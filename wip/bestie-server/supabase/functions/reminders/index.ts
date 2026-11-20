// Optional reminders. Runs on Supabase, never in the app.
// - "key": hands the app the public sending key (made once, here, so nobody ever sees the private one)
// - "subscribe": saves this phone's delivery address
// - "set": saves this person's reminder times (times only; nothing private)
// - "send": called every few minutes by the database timer; sends any reminders that are due
// The app must be logged in for everything except "send", which needs the timer's own password.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const MESSAGE = { title: "Optional", body: "Quick check-in? 🌿", url: "./#dash" };
const WINDOW_MIN = 5; // the timer runs every 5 minutes

function serverKey(): string {
  const list = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (list) {
    try {
      const keys = JSON.parse(list);
      const first = typeof keys === "object" && keys !== null ? (keys.default ?? Object.values(keys)[0]) : null;
      if (typeof first === "string" && first) return first;
    } catch { /* fall through */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, serverKey());

async function config() {
  const { data, error } = await admin.from("push_config").select("*").eq("id", 1).single();
  if (error) throw error;
  if (!data.vapid_public || !data.vapid_private) {
    const keys = webpush.generateVAPIDKeys();
    const { error: upErr } = await admin.from("push_config")
      .update({ vapid_public: keys.publicKey, vapid_private: keys.privateKey }).eq("id", 1);
    if (upErr) throw upErr;
    data.vapid_public = keys.publicKey; data.vapid_private = keys.privateKey;
  }
  return data as { vapid_public: string; vapid_private: string; cron_secret: string };
}

function localNow(tz: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: (+get("hour")) * 60 + (+get("minute")) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "method" }, 405);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "");

  try {
    // ---------- the timer ----------
    if (action === "send") {
      const cfg = await config();
      if (req.headers.get("x-cron-secret") !== cfg.cron_secret) return reply({ error: "no" }, 401);
      webpush.setVapidDetails("mailto:noreply@optional.app", cfg.vapid_public, cfg.vapid_private);
      const { data: due, error } = await admin.from("reminder_times").select("user_id, hhmm, tz, last_sent_on");
      if (error) throw error;
      let sent = 0;
      for (const r of due ?? []) {
        const now = localNow(r.tz || "UTC");
        const [h, m] = String(r.hhmm).split(":").map(Number);
        const at = h * 60 + m;
        const diff = now.minutes - at;
        if (diff < 0 || diff >= WINDOW_MIN || r.last_sent_on === now.date) continue;
        const { data: subs } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", r.user_id);
        for (const s of subs ?? []) {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(MESSAGE), { TTL: 600 });
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
        await admin.from("reminder_times").update({ last_sent_on: now.date }).eq("user_id", r.user_id).eq("hhmm", r.hhmm);
      }
      return reply({ sent });
    }

    // ---------- everything else needs a logged-in person ----------
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
    if (whoErr || !who?.user) return reply({ error: "login" }, 401);
    const uid = who.user.id;

    if (action === "key") {
      const cfg = await config();
      return reply({ key: cfg.vapid_public });
    }

    if (action === "subscribe") {
      const sub = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
      if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return reply({ error: "bad" }, 400);
      const { error } = await admin.from("push_subscriptions").upsert({
        endpoint: sub.endpoint, user_id: uid, p256dh: sub.keys.p256dh, auth: sub.keys.auth, tz: String(body.tz ?? "UTC").slice(0, 64),
      });
      if (error) throw error;
      return reply({ ok: true });
    }

    if (action === "set") {
      const tz = String(body.tz ?? "UTC").slice(0, 64);
      const times = Array.isArray(body.times) ? body.times : [];
      const clean = [...new Set(times.map(String).filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))].slice(0, 12);
      const { data: old } = await admin.from("reminder_times").select("hhmm, last_sent_on").eq("user_id", uid);
      const sentToday = new Map((old ?? []).map((o) => [o.hhmm, o.last_sent_on]));
      await admin.from("reminder_times").delete().eq("user_id", uid);
      if (clean.length) {
        const { error } = await admin.from("reminder_times").insert(clean.map((t) => ({ user_id: uid, hhmm: t, tz, last_sent_on: sentToday.get(t) ?? null })));
        if (error) throw error;
      }
      return reply({ ok: true, count: clean.length });
    }

    if (action === "unsubscribe") {
      const endpoint = String(body.endpoint ?? "");
      if (endpoint) await admin.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", uid);
      return reply({ ok: true });
    }

    return reply({ error: "unknown" }, 400);
  } catch (e) {
    console.error("reminders error", e);
    return reply({ error: "server" }, 500);
  }
});

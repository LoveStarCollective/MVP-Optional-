// Bestie's server piece. Runs on Supabase, never in the app.
// It checks the person is logged in, keeps them under a daily limit,
// sends the recent chat to Claude with Bestie's instructions, and returns the reply.
// Nothing is stored here: no chat text is saved on the server.
import { createClient } from "npm:@supabase/supabase-js@2";
import { BESTIE_INSTRUCTIONS } from "./instructions.ts";

const DAILY_LIMIT = Number(Deno.env.get("BESTIE_DAILY_LIMIT") ?? "100");
const MODEL = Deno.env.get("BESTIE_MODEL") ?? "claude-haiku-5-5";
const MAX_TURNS = 20;          // only the last 20 messages are sent
const MAX_CHARS = 2000;        // per message

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "method" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply({ error: "not_connected" }, 503);   // app shows "almost here"

  // 1. Who is this? (must be logged in)
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who?.user) return reply({ error: "login" }, 401);

  // 2. Read the chat the app sent
  let body: { messages?: { role: string; text: string }[]; friend?: string; nick?: string };
  try { body = await req.json(); } catch { return reply({ error: "bad" }, 400); }
  const msgs = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.text.slice(0, MAX_CHARS) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) return reply({ error: "empty" }, 400);

  // 3. Daily limit
  const { data: n, error: limErr } = await admin.rpc("bestie_bump", { p_user: who.user.id, p_limit: DAILY_LIMIT });
  if (limErr) return reply({ error: "server" }, 500);
  if (n === -1) return reply({ error: "limit" }, 429);

  // 4. Ask Claude
  const friend = (body.friend ?? "Bestie").slice(0, 40);
  const nick = (body.nick ?? "").slice(0, 40);
  const system = BESTIE_INSTRUCTIONS.replaceAll("{{FRIEND}}", friend).replaceAll("{{NICK}}", nick || "your person");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 400, system, messages: msgs }),
  });
  if (!r.ok) return reply({ error: "ai", status: r.status }, 502);
  const out = await r.json();
  const text = (out.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n").trim();
  return reply({ text, left: DAILY_LIMIT - (n as number) });
});

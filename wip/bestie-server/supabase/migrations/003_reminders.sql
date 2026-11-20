-- Reminders: phone delivery addresses, reminder times, and a timer that checks every 5 minutes.
-- Only reminder times and delivery addresses are stored here. Nothing private.
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.push_config (
  id int primary key default 1,
  vapid_public text,
  vapid_private text,
  cron_secret text not null default encode(gen_random_bytes(24), 'hex')
);
insert into public.push_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  tz text,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_times (
  user_id uuid not null references auth.users(id) on delete cascade,
  hhmm text not null,
  tz text,
  last_sent_on text,
  primary key (user_id, hhmm)
);

-- Locked down: the app can't touch these directly. Only the reminders server piece can.
alter table public.push_config enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_times enable row level security;

-- The timer: every 5 minutes, ask the reminders server piece to send anything that's due.
select cron.unschedule('optional-reminders') where exists (select 1 from cron.job where jobname = 'optional-reminders');
select cron.schedule(
  'optional-reminders',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://qpwdqtbeynzlaamkauum.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select cron_secret from public.push_config where id = 1)),
    body := '{"action":"send"}'::jsonb
  );
  $job$
);

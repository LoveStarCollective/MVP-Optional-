-- Good to Know: community pins.
-- Paste this whole file into Supabase > SQL Editor and press Run, once.
-- To approve a pin: Table Editor > pins > change status from pending to approved.

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  by text check (by is null or char_length(by) <= 120),
  type text not null check (type in ('Book','Video','Article','Podcast','Music','Story','Link')),
  url text check (url is null or (url ~ '^https://[^[:space:]]+$' and char_length(url) <= 500)),
  cats text[] not null check (array_length(cats, 1) between 1 and 10),
  why text not null check (char_length(why) between 10 and 400),
  nickname text check (nickname is null or char_length(nickname) <= 40),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.pin_reports (
  pin_id uuid not null references public.pins(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

-- True when the signed-in account is at least a month old and has fewer than 3 pins waiting.
create or replace function public.can_pin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select created_at <= now() - interval '1 month' from auth.users where id = auth.uid()), false)
     and (select count(*) from public.pins where user_id = auth.uid() and status = 'pending') < 3;
$$;

-- How many people reported a pin (3 or more hides it until we look).
create or replace function public.pin_report_count(p uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.pin_reports where pin_id = p;
$$;

alter table public.pins enable row level security;
alter table public.pin_reports enable row level security;

drop policy if exists "see approved pins and your own" on public.pins;
create policy "see approved pins and your own" on public.pins for select to authenticated
  using ((status = 'approved' and public.pin_report_count(id) < 3) or user_id = auth.uid());

drop policy if exists "add a pending pin" on public.pins;
create policy "add a pending pin" on public.pins for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and public.can_pin());

drop policy if exists "report a pin" on public.pin_reports;
create policy "report a pin" on public.pin_reports for insert to authenticated
  with check (user_id = auth.uid());

revoke execute on function public.can_pin() from anon;
revoke execute on function public.pin_report_count(uuid) from anon;

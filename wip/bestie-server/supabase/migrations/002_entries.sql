-- Locked storage for Journal entries and Cue Alarm check-ins.
-- Everything in "data" is scrambled on the phone before it arrives. Supabase only sees gibberish.
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  data text not null,
  created_at timestamptz not null default now()
);

-- If an older "entries" table already exists, add what's missing and relax anything extra.
alter table public.entries add column if not exists kind text;
alter table public.entries add column if not exists data text;
alter table public.entries add column if not exists created_at timestamptz default now();
do $$
declare c record;
begin
  for c in select column_name from information_schema.columns
           where table_schema = 'public' and table_name = 'entries' and is_nullable = 'NO'
             and column_name not in ('id', 'user_id')
  loop
    execute format('alter table public.entries alter column %I drop not null', c.column_name);
  end loop;
end $$;

create index if not exists entries_user_kind_idx on public.entries (user_id, kind, created_at desc);

-- Each person can only reach their own rows.
alter table public.entries enable row level security;
drop policy if exists "entries: read own" on public.entries;
drop policy if exists "entries: add own" on public.entries;
drop policy if exists "entries: delete own" on public.entries;
create policy "entries: read own" on public.entries for select to authenticated using (auth.uid() = user_id);
create policy "entries: add own" on public.entries for insert to authenticated with check (auth.uid() = user_id);
create policy "entries: delete own" on public.entries for delete to authenticated using (auth.uid() = user_id);

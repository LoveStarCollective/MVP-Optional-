-- Counts how many messages each tester sends Bestie per day, so nobody runs up the bill.
-- Only the server piece can read or change this table.
create table if not exists public.bestie_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.bestie_usage enable row level security;
-- No policies on purpose: the app itself can't touch it, only the server piece.

create or replace function public.bestie_bump(p_user uuid, p_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into bestie_usage(user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = bestie_usage.count + 1
  returning count into n;
  if n > p_limit then
    update bestie_usage set count = count - 1 where user_id = p_user and day = current_date;
    return -1;
  end if;
  return n;
end $$;
revoke all on function public.bestie_bump(uuid, int) from public, anon, authenticated;

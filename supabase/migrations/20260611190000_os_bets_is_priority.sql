alter table public.os_bets
  add column if not exists is_priority boolean not null default false;

create index if not exists os_bets_goal_priority_idx
  on public.os_bets (goal_id, is_priority)
  where is_priority = true;

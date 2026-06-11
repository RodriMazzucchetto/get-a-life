alter table public.os_bets
  add column if not exists pos double precision,
  add column if not exists execution_owner text;

update public.os_bets
set pos = (extract(epoch from created_at) * 1000)
where pos is null;

-- Backlog de metas por bloco OS
alter table public.os_goals
  add column if not exists is_priority boolean not null default false,
  add column if not exists pos double precision;

-- Metas existentes activas: atribuir posição por ordem de criação
update public.os_goals
set pos = (extract(epoch from created_at) * 1000)
where pos is null;

-- A meta activa mais recente por bloco passa a ser a prioritária
with ranked as (
  select id, row_number() over (partition by block_id order by created_at desc) as rn
  from public.os_goals
  where status = 'active'
)
update public.os_goals g
set is_priority = true
from ranked r
where g.id = r.id and r.rn = 1;

create index if not exists os_goals_block_priority_idx
  on public.os_goals (block_id, is_priority)
  where is_priority = true;

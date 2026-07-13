-- Organização de metas OS por quarter (1–4)
alter table public.os_goals
  add column if not exists quarter smallint
    check (quarter between 1 and 4);

-- Metas existentes → quarter atual (Q3 = Jul–Set)
update public.os_goals
set quarter = 3
where quarter is null;

alter table public.os_goals
  alter column quarter set default 3;

alter table public.os_goals
  alter column quarter set not null;

create index if not exists os_goals_block_quarter_idx
  on public.os_goals (block_id, quarter);

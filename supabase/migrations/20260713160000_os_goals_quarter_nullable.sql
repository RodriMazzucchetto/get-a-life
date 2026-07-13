-- Metas no backlog: quarter pode ser null (ainda não planeadas)
alter table public.os_goals
  alter column quarter drop not null;

alter table public.os_goals
  alter column quarter drop default;

alter table public.os_goals
  alter column quarter set default null;

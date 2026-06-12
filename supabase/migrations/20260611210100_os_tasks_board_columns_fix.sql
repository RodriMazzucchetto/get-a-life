alter table public.os_tasks
  add column if not exists on_hold boolean not null default false,
  add column if not exists on_hold_reason text;

alter table public.os_tasks drop constraint if exists os_tasks_status_check;

update public.os_tasks set status = 'backlog' where status = 'todo';
update public.os_tasks set status = 'in_progress' where status = 'doing';
update public.os_tasks set status = 'backlog' where status = 'done';

alter table public.os_tasks
  add constraint os_tasks_status_check
  check (status in ('backlog', 'current_week', 'in_progress'));

alter table public.os_tasks alter column status set default 'backlog';

update public.os_tasks set pos = 1000 where pos is null;

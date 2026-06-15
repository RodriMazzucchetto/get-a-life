-- Tags de projeto (incl. Quick Win) em tasks OS — N:N como todo_projects
create table if not exists public.os_task_projects (
  task_id uuid not null references public.os_tasks (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  primary key (task_id, project_id)
);

create index if not exists idx_os_task_projects_project on public.os_task_projects (project_id);

alter table public.os_task_projects enable row level security;

drop policy if exists "os_task_projects_own" on public.os_task_projects;
create policy "os_task_projects_own" on public.os_task_projects
  for all
  using (
    exists (select 1 from public.os_tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.os_tasks t where t.id = task_id and t.user_id = auth.uid())
    and exists (select 1 from public.projects pr where pr.id = project_id and pr.user_id = auth.uid())
  );

insert into public.os_task_projects (task_id, project_id)
select id, project_id from public.os_tasks where project_id is not null
on conflict do nothing;

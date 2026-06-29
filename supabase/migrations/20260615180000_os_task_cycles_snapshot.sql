-- Snapshot de esforço em aberto e comprometido ao fechar o ciclo
alter table public.os_task_cycles
  add column if not exists remaining_sprint_points numeric(10,2),
  add column if not exists committed_points numeric(10,2);

-- Ciclos de entrega para Tasks OS (pontos-based, sistema novo)
create table if not exists public.os_task_cycles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  cycle_number    integer not null default 1,
  status          text not null default 'active' check (status in ('active', 'closed')),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  planned_points  numeric(10,2) not null default 0,   -- pontos ao iniciar
  added_after_points numeric(10,2) not null default 0, -- pontos adicionados após início
  delivered_points   numeric(10,2) not null default 0, -- pontos entregues
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- índice para busca do ciclo ativo
create unique index if not exists os_task_cycles_active_user
  on public.os_task_cycles (user_id)
  where status = 'active';

-- RLS
alter table public.os_task_cycles enable row level security;

create policy "os_task_cycles_user" on public.os_task_cycles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

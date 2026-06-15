-- Importância x Urgência (1–5) para priorização de tasks OS
alter table public.os_tasks
  add column if not exists importance smallint not null default 3
    check (importance between 1 and 5),
  add column if not exists urgency smallint not null default 3
    check (urgency between 1 and 5);

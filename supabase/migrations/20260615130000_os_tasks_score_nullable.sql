-- Score opcional: sem default; tasks existentes zeradas até o user atribuir nota
alter table public.os_tasks
  alter column importance drop not null,
  alter column importance drop default,
  alter column urgency drop not null,
  alter column urgency drop default;

update public.os_tasks
  set importance = null,
      urgency = null;

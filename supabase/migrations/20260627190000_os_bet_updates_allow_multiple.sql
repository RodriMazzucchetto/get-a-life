-- Permite vários weekly updates por aposta (incl. mesma semana); histórico completo.
alter table public.os_bet_updates
  drop constraint if exists os_bet_updates_bet_id_week_start_key;

create index if not exists os_bet_updates_bet_week_created_idx
  on public.os_bet_updates (bet_id, week_start desc, created_at desc);

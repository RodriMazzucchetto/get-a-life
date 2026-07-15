-- Modos de falha / safeguards da aposta
alter table public.os_bets
  add column if not exists failure_modes text;

comment on column public.os_bets.failure_modes is 'O que garantiria falha ou resultado ruim (modos de falha, worst cases, blind spots, anti-patterns)';

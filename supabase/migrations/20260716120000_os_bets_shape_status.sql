-- Pipeline de shaping da aposta (antes da execução)
alter table public.os_bets
  add column if not exists shape_status text not null default 'in_discovery'
    check (shape_status in ('in_discovery', 'ready_to_prioritize'));

-- Apostas já priorizadas → discovery concluído
update public.os_bets
set shape_status = 'ready_to_prioritize'
where is_priority = true
  and shape_status = 'in_discovery';

comment on column public.os_bets.shape_status is 'In Discovery | Ready to prioritize (Prioritized = is_priority)';

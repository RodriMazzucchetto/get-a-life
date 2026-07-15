-- Campos de estrutura da aposta (Shape Up)
alter table public.os_bets
  add column if not exists appetite_scope text,
  add column if not exists success_criteria text;

comment on column public.os_bets.pitch_outcome is 'Outcome binário e datado que a aposta entrega';
comment on column public.os_bets.pitch_objective is 'Sketch da solução / fluxo esperado';
comment on column public.os_bets.appetite_scope is 'Apetite: o que entra e o que fica de fora';
comment on column public.os_bets.pitch_data is 'Por que essa aposta e não outra (lógica + dados)';
comment on column public.os_bets.success_criteria is 'Como saberemos sucesso ou falha';

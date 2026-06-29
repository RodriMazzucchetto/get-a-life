-- Rastreio de conclusão de metas (separado dos weekly updates de pitches)
alter table public.os_goals
  add column if not exists closed_at timestamptz,
  add column if not exists closure_note text;

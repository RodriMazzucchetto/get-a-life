ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_note text;

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_lifecycle_status_check;

ALTER TABLE public.goals
  ADD CONSTRAINT goals_lifecycle_status_check
  CHECK (lifecycle_status IN ('active', 'done', 'partial', 'not_done'));

COMMENT ON COLUMN public.goals.lifecycle_status IS 'active = em andamento; done/partial/not_done = encerrada no histórico.';
COMMENT ON COLUMN public.goals.closed_at IS 'Quando a meta saiu da lista ativa.';
COMMENT ON COLUMN public.goals.closure_note IS 'Nota opcional ao encerrar a meta.';

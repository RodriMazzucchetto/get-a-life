-- Tipos de problema: mercado (estratégico) vs operacional
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS kind text;

UPDATE public.problems SET kind = 'market' WHERE kind IS NULL;

ALTER TABLE public.problems
  ALTER COLUMN kind SET NOT NULL,
  ALTER COLUMN kind SET DEFAULT 'market';

ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_kind_check;
ALTER TABLE public.problems
  ADD CONSTRAINT problems_kind_check CHECK (kind IN ('market', 'operational'));

CREATE INDEX IF NOT EXISTS idx_problems_user_kind_project_pos
  ON public.problems (user_id, kind, project_id, pos);

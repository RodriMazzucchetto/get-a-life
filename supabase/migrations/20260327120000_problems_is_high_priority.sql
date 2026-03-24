-- Prioridade explícita (igual à ideia de is_high_priority nos todos)
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS is_high_priority boolean NOT NULL DEFAULT false;

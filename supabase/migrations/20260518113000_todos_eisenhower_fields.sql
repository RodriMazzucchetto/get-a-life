-- Classificação Eisenhower nas tarefas.
-- Mantemos os campos antigos (importance_score/urgency_score/etc.) para rollback seguro.
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delegate_timebox_minutes integer CHECK (delegate_timebox_minutes > 0);

COMMENT ON COLUMN public.todos.is_important IS 'Task considerada importante no modelo Eisenhower.';
COMMENT ON COLUMN public.todos.is_urgent IS 'Task considerada urgente no modelo Eisenhower.';
COMMENT ON COLUMN public.todos.delegate_timebox_minutes IS 'Timebox opcional (minutos) para tasks Delegate.';

-- Migração de dados existentes:
-- importance_score >= 4 => is_important = true
-- urgency_score >= 4 => is_urgent = true
UPDATE public.todos
SET
  is_important = COALESCE(importance_score, 0) >= 4,
  is_urgent = COALESCE(urgency_score, 0) >= 4
WHERE
  (COALESCE(is_important, false) = false AND COALESCE(importance_score, 0) >= 4)
  OR (COALESCE(is_urgent, false) = false AND COALESCE(urgency_score, 0) >= 4);

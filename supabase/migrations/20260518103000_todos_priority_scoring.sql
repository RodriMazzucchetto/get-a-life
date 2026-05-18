-- Priorização inteligente das tarefas (1..5 por eixo + score final multiplicado).
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS effort_score integer NOT NULL DEFAULT 3 CHECK (effort_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS importance_score integer NOT NULL DEFAULT 3 CHECK (importance_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS urgency_score integer NOT NULL DEFAULT 3 CHECK (urgency_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS priority_score integer NOT NULL DEFAULT 27 CHECK (priority_score BETWEEN 1 AND 125);

COMMENT ON COLUMN public.todos.effort_score IS 'Nota de esforço (1 a 5).';
COMMENT ON COLUMN public.todos.importance_score IS 'Nota de importância (1 a 5).';
COMMENT ON COLUMN public.todos.urgency_score IS 'Nota de urgência (1 a 5).';
COMMENT ON COLUMN public.todos.priority_score IS 'Score final = esforço x importância x urgência.';

UPDATE public.todos
SET
  effort_score = GREATEST(1, LEAST(5, COALESCE(effort_score, 3))),
  importance_score = GREATEST(1, LEAST(5, COALESCE(importance_score, 3))),
  urgency_score = GREATEST(1, LEAST(5, COALESCE(urgency_score, 3))),
  priority_score =
    GREATEST(1, LEAST(5, COALESCE(effort_score, 3))) *
    GREATEST(1, LEAST(5, COALESCE(importance_score, 3))) *
    GREATEST(1, LEAST(5, COALESCE(urgency_score, 3)));

CREATE OR REPLACE FUNCTION public.todos_sync_priority_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.effort_score := GREATEST(1, LEAST(5, COALESCE(NEW.effort_score, 3)));
  NEW.importance_score := GREATEST(1, LEAST(5, COALESCE(NEW.importance_score, 3)));
  NEW.urgency_score := GREATEST(1, LEAST(5, COALESCE(NEW.urgency_score, 3)));
  NEW.priority_score := NEW.effort_score * NEW.importance_score * NEW.urgency_score;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS todos_sync_priority_score_trigger ON public.todos;
CREATE TRIGGER todos_sync_priority_score_trigger
  BEFORE INSERT OR UPDATE OF effort_score, importance_score, urgency_score ON public.todos
  FOR EACH ROW
  EXECUTE PROCEDURE public.todos_sync_priority_score();

-- Idempotente: projeto sem migração anterior recebe a coluna; o app não envia completed_at no cliente.
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.todos.completed_at IS 'Preenchido ao concluir/desconcluir (trigger).';

UPDATE public.todos
SET completed_at = updated_at
WHERE completed = true AND completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.todos_sync_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.completed IS DISTINCT FROM OLD.completed THEN
      IF NEW.completed THEN
        NEW.completed_at := timezone('utc', now());
      ELSE
        NEW.completed_at := NULL;
      END IF;
    END IF;
  END IF;
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS todos_sync_timestamps_trigger ON public.todos;
CREATE TRIGGER todos_sync_timestamps_trigger
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE PROCEDURE public.todos_sync_timestamps();

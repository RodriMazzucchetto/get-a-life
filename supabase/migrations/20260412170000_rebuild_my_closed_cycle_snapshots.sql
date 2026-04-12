-- Permite ao utilizador autenticado recalcular os snapshots em task_cycle_project_stats
-- para todos os ciclos fechados dele (útil após corrigir a função de snapshot sem deploy manual).

CREATE OR REPLACE FUNCTION public.rebuild_my_closed_cycle_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id
    FROM public.task_cycles
    WHERE user_id = auth.uid()
      AND status = 'closed'
      AND ended_at IS NOT NULL
  LOOP
    PERFORM public.snapshot_task_cycle_project_stats_internal(r.id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_my_closed_cycle_snapshots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebuild_my_closed_cycle_snapshots() TO authenticated;

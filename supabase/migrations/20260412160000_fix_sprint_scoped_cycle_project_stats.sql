-- Denominador (tasks_linked) nos snapshots de ciclo contava todas as tarefas ligadas ao projeto
-- (incluindo backlog histórico), enquanto o numerador só considerava conclusões na janela.
-- Alinha com o planejado do ciclo: só Semana atual / Em progresso (não concluídas) ou concluídas
-- dentro de [started_at, ended_at]. Mesma lógica em user_project_stats_in_window.

CREATE OR REPLACE FUNCTION public.snapshot_task_cycle_project_stats_internal(p_cycle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_started timestamptz;
  v_ended timestamptz;
BEGIN
  SELECT tc.user_id, tc.started_at, tc.ended_at
  INTO v_user_id, v_started, v_ended
  FROM public.task_cycles tc
  WHERE tc.id = p_cycle_id;

  IF v_user_id IS NULL OR v_ended IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.task_cycle_project_stats WHERE task_cycle_id = p_cycle_id;

  INSERT INTO public.task_cycle_project_stats (
    task_cycle_id,
    project_id,
    tasks_linked,
    tasks_completed_in_cycle
  )
  SELECT *
  FROM (
    SELECT
      p_cycle_id AS task_cycle_id,
      p.id AS project_id,
      (
        SELECT COUNT(DISTINCT tid)::integer
        FROM (
          SELECT tp.todo_id AS tid
          FROM public.todo_projects tp
          INNER JOIN public.todos t ON t.id = tp.todo_id
          WHERE tp.project_id = p.id AND t.user_id = v_user_id
            AND (
              (t.status IN ('current_week', 'in_progress') AND t.completed = false)
              OR (
                t.completed = true
                AND COALESCE(t.completed_at, t.updated_at) >= v_started
                AND COALESCE(t.completed_at, t.updated_at) <= v_ended
              )
            )
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = v_user_id
            AND (
              (t.status IN ('current_week', 'in_progress') AND t.completed = false)
              OR (
                t.completed = true
                AND COALESCE(t.completed_at, t.updated_at) >= v_started
                AND COALESCE(t.completed_at, t.updated_at) <= v_ended
              )
            )
        ) x
      ) AS tasks_linked,
      (
        SELECT COUNT(DISTINCT tid)::integer
        FROM (
          SELECT tp.todo_id AS tid
          FROM public.todo_projects tp
          INNER JOIN public.todos t ON t.id = tp.todo_id
          WHERE tp.project_id = p.id AND t.user_id = v_user_id
            AND t.completed = true
            AND COALESCE(t.completed_at, t.updated_at) >= v_started
            AND COALESCE(t.completed_at, t.updated_at) <= v_ended
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = v_user_id
            AND t.completed = true
            AND COALESCE(t.completed_at, t.updated_at) >= v_started
            AND COALESCE(t.completed_at, t.updated_at) <= v_ended
        ) y
      ) AS tasks_completed_in_cycle
    FROM public.projects p
    WHERE p.user_id = v_user_id
  ) s
  WHERE s.tasks_linked > 0 OR s.tasks_completed_in_cycle > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_task_cycle_project_stats_internal(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.snapshot_task_cycle_project_stats(p_cycle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT tc.user_id INTO v_user_id FROM public.task_cycles tc WHERE tc.id = p_cycle_id;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  IF v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  PERFORM public.snapshot_task_cycle_project_stats_internal(p_cycle_id);
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_task_cycle_project_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.snapshot_task_cycle_project_stats(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_project_stats_in_window(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  project_color text,
  tasks_linked integer,
  tasks_completed_in_window integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM (
    SELECT
      p.id AS project_id,
      p.name AS project_name,
      p.color AS project_color,
      (
        SELECT COUNT(DISTINCT tid)::integer
        FROM (
          SELECT tp.todo_id AS tid
          FROM public.todo_projects tp
          INNER JOIN public.todos t ON t.id = tp.todo_id
          WHERE tp.project_id = p.id AND t.user_id = auth.uid()
            AND (
              (t.status IN ('current_week', 'in_progress') AND t.completed = false)
              OR (
                t.completed = true
                AND COALESCE(t.completed_at, t.updated_at) >= p_start
                AND COALESCE(t.completed_at, t.updated_at) <= p_end
              )
            )
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = auth.uid()
            AND (
              (t.status IN ('current_week', 'in_progress') AND t.completed = false)
              OR (
                t.completed = true
                AND COALESCE(t.completed_at, t.updated_at) >= p_start
                AND COALESCE(t.completed_at, t.updated_at) <= p_end
              )
            )
        ) x
      ) AS tasks_linked,
      (
        SELECT COUNT(DISTINCT tid)::integer
        FROM (
          SELECT tp.todo_id AS tid
          FROM public.todo_projects tp
          INNER JOIN public.todos t ON t.id = tp.todo_id
          WHERE tp.project_id = p.id AND t.user_id = auth.uid()
            AND t.completed = true
            AND COALESCE(t.completed_at, t.updated_at) >= p_start
            AND COALESCE(t.completed_at, t.updated_at) <= p_end
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = auth.uid()
            AND t.completed = true
            AND COALESCE(t.completed_at, t.updated_at) >= p_start
            AND COALESCE(t.completed_at, t.updated_at) <= p_end
        ) y
      ) AS tasks_completed_in_window
    FROM public.projects p
    WHERE p.user_id = auth.uid()
  ) z
  WHERE z.tasks_linked > 0 OR z.tasks_completed_in_window > 0
  ORDER BY z.tasks_linked DESC, z.tasks_completed_in_window DESC;
$$;

REVOKE ALL ON FUNCTION public.user_project_stats_in_window(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_project_stats_in_window(timestamptz, timestamptz) TO authenticated;

-- Recalcular snapshots já gravados (migração corre dados antigos)
DO $recalc$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.task_cycles WHERE status = 'closed' AND ended_at IS NOT NULL
  LOOP
    PERFORM public.snapshot_task_cycle_project_stats_internal(r.id);
  END LOOP;
END
$recalc$;

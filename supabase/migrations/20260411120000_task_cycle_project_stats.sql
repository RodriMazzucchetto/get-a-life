-- Tarefas: quando marcar como concluída, saber em que instante (estatísticas por ciclo / projeto)
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.todos.completed_at IS 'Preenchido quando completed vira true; limpo quando volta a false.';

UPDATE public.todos
SET completed_at = updated_at
WHERE completed = true AND completed_at IS NULL;

-- Agregados por projeto ao fechar um ciclo (dashboard histórico)
CREATE TABLE IF NOT EXISTS public.task_cycle_project_stats (
  task_cycle_id uuid NOT NULL REFERENCES public.task_cycles (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  tasks_linked integer NOT NULL DEFAULT 0 CHECK (tasks_linked >= 0),
  tasks_completed_in_cycle integer NOT NULL DEFAULT 0 CHECK (tasks_completed_in_cycle >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_cycle_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_task_cycle_project_stats_project
  ON public.task_cycle_project_stats (project_id);

ALTER TABLE public.task_cycle_project_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_cycle_project_stats_own" ON public.task_cycle_project_stats;
CREATE POLICY "task_cycle_project_stats_own" ON public.task_cycle_project_stats
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.task_cycles tc
      WHERE tc.id = task_cycle_id AND tc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_cycles tc
      WHERE tc.id = task_cycle_id AND tc.user_id = auth.uid()
    )
  );

-- Snapshot ao fechar ciclo (chamado pelo app após UPDATE em task_cycles)
CREATE OR REPLACE FUNCTION public.snapshot_task_cycle_project_stats(p_cycle_id uuid)
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

  IF v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
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
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = v_user_id
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

REVOKE ALL ON FUNCTION public.snapshot_task_cycle_project_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.snapshot_task_cycle_project_stats(uuid) TO authenticated;

-- Totais globais (dashboard): tarefas ligadas ao projeto vs concluídas (lifetime)
CREATE OR REPLACE FUNCTION public.user_project_todo_totals()
RETURNS TABLE (
  project_id uuid,
  project_name text,
  project_color text,
  tasks_linked integer,
  tasks_completed integer
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
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = auth.uid()
        ) x
      ) AS tasks_linked,
      (
        SELECT COUNT(DISTINCT tid)::integer
        FROM (
          SELECT tp.todo_id AS tid
          FROM public.todo_projects tp
          INNER JOIN public.todos t ON t.id = tp.todo_id
          WHERE tp.project_id = p.id AND t.user_id = auth.uid() AND t.completed = true
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = auth.uid() AND t.completed = true
        ) y
      ) AS tasks_completed
    FROM public.projects p
    WHERE p.user_id = auth.uid()
  ) z
  WHERE z.tasks_linked > 0 OR z.tasks_completed > 0
  ORDER BY z.tasks_linked DESC, z.tasks_completed DESC;
$$;

REVOKE ALL ON FUNCTION public.user_project_todo_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_project_todo_totals() TO authenticated;

-- Ciclo aberto: mesma métrica de concluídas com janela [início, fim]; tarefas ligadas = estado atual
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
          UNION
          SELECT t.id AS tid
          FROM public.todos t
          WHERE t.project_id = p.id AND t.user_id = auth.uid()
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

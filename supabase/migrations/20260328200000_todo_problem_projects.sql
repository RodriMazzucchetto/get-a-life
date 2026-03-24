-- Muitos projetos por tarefa / problema (N:N)
CREATE TABLE IF NOT EXISTS public.todo_projects (
  todo_id uuid NOT NULL REFERENCES public.todos (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_todo_projects_project ON public.todo_projects (project_id);

CREATE TABLE IF NOT EXISTS public.problem_projects (
  problem_id uuid NOT NULL REFERENCES public.problems (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_projects_project ON public.problem_projects (project_id);

ALTER TABLE public.todo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todo_projects_own" ON public.todo_projects;
CREATE POLICY "todo_projects_own" ON public.todo_projects
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.todos t WHERE t.id = todo_id AND t.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.todos t WHERE t.id = todo_id AND t.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "problem_projects_own" ON public.problem_projects;
CREATE POLICY "problem_projects_own" ON public.problem_projects
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.problems p WHERE p.id = problem_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.problems p WHERE p.id = problem_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = project_id AND pr.user_id = auth.uid())
  );

INSERT INTO public.todo_projects (todo_id, project_id)
SELECT id, project_id FROM public.todos WHERE project_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.problem_projects (problem_id, project_id)
SELECT id, project_id FROM public.problems WHERE project_id IS NOT NULL
ON CONFLICT DO NOTHING;

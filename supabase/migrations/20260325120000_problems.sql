-- Problemas: prioridade por posição (drag), opcionalmente ligados a projetos (como todos).
-- Aplicar no Supabase: SQL Editor → Run após migrações anteriores.

CREATE TABLE IF NOT EXISTS public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  title text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_problems_user_project_pos ON public.problems (user_id, project_id, pos);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "problems_own" ON public.problems;
CREATE POLICY "problems_own" ON public.problems
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

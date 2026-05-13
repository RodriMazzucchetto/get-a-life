-- Itens prioritários da semana (foco estratégico no topo de Tarefas)
CREATE TABLE IF NOT EXISTS public.weekly_priority_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.task_cycles (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  delivery_status text NOT NULL DEFAULT 'not_delivered'
    CHECK (delivery_status IN ('not_delivered', 'partially_delivered', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_priority_items_user
  ON public.weekly_priority_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_priority_items_cycle
  ON public.weekly_priority_items (cycle_id);

CREATE INDEX IF NOT EXISTS idx_weekly_priority_items_project
  ON public.weekly_priority_items (project_id);

ALTER TABLE public.weekly_priority_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_priority_items_own" ON public.weekly_priority_items;
CREATE POLICY "weekly_priority_items_own"
  ON public.weekly_priority_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.task_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_number integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  planned_count integer NOT NULL DEFAULT 0 CHECK (planned_count >= 0),
  delivered_count integer NOT NULL DEFAULT 0 CHECK (delivered_count >= 0),
  effectiveness_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (effectiveness_pct >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_cycles_user_cycle_number
  ON public.task_cycles (user_id, cycle_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_cycles_user_active
  ON public.task_cycles (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_task_cycles_user_created_at
  ON public.task_cycles (user_id, created_at DESC);

ALTER TABLE public.task_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_cycles_own" ON public.task_cycles;
CREATE POLICY "task_cycles_own" ON public.task_cycles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.task_cycles
  ADD COLUMN IF NOT EXISTS added_after_start_count integer NOT NULL DEFAULT 0
  CHECK (added_after_start_count >= 0);

ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS on_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_hold_reason text;

-- Descrição livre do objetivo (além da métrica).
ALTER TABLE public.rm_objectives
  ADD COLUMN IF NOT EXISTS description text;

-- Empresas (tag + cor) geridas em Configurações; objetivos apontam para elas.

CREATE TABLE IF NOT EXISTS public.rm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tag text NOT NULL,
  name text,
  color text NOT NULL DEFAULT 'oklch(0.55 0.2 28)',
  soft_color text NOT NULL DEFAULT 'oklch(0.94 0.04 28)',
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_rm_companies_user_pos
  ON public.rm_companies (user_id, pos);

ALTER TABLE public.rm_objectives
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.rm_companies (id) ON DELETE RESTRICT;

-- Backfill: uma empresa por (user_id, tag) a partir dos objetivos existentes
INSERT INTO public.rm_companies (user_id, tag, name, color, soft_color, pos)
SELECT DISTINCT ON (o.user_id, o.tag)
  o.user_id,
  o.tag,
  o.tag,
  o.color,
  o.soft_color,
  o.pos
FROM public.rm_objectives o
WHERE NOT EXISTS (
  SELECT 1 FROM public.rm_companies c
  WHERE c.user_id = o.user_id AND c.tag = o.tag
)
ORDER BY o.user_id, o.tag, o.pos;

UPDATE public.rm_objectives o
SET company_id = c.id
FROM public.rm_companies c
WHERE o.company_id IS NULL
  AND c.user_id = o.user_id
  AND c.tag = o.tag;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rm_objectives_one_per_company
  ON public.rm_objectives (company_id)
  WHERE company_id IS NOT NULL;

ALTER TABLE public.rm_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rm_companies_own" ON public.rm_companies;
CREATE POLICY "rm_companies_own" ON public.rm_companies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS rm_companies_touch ON public.rm_companies;
CREATE TRIGGER rm_companies_touch
  BEFORE UPDATE ON public.rm_companies
  FOR EACH ROW EXECUTE PROCEDURE public.rm_touch_updated_at();

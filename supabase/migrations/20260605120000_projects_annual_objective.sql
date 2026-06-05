ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS annual_objective text,
  ADD COLUMN IF NOT EXISTS annual_objective_year int;

COMMENT ON COLUMN public.projects.annual_objective IS 'North-star intent for the project in the given year.';
COMMENT ON COLUMN public.projects.annual_objective_year IS 'Calendar year the annual_objective refers to.';

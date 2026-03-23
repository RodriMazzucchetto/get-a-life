-- Schema inicial gerado a partir do código do app (get-a-life).
-- Aplicar num projeto Supabase NOVO/vazio: SQL Editor → New query → Run.
-- Projeto ref exemplo: nduhkmizghfzpdhbakvz

-- gen_random_uuid() está disponível no Postgres do Supabase sem extensão extra.

-- ---------------------------------------------------------------------------
-- Tabelas core (planeamento GTD)
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text,
  onboarding_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#94a3b8',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  progress int NOT NULL DEFAULT 0,
  next_step text,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  category text,
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  is_high_priority boolean NOT NULL DEFAULT false,
  time_sensitive boolean NOT NULL DEFAULT false,
  on_hold boolean NOT NULL DEFAULT false,
  on_hold_reason text,
  status text NOT NULL DEFAULT 'backlog',
  pos double precision NOT NULL DEFAULT 1000,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  goal_id uuid REFERENCES public.goals (id) ON DELETE SET NULL,
  initiative_id uuid REFERENCES public.initiatives (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'lembretes',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  life_front text NOT NULL DEFAULT '',
  notes text,
  media jsonb DEFAULT '[]'::jsonb,
  mood text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.visited_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  city_name text NOT NULL,
  display_name text NOT NULL,
  country text NOT NULL,
  state text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Off Work
-- ---------------------------------------------------------------------------

CREATE TABLE public.offwork_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  icon text,
  "order" int NOT NULL DEFAULT 0
);

CREATE TABLE public.offwork_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.offwork_categories (id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  estimated_duration int,
  actual_duration int,
  due_date timestamptz,
  completed_at timestamptz,
  is_recurring boolean NOT NULL DEFAULT false,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offwork_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration int,
  is_prioritized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tabelas de teste / hierarquia (rotas /api/test-*)
-- ---------------------------------------------------------------------------

CREATE TABLE public.subcategory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.idea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  subcategory_id uuid REFERENCES public.subcategory (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.week_selection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.day_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user ON public.projects (user_id);
CREATE INDEX idx_tags_user ON public.tags (user_id);
CREATE INDEX idx_goals_user ON public.goals (user_id);
CREATE INDEX idx_todos_user_pos ON public.todos (user_id, pos);
CREATE INDEX idx_reminders_user ON public.reminders (user_id);
CREATE INDEX idx_memories_user ON public.memories (user_id);
CREATE INDEX idx_visited_user ON public.visited_cities (user_id);
CREATE INDEX idx_offwork_act_user ON public.offwork_activities (user_id);
CREATE INDEX idx_offwork_ideas_user ON public.offwork_ideas (user_id);

-- ---------------------------------------------------------------------------
-- Funções RPC usadas pelo app
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.move_todo (
  p_id uuid,
  p_status text,
  p_pos double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.todos
  SET
    pos = p_pos,
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE id = p_id
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_offwork_activities_by_category (category_name text)
RETURNS SETOF public.offwork_activities
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.*
  FROM public.offwork_activities a
  INNER JOIN public.offwork_categories c ON c.id = a.category_id
  WHERE c.name = category_name
    AND a.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.move_todo (uuid, text, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_offwork_activities_by_category (text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offwork_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offwork_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offwork_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_own" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_own" ON public.tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_own" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "initiatives_own" ON public.initiatives
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos_own" ON public.todos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_own" ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memories_own" ON public.memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visited_own" ON public.visited_cities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offwork_categories_read" ON public.offwork_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "offwork_activities_own" ON public.offwork_activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offwork_ideas_own" ON public.offwork_ideas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subcategory_rw" ON public.subcategory
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "idea_rw" ON public.idea
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "week_selection_own" ON public.week_selection
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "day_assignment_own" ON public.day_assignment
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed mínimo: categorias Off Work (ajusta nomes no UI se precisares)
-- ---------------------------------------------------------------------------

INSERT INTO public.offwork_categories (name, color, icon, "order") VALUES
  ('Viagens', '#0ea5e9', 'map', 1),
  ('Social', '#8b5cf6', 'users', 2),
  ('Corpo & esporte', '#22c55e', 'activity', 3),
  ('Crescimento', '#f59e0b', 'sparkles', 4),
  ('Lazer', '#ec4899', 'heart', 5);

-- ---------------------------------------------------------------------------
-- Storage: bucket público "media" (memórias)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "media_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media');

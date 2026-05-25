-- Signal/Noise + Life-Admin: substitui Eisenhower e scoring legado.

-- Enums
DO $$ BEGIN
  CREATE TYPE public.task_type AS ENUM ('STRATEGIC', 'LIFE_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_classification AS ENUM (
    'SIGNAL_SEMANA',
    'SIGNAL_BACKLOG',
    'ADIADA_30D',
    'CORTADA'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.life_admin_subtype AS ENUM ('COM_DEADLINE', 'SEM_DEADLINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Remove trigger e colunas de scoring Eisenhower legado
DROP TRIGGER IF EXISTS todos_sync_priority_score_trigger ON public.todos;
DROP FUNCTION IF EXISTS public.todos_sync_priority_score();

ALTER TABLE public.todos
  DROP COLUMN IF EXISTS effort_score,
  DROP COLUMN IF EXISTS importance_score,
  DROP COLUMN IF EXISTS urgency_score,
  DROP COLUMN IF EXISTS priority_score,
  DROP COLUMN IF EXISTS is_important,
  DROP COLUMN IF EXISTS is_urgent,
  DROP COLUMN IF EXISTS eisenhower_configured,
  DROP COLUMN IF EXISTS delegate_timebox_minutes,
  DROP COLUMN IF EXISTS time_sensitive;

-- Novos campos
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS task_type public.task_type,
  ADD COLUMN IF NOT EXISTS status_classification public.status_classification,
  ADD COLUMN IF NOT EXISTS revisao_em date,
  ADD COLUMN IF NOT EXISTS life_admin_subtype public.life_admin_subtype,
  ADD COLUMN IF NOT EXISTS life_admin_deadline date,
  ADD COLUMN IF NOT EXISTS needs_reclassification boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.todos.task_type IS 'STRATEGIC = execução estratégica; LIFE_ADMIN = manutenção de vida.';
COMMENT ON COLUMN public.todos.status_classification IS 'Classificação Signal/Noise para tasks STRATEGIC.';
COMMENT ON COLUMN public.todos.revisao_em IS 'Data de revisão para ADIADA_30D (created_at + 30 dias).';
COMMENT ON COLUMN public.todos.life_admin_subtype IS 'Subtipo para tasks LIFE_ADMIN.';
COMMENT ON COLUMN public.todos.life_admin_deadline IS 'Deadline real para LIFE_ADMIN COM_DEADLINE.';
COMMENT ON COLUMN public.todos.needs_reclassification IS 'Task existente aguardando reclassificação manual.';

-- Tasks existentes: marcar para reclassificação (sem inferir Eisenhower)
UPDATE public.todos
SET
  needs_reclassification = true,
  task_type = NULL,
  status_classification = NULL,
  revisao_em = NULL,
  life_admin_subtype = NULL,
  life_admin_deadline = NULL;

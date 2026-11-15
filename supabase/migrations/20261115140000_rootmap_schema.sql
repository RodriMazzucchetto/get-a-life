-- Rootmap (Opportunity Solution Tree)
-- Tabelas novas com prefixo rm_ — schema antigo permanece arquivado/intocado.

CREATE TABLE IF NOT EXISTS public.rm_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tag text NOT NULL,
  title text NOT NULL,
  metric text,
  color text NOT NULL DEFAULT 'oklch(0.55 0.2 28)',
  soft_color text NOT NULL DEFAULT 'oklch(0.94 0.04 28)',
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);

CREATE TABLE IF NOT EXISTS public.rm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.rm_objectives (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  success_signal text,
  status text NOT NULL DEFAULT 'agora'
    CHECK (status IN ('agora', 'proximo', 'depois', 'resolvido')),
  is_focus boolean NOT NULL DEFAULT false,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.rm_opportunities (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'agora'
    CHECK (status IN ('agora', 'proximo', 'depois', 'descartada', 'validada')),
  is_focus boolean NOT NULL DEFAULT false,
  focused_at timestamptz,
  validated_at timestamptz,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  solution_id uuid NOT NULL REFERENCES public.rm_solutions (id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'nao_testada'
    CHECK (status IN ('nao_testada', 'em_teste', 'validada', 'invalidada')),
  status_note text,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  objective_id uuid REFERENCES public.rm_objectives (id) ON DELETE SET NULL,
  solution_id uuid REFERENCES public.rm_solutions (id) ON DELETE SET NULL,
  assumption_id uuid REFERENCES public.rm_assumptions (id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  kind text NOT NULL DEFAULT 'entrega'
    CHECK (kind IN ('entrega', 'teste')),
  status text NOT NULL DEFAULT 'agora'
    CHECK (status IN ('agora', 'proximo', 'depois')),
  hypothesis text,
  test_result text
    CHECK (test_result IS NULL OR test_result IN ('validou', 'invalidou', 'inconclusivo')),
  wait_reason text,
  recurrence text
    CHECK (recurrence IS NULL OR recurrence IN ('Diária', 'Semanal', 'Mensal')),
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_task_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.rm_tasks (id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  pos double precision NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.rm_opportunities (id) ON DELETE CASCADE,
  body text NOT NULL,
  source_task_id uuid REFERENCES public.rm_tasks (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rm_diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.rm_opportunities (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rm_objectives_user_pos ON public.rm_objectives (user_id, pos);
CREATE INDEX IF NOT EXISTS idx_rm_opportunities_obj ON public.rm_opportunities (objective_id, pos);
CREATE INDEX IF NOT EXISTS idx_rm_solutions_opp ON public.rm_solutions (opportunity_id, pos);
CREATE INDEX IF NOT EXISTS idx_rm_assumptions_sol ON public.rm_assumptions (solution_id, pos);
CREATE INDEX IF NOT EXISTS idx_rm_tasks_user_status ON public.rm_tasks (user_id, status, completed, pos);
CREATE INDEX IF NOT EXISTS idx_rm_tasks_solution ON public.rm_tasks (solution_id, pos);
CREATE INDEX IF NOT EXISTS idx_rm_evidences_opp ON public.rm_evidences (opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rm_diary_opp ON public.rm_diary_entries (opportunity_id, created_at DESC);

-- Um ★ por nível dentro do mesmo pai
CREATE UNIQUE INDEX IF NOT EXISTS idx_rm_opportunities_one_focus
  ON public.rm_opportunities (objective_id)
  WHERE is_focus = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rm_solutions_one_focus
  ON public.rm_solutions (opportunity_id)
  WHERE is_focus = true;

ALTER TABLE public.rm_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rm_diary_entries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rm_objectives','rm_opportunities','rm_solutions','rm_assumptions',
    'rm_tasks','rm_task_steps','rm_evidences','rm_diary_entries'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_own" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_own" ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t, t
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.rm_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rm_objectives','rm_opportunities','rm_solutions','rm_assumptions','rm_tasks'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.rm_touch_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- Ao concluir um teste, atualiza premissa e cria evidência
CREATE OR REPLACE FUNCTION public.rm_apply_test_result(
  p_task_id uuid,
  p_result text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_task public.rm_tasks%ROWTYPE;
  v_ass public.rm_assumptions%ROWTYPE;
  v_sol public.rm_solutions%ROWTYPE;
  v_new_status text;
  v_evidence text;
BEGIN
  IF p_result NOT IN ('validou', 'invalidou', 'inconclusivo') THEN
    RAISE EXCEPTION 'resultado inválido';
  END IF;

  SELECT * INTO v_task FROM public.rm_tasks WHERE id = p_task_id AND user_id = auth.uid();
  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'task não encontrada';
  END IF;
  IF v_task.kind <> 'teste' THEN
    RAISE EXCEPTION 'task não é teste';
  END IF;

  UPDATE public.rm_tasks
  SET
    test_result = p_result,
    completed = true,
    completed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  WHERE id = p_task_id;

  IF v_task.assumption_id IS NOT NULL THEN
    IF p_result = 'validou' THEN
      v_new_status := 'validada';
    ELSIF p_result = 'invalidou' THEN
      v_new_status := 'invalidada';
    ELSE
      v_new_status := 'nao_testada';
    END IF;

    UPDATE public.rm_assumptions
    SET
      status = v_new_status,
      status_note = CASE
        WHEN p_result = 'validou' THEN 'Validada via teste'
        WHEN p_result = 'invalidou' THEN 'Invalidada via teste'
        ELSE 'Teste inconclusivo'
      END,
      updated_at = timezone('utc', now())
    WHERE id = v_task.assumption_id
      AND user_id = auth.uid()
    RETURNING * INTO v_ass;

    IF v_task.solution_id IS NOT NULL THEN
      SELECT * INTO v_sol FROM public.rm_solutions WHERE id = v_task.solution_id;
      IF v_sol.id IS NOT NULL THEN
        v_evidence := format(
          'Teste "%s" → %s. Premissa: %s. Hipótese: %s',
          v_task.title,
          p_result,
          coalesce(v_ass.title, '(sem premissa)'),
          coalesce(v_task.hypothesis, '—')
        );
        INSERT INTO public.rm_evidences (user_id, opportunity_id, body, source_task_id)
        VALUES (auth.uid(), v_sol.opportunity_id, v_evidence, v_task.id);
      END IF;
    END IF;
  END IF;

  -- Se ainda houver testes abertos na mesma premissa, mantém em_teste
  IF v_task.assumption_id IS NOT NULL AND p_result = 'inconclusivo' THEN
    IF EXISTS (
      SELECT 1 FROM public.rm_tasks
      WHERE assumption_id = v_task.assumption_id
        AND kind = 'teste'
        AND completed = false
        AND id <> p_task_id
    ) THEN
      UPDATE public.rm_assumptions
      SET status = 'em_teste', updated_at = timezone('utc', now())
      WHERE id = v_task.assumption_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rm_apply_test_result(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rm_apply_test_result(uuid, text) TO authenticated;

-- Ao criar/abrir task de teste ligada a premissa → em_teste
CREATE OR REPLACE FUNCTION public.rm_sync_assumption_on_test_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.kind = 'teste' AND NEW.assumption_id IS NOT NULL AND NEW.completed = false THEN
    UPDATE public.rm_assumptions
    SET status = 'em_teste',
        status_note = coalesce(status_note, '1 teste em andamento'),
        updated_at = timezone('utc', now())
    WHERE id = NEW.assumption_id
      AND status IN ('nao_testada', 'em_teste');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rm_tasks_sync_assumption ON public.rm_tasks;
CREATE TRIGGER rm_tasks_sync_assumption
  AFTER INSERT OR UPDATE OF kind, assumption_id, completed
  ON public.rm_tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.rm_sync_assumption_on_test_task();

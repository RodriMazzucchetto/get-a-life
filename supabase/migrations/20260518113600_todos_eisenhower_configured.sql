-- Mantém tasks sem badge Eisenhower até o usuário classificar manualmente.
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS eisenhower_configured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.todos.eisenhower_configured IS 'Indica se a classificação Eisenhower foi definida explicitamente pelo usuário.';

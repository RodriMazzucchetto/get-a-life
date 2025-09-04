-- Criar função RPC para mover todos de forma atômica
-- Execute no Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.move_todo(
  p_id uuid,
  p_status text DEFAULT NULL,
  p_pos numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Verificar se o todo pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.todos 
    WHERE id = p_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Todo not found or access denied';
  END IF;

  -- Atualizar pos e/ou status
  UPDATE public.todos
  SET 
    status = COALESCE(p_status, status),
    pos = COALESCE(p_pos, pos),
    updated_at = NOW()
  WHERE id = p_id AND user_id = auth.uid();

  -- Verificar se o update foi bem-sucedido
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update todo';
  END IF;
END;
$$;

-- Testar a função (substitua o ID por um dos seus todos)
-- SELECT public.move_todo('seu-todo-id-aqui', 'current_week', 5000);

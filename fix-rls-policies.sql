-- Corrigir políticas RLS para permitir UPDATE de pos
-- Execute no Supabase SQL Editor

-- 1. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update todos" ON public.todos;
DROP POLICY IF EXISTS "owner_can_update_pos" ON public.todos;

-- 2. Criar política robusta para UPDATE
CREATE POLICY "Users can update own todos"
ON public.todos
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Verificar se a política foi criada
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'todos' AND cmd = 'UPDATE';

-- 4. Testar UPDATE manual (substitua o ID por um dos seus todos)
-- UPDATE public.todos 
-- SET pos = 9999 
-- WHERE id = 'seu-todo-id-aqui' AND user_id = auth.uid();

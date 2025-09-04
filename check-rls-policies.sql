-- Verificar políticas RLS para a tabela todos
-- Execute no Supabase SQL Editor

-- 1. Ver todas as políticas da tabela todos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'todos';

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'todos';

-- 3. Testar se o usuário atual pode fazer UPDATE
SELECT auth.uid() as current_user_id;

-- 4. Verificar se existe política para UPDATE
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'todos' AND cmd = 'UPDATE';

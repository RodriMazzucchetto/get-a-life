-- Script para corrigir as políticas RLS
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar as políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'offwork_activities';

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own activities" ON offwork_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON offwork_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON offwork_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON offwork_activities;

-- Criar políticas corretas
CREATE POLICY "Users can view their own activities" ON offwork_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON offwork_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON offwork_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON offwork_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'offwork_activities';

-- Testar inserção de uma atividade
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Teste de inserção',
  'Esta é uma atividade de teste',
  ARRAY['Teste'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Viagens'
LIMIT 1;

-- Verificar se foi inserida
SELECT COUNT(*) as total_activities FROM offwork_activities;
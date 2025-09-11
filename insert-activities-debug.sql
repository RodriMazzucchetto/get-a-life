-- Script para inserir atividades com debug
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar o user_id atual
SELECT auth.uid() as current_user_id;

-- Verificar se existem categorias
SELECT id, name FROM offwork_categories ORDER BY "order";

-- Inserir atividades de teste
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  auth.uid(), -- Usar o user_id atual
  id,
  'Teste - Terapia ou coaching',
  'Sessões de terapia ou coaching para desenvolvimento pessoal',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento'
LIMIT 1;

-- Verificar se foi inserido
SELECT COUNT(*) as total_activities FROM offwork_activities;

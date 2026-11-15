-- Script para verificar se as atividades foram inseridas
-- Execute este script no Supabase SQL Editor

-- Verificar se existem atividades na tabela
SELECT COUNT(*) as total_activities FROM offwork_activities;

-- Verificar atividades por categoria
SELECT 
  c.name as category_name,
  COUNT(a.id) as activity_count
FROM offwork_categories c
LEFT JOIN offwork_activities a ON c.id = a.category_id
GROUP BY c.id, c.name
ORDER BY c.order;

-- Verificar algumas atividades específicas
SELECT 
  a.title,
  a.description,
  a.tags,
  c.name as category_name
FROM offwork_activities a
JOIN offwork_categories c ON a.category_id = c.id
LIMIT 10;

-- Verificar se o user_id está correto
SELECT DISTINCT user_id FROM offwork_activities;

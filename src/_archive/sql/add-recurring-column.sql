-- Adicionar coluna is_recurring na tabela offwork_activities
ALTER TABLE offwork_activities 
ADD COLUMN is_recurring BOOLEAN DEFAULT false;

-- Reset das atividades para testar do zero
UPDATE offwork_activities 
SET priority = 'medium', is_recurring = false 
WHERE user_id = '6d3e5549-13f8-40a5-8376-2f727f67dabb';

-- Verificar quantas atividades foram resetadas
SELECT COUNT(*) as atividades_resetadas FROM offwork_activities 
WHERE user_id = '6d3e5549-13f8-40a5-8376-2f727f67dabb' 
AND priority = 'medium' AND is_recurring = false;

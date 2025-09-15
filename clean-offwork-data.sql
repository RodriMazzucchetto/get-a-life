-- Script para limpar dados off-work existentes
-- Executar no Supabase SQL Editor

-- Deletar todas as atividades off-work existentes
DELETE FROM offwork_activities;

-- Deletar todas as ideias off-work existentes  
DELETE FROM offwork_ideas;

-- Deletar todas as categorias off-work existentes
DELETE FROM offwork_categories;

-- Verificar se as tabelas estão vazias
SELECT 'offwork_activities' as tabela, COUNT(*) as registros FROM offwork_activities
UNION ALL
SELECT 'offwork_ideas' as tabela, COUNT(*) as registros FROM offwork_ideas  
UNION ALL
SELECT 'offwork_categories' as tabela, COUNT(*) as registros FROM offwork_categories;

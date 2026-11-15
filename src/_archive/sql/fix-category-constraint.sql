-- Corrigir constraint de categoria para permitir todas as categorias hierárquicas
-- Execute este script no Supabase SQL Editor

-- 1. Remover constraint antiga
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;

-- 2. Adicionar nova constraint com todas as categorias
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
  'social', 'relacionamentos', 'hobbies', 'viagens'
));

-- 3. Agora executar o script principal novamente
-- (Execute o setup-hierarchical-tables.sql após este)




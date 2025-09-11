-- Script seguro para corrigir categorias
-- Execute este script no Supabase SQL Editor

-- 1. PRIMEIRO: Remover a constraint que está bloqueando
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;

-- 2. SEGUNDO: Atualizar todas as categorias antigas para as novas
UPDATE idea SET category = 'crescimento' WHERE category IN ('saude', 'aprendizado', 'criatividade');
UPDATE idea SET category = 'social' WHERE category = 'social';
UPDATE idea SET category = 'relacionamentos' WHERE category = 'familia';
UPDATE idea SET category = 'hobbies' WHERE category = 'aventura';

-- 3. TERCEIRO: Verificar se todas as categorias estão corretas
SELECT DISTINCT category, COUNT(*) as count 
FROM idea 
GROUP BY category 
ORDER BY category;

-- 4. QUARTO: Recriar a constraint com as categorias corretas
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
  'social', 'relacionamentos', 'hobbies', 'viagens'
));

-- 5. QUINTO: Verificar se a constraint foi aplicada corretamente
SELECT DISTINCT category, COUNT(*) as count 
FROM idea 
GROUP BY category 
ORDER BY category;



-- Script para corrigir categorias passo a passo
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos ver quais categorias existem atualmente
-- (Execute este SELECT para ver o que temos)
SELECT DISTINCT category, COUNT(*) as count 
FROM idea 
GROUP BY category 
ORDER BY category;

-- 2. Atualizar categorias antigas para as novas
UPDATE idea SET category = 'crescimento' WHERE category IN ('saude', 'aprendizado', 'criatividade');
UPDATE idea SET category = 'social' WHERE category = 'social';
UPDATE idea SET category = 'relacionamentos' WHERE category = 'familia';
UPDATE idea SET category = 'hobbies' WHERE category = 'aventura';

-- 3. Agora remover a constraint antiga
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;

-- 4. Adicionar nova constraint
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
  'social', 'relacionamentos', 'hobbies', 'viagens'
));

-- 5. Verificar se funcionou
SELECT DISTINCT category, COUNT(*) as count 
FROM idea 
GROUP BY category 
ORDER BY category;





-- Script para renormalizar posições quando ficam muito próximas
-- Execute no Supabase SQL Editor quando necessário

-- 1. Verificar posições atuais
SELECT 
    id, 
    title, 
    pos, 
    status,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY pos ASC) as current_order
FROM public.todos 
WHERE user_id = auth.uid()
ORDER BY status, pos ASC;

-- 2. Renormalizar posições (executar apenas se necessário)
-- ATENÇÃO: Isso vai reordenar todos os itens baseado na ordem atual
WITH renumbered AS (
  SELECT 
    id,
    status,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY pos ASC) * 1000 as new_pos
  FROM public.todos 
  WHERE user_id = auth.uid()
)
UPDATE public.todos 
SET pos = renumbered.new_pos
FROM renumbered
WHERE public.todos.id = renumbered.id;

-- 3. Verificar resultado
SELECT 
    id, 
    title, 
    pos, 
    status,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY pos ASC) as new_order
FROM public.todos 
WHERE user_id = auth.uid()
ORDER BY status, pos ASC;

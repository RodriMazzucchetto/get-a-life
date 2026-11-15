-- Script para adicionar coluna pos no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar coluna pos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS pos DECIMAL(10,2);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_todos_pos ON todos(pos);

-- 3. Backfill usando CTE (Common Table Expression) - funciona no Supabase
WITH numbered_todos AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) * 1000 as new_pos
  FROM todos
  WHERE pos IS NULL
)
UPDATE todos 
SET pos = numbered_todos.new_pos
FROM numbered_todos
WHERE todos.id = numbered_todos.id;

-- 4. Tornar a coluna NOT NULL após o backfill
ALTER TABLE todos ALTER COLUMN pos SET NOT NULL;

-- 5. Verificar resultado
SELECT id, title, pos, created_at 
FROM todos 
ORDER BY pos ASC;

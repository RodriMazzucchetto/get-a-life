-- Versão simples para adicionar coluna pos no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar coluna pos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS pos DECIMAL(10,2);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_todos_pos ON todos(pos);

-- 3. Backfill simples - atribuir pos baseado na ordem atual
-- Primeiro, vamos ver quantos todos existem
SELECT COUNT(*) as total_todos FROM todos;

-- 4. Atribuir pos manualmente (substitua os IDs pelos seus)
-- Exemplo para os primeiros todos:
UPDATE todos SET pos = 1000 WHERE id = 'seu-primeiro-todo-id';
UPDATE todos SET pos = 2000 WHERE id = 'seu-segundo-todo-id';
UPDATE todos SET pos = 3000 WHERE id = 'seu-terceiro-todo-id';
-- Continue para todos os seus todos...

-- 5. Tornar a coluna NOT NULL após o backfill
ALTER TABLE todos ALTER COLUMN pos SET NOT NULL;

-- 6. Verificar resultado
SELECT id, title, pos, created_at 
FROM todos 
ORDER BY pos ASC;

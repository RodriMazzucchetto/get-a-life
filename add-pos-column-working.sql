-- Script que funciona no Supabase para adicionar coluna pos
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar coluna pos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS pos DECIMAL(10,2);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_todos_pos ON todos(pos);

-- 3. Backfill usando uma função que funciona no Supabase
-- Primeiro, vamos criar uma função temporária
CREATE OR REPLACE FUNCTION update_todos_pos()
RETURNS void AS $$
DECLARE
    todo_record RECORD;
    counter INTEGER := 1000;
BEGIN
    FOR todo_record IN 
        SELECT id FROM todos ORDER BY created_at ASC
    LOOP
        UPDATE todos SET pos = counter WHERE id = todo_record.id;
        counter := counter + 1000;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Executar a função
SELECT update_todos_pos();

-- 5. Remover a função temporária
DROP FUNCTION update_todos_pos();

-- 6. Tornar a coluna NOT NULL após o backfill
ALTER TABLE todos ALTER COLUMN pos SET NOT NULL;

-- 7. Verificar resultado
SELECT id, title, pos, created_at 
FROM todos 
ORDER BY pos ASC;

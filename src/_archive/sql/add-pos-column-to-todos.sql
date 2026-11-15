-- Adicionar coluna pos para ordenação persistente
ALTER TABLE todos ADD COLUMN IF NOT EXISTS pos DECIMAL(10,2);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_todos_pos ON todos(pos);

-- Backfill: atribuir pos baseado no created_at atual
-- Usar gaps de 1000 para permitir inserções futuras
UPDATE todos 
SET pos = (ROW_NUMBER() OVER (ORDER BY created_at ASC) * 1000)
WHERE pos IS NULL;

-- Tornar a coluna NOT NULL após o backfill
ALTER TABLE todos ALTER COLUMN pos SET NOT NULL;

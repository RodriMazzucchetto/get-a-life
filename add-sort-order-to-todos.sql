-- =====================================================
-- ADICIONAR CAMPO DE ORDENAÇÃO À TABELA TODOS
-- =====================================================

-- Adicionar campo sort_order para persistir a ordem dos itens
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Criar índice para melhor performance na ordenação
CREATE INDEX IF NOT EXISTS idx_todos_sort_order ON todos(sort_order);

-- Atualizar todos os registros existentes com um sort_order baseado na data de criação
-- Itens mais antigos terão sort_order menor (aparecem primeiro)
UPDATE todos 
SET sort_order = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE sort_order = 0;

-- Comentário explicativo
COMMENT ON COLUMN todos.sort_order IS 'Campo para controlar a ordem de exibição dos itens. Itens em pausa devem ter sort_order maior para aparecer no final.';

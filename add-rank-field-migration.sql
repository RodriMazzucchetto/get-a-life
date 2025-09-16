-- MIGRAÇÃO: ADICIONAR CAMPO rank PARA ORDENAÇÃO ESTÁVEL
-- ⚠️ IMPORTANTE: Este script NÃO deleta nenhum dado existente!

-- =====================================================
-- 1. ADICIONAR CAMPO rank (LexoRank-like)
-- =====================================================

-- Adicionar campo rank se não existir
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT '0|00000:00000';

-- =====================================================
-- 2. INICIALIZAR RANK PARA TODOS OS TODOS EXISTENTES
-- =====================================================

-- Função para gerar rank inicial baseado na posição atual
CREATE OR REPLACE FUNCTION initialize_ranks()
RETURNS void AS $$
DECLARE
    todo_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Para cada status, ordenar por pos e atribuir rank sequencial
    FOR todo_record IN 
        SELECT id, status, pos 
        FROM todos 
        WHERE rank = '0|00000:00000'  -- Só inicializar os que ainda não têm rank
        ORDER BY status, pos ASC
    LOOP
        -- Gerar rank no formato LexoRank: "0|00001:00000", "0|00002:00000", etc.
        UPDATE todos 
        SET rank = '0|' || LPAD(counter::text, 5, '0') || ':00000'
        WHERE id = todo_record.id;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Inicializados % ranks para todos existentes', counter - 1;
END;
$$ LANGUAGE plpgsql;

-- Executar a inicialização
SELECT initialize_ranks();

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice composto para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_todos_status_hold_priority_rank 
ON todos (status, on_hold, priority, rank);

-- Índice para busca por rank
CREATE INDEX IF NOT EXISTS idx_todos_rank ON todos (rank);

-- =====================================================
-- 4. FUNÇÕES AUXILIARES PARA LEXORANK
-- =====================================================

-- Função para gerar rank entre dois valores
CREATE OR REPLACE FUNCTION between_ranks(prev_rank TEXT, next_rank TEXT)
RETURNS TEXT AS $$
DECLARE
    prev_parts TEXT[];
    next_parts TEXT[];
    prev_num INTEGER;
    next_num INTEGER;
    new_num INTEGER;
    result TEXT;
BEGIN
    -- Se não há rank anterior, usar "0|00000:00000"
    IF prev_rank IS NULL THEN
        prev_rank := '0|00000:00000';
    END IF;
    
    -- Se não há rank próximo, usar "0|99999:00000"
    IF next_rank IS NULL THEN
        next_rank := '0|99999:00000';
    END IF;
    
    -- Extrair número da parte principal (ex: "0|00001:00000" -> 1)
    prev_parts := string_to_array(prev_rank, '|');
    next_parts := string_to_array(next_rank, '|');
    
    prev_num := substring(prev_parts[2], 1, 5)::INTEGER;
    next_num := substring(next_parts[2], 1, 5)::INTEGER;
    
    -- Calcular novo número (média simples)
    new_num := (prev_num + next_num) / 2;
    
    -- Se os números são muito próximos, usar subdivisão
    IF next_num - prev_num <= 1 THEN
        result := prev_parts[1] || '|' || LPAD(prev_num::text, 5, '0') || ':00001';
    ELSE
        result := prev_parts[1] || '|' || LPAD(new_num::text, 5, '0') || ':00000';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar rank após o último item
CREATE OR REPLACE FUNCTION after_rank(status_filter TEXT, on_hold_filter BOOLEAN)
RETURNS TEXT AS $$
DECLARE
    last_rank TEXT;
    last_num INTEGER;
    result TEXT;
BEGIN
    -- Buscar último rank do status/on_hold especificado
    SELECT rank INTO last_rank
    FROM todos 
    WHERE status = status_filter 
      AND on_hold = on_hold_filter
      AND rank IS NOT NULL
    ORDER BY rank DESC 
    LIMIT 1;
    
    -- Se não há itens, usar rank inicial
    IF last_rank IS NULL THEN
        RETURN '0|00001:00000';
    END IF;
    
    -- Extrair número e incrementar
    last_num := substring(string_to_array(last_rank, '|')[2], 1, 5)::INTEGER;
    result := '0|' || LPAD((last_num + 1)::text, 5, '0') || ':00000';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar rank antes do primeiro item
CREATE OR REPLACE FUNCTION before_rank(status_filter TEXT, on_hold_filter BOOLEAN)
RETURNS TEXT AS $$
DECLARE
    first_rank TEXT;
    first_num INTEGER;
    result TEXT;
BEGIN
    -- Buscar primeiro rank do status/on_hold especificado
    SELECT rank INTO first_rank
    FROM todos 
    WHERE status = status_filter 
      AND on_hold = on_hold_filter
      AND rank IS NOT NULL
    ORDER BY rank ASC 
    LIMIT 1;
    
    -- Se não há itens, usar rank inicial
    IF first_rank IS NULL THEN
        RETURN '0|00001:00000';
    END IF;
    
    -- Extrair número e decrementar
    first_num := substring(string_to_array(first_rank, '|')[2], 1, 5)::INTEGER;
    
    -- Se seria menor que 1, usar subdivisão
    IF first_num <= 1 THEN
        result := '0|00000:00001';
    ELSE
        result := '0|' || LPAD((first_num - 1)::text, 5, '0') || ':00000';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNÇÃO PARA MOVER TODO (ATÔMICA)
-- =====================================================

CREATE OR REPLACE FUNCTION move_todo_atomic(
    todo_id UUID,
    new_status TEXT DEFAULT NULL,
    new_on_hold BOOLEAN DEFAULT NULL,
    prev_rank TEXT DEFAULT NULL,
    next_rank TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    new_rank TEXT;
    current_todo RECORD;
BEGIN
    -- Buscar todo atual
    SELECT status, on_hold, rank INTO current_todo
    FROM todos 
    WHERE id = todo_id;
    
    -- Se não encontrou, retornar erro
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Todo % não encontrado', todo_id;
    END IF;
    
    -- Calcular novo rank
    IF prev_rank IS NOT NULL OR next_rank IS NOT NULL THEN
        -- Rank específico (drag & drop)
        new_rank := between_ranks(prev_rank, next_rank);
    ELSIF new_on_hold = true THEN
        -- Pausar: ir para o fim
        new_rank := after_rank(
            COALESCE(new_status, current_todo.status), 
            true
        );
    ELSIF new_on_hold = false AND current_todo.on_hold = true THEN
        -- Despausar: ir para o fim dos não pausados
        new_rank := after_rank(
            COALESCE(new_status, current_todo.status), 
            false
        );
    ELSE
        -- Manter rank atual
        new_rank := current_todo.rank;
    END IF;
    
    -- Atualizar todo
    UPDATE todos 
    SET 
        status = COALESCE(new_status, status),
        on_hold = COALESCE(new_on_hold, on_hold),
        rank = new_rank,
        updated_at = NOW()
    WHERE id = todo_id;
    
    RETURN new_rank;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todos os todos têm rank
DO $$
DECLARE
    todos_sem_rank INTEGER;
BEGIN
    SELECT COUNT(*) INTO todos_sem_rank 
    FROM todos 
    WHERE rank IS NULL OR rank = '';
    
    IF todos_sem_rank > 0 THEN
        RAISE NOTICE 'ATENÇÃO: % todos ainda não têm rank!', todos_sem_rank;
    ELSE
        RAISE NOTICE '✅ Todos os todos têm rank definido';
    END IF;
END;
$$;

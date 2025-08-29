-- DELETAR COMPLETAMENTE TODAS AS TABELAS DE TAGS
-- ⚠️ ATENÇÃO: ISSO É IRREVERSÍVEL!

-- 1. Deletar tabela de relacionamento todo_tags
DROP TABLE IF EXISTS todo_tags CASCADE;

-- 2. Deletar tabela de tags
DROP TABLE IF EXISTS tags CASCADE;

-- 3. Verificar se foram deletadas
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('tags', 'todo_tags');

-- 4. Se ainda existirem, forçar remoção
DO $$
BEGIN
    -- Forçar remoção de todo_tags se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todo_tags') THEN
        EXECUTE 'DROP TABLE todo_tags CASCADE';
        RAISE NOTICE 'Tabela todo_tags removida com sucesso';
    END IF;
    
    -- Forçar remoção de tags se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN
        EXECUTE 'DROP TABLE tags CASCADE';
        RAISE NOTICE 'Tabela tags removida com sucesso';
    END IF;
END $$;

-- 5. Verificação final
SELECT 'TABELAS DE TAGS DELETADAS COM SUCESSO!' as status;

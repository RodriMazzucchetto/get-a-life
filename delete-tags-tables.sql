-- DELETAR COMPLETAMENTE TODAS AS TABELAS DE TAGS E PROJETOS
-- ⚠️ ATENÇÃO: ISSO É IRREVERSÍVEL!

-- 1. Deletar tabela de relacionamento todo_tags
DROP TABLE IF EXISTS todo_tags CASCADE;

-- 2. Deletar tabela de tags
DROP TABLE IF EXISTS tags CASCADE;

-- 3. Deletar tabela de projetos
DROP TABLE IF EXISTS projects CASCADE;

-- 4. Verificar se foram deletadas
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('tags', 'todo_tags', 'projects');

-- 5. Se ainda existirem, forçar remoção
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
    
    -- Forçar remoção de projects se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        EXECUTE 'DROP TABLE projects CASCADE';
        RAISE NOTICE 'Tabela projects removida com sucesso';
    END IF;
END $$;

-- 6. Verificação final
SELECT 'TABELAS DE TAGS E PROJETOS DELETADAS COM SUCESSO!' as status;

-- FUNÇÃO RPC PARA EXECUTAR SQL DINÂMICO
-- ⚠️ ATENÇÃO: Esta função deve ser usada apenas para migrações controladas

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TEXT AS $$
BEGIN
    EXECUTE sql;
    RETURN 'SQL executado com sucesso';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

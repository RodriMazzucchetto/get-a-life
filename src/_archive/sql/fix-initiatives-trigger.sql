-- CORREÇÃO: Remover trigger problemático que tenta atualizar campos inexistentes
-- Este trigger está causando erro: column "initiatives_count" does not exist

-- Remover o trigger que tenta atualizar campos inexistentes
DROP TRIGGER IF EXISTS update_goal_initiatives_count_trigger ON initiatives;

-- Remover a função que tenta atualizar campos inexistentes
DROP FUNCTION IF EXISTS update_goal_initiatives_count();

-- Verificar se o trigger foi removido
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_goal_initiatives_count_trigger';

-- Verificar se a função foi removida
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_goal_initiatives_count';

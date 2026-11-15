-- Script para testar a estrutura da tabela reminders
-- Execute este script no Supabase SQL Editor para verificar se o campo completed_at existe

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reminders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se existem lembretes
SELECT COUNT(*) as total_reminders FROM reminders;

-- Verificar lembretes por status
SELECT 
  completed,
  completed_at,
  COUNT(*) as count
FROM reminders 
GROUP BY completed, completed_at;

-- Testar inserção de lembrete com completed_at
INSERT INTO reminders (user_id, title, category, priority, completed, completed_at)
VALUES (
  auth.uid(),
  'Teste de completed_at',
  'lembretes',
  'medium',
  true,
  NOW()
);

-- Verificar se foi inserido corretamente
SELECT * FROM reminders WHERE title = 'Teste de completed_at';

-- Limpar teste
DELETE FROM reminders WHERE title = 'Teste de completed_at';

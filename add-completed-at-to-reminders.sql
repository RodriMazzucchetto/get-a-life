-- Adicionar campo completed_at à tabela reminders
-- Este script adiciona o campo completed_at para rastrear quando um lembrete foi concluído

-- Adicionar a coluna completed_at
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar a coluna deleted_at para soft delete (opcional)
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhor performance nas queries de filtro
CREATE INDEX IF NOT EXISTS idx_reminders_user_completed 
ON reminders(user_id, completed_at) 
WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reminders_user_deleted 
ON reminders(user_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Atualizar lembretes existentes que estão marcados como completed=true
-- para ter completed_at preenchido
UPDATE reminders 
SET completed_at = updated_at 
WHERE completed = true AND completed_at IS NULL;

-- Comentário: A partir de agora, use completed_at para verificar se está concluído
-- O campo 'completed' pode ser mantido para compatibilidade ou removido futuramente

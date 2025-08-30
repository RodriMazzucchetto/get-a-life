-- MIGRAÇÃO DA ESTRUTURA EXISTENTE PARA NOVA HIERARQUIA
-- ⚠️ ATENÇÃO: Este script AJUSTA tabelas existentes, não cria do zero

-- =====================================================
-- 1. RENOMEAR goal_initiatives → initiatives
-- =====================================================

-- Primeiro, deletar a tabela antiga (se existir)
DROP TABLE IF EXISTS goal_initiatives CASCADE;

-- Criar a nova tabela initiatives
CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. ADICIONAR CAMPOS DE RELACIONAMENTO EM todos
-- =====================================================

-- Adicionar campos para relacionar atividades com projetos/metas/iniciativas
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL;

-- =====================================================
-- 3. CRIAR ÍNDICES PARA OS NOVOS RELACIONAMENTOS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_goal_id ON todos(goal_id);
CREATE INDEX IF NOT EXISTS idx_todos_initiative_id ON todos(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_goal_id ON initiatives(goal_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_user_id ON initiatives(user_id);

-- =====================================================
-- 4. HABILITAR RLS PARA initiatives
-- =====================================================

ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS PARA initiatives
-- =====================================================

CREATE POLICY "Users can view own initiatives" ON initiatives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own initiatives" ON initiatives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own initiatives" ON initiatives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own initiatives" ON initiatives
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CRIAR TRIGGER PARA initiatives
-- =====================================================

CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FUNÇÃO PARA ATUALIZAR CONTADOR DE INICIATIVAS
-- =====================================================

CREATE OR REPLACE FUNCTION update_goal_initiatives_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE goals 
        SET initiatives_count = initiatives_count + 1,
            total_initiatives = total_initiatives + 1
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE goals 
        SET initiatives_count = initiatives_count - 1
        WHERE id = OLD.goal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para atualizar contador de iniciativas
DROP TRIGGER IF EXISTS update_goal_initiatives_count_trigger ON initiatives;
CREATE TRIGGER update_goal_initiatives_count_trigger
    AFTER INSERT OR DELETE ON initiatives
    FOR EACH ROW EXECUTE FUNCTION update_goal_initiatives_count();

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status;

-- Verificar estrutura final
SELECT 
    table_name,
    '✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'projects', 'goals', 'initiatives', 'todos', 
        'reminders', 'tags', 'todo_tags'
    )
ORDER BY table_name;

-- Verificar campos adicionados em todos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'todos' 
    AND column_name IN ('project_id', 'goal_id', 'initiative_id')
ORDER BY column_name;

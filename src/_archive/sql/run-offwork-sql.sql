-- Execute este script no Supabase SQL Editor para criar as tabelas Off Work

-- 1. Tabela de categorias Off Work
CREATE TABLE IF NOT EXISTS offwork_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de atividades Off Work
CREATE TABLE IF NOT EXISTS offwork_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES offwork_categories(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_duration INTEGER, -- em minutos
    actual_duration INTEGER, -- em minutos
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[], -- array de tags
    metadata JSONB, -- dados adicionais flexíveis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de ideias Off Work (para ideias não implementadas ainda)
CREATE TABLE IF NOT EXISTS offwork_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES offwork_categories(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    source VARCHAR(100), -- onde a ideia veio (sugestão IA, manual, etc)
    status VARCHAR(20) DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_duration INTEGER, -- em minutos
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir categorias padrão
INSERT INTO offwork_categories (name, color, description, icon) VALUES
('Viagens', 'blue', 'Atividades relacionadas a viagens e turismo', '🌍'),
('Mini Aventuras', 'green', 'Pequenas aventuras e experiências locais', '🌱'),
('Esporte', 'orange', 'Atividades esportivas e exercícios', '⚽'),
('Crescimento', 'purple', 'Atividades de desenvolvimento pessoal', '📈'),
('Social', 'cyan', 'Atividades sociais e networking', '👥'),
('Relacionamentos', 'pink', 'Atividades para fortalecer relacionamentos', '💕'),
('Lifestyle', 'indigo', 'Atividades de estilo de vida e bem-estar', '🎨'),
('Hobbies', 'yellow', 'Hobbies e passatempos pessoais', '🎯')
ON CONFLICT (name) DO NOTHING;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_offwork_activities_user_id ON offwork_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_offwork_activities_category_id ON offwork_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_offwork_activities_status ON offwork_activities(status);
CREATE INDEX IF NOT EXISTS idx_offwork_activities_created_at ON offwork_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_offwork_ideas_user_id ON offwork_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_category_id ON offwork_ideas(category_id);
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_status ON offwork_ideas(status);
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_created_at ON offwork_ideas(created_at);

-- 6. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offwork_categories_updated_at 
    BEFORE UPDATE ON offwork_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offwork_activities_updated_at 
    BEFORE UPDATE ON offwork_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offwork_ideas_updated_at 
    BEFORE UPDATE ON offwork_ideas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS Policies
ALTER TABLE offwork_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offwork_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (todos podem ler, apenas admins podem modificar)
CREATE POLICY "Categorias são visíveis para todos" ON offwork_categories
    FOR SELECT USING (true);

-- Políticas para atividades (usuários só veem suas próprias)
CREATE POLICY "Usuários podem ver suas próprias atividades" ON offwork_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias atividades" ON offwork_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias atividades" ON offwork_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias atividades" ON offwork_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ideias (usuários só veem suas próprias)
CREATE POLICY "Usuários podem ver suas próprias ideias" ON offwork_ideas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias ideias" ON offwork_ideas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias ideias" ON offwork_ideas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias ideias" ON offwork_ideas
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Funções auxiliares
CREATE OR REPLACE FUNCTION get_offwork_categories()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    color VARCHAR(20),
    description TEXT,
    icon VARCHAR(50),
    activity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.color,
        c.description,
        c.icon,
        COALESCE(COUNT(a.id), 0) as activity_count
    FROM offwork_categories c
    LEFT JOIN offwork_activities a ON c.id = a.category_id AND a.user_id = auth.uid()
    GROUP BY c.id, c.name, c.color, c.description, c.icon
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_offwork_activities_by_category(category_name VARCHAR)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20),
    priority VARCHAR(10),
    estimated_duration INTEGER,
    actual_duration INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.status,
        a.priority,
        a.estimated_duration,
        a.actual_duration,
        a.due_date,
        a.completed_at,
        a.tags,
        a.created_at,
        a.updated_at
    FROM offwork_activities a
    JOIN offwork_categories c ON a.category_id = c.id
    WHERE c.name = category_name 
    AND a.user_id = auth.uid()
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_offwork_ideas_by_category(category_name VARCHAR)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20),
    priority VARCHAR(10),
    estimated_duration INTEGER,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.estimated_duration,
        i.tags,
        i.created_at,
        i.updated_at
    FROM offwork_ideas i
    JOIN offwork_categories c ON i.category_id = c.id
    WHERE c.name = category_name 
    AND i.user_id = auth.uid()
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

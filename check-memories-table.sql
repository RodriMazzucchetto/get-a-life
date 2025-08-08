-- =====================================================
-- VERIFICAÇÃO E CRIAÇÃO DA TABELA MEMORIES
-- =====================================================

-- Verificar se a tabela memories existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'memories'
) as table_exists;

-- Se a tabela não existir, criá-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'memories'
    ) THEN
        -- Criar a tabela memories
        CREATE TABLE memories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            life_front TEXT NOT NULL,
            accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            notes TEXT,
            media TEXT[],
            mood TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Comentários explicativos
        COMMENT ON TABLE memories IS 'Tabela para armazenar as experiências aceitas pelos usuários no diário';
        COMMENT ON COLUMN memories.id IS 'Identificador único da memória';
        COMMENT ON COLUMN memories.user_id IS 'ID do usuário que aceitou a experiência';
        COMMENT ON COLUMN memories.title IS 'Título da experiência aceita (mesmo da sugestão)';
        COMMENT ON COLUMN memories.life_front IS 'Frente de vida relacionada à experiência';
        COMMENT ON COLUMN memories.accepted_at IS 'Data e hora em que a experiência foi aceita';
        COMMENT ON COLUMN memories.notes IS 'Notas opcionais do usuário sobre a experiência';
        COMMENT ON COLUMN memories.media IS 'Array de URLs para fotos/vídeos da experiência';
        COMMENT ON COLUMN memories.mood IS 'Sentimento final do usuário após a experiência';
        COMMENT ON COLUMN memories.created_at IS 'Data de criação do registro';

        -- Criar índices para melhor performance
        CREATE INDEX idx_memories_user_id ON memories(user_id);
        CREATE INDEX idx_memories_accepted_at ON memories(accepted_at DESC);
        CREATE INDEX idx_memories_life_front ON memories(life_front);

        -- Configurar Row Level Security (RLS)
        ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

        -- Política para usuários verem apenas suas próprias memórias
        CREATE POLICY "Users can view their own memories" ON memories
            FOR SELECT USING (auth.uid() = user_id);

        -- Política para usuários criarem suas próprias memórias
        CREATE POLICY "Users can create their own memories" ON memories
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Política para usuários atualizarem suas próprias memórias
        CREATE POLICY "Users can update their own memories" ON memories
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        -- Política para usuários deletarem suas próprias memórias
        CREATE POLICY "Users can delete their own memories" ON memories
            FOR DELETE USING (auth.uid() = user_id);

        RAISE NOTICE 'Tabela memories criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela memories já existe!';
    END IF;
END $$;

-- Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'memories'
ORDER BY ordinal_position;

-- Verificar as políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'memories';

-- Testar inserção (apenas para verificar se funciona)
-- INSERT INTO memories (title, life_front) VALUES ('Teste', 'creativity') RETURNING id; 
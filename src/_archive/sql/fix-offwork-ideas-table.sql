-- Script para verificar e corrigir a estrutura da tabela offwork_ideas
-- Executar no Supabase SQL Editor

-- 1. Verificar se a tabela existe e sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'offwork_ideas' 
ORDER BY ordinal_position;

-- 2. Se a tabela não existir, criar ela completa
CREATE TABLE IF NOT EXISTS offwork_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_prioritized BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  estimated_duration INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar due_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offwork_ideas' AND column_name = 'due_date') THEN
        ALTER TABLE offwork_ideas ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar completed_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offwork_ideas' AND column_name = 'completed_at') THEN
        ALTER TABLE offwork_ideas ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offwork_ideas' AND column_name = 'updated_at') THEN
        ALTER TABLE offwork_ideas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Habilitar RLS
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offwork_ideas' AND policyname = 'Users can manage their own ideas') THEN
        CREATE POLICY "Users can manage their own ideas" ON offwork_ideas
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_offwork_ideas_updated_at ON offwork_ideas;
CREATE TRIGGER update_offwork_ideas_updated_at 
  BEFORE UPDATE ON offwork_ideas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'offwork_ideas' 
ORDER BY ordinal_position;

-- 8. Testar inserção
INSERT INTO offwork_ideas (user_id, title, description, tags, estimated_duration, is_prioritized)
VALUES (auth.uid(), 'Teste', 'Ideia de teste', '{"teste"}', 60, false)
ON CONFLICT DO NOTHING;

-- 9. Verificar dados
SELECT COUNT(*) as total_ideas FROM offwork_ideas;

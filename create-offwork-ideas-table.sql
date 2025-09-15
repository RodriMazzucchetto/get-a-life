-- Script simples para criar apenas a tabela offwork_ideas
-- Executar no Supabase SQL Editor

-- Criar tabela offwork_ideas se não existir
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offwork_ideas' AND policyname = 'Users can view their own ideas') THEN
        CREATE POLICY "Users can view their own ideas" ON offwork_ideas
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offwork_ideas' AND policyname = 'Users can insert their own ideas') THEN
        CREATE POLICY "Users can insert their own ideas" ON offwork_ideas
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offwork_ideas' AND policyname = 'Users can update their own ideas') THEN
        CREATE POLICY "Users can update their own ideas" ON offwork_ideas
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offwork_ideas' AND policyname = 'Users can delete their own ideas') THEN
        CREATE POLICY "Users can delete their own ideas" ON offwork_ideas
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Criar trigger para updated_at (se não existir)
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

-- Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_user_id ON offwork_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_prioritized ON offwork_ideas(user_id, is_prioritized);
CREATE INDEX IF NOT EXISTS idx_offwork_ideas_created_at ON offwork_ideas(user_id, created_at DESC);

-- Verificar se a tabela foi criada corretamente
SELECT 'offwork_ideas' as tabela, COUNT(*) as registros FROM offwork_ideas;

-- Script para configurar sistema simplificado de off-work
-- Executar no Supabase SQL Editor

-- 1. Limpar dados existentes
DELETE FROM offwork_activities;
DELETE FROM offwork_ideas;
DELETE FROM offwork_categories;

-- 2. Recriar tabela offwork_ideas com estrutura simplificada
DROP TABLE IF EXISTS offwork_ideas CASCADE;

CREATE TABLE offwork_ideas (
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

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
CREATE POLICY "Users can view their own ideas" ON offwork_ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas" ON offwork_ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas" ON offwork_ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas" ON offwork_ideas
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offwork_ideas_updated_at 
  BEFORE UPDATE ON offwork_ideas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar índices para performance
CREATE INDEX idx_offwork_ideas_user_id ON offwork_ideas(user_id);
CREATE INDEX idx_offwork_ideas_prioritized ON offwork_ideas(user_id, is_prioritized);
CREATE INDEX idx_offwork_ideas_created_at ON offwork_ideas(user_id, created_at DESC);

-- 7. Verificar se a tabela foi criada corretamente
SELECT 'offwork_ideas' as tabela, COUNT(*) as registros FROM offwork_ideas;

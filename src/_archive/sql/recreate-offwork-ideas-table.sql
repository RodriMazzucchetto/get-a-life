-- Script para recriar a tabela offwork_ideas sem due_date
-- Executar no Supabase SQL Editor

-- 1. Dropar a tabela existente (CUIDADO: isso vai deletar todos os dados!)
DROP TABLE IF EXISTS offwork_ideas CASCADE;

-- 2. Criar a tabela novamente sem due_date
CREATE TABLE offwork_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_prioritized BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  estimated_duration INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- 4. Criar política
CREATE POLICY "Users can manage their own ideas" ON offwork_ideas
  FOR ALL USING (auth.uid() = user_id);

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

-- 6. Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'offwork_ideas' 
ORDER BY ordinal_position;

-- 7. Testar inserção
INSERT INTO offwork_ideas (user_id, title, description, tags, estimated_duration, is_prioritized)
VALUES (auth.uid(), 'Teste', 'Ideia de teste', '{"teste"}', 60, false);

-- 8. Verificar dados
SELECT COUNT(*) as total_ideas FROM offwork_ideas;

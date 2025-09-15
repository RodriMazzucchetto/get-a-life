-- Teste simples para verificar se a tabela offwork_ideas existe
-- Executar no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'offwork_ideas'
);

-- Se a tabela não existir, criar ela
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

-- Habilitar RLS
ALTER TABLE offwork_ideas ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas
CREATE POLICY "Users can manage their own ideas" ON offwork_ideas
  FOR ALL USING (auth.uid() = user_id);

-- Verificar se foi criada
SELECT 'offwork_ideas' as tabela, COUNT(*) as registros FROM offwork_ideas;

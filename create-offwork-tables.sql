-- Tabelas para funcionalidade Off Work
-- Executar no Supabase SQL Editor

-- Tabela de ideias (catálogo mestre)
CREATE TABLE IF NOT EXISTS idea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('saude', 'social', 'aprendizado', 'aventura', 'criatividade', 'familia')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de seleções para a semana
CREATE TABLE IF NOT EXISTS week_selection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES idea(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  selected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, week_start)
);

-- Tabela de alocações por dia
CREATE TABLE IF NOT EXISTS day_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES idea(id) ON DELETE CASCADE,
  date date NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_week_selection_week_start ON week_selection(week_start);
CREATE INDEX IF NOT EXISTS idx_day_assignment_date ON day_assignment(date);
CREATE INDEX IF NOT EXISTS idx_idea_category ON idea(category);

-- RLS Policies
ALTER TABLE idea ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_assignment ENABLE ROW LEVEL SECURITY;

-- Políticas para idea
CREATE POLICY "Users can view all ideas" ON idea FOR SELECT USING (true);
CREATE POLICY "Users can insert ideas" ON idea FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ideas" ON idea FOR UPDATE USING (true);
CREATE POLICY "Users can delete ideas" ON idea FOR DELETE USING (true);

-- Políticas para week_selection
CREATE POLICY "Users can manage their week selections" ON week_selection FOR ALL USING (true);

-- Políticas para day_assignment
CREATE POLICY "Users can manage their day assignments" ON day_assignment FOR ALL USING (true);

-- Inserir algumas ideias de exemplo
INSERT INTO idea (title, category) VALUES
  ('Fazer uma caminhada no parque', 'saude'),
  ('Ler um livro novo', 'aprendizado'),
  ('Assistir um filme com amigos', 'social'),
  ('Experimentar uma receita nova', 'criatividade'),
  ('Visitar um museu', 'aprendizado'),
  ('Fazer um piquenique', 'familia'),
  ('Aprender a tocar um instrumento', 'criatividade'),
  ('Fazer voluntariado', 'social'),
  ('Praticar meditação', 'saude'),
  ('Fazer uma viagem de fim de semana', 'aventura');

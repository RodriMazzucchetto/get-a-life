-- Script rápido para atualizar categorias no Supabase
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos atualizar a constraint da tabela para aceitar as novas categorias
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
  'social', 'relacionamentos', 'hobbies', 'viagens'
));

-- Agora vamos inserir algumas ideias das novas categorias
INSERT INTO idea (title, category) VALUES
-- Crescimento
('Terapia ou Coaching', 'crescimento'),
('Escrita Reflexiva', 'crescimento'),
('Estudo Bíblico', 'crescimento'),
('Aprender Novos Idiomas', 'crescimento'),

-- Mini Aventuras
('Exploração Urbana', 'mini-aventuras'),
('Museu Oscar Niemeyer', 'mini-aventuras'),
('Escalada Indoor', 'mini-aventuras'),
('Cozinhar Algo Exótico', 'mini-aventuras'),

-- Lifestyle
('Cursos de culinária', 'lifestyle'),
('Spas Urbanos', 'lifestyle'),
('Hotel Boutique', 'lifestyle'),
('Autocuidado', 'lifestyle'),

-- Esporte
('Treino MT 3x semana', 'esporte'),
('Stand Up Paddle', 'esporte'),
('Surf', 'esporte'),
('Bike Noturna', 'esporte'),

-- Social
('Sauna Semanal', 'social'),
('Voluntariado', 'social'),
('Company retreat 1x ano', 'social'),

-- Relacionamentos
('Microaventuras a dois', 'relacionamentos'),
('Conversas diferentes', 'relacionamentos'),
('Surpresas especiais', 'relacionamentos'),

-- Hobbies
('Pintura', 'hobbies'),
('Cerâmica', 'hobbies'),
('Piano com indicadores', 'hobbies'),
('Board games', 'hobbies'),
('Cultura Biker', 'hobbies'),

-- Viagens
('Morretes - Bate volta', 'viagens'),
('Antonina - Bate volta', 'viagens'),
('South of France', 'viagens'),
('Northern Italy', 'viagens'),
('Bariloche', 'viagens');

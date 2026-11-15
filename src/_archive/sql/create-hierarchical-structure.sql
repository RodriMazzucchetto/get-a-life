-- Estrutura hierárquica: Categoria → Subcategoria → Atividades
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos limpar tudo
DELETE FROM day_assignment;
DELETE FROM week_selection;
DELETE FROM idea;

-- Criar tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Atualizar tabela idea para referenciar subcategoria
ALTER TABLE idea DROP COLUMN IF EXISTS subcategory;
ALTER TABLE idea ADD COLUMN subcategory_id uuid REFERENCES subcategory(id) ON DELETE CASCADE;

-- Inserir subcategorias conforme sua estrutura

-- CRESCIMENTO
INSERT INTO subcategory (name, category) VALUES
('Pessoal', 'crescimento'),
('Espiritual', 'crescimento'),
('Profissional', 'crescimento');

-- SOCIAL
INSERT INTO subcategory (name, category) VALUES
('Compromissos fixos', 'social'),
('Eventos esporádicos', 'social'),
('Comunidades', 'social'),
('Voluntariado', 'social');

-- RELACIONAMENTOS
INSERT INTO subcategory (name, category) VALUES
('Afetivo', 'relacionamentos'),
('Profissional', 'relacionamentos'),
('Amizade', 'relacionamentos');

-- HOBBIES
INSERT INTO subcategory (name, category) VALUES
('Criativos', 'hobbies'),
('Intelectuais', 'hobbies'),
('Jogos', 'hobbies'),
('Gastronômicos', 'hobbies'),
('Colecionáveis', 'hobbies'),
('Motorcycle', 'hobbies');

-- LIFESTYLE
INSERT INTO subcategory (name, category) VALUES
('Casa', 'lifestyle'),
('Experiências premium', 'lifestyle'),
('Gastronomia', 'lifestyle');

-- MINI AVENTURAS
INSERT INTO subcategory (name, category) VALUES
('Exploração urbana', 'mini-aventuras'),
('Culturais', 'mini-aventuras'),
('Físicas', 'mini-aventuras'),
('Sensorial', 'mini-aventuras');

-- ESPORTE (sem subcategorias)
-- VIAGENS (sem subcategorias)

-- Inserir algumas atividades de exemplo para cada subcategoria

-- CRESCIMENTO > Pessoal
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Terapia ou Coaching', 'crescimento', id FROM subcategory WHERE name = 'Pessoal' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Escrita Reflexiva', 'crescimento', id FROM subcategory WHERE name = 'Pessoal' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cursos de Soft Skills', 'crescimento', id FROM subcategory WHERE name = 'Pessoal' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Livros de Desenvolvimento Pessoal', 'crescimento', id FROM subcategory WHERE name = 'Pessoal' AND category = 'crescimento';

-- CRESCIMENTO > Espiritual
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Estudo Bíblico', 'crescimento', id FROM subcategory WHERE name = 'Espiritual' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Meditações', 'crescimento', id FROM subcategory WHERE name = 'Espiritual' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Retiros Espirituais', 'crescimento', id FROM subcategory WHERE name = 'Espiritual' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Jejuns', 'crescimento', id FROM subcategory WHERE name = 'Espiritual' AND category = 'crescimento';

-- CRESCIMENTO > Profissional
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Aprender Novos Idiomas', 'crescimento', id FROM subcategory WHERE name = 'Profissional' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cursos de Tecnologia', 'crescimento', id FROM subcategory WHERE name = 'Profissional' AND category = 'crescimento';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Desenvolvimento de Negócios', 'crescimento', id FROM subcategory WHERE name = 'Profissional' AND category = 'crescimento';

-- SOCIAL > Compromissos fixos
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Sauna Semanal', 'social', id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Treino MT 3x/semana', 'social', id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Treino Musculação 6x/semana', 'social', id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Bera com brothers 1x/mês', 'social', id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Algo com a mulher', 'social', id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social';

-- SOCIAL > Eventos esporádicos
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Company retreat 1x/ano', 'social', id FROM subcategory WHERE name = 'Eventos esporádicos' AND category = 'social';

-- SOCIAL > Comunidades
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Participar de Comunidades', 'social', id FROM subcategory WHERE name = 'Comunidades' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Encontrar grupos de interesse', 'social', id FROM subcategory WHERE name = 'Comunidades' AND category = 'social';

-- SOCIAL > Voluntariado
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Voluntariado', 'social', id FROM subcategory WHERE name = 'Voluntariado' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Ajudar em ONGs', 'social', id FROM subcategory WHERE name = 'Voluntariado' AND category = 'social';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Mentoria voluntária', 'social', id FROM subcategory WHERE name = 'Voluntariado' AND category = 'social';

-- RELACIONAMENTOS > Afetivo
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Microaventuras a dois', 'relacionamentos', id FROM subcategory WHERE name = 'Afetivo' AND category = 'relacionamentos';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Conversas diferentes', 'relacionamentos', id FROM subcategory WHERE name = 'Afetivo' AND category = 'relacionamentos';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Pequenos Rituais', 'relacionamentos', id FROM subcategory WHERE name = 'Afetivo' AND category = 'relacionamentos';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Surpresas especiais', 'relacionamentos', id FROM subcategory WHERE name = 'Afetivo' AND category = 'relacionamentos';

-- HOBBIES > Criativos
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Pintura', 'hobbies', id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cerâmica', 'hobbies', id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Piano com guia que indica onde tocar', 'hobbies', id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies';

-- HOBBIES > Jogos
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Jogos PC', 'hobbies', id FROM subcategory WHERE name = 'Jogos' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Board games', 'hobbies', id FROM subcategory WHERE name = 'Jogos' AND category = 'hobbies';

-- HOBBIES > Gastronômicos
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cozinhar pratos específicos', 'hobbies', id FROM subcategory WHERE name = 'Gastronômicos' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Produções próprias', 'hobbies', id FROM subcategory WHERE name = 'Gastronômicos' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Degustações temáticas', 'hobbies', id FROM subcategory WHERE name = 'Gastronômicos' AND category = 'hobbies';

-- HOBBIES > Motorcycle
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cultura Biker', 'hobbies', id FROM subcategory WHERE name = 'Motorcycle' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Manutenção/Mecânica de motos', 'hobbies', id FROM subcategory WHERE name = 'Motorcycle' AND category = 'hobbies';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Tech/Gadgets para motos', 'hobbies', id FROM subcategory WHERE name = 'Motorcycle' AND category = 'hobbies';

-- LIFESTYLE > Casa
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Renovar guarda-roupa', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Autocuidado', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Decoração da casa', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Organização e minimalismo', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle';

-- LIFESTYLE > Experiências premium
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Spas Urbanos', 'lifestyle', id FROM subcategory WHERE name = 'Experiências premium' AND category = 'lifestyle';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Hotel Boutique', 'lifestyle', id FROM subcategory WHERE name = 'Experiências premium' AND category = 'lifestyle';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Massagens terapêuticas', 'lifestyle', id FROM subcategory WHERE name = 'Experiências premium' AND category = 'lifestyle';

-- MINI AVENTURAS > Exploração urbana
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Ir a um evento aleatório do Meetup', 'mini-aventuras', id FROM subcategory WHERE name = 'Exploração urbana' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Se inscrever num curso muito louco', 'mini-aventuras', id FROM subcategory WHERE name = 'Exploração urbana' AND category = 'mini-aventuras';

-- MINI AVENTURAS > Culturais
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Museu Oscar Niemeyer', 'mini-aventuras', id FROM subcategory WHERE name = 'Culturais' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Teatro ou stand-up', 'mini-aventuras', id FROM subcategory WHERE name = 'Culturais' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Retiro espiritual', 'mini-aventuras', id FROM subcategory WHERE name = 'Culturais' AND category = 'mini-aventuras';

-- MINI AVENTURAS > Físicas
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Escalada Indoor', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Bike Noturna', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Trekking urbano em bairros específicos', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Stand Up Paddle', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Surf', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Skate', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras';

-- MINI AVENTURAS > Sensorial
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Terapias Sensoriais', 'mini-aventuras', id FROM subcategory WHERE name = 'Sensorial' AND category = 'mini-aventuras';
INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cozinhar Algo Exótico', 'mini-aventuras', id FROM subcategory WHERE name = 'Sensorial' AND category = 'mini-aventuras';

-- ESPORTE (sem subcategorias)
INSERT INTO idea (title, category) VALUES
('Treino MT 3x/semana', 'esporte'),
('Treino Musculação 6x/semana', 'esporte'),
('Stand Up Paddle', 'esporte'),
('Surf', 'esporte'),
('Escalada Indoor', 'esporte'),
('Bike Noturna', 'esporte'),
('Skate', 'esporte'),
('Trekking Urbano', 'esporte'),
('Corrida', 'esporte'),
('Natação', 'esporte');

-- VIAGENS (sem subcategorias)
INSERT INTO idea (title, category) VALUES
('Morretes - Bate volta', 'viagens'),
('Antonina - Bate volta', 'viagens'),
('Parque Estadual do Pau Oco', 'viagens'),
('South of France', 'viagens'),
('Northern Italy', 'viagens'),
('Bariloche', 'viagens'),
('Jerusalem - Viagem espiritual', 'viagens'),
('Road trip de moto', 'viagens'),
('Viagem de fim de semana', 'viagens'),
('Retiro em local remoto', 'viagens');

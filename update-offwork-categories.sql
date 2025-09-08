-- Atualização das categorias e ideias baseadas no mapa mental "Getting a Life"
-- Executar no Supabase SQL Editor

-- Primeiro, vamos limpar as ideias existentes para recriar com a nova estrutura
DELETE FROM day_assignment;
DELETE FROM week_selection;
DELETE FROM idea;

-- Atualizar as categorias permitidas
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
  'social', 'relacionamentos', 'hobbies', 'viagens'
));

-- Inserir ideias baseadas no mapa mental

-- CRESCIMENTO (Pink Branch)
INSERT INTO idea (title, category) VALUES
-- Pessoal
('Terapia ou Coaching', 'crescimento'),
('Escrita Reflexiva', 'crescimento'),
('Cursos de Soft Skills', 'crescimento'),
('Livros de Desenvolvimento Pessoal', 'crescimento'),

-- Espiritual
('Estudo Bíblico', 'crescimento'),
('Meditações', 'crescimento'),
('Retiros Espirituais', 'crescimento'),
('Jejuns', 'crescimento'),

-- Profissional
('Aprender Novos Idiomas', 'crescimento'),
('Cursos de Tecnologia', 'crescimento'),
('Desenvolvimento de Negócios', 'crescimento');

-- MINI AVENTURAS (Yellow Branch)
INSERT INTO idea (title, category) VALUES
-- Experiências Inusitadas
('Exploração Urbana', 'mini-aventuras'),
('Ir a um evento aleatório do Meetup', 'mini-aventuras'),
('Se inscrever num curso muito louco', 'mini-aventuras'),

-- Culturais
('Museu Oscar Niemeyer', 'mini-aventuras'),
('Teatro ou stand-up', 'mini-aventuras'),
('Retiro Espiritual', 'mini-aventuras'),

-- Físicas
('Escalada Indoor', 'mini-aventuras'),
('Bike Noturna', 'mini-aventuras'),
('Trekking Urbano em Bairros específicos', 'mini-aventuras'),
('Stand Up Paddle', 'mini-aventuras'),
('Surf', 'mini-aventuras'),
('Skate', 'mini-aventuras'),

-- Sensorial
('Terapias Sensoriais', 'mini-aventuras'),
('Cozinhar Algo Exótico', 'mini-aventuras'),
('Testar novos restaurantes', 'mini-aventuras');

-- LIFESTYLE (Green Branch)
INSERT INTO idea (title, category) VALUES
-- Gastronomia
('Cursos de culinária', 'lifestyle'),
('Degustações', 'lifestyle'),

-- Estilo
('Renovar guarda-roupa', 'lifestyle'),
('Autocuidado', 'lifestyle'),
('Experimentar novos perfumes', 'lifestyle'),

-- Casa
('Decoração da casa', 'lifestyle'),
('Criar ambientes sensoriais', 'lifestyle'),
('Organização e minimalismo', 'lifestyle'),

-- Tecnologia
('Automatizações domésticas', 'lifestyle'),
('Gadgets inovadores', 'lifestyle'),

-- Experiências Premium
('Spas Urbanos', 'lifestyle'),
('Hotel Boutique', 'lifestyle'),
('Assinaturas Especiais', 'lifestyle'),
('Massagens terapêuticas', 'lifestyle');

-- ESPORTE (Blue Branch)
INSERT INTO idea (title, category) VALUES
('Treino MT 3x semana', 'esporte'),
('Treino Musc 6x semana', 'esporte'),
('Stand Up Paddle', 'esporte'),
('Surf', 'esporte'),
('Escalada Indoor', 'esporte'),
('Bike Noturna', 'esporte'),
('Skate', 'esporte'),
('Trekking Urbano', 'esporte');

-- SOCIAL (Orange Branch)
INSERT INTO idea (title, category) VALUES
-- Compromissos Fixos
('Sauna Semanal', 'social'),
('Bera com brothers 1x no mês', 'social'),
('Algo com a mulher', 'social'),

-- Eventos Esporádicos
('Company retreat 1x ano', 'social'),
('Participar de Comunidades', 'social'),
('Voluntariado', 'social'),
('Eventos do Meetup', 'social');

-- RELACIONAMENTOS (Red Branch)
INSERT INTO idea (title, category) VALUES
-- Afetivo
('Microaventuras a dois', 'relacionamentos'),
('Conversas diferentes', 'relacionamentos'),
('Pequenos Rituais', 'relacionamentos'),
('Surpresas especiais', 'relacionamentos'),

-- Profissional
('Networking profissional', 'relacionamentos'),
('Mentoria', 'relacionamentos'),

-- Amizade
('Encontrar com amigos antigos', 'relacionamentos'),
('Fazer novas amizades', 'relacionamentos');

-- HOBBIES (Purple Branch)
INSERT INTO idea (title, category) VALUES
-- Criativos
('Pintura', 'hobbies'),
('Cerâmica', 'hobbies'),
('Piano com indicadores', 'hobbies'),

-- Intelectuais
('Leitura de ficção', 'hobbies'),
('Quebra-cabeças complexos', 'hobbies'),
('Aprender história', 'hobbies'),

-- Jogos
('Jogos PC', 'hobbies'),
('Board games', 'hobbies'),

-- Gastronômicos
('Cozinhar pratos específicos', 'hobbies'),
('Produções Próprias', 'hobbies'),
('Degustações Temáticas', 'hobbies'),

-- Colecionáveis
('Colecionar moedas', 'hobbies'),
('Colecionar selos', 'hobbies'),

-- Motorcycle
('Cultura Biker', 'hobbies'),
('Manutenção/Mecânica de motos', 'hobbies'),
('Tech/Gadgets para motos', 'hobbies');

-- VIAGENS (Adicionando algumas viagens baseadas no mapa mental)
INSERT INTO idea (title, category) VALUES
('Morretes - Bate volta', 'viagens'),
('Antonina - Bate volta', 'viagens'),
('Parque Estadual do Pau Oco', 'viagens'),
('South of France', 'viagens'),
('Northern Italy', 'viagens'),
('Bariloche', 'viagens'),
('Jerusalem - Viagem espiritual', 'viagens'),
('Viagem de fim de semana', 'viagens'),
('Retiro em local remoto', 'viagens'),
('Road trip de moto', 'viagens');

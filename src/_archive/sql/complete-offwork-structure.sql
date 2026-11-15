-- Estrutura completa do Off Work baseada no mapa mental
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos limpar e recriar tudo
DELETE FROM day_assignment;
DELETE FROM week_selection;
DELETE FROM idea;

-- Atualizar constraint para aceitar todas as categorias
ALTER TABLE idea DROP CONSTRAINT IF EXISTS idea_category_check;
ALTER TABLE idea ADD CONSTRAINT idea_category_check 
CHECK (category IN (
  'crescimento', 'social', 'relacionamentos', 'hobbies', 
  'lifestyle', 'mini-aventuras', 'esporte', 'viagens'
));

-- ========================================
-- CRESCIMENTO
-- ========================================

-- Crescimento > Pessoal
INSERT INTO idea (title, category) VALUES
('Terapia ou Coaching', 'crescimento'),
('Escrita Reflexiva', 'crescimento'),
('Cursos de Soft Skills', 'crescimento'),
('Livros de Desenvolvimento Pessoal', 'crescimento');

-- Crescimento > Espiritual
INSERT INTO idea (title, category) VALUES
('Estudo Bíblico', 'crescimento'),
('Meditações', 'crescimento'),
('Retiros Espirituais', 'crescimento'),
('Jejuns', 'crescimento');

-- Crescimento > Profissional
INSERT INTO idea (title, category) VALUES
('Aprender Novos Idiomas', 'crescimento'),
('Cursos de Tecnologia', 'crescimento'),
('Desenvolvimento de Negócios', 'crescimento');

-- ========================================
-- SOCIAL
-- ========================================

-- Social > Compromissos Fixos
INSERT INTO idea (title, category) VALUES
('Sauna Semanal', 'social'),
('Treino MT 3x/semana', 'social'),
('Treino Musculação 6x/semana', 'social'),
('Bera com brothers 1x/mês', 'social'),
('Algo com a mulher', 'social');

-- Social > Eventos Esporádicos
INSERT INTO idea (title, category) VALUES
('Company retreat 1x/ano', 'social');

-- Social > Comunidades (atividades genéricas)
INSERT INTO idea (title, category) VALUES
('Participar de Comunidades', 'social'),
('Encontrar grupos de interesse', 'social');

-- Social > Voluntariado
INSERT INTO idea (title, category) VALUES
('Voluntariado', 'social'),
('Ajudar em ONGs', 'social'),
('Mentoria voluntária', 'social');

-- ========================================
-- RELACIONAMENTOS
-- ========================================

-- Relacionamentos > Afetivo
INSERT INTO idea (title, category) VALUES
('Microaventuras a dois', 'relacionamentos'),
('Conversas diferentes', 'relacionamentos'),
('Pequenos Rituais', 'relacionamentos'),
('Surpresas especiais', 'relacionamentos');

-- Relacionamentos > Profissional
INSERT INTO idea (title, category) VALUES
('Networking profissional', 'relacionamentos'),
('Mentoria profissional', 'relacionamentos'),
('Colaborações profissionais', 'relacionamentos');

-- Relacionamentos > Amizade
INSERT INTO idea (title, category) VALUES
('Encontrar com amigos antigos', 'relacionamentos'),
('Fazer novas amizades', 'relacionamentos'),
('Manter contato regular', 'relacionamentos');

-- ========================================
-- HOBBIES
-- ========================================

-- Hobbies > Criativos
INSERT INTO idea (title, category) VALUES
('Pintura', 'hobbies'),
('Cerâmica', 'hobbies'),
('Piano com guia que indica onde tocar', 'hobbies'),
('Desenho', 'hobbies'),
('Fotografia', 'hobbies');

-- Hobbies > Intelectuais
INSERT INTO idea (title, category) VALUES
('Leitura de ficção', 'hobbies'),
('Quebra-cabeças complexos', 'hobbies'),
('Aprender história', 'hobbies'),
('Estudar filosofia', 'hobbies');

-- Hobbies > Jogos
INSERT INTO idea (title, category) VALUES
('Jogos PC', 'hobbies'),
('Board games', 'hobbies'),
('Jogos de tabuleiro estratégicos', 'hobbies');

-- Hobbies > Gastronômicos
INSERT INTO idea (title, category) VALUES
('Cozinhar pratos específicos', 'hobbies'),
('Produções próprias', 'hobbies'),
('Degustações temáticas', 'hobbies'),
('Criar receitas originais', 'hobbies');

-- Hobbies > Colecionáveis
INSERT INTO idea (title, category) VALUES
('Colecionar moedas', 'hobbies'),
('Colecionar selos', 'hobbies'),
('Colecionar livros raros', 'hobbies');

-- Hobbies > Motorcycle
INSERT INTO idea (title, category) VALUES
('Cultura Biker', 'hobbies'),
('Manutenção/Mecânica de motos', 'hobbies'),
('Tech/Gadgets para motos', 'hobbies'),
('Passeios de moto', 'hobbies');

-- ========================================
-- LIFESTYLE
-- ========================================

-- Lifestyle > Casa
INSERT INTO idea (title, category) VALUES
('Renovar guarda-roupa', 'lifestyle'),
('Autocuidado', 'lifestyle'),
('Experimentar novos perfumes', 'lifestyle'),
('Decoração da casa', 'lifestyle'),
('Criar ambientes sensoriais', 'lifestyle'),
('Organização e minimalismo', 'lifestyle'),
('Automatizações domésticas', 'lifestyle'),
('Gadgets inovadores', 'lifestyle');

-- Lifestyle > Experiências Premium
INSERT INTO idea (title, category) VALUES
('Spas Urbanos', 'lifestyle'),
('Hotel Boutique', 'lifestyle'),
('Assinaturas Especiais', 'lifestyle'),
('Massagens terapêuticas', 'lifestyle'),
('Experiências VIP', 'lifestyle');

-- Lifestyle > Gastronomia
INSERT INTO idea (title, category) VALUES
('Cursos de culinária', 'lifestyle'),
('Degustações', 'lifestyle'),
('Testar novos restaurantes', 'lifestyle'),
('Jantares temáticos', 'lifestyle');

-- ========================================
-- MINI AVENTURAS
-- ========================================

-- Mini Aventuras > Exploração Urbana
INSERT INTO idea (title, category) VALUES
('Ir a um evento aleatório do Meetup', 'mini-aventuras'),
('Se inscrever num curso muito louco', 'mini-aventuras'),
('Exploração Urbana', 'mini-aventuras'),
('Descobrir lugares secretos da cidade', 'mini-aventuras');

-- Mini Aventuras > Culturais
INSERT INTO idea (title, category) VALUES
('Museu Oscar Niemeyer', 'mini-aventuras'),
('Teatro ou stand-up', 'mini-aventuras'),
('Retiro espiritual', 'mini-aventuras'),
('Festivais culturais', 'mini-aventuras');

-- Mini Aventuras > Físicas
INSERT INTO idea (title, category) VALUES
('Escalada Indoor', 'mini-aventuras'),
('Bike Noturna', 'mini-aventuras'),
('Trekking urbano em bairros específicos', 'mini-aventuras'),
('Stand Up Paddle', 'mini-aventuras'),
('Surf', 'mini-aventuras'),
('Skate', 'mini-aventuras'),
('Parkour urbano', 'mini-aventuras');

-- Mini Aventuras > Sensorial
INSERT INTO idea (title, category) VALUES
('Terapias Sensoriais', 'mini-aventuras'),
('Cozinhar Algo Exótico', 'mini-aventuras'),
('Testar novos restaurantes', 'mini-aventuras'),
('Experiências sensoriais únicas', 'mini-aventuras');

-- ========================================
-- ESPORTE
-- ========================================

-- Esporte (categoria principal)
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

-- ========================================
-- VIAGENS
-- ========================================

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

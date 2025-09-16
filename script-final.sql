CREATE TABLE IF NOT EXISTS subcategory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE idea ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES subcategory(id) ON DELETE CASCADE;

INSERT INTO subcategory (name, category) VALUES
('Pessoal', 'crescimento'),
('Espiritual', 'crescimento'),
('Profissional', 'crescimento'),
('Compromissos fixos', 'social'),
('Eventos esporádicos', 'social'),
('Comunidades', 'social'),
('Voluntariado', 'social'),
('Afetivo', 'relacionamentos'),
('Profissional', 'relacionamentos'),
('Amizade', 'relacionamentos'),
('Criativos', 'hobbies'),
('Intelectuais', 'hobbies'),
('Jogos', 'hobbies'),
('Gastronômicos', 'hobbies'),
('Colecionáveis', 'hobbies'),
('Motorcycle', 'hobbies'),
('Casa', 'lifestyle'),
('Experiências premium', 'lifestyle'),
('Gastronomia', 'lifestyle'),
('Exploração urbana', 'mini-aventuras'),
('Culturais', 'mini-aventuras'),
('Físicas', 'mini-aventuras'),
('Sensorial', 'mini-aventuras');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Pessoal' AND category = 'crescimento' LIMIT 1)
WHERE title IN ('Terapia ou Coaching', 'Escrita Reflexiva', 'Cursos de Soft Skills', 'Livros de Desenvolvimento Pessoal');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Espiritual' AND category = 'crescimento' LIMIT 1)
WHERE title IN ('Estudo Bíblico', 'Meditações', 'Retiros Espirituais', 'Jejuns');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Profissional' AND category = 'crescimento' LIMIT 1)
WHERE title IN ('Aprender Novos Idiomas', 'Cursos de Tecnologia', 'Desenvolvimento de Negócios');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Compromissos fixos' AND category = 'social' LIMIT 1)
WHERE title IN ('Sauna Semanal', 'Treino MT 3x/semana', 'Treino Musculação 6x/semana', 'Bera com brothers 1x/mês', 'Algo com a mulher');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Eventos esporádicos' AND category = 'social' LIMIT 1)
WHERE title IN ('Company retreat 1x/ano');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Comunidades' AND category = 'social' LIMIT 1)
WHERE title IN ('Participar de Comunidades', 'Encontrar grupos de interesse');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Voluntariado' AND category = 'social' LIMIT 1)
WHERE title IN ('Voluntariado', 'Ajudar em ONGs', 'Mentoria voluntária');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Afetivo' AND category = 'relacionamentos' LIMIT 1)
WHERE title IN ('Microaventuras a dois', 'Conversas diferentes', 'Pequenos Rituais', 'Surpresas especiais');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies' LIMIT 1)
WHERE title IN ('Pintura', 'Cerâmica', 'Piano com guia que indica onde tocar');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Jogos' AND category = 'hobbies' LIMIT 1)
WHERE title IN ('Jogos PC', 'Board games');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Gastronômicos' AND category = 'hobbies' LIMIT 1)
WHERE title IN ('Cozinhar pratos específicos', 'Produções próprias', 'Degustações temáticas');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Motorcycle' AND category = 'hobbies' LIMIT 1)
WHERE title IN ('Cultura Biker', 'Manutenção/Mecânica de motos', 'Tech/Gadgets para motos');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle' LIMIT 1)
WHERE title IN ('Renovar guarda-roupa', 'Autocuidado', 'Decoração da casa', 'Organização e minimalismo');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Experiências premium' AND category = 'lifestyle' LIMIT 1)
WHERE title IN ('Spas Urbanos', 'Hotel Boutique', 'Massagens terapêuticas');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Exploração urbana' AND category = 'mini-aventuras' LIMIT 1)
WHERE title IN ('Ir a um evento aleatório do Meetup', 'Se inscrever num curso muito louco');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Culturais' AND category = 'mini-aventuras' LIMIT 1)
WHERE title IN ('Museu Oscar Niemeyer', 'Teatro ou stand-up', 'Retiro espiritual');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras' LIMIT 1)
WHERE title IN ('Escalada Indoor', 'Bike Noturna', 'Trekking urbano em bairros específicos', 'Stand Up Paddle', 'Surf', 'Skate');

UPDATE idea SET subcategory_id = (SELECT id FROM subcategory WHERE name = 'Sensorial' AND category = 'mini-aventuras' LIMIT 1)
WHERE title IN ('Terapias Sensoriais', 'Cozinhar Algo Exótico');

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Desenho', 'hobbies', id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Fotografia', 'hobbies', id FROM subcategory WHERE name = 'Criativos' AND category = 'hobbies'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Jogos de tabuleiro estratégicos', 'hobbies', id FROM subcategory WHERE name = 'Jogos' AND category = 'hobbies'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Criar receitas originais', 'hobbies', id FROM subcategory WHERE name = 'Gastronômicos' AND category = 'hobbies'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Passeios de moto', 'hobbies', id FROM subcategory WHERE name = 'Motorcycle' AND category = 'hobbies'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Experimentar novos perfumes', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Criar ambientes sensoriais', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Automatizações domésticas', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Gadgets inovadores', 'lifestyle', id FROM subcategory WHERE name = 'Casa' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Experiências VIP', 'lifestyle', id FROM subcategory WHERE name = 'Experiências premium' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Cursos de culinária', 'lifestyle', id FROM subcategory WHERE name = 'Gastronomia' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Degustações', 'lifestyle', id FROM subcategory WHERE name = 'Gastronomia' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Testar novos restaurantes', 'lifestyle', id FROM subcategory WHERE name = 'Gastronomia' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Jantares temáticos', 'lifestyle', id FROM subcategory WHERE name = 'Gastronomia' AND category = 'lifestyle'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Exploração Urbana', 'mini-aventuras', id FROM subcategory WHERE name = 'Exploração urbana' AND category = 'mini-aventuras'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Descobrir lugares secretos da cidade', 'mini-aventuras', id FROM subcategory WHERE name = 'Exploração urbana' AND category = 'mini-aventuras'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Festivais culturais', 'mini-aventuras', id FROM subcategory WHERE name = 'Culturais' AND category = 'mini-aventuras'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Parkour urbano', 'mini-aventuras', id FROM subcategory WHERE name = 'Físicas' AND category = 'mini-aventuras'
ON CONFLICT DO NOTHING;

INSERT INTO idea (title, category, subcategory_id) 
SELECT 'Experiências sensoriais únicas', 'mini-aventuras', id FROM subcategory WHERE name = 'Sensorial' AND category = 'mini-aventuras'
ON CONFLICT DO NOTHING;





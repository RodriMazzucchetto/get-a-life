-- Script final para adicionar atividades com seu user_id real
-- Execute este script no Supabase SQL Editor

-- CRESCIMENTO - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Terapia ou coaching',
  'Sessões de terapia ou coaching para desenvolvimento pessoal',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- CRESCIMENTO - Profissional
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Soft skills - Cursos',
  'Cursos de desenvolvimento de soft skills',
  ARRAY['Profissional'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- VIAGENS - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Viagem para a praia',
  'Férias relaxantes na praia',
  ARRAY['Pessoal'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Viagens';

-- VIAGENS - Aventura
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Trilha na montanha',
  'Caminhada em trilha de montanha',
  ARRAY['Aventura'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Viagens';

-- ESPORTE - Individual
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Corrida matinal',
  'Corrida de 5km todas as manhãs',
  ARRAY['Individual'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Esporte';

-- ESPORTE - Equipe
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Futebol com amigos',
  'Pelada semanal com a galera',
  ARRAY['Equipe'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Esporte';

-- SOCIAL - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Happy hour com colegas',
  'Encontro casual com colegas de trabalho',
  ARRAY['Pessoal'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Social';

-- HOBBIES - Criativo
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Pintura em aquarela',
  'Aprender técnicas de pintura em aquarela',
  ARRAY['Criativo'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- LIFESTYLE - Saúde
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Meditação diária',
  'Prática de meditação de 10 minutos por dia',
  ARRAY['Saúde'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Lifestyle';

-- RELACIONAMENTOS - Romântico
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Jantar romântico',
  'Jantar especial com a pessoa amada',
  ARRAY['Romântico'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

-- Script corrigido para adicionar atividades com seu user_id real
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos ver qual é o seu user_id real
-- Execute esta query primeiro para ver seu user_id:
-- SELECT id, email FROM auth.users LIMIT 1;

-- 2. Depois substitua 'SEU_USER_ID_AQUI' pelo ID que apareceu acima
-- e execute o resto do script:

-- CRESCIMENTO - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
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
  'SEU_USER_ID_AQUI'::uuid,  -- SUBSTITUA pelo seu user_id real
  id,
  'Jantar romântico',
  'Jantar especial com a pessoa amada',
  ARRAY['Romântico'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

-- Script de teste para adicionar algumas atividades
-- Execute este script no Supabase SQL Editor

-- 1. CRESCIMENTO - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Terapia ou coaching',
  'Sessões de terapia ou coaching para desenvolvimento pessoal',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- 2. CRESCIMENTO - Profissional
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Soft skills - Cursos',
  'Cursos de desenvolvimento de soft skills',
  ARRAY['Profissional'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- 3. VIAGENS - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Viagem para a praia',
  'Férias relaxantes na praia',
  ARRAY['Pessoal'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Viagens';

-- 4. VIAGENS - Aventura
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Trilha na montanha',
  'Caminhada em trilha de montanha',
  ARRAY['Aventura'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Viagens';

-- 5. ESPORTE - Individual
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Corrida matinal',
  'Corrida de 5km todas as manhãs',
  ARRAY['Individual'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Esporte';

-- 6. ESPORTE - Equipe
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Futebol com amigos',
  'Pelada semanal com a galera',
  ARRAY['Equipe'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Esporte';

-- 7. SOCIAL - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Happy hour com colegas',
  'Encontro casual com colegas de trabalho',
  ARRAY['Pessoal'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Social';

-- 8. HOBBIES - Criativo
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Pintura em aquarela',
  'Aprender técnicas de pintura em aquarela',
  ARRAY['Criativo'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- 9. LIFESTYLE - Saúde
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Meditação diária',
  'Prática de meditação de 10 minutos por dia',
  ARRAY['Saúde'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Lifestyle';

-- 10. RELACIONAMENTOS - Romântico
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Jantar romântico',
  'Jantar especial com a pessoa amada',
  ARRAY['Romântico'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

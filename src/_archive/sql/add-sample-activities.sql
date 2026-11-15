-- Script simplificado para adicionar algumas atividades de exemplo
-- Execute este script no Supabase SQL Editor

-- CRESCIMENTO - Pessoal
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Soft skills - Cursos',
  'Cursos para desenvolvimento de habilidades interpessoais',
  ARRAY['Pessoal', 'Cursos'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- CRESCIMENTO - Espiritual
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Estudo bíblico',
  'Estudo regular das escrituras',
  ARRAY['Espiritual'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Meditações',
  'Práticas de meditação e mindfulness',
  ARRAY['Espiritual', 'Meditações'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- SOCIAL - Compromissos fixos
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Sauna semanal',
  'Sessão semanal de sauna para relaxamento',
  ARRAY['Compromissos fixos', 'Sauna'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Social';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Treino MT 3×/semana',
  'Treino de artes marciais 3 vezes por semana',
  ARRAY['Compromissos fixos', 'Artes Marciais'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Social';

-- HOBBIES - Criativos
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Pintura',
  'Prática de pintura como hobby criativo',
  ARRAY['Criativos', 'Arte'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Piano com guia',
  'Aprendizado de piano com guia que indica onde tocar',
  ARRAY['Criativos', 'Música', 'Piano'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- HOBBIES - Motorcycle
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Cultura biker',
  'Participação na cultura e comunidade biker',
  ARRAY['Motorcycle', 'Cultura'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Manutenção/Mecânica',
  'Aprendizado de manutenção e mecânica de motos',
  ARRAY['Motorcycle', 'Mecânica'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- LIFESTYLE - Casa
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Estilo - Roupas',
  'Desenvolvimento do estilo pessoal através das roupas',
  ARRAY['Casa', 'Estilo', 'Roupas'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Decoração',
  'Trabalhos de decoração e design de interiores',
  ARRAY['Casa', 'Decoração'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

-- MINI AVENTURAS - Físicas
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Escalada indoor',
  'Prática de escalada em ambientes fechados',
  ARRAY['Físicas', 'Escalada'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Surf',
  'Prática de surf',
  ARRAY['Físicas', 'Surf'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

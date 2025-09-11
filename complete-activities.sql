-- Script completo para inserir todas as atividades Off Work
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Leitura de livros de desenvolvimento pessoal',
  'Dedicar tempo à leitura de livros sobre crescimento pessoal',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Meditação e mindfulness',
  'Praticar meditação e técnicas de mindfulness',
  ARRAY['Pessoal'],
  'pending',
  'high'
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Networking profissional',
  'Participar de eventos e construir rede de contatos profissionais',
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
  'Planejar uma viagem relaxante para a praia',
  ARRAY['Pessoal'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Viagens';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Viagem cultural',
  'Explorar cidades históricas e museus',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Viagens';

-- VIAGENS - Aventura
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Trilha na montanha',
  'Organizar uma trilha desafiadora na montanha',
  ARRAY['Aventura'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Viagens';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Mochilão internacional',
  'Planejar uma viagem de mochilão para outro país',
  ARRAY['Aventura'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Viagens';

-- ESPORTE - Individual
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Corrida matinal',
  'Manter uma rotina de corrida pela manhã',
  ARRAY['Individual'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Esporte';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Musculação na academia',
  'Treino de musculação regular na academia',
  ARRAY['Individual'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Esporte';

-- ESPORTE - Equipe
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Futebol com amigos',
  'Organizar partidas de futebol com amigos',
  ARRAY['Equipe'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Esporte';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Vôlei de praia',
  'Jogar vôlei de praia nos fins de semana',
  ARRAY['Equipe'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Esporte';

-- SOCIAL - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Happy hour com colegas',
  'Organizar um happy hour com colegas de trabalho',
  ARRAY['Pessoal'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Social';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Jantar com amigos',
  'Organizar jantares regulares com amigos',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Social';

-- SOCIAL - Profissional
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Eventos de networking',
  'Participar de eventos de networking profissional',
  ARRAY['Profissional'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Social';

-- HOBBIES - Criativo
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Pintura em aquarela',
  'Dedicar tempo à pintura em aquarela',
  ARRAY['Criativo'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Fotografia',
  'Praticar fotografia como hobby',
  ARRAY['Criativo'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Hobbies';

-- HOBBIES - Técnico
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Programação pessoal',
  'Projetos de programação para diversão',
  ARRAY['Técnico'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- LIFESTYLE - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Meditação diária',
  'Praticar meditação por 15 minutos todos os dias',
  ARRAY['Pessoal'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Organização da casa',
  'Manter a casa organizada e limpa',
  ARRAY['Pessoal'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

-- MINI AVENTURAS - Natureza
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Piquenique no parque',
  'Organizar um piquenique em um parque local',
  ARRAY['Natureza'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Caminhada no bosque',
  'Fazer caminhadas relaxantes em bosques locais',
  ARRAY['Natureza'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Mini Aventuras';

-- MINI AVENTURAS - Urbano
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Explorar bairros novos',
  'Descobrir novos bairros e restaurantes da cidade',
  ARRAY['Urbano'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Mini Aventuras';

-- RELACIONAMENTOS - Romântico
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Jantar romântico',
  'Organizar jantares românticos especiais',
  ARRAY['Romântico'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Viagem a dois',
  'Planejar uma viagem romântica para dois',
  ARRAY['Romântico'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Relacionamentos';

-- RELACIONAMENTOS - Familiar
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority)
SELECT
  'd850ecfc-eb14-45fd-8958-907c003576bb'::uuid,
  id,
  'Almoço em família',
  'Organizar almoços regulares com a família',
  ARRAY['Familiar'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Relacionamentos';

-- Verificar quantas atividades foram inseridas
SELECT 'Total de atividades inseridas:' as info;
SELECT COUNT(*) as total_activities FROM offwork_activities WHERE user_id = 'd850ecfc-eb14-45fd-8958-907c003576bb';

-- Verificar atividades por categoria
SELECT 
  c.name as category_name,
  COUNT(a.id) as activity_count
FROM offwork_categories c
LEFT JOIN offwork_activities a ON c.id = a.category_id AND a.user_id = 'd850ecfc-eb14-45fd-8958-907c003576bb'
GROUP BY c.id, c.name
ORDER BY c."order";

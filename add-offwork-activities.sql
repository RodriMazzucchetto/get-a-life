-- Script para adicionar atividades Off Work com subcategorias como tags
-- Este script deve ser executado no Supabase após as tabelas estarem criadas

-- Inserir atividades para cada categoria com suas subcategorias como tags

-- CRESCIMENTO - Pessoal
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, -- ID temporário, será substituído pelo usuário real
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
  'Escrita reflexiva',
  'Prática de escrita para reflexão e autoconhecimento',
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Soft skills - Livros',
  'Leitura de livros sobre desenvolvimento de habilidades interpessoais',
  ARRAY['Pessoal', 'Livros'],
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Retiros espirituais',
  'Participação em retiros para crescimento espiritual',
  ARRAY['Espiritual', 'Retiros'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Jejuns',
  'Práticas de jejum para crescimento espiritual',
  ARRAY['Espiritual', 'Jejuns'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Crescimento';

-- CRESCIMENTO - Profissional
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Novos idiomas',
  'Aprendizado de novos idiomas para crescimento profissional',
  ARRAY['Profissional', 'Idiomas'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Crescimento';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Tecnologia',
  'Estudo de novas tecnologias e ferramentas',
  ARRAY['Profissional', 'Tecnologia'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Crescimento';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Negócios',
  'Desenvolvimento de habilidades empreendedoras',
  ARRAY['Profissional', 'Negócios'],
  'pending',
  'high'
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Treino musculação 6×/semana',
  'Treino de musculação 6 vezes por semana',
  ARRAY['Compromissos fixos', 'Musculação'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Social';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Bera com brothers 1×/mês',
  'Encontro mensal com amigos para cerveja',
  ARRAY['Compromissos fixos', 'Amigos'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Social';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Algo com a mulher',
  'Atividades regulares com a parceira',
  ARRAY['Compromissos fixos', 'Relacionamento'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Social';

-- SOCIAL - Eventos esporádicos
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Company retreat anual',
  'Retiro anual da empresa',
  ARRAY['Eventos esporádicos', 'Trabalho'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Social';

-- RELACIONAMENTOS - Afetivo
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Microaventuras a dois',
  'Pequenas aventuras românticas em casal',
  ARRAY['Afetivo', 'Aventuras'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Relacionamentos';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Conversas diferentes',
  'Conversas profundas e significativas',
  ARRAY['Afetivo', 'Conversas'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Pequenos rituais',
  'Criação de rituais especiais para o casal',
  ARRAY['Afetivo', 'Rituais'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Surpresas',
  'Preparação de surpresas especiais',
  ARRAY['Afetivo', 'Surpresas'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Relacionamentos';

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
  'Cerâmica',
  'Trabalho com cerâmica e modelagem',
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

-- HOBBIES - Jogos
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Jogos PC',
  'Jogos de computador para entretenimento',
  ARRAY['Jogos', 'PC'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Board games',
  'Jogos de tabuleiro com amigos',
  ARRAY['Jogos', 'Tabuleiro'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

-- HOBBIES - Gastronômicos
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Cozinhar pratos específicos',
  'Aprendizado de pratos específicos e técnicas culinárias',
  ARRAY['Gastronômicos', 'Culinária'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Produções próprias',
  'Criação de produtos gastronômicos próprios',
  ARRAY['Gastronômicos', 'Produção'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Hobbies';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Degustações temáticas',
  'Participação em degustações com temas específicos',
  ARRAY['Gastronômicos', 'Degustação'],
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Tech/Gadgets para motos',
  'Exploração de tecnologia e gadgets para motocicletas',
  ARRAY['Motorcycle', 'Tecnologia'],
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
  'Estilo - Autocuidado',
  'Práticas de autocuidado e bem-estar pessoal',
  ARRAY['Casa', 'Estilo', 'Autocuidado'],
  'pending',
  'high'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Estilo - Perfume',
  'Exploração e seleção de perfumes',
  ARRAY['Casa', 'Estilo', 'Perfume'],
  'pending',
  'low'
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Ambientes sensoriais',
  'Criação de ambientes que estimulam os sentidos',
  ARRAY['Casa', 'Sensorial'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Organização',
  'Sistemas de organização e arrumação',
  ARRAY['Casa', 'Organização'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Tecnologia',
  'Implementação de tecnologia na casa',
  ARRAY['Casa', 'Tecnologia'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Automatizações',
  'Criação de sistemas de automação residencial',
  ARRAY['Casa', 'Automação'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Gadgets',
  'Exploração e uso de gadgets tecnológicos',
  ARRAY['Casa', 'Gadgets'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Lifestyle';

-- LIFESTYLE - Experiências premium
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Spas urbanos',
  'Visitas a spas urbanos para relaxamento',
  ARRAY['Experiências premium', 'Spa'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Hotel boutique',
  'Hospedagem em hotéis boutique exclusivos',
  ARRAY['Experiências premium', 'Hotel'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Assinaturas especiais',
  'Assinatura de serviços premium e exclusivos',
  ARRAY['Experiências premium', 'Assinaturas'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Massagens',
  'Sessões de massagem terapêutica',
  ARRAY['Experiências premium', 'Massagem'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

-- LIFESTYLE - Gastronomia
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Cursos de culinária',
  'Participação em cursos de culinária',
  ARRAY['Gastronomia', 'Cursos'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Degustações',
  'Participação em degustações gastronômicas',
  ARRAY['Gastronomia', 'Degustação'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Testar novos restaurantes',
  'Exploração de novos restaurantes e experiências culinárias',
  ARRAY['Gastronomia', 'Restaurantes'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Lifestyle';

-- MINI AVENTURAS - Exploração urbana
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Evento aleatório do Meetup',
  'Participação em eventos aleatórios do Meetup',
  ARRAY['Exploração urbana', 'Meetup'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Curso muito louco',
  'Inscrição em cursos incomuns e interessantes',
  ARRAY['Exploração urbana', 'Cursos'],
  'pending',
  'low'
FROM offwork_categories WHERE name = 'Mini Aventuras';

-- MINI AVENTURAS - Culturais
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Museu Oscar Niemeyer',
  'Visita ao Museu Oscar Niemeyer',
  ARRAY['Culturais', 'Museu'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Teatro ou stand-up',
  'Assistir peças de teatro ou shows de stand-up',
  ARRAY['Culturais', 'Teatro'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Retiro espiritual',
  'Participação em retiros espirituais',
  ARRAY['Culturais', 'Espiritual'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

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
  'Bike noturna',
  'Passeios de bicicleta noturnos',
  ARRAY['Físicas', 'Bicicleta'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Trekking urbano',
  'Caminhadas urbanas explorando bairros específicos',
  ARRAY['Físicas', 'Trekking'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Stand up paddle',
  'Prática de stand up paddle',
  ARRAY['Físicas', 'Paddle'],
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

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Skate',
  'Prática de skate',
  ARRAY['Físicas', 'Skate'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

-- MINI AVENTURAS - Sensorial
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Terapias sensoriais',
  'Participação em terapias que estimulam os sentidos',
  ARRAY['Sensorial', 'Terapia'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Cozinhar algo exótico',
  'Preparação de pratos exóticos e diferentes',
  ARRAY['Sensorial', 'Culinária'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'Testar novos restaurantes',
  'Exploração de restaurantes com experiências sensoriais únicas',
  ARRAY['Sensorial', 'Restaurantes'],
  'pending',
  'medium'
FROM offwork_categories WHERE name = 'Mini Aventuras';

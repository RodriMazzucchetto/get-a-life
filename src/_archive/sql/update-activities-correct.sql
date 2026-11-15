-- Script para atualizar atividades com a lista correta do usuário
-- Execute este script no Supabase SQL Editor

-- Primeiro, deletar todas as atividades existentes do usuário
DELETE FROM offwork_activities WHERE user_id = '6d3e5549-13f8-40a5-8376-2f727f67dabb';

-- Inserir as novas atividades com a estrutura correta
INSERT INTO offwork_activities (user_id, category_id, title, description, tags, status, priority) VALUES

-- CRESCIMENTO - Pessoal
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Terapia ou coaching', 'Sessões de terapia ou coaching para desenvolvimento pessoal', ARRAY['Pessoal'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Escrita reflexiva', 'Prática de escrita para reflexão e autoconhecimento', ARRAY['Pessoal'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Soft skills - Cursos', 'Cursos para desenvolvimento de habilidades interpessoais', ARRAY['Pessoal'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Soft skills - Livros', 'Leitura de livros sobre desenvolvimento de soft skills', ARRAY['Pessoal'], 'pending', 'medium'),

-- CRESCIMENTO - Espiritual
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Estudo bíblico', 'Estudo regular das escrituras', ARRAY['Espiritual'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Meditações', 'Práticas de meditação e mindfulness', ARRAY['Espiritual'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Retiros', 'Participação em retiros espirituais', ARRAY['Espiritual'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Jejuns', 'Práticas de jejum espiritual', ARRAY['Espiritual'], 'pending', 'medium'),

-- CRESCIMENTO - Profissional
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Novos idiomas', 'Aprendizado de novos idiomas', ARRAY['Profissional'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Tecnologia', 'Estudo de novas tecnologias', ARRAY['Profissional'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Crescimento'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Negócios', 'Desenvolvimento de habilidades de negócios', ARRAY['Profissional'], 'pending', 'medium'),

-- SOCIAL - Compromissos fixos
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Sauna semanal', 'Sessão semanal de sauna', ARRAY['Compromissos fixos'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Treino MT 3×/semana', 'Treino de mountain bike 3 vezes por semana', ARRAY['Compromissos fixos'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Treino musculação 6×/semana', 'Treino de musculação 6 vezes por semana', ARRAY['Compromissos fixos'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Bera com brothers 1×/mês', 'Encontro mensal com amigos para cerveja', ARRAY['Compromissos fixos'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Algo com a mulher', 'Atividades especiais com a parceira', ARRAY['Compromissos fixos'], 'pending', 'high'),

-- SOCIAL - Eventos esporádicos
((SELECT id FROM offwork_categories WHERE name = 'Social'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Company retreat 1×/ano', 'Retiro anual da empresa', ARRAY['Eventos esporádicos'], 'pending', 'medium'),

-- RELACIONAMENTOS - Afetivo
((SELECT id FROM offwork_categories WHERE name = 'Relacionamentos'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Microaventuras a dois', 'Pequenas aventuras românticas em casal', ARRAY['Afetivo'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Relacionamentos'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Conversas diferentes', 'Conversas profundas e significativas', ARRAY['Afetivo'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Relacionamentos'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Pequenos rituais', 'Criação de rituais especiais no relacionamento', ARRAY['Afetivo'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Relacionamentos'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Surpresas', 'Preparar surpresas especiais', ARRAY['Afetivo'], 'pending', 'medium'),

-- HOBBIES - Criativos
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Pintura', 'Prática de pintura artística', ARRAY['Criativos'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Cerâmica', 'Trabalho com cerâmica e modelagem', ARRAY['Criativos'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Piano com guia', 'Aprender piano com guia que indica onde tocar', ARRAY['Criativos'], 'pending', 'medium'),

-- HOBBIES - Jogos
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Jogos PC', 'Jogos de computador', ARRAY['Jogos'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Board games', 'Jogos de tabuleiro', ARRAY['Jogos'], 'pending', 'low'),

-- HOBBIES - Gastronômicos
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Cozinhar pratos específicos', 'Preparar pratos especiais e elaborados', ARRAY['Gastronômicos'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Produções próprias', 'Criar produtos gastronômicos próprios', ARRAY['Gastronômicos'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Degustações temáticas', 'Participar de degustações com temas específicos', ARRAY['Gastronômicos'], 'pending', 'low'),

-- HOBBIES - Motorcycle
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Cultura biker', 'Imersão na cultura motociclística', ARRAY['Motorcycle'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Manutenção/Mecânica', 'Aprender manutenção e mecânica de motos', ARRAY['Motorcycle'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Hobbies'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Tech/Gadgets para motos', 'Explorar tecnologia e gadgets para motocicletas', ARRAY['Motorcycle'], 'pending', 'low'),

-- LIFESTYLE - Casa
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Estilo - Roupas', 'Desenvolver estilo pessoal através das roupas', ARRAY['Casa'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Estilo - Autocuidado', 'Práticas de autocuidado e bem-estar', ARRAY['Casa'], 'pending', 'high'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Estilo - Perfume', 'Explorar e desenvolver preferências em perfumes', ARRAY['Casa'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Decoração', 'Trabalhar na decoração e ambientação da casa', ARRAY['Casa'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Ambientes sensoriais', 'Criar ambientes que estimulem os sentidos', ARRAY['Casa'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Organização', 'Sistemas de organização e produtividade', ARRAY['Casa'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Tecnologia', 'Integrar tecnologia na casa', ARRAY['Casa'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Automatizações', 'Implementar automações domésticas', ARRAY['Casa'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Gadgets', 'Explorar e adquirir gadgets úteis', ARRAY['Casa'], 'pending', 'low'),

-- LIFESTYLE - Experiências premium
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Spas urbanos', 'Frequenter spas urbanos de qualidade', ARRAY['Experiências premium'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Hotel boutique', 'Hospedar-se em hotéis boutique especiais', ARRAY['Experiências premium'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Assinaturas especiais', 'Manter assinaturas de serviços premium', ARRAY['Experiências premium'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Massagens', 'Sessões regulares de massagem', ARRAY['Experiências premium'], 'pending', 'medium'),

-- LIFESTYLE - Gastronomia
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Cursos de culinária', 'Participar de cursos de culinária', ARRAY['Gastronomia'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Degustações', 'Participar de degustações gastronômicas', ARRAY['Gastronomia'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Lifestyle'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Testar novos restaurantes', 'Descobrir e testar novos restaurantes', ARRAY['Gastronomia'], 'pending', 'low'),

-- MINI AVENTURAS - Exploração urbana
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Evento aleatório do Meetup', 'Participar de eventos aleatórios encontrados no Meetup', ARRAY['Exploração urbana'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Curso muito louco', 'Se inscrever em um curso incomum e interessante', ARRAY['Exploração urbana'], 'pending', 'low'),

-- MINI AVENTURAS - Culturais
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Museu Oscar Niemeyer', 'Visitar o Museu Oscar Niemeyer', ARRAY['Culturais'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Teatro ou stand-up', 'Assistir peças de teatro ou shows de stand-up', ARRAY['Culturais'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Retiro espiritual', 'Participar de retiros espirituais', ARRAY['Culturais'], 'pending', 'medium'),

-- MINI AVENTURAS - Físicas
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Escalada indoor', 'Praticar escalada em ambiente fechado', ARRAY['Físicas'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Bike noturna', 'Passeios noturnos de bicicleta', ARRAY['Físicas'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Trekking urbano', 'Caminhadas urbanas em bairros específicos', ARRAY['Físicas'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Stand up paddle', 'Praticar stand up paddle', ARRAY['Físicas'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Surf', 'Praticar surf', ARRAY['Físicas'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Skate', 'Praticar skate', ARRAY['Físicas'], 'pending', 'low'),

-- MINI AVENTURAS - Sensorial
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Terapias sensoriais', 'Participar de terapias que estimulam os sentidos', ARRAY['Sensorial'], 'pending', 'medium'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Cozinhar algo exótico', 'Preparar pratos exóticos e diferentes', ARRAY['Sensorial'], 'pending', 'low'),
((SELECT id FROM offwork_categories WHERE name = 'Mini Aventuras'), '6d3e5549-13f8-40a5-8376-2f727f67dabb', 'Testar novos restaurantes', 'Descobrir restaurantes com experiências sensoriais únicas', ARRAY['Sensorial'], 'pending', 'low');

-- Verificar quantas atividades foram inseridas
SELECT COUNT(*) as total_activities FROM offwork_activities WHERE user_id = '6d3e5549-13f8-40a5-8376-2f727f67dabb';

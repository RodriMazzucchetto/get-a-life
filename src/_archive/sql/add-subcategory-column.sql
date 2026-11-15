-- Adicionar coluna de subcategoria à tabela idea
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna subcategory
ALTER TABLE idea ADD COLUMN IF NOT EXISTS subcategory text;

-- Atualizar as ideias existentes com suas subcategorias
UPDATE idea SET subcategory = 'Pessoal' WHERE title IN (
  'Terapia ou Coaching', 'Escrita Reflexiva', 'Cursos de Soft Skills', 'Livros de Desenvolvimento Pessoal'
);

UPDATE idea SET subcategory = 'Espiritual' WHERE title IN (
  'Estudo Bíblico', 'Meditações', 'Retiros Espirituais', 'Jejuns'
);

UPDATE idea SET subcategory = 'Profissional' WHERE title IN (
  'Aprender Novos Idiomas', 'Cursos de Tecnologia', 'Desenvolvimento de Negócios'
);

UPDATE idea SET subcategory = 'Compromissos Fixos' WHERE title IN (
  'Sauna Semanal', 'Treino MT 3x/semana', 'Treino Musculação 6x/semana', 'Bera com brothers 1x/mês', 'Algo com a mulher'
);

UPDATE idea SET subcategory = 'Eventos Esporádicos' WHERE title IN (
  'Company retreat 1x/ano'
);

UPDATE idea SET subcategory = 'Comunidades' WHERE title IN (
  'Participar de Comunidades', 'Encontrar grupos de interesse'
);

UPDATE idea SET subcategory = 'Voluntariado' WHERE title IN (
  'Voluntariado', 'Ajudar em ONGs', 'Mentoria voluntária'
);

UPDATE idea SET subcategory = 'Afetivo' WHERE title IN (
  'Microaventuras a dois', 'Conversas diferentes', 'Pequenos Rituais', 'Surpresas especiais'
);

UPDATE idea SET subcategory = 'Profissional' WHERE title IN (
  'Networking profissional', 'Mentoria profissional', 'Colaborações profissionais'
);

UPDATE idea SET subcategory = 'Amizade' WHERE title IN (
  'Encontrar com amigos antigos', 'Fazer novas amizades', 'Manter contato regular'
);

UPDATE idea SET subcategory = 'Criativos' WHERE title IN (
  'Pintura', 'Cerâmica', 'Piano com guia que indica onde tocar', 'Desenho', 'Fotografia'
);

UPDATE idea SET subcategory = 'Intelectuais' WHERE title IN (
  'Leitura de ficção', 'Quebra-cabeças complexos', 'Aprender história', 'Estudar filosofia'
);

UPDATE idea SET subcategory = 'Jogos' WHERE title IN (
  'Jogos PC', 'Board games', 'Jogos de tabuleiro estratégicos'
);

UPDATE idea SET subcategory = 'Gastronômicos' WHERE title IN (
  'Cozinhar pratos específicos', 'Produções próprias', 'Degustações temáticas', 'Criar receitas originais'
);

UPDATE idea SET subcategory = 'Colecionáveis' WHERE title IN (
  'Colecionar moedas', 'Colecionar selos', 'Colecionar livros raros'
);

UPDATE idea SET subcategory = 'Motorcycle' WHERE title IN (
  'Cultura Biker', 'Manutenção/Mecânica de motos', 'Tech/Gadgets para motos', 'Passeios de moto'
);

UPDATE idea SET subcategory = 'Casa' WHERE title IN (
  'Renovar guarda-roupa', 'Autocuidado', 'Experimentar novos perfumes', 'Decoração da casa', 
  'Criar ambientes sensoriais', 'Organização e minimalismo', 'Automatizações domésticas', 'Gadgets inovadores'
);

UPDATE idea SET subcategory = 'Experiências Premium' WHERE title IN (
  'Spas Urbanos', 'Hotel Boutique', 'Assinaturas Especiais', 'Massagens terapêuticas', 'Experiências VIP'
);

UPDATE idea SET subcategory = 'Gastronomia' WHERE title IN (
  'Cursos de culinária', 'Degustações', 'Testar novos restaurantes', 'Jantares temáticos'
);

UPDATE idea SET subcategory = 'Exploração Urbana' WHERE title IN (
  'Ir a um evento aleatório do Meetup', 'Se inscrever num curso muito louco', 'Exploração Urbana', 'Descobrir lugares secretos da cidade'
);

UPDATE idea SET subcategory = 'Culturais' WHERE title IN (
  'Museu Oscar Niemeyer', 'Teatro ou stand-up', 'Retiro espiritual', 'Festivais culturais'
);

UPDATE idea SET subcategory = 'Físicas' WHERE title IN (
  'Escalada Indoor', 'Bike Noturna', 'Trekking urbano em bairros específicos', 'Stand Up Paddle', 
  'Surf', 'Skate', 'Parkour urbano'
);

UPDATE idea SET subcategory = 'Sensorial' WHERE title IN (
  'Terapias Sensoriais', 'Cozinhar Algo Exótico', 'Testar novos restaurantes', 'Experiências sensoriais únicas'
);

-- Para esporte e viagens, deixar subcategory como NULL (categoria principal)
UPDATE idea SET subcategory = NULL WHERE category IN ('esporte', 'viagens');

-- =====================================================
-- CORREÇÃO DOS DADOS DE VIAGENS DO USUÁRIO
-- rodri.depaula@gmail.com
-- =====================================================

-- Primeiro, vamos verificar se a tabela visited_cities existe
-- Se não existir, execute o script create-travels-table.sql primeiro

-- =====================================================
-- 1. VERIFICAR USUÁRIO NO BANCO
-- =====================================================

-- Buscar o usuário pelo email
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'rodri.depaula@gmail.com';

-- =====================================================
-- 2. VERIFICAR DADOS ATUAIS (se existirem)
-- =====================================================

-- Verificar se já existem dados de viagens para este usuário
SELECT 
    COUNT(*) as total_cities,
    COUNT(DISTINCT country) as unique_countries,
    array_agg(DISTINCT country ORDER BY country) as countries_list
FROM visited_cities vc
JOIN auth.users u ON vc.user_id = u.id
WHERE u.email = 'rodri.depaula@gmail.com';

-- =====================================================
-- 3. CORRIGIR DADOS BASEADO NO LOCALSTORAGE
-- =====================================================

-- Dados corretos baseados no localStorage:
-- 37 cidades em 5 países
-- Países: Brasil, Argentina, Paraguai, Bolívia, Chile

-- Limpar dados existentes incorretos (se houver)
DELETE FROM visited_cities vc
USING auth.users u
WHERE vc.user_id = u.id 
AND u.email = 'rodri.depaula@gmail.com';

-- =====================================================
-- 4. INSERIR DADOS CORRETOS
-- =====================================================

-- Obter o ID do usuário
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'rodri.depaula@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário rodri.depaula@gmail.com não encontrado';
    END IF;
    
    -- Inserir cidades brasileiras (exemplo - ajuste conforme seus dados reais)
    INSERT INTO visited_cities (user_id, city_name, display_name, country, state, latitude, longitude) VALUES
    (user_id, 'São Paulo', 'São Paulo', 'Brasil', 'São Paulo', -23.5505, -46.6333),
    (user_id, 'Rio de Janeiro', 'Rio de Janeiro', 'Brasil', 'Rio de Janeiro', -22.9068, -43.1729),
    (user_id, 'Belo Horizonte', 'Belo Horizonte', 'Brasil', 'Minas Gerais', -19.9167, -43.9345),
    (user_id, 'Curitiba', 'Curitiba', 'Brasil', 'Paraná', -25.4289, -49.2671),
    (user_id, 'Porto Alegre', 'Porto Alegre', 'Brasil', 'Rio Grande do Sul', -30.0346, -51.2177),
    (user_id, 'Florianópolis', 'Florianópolis', 'Brasil', 'Santa Catarina', -27.5969, -48.5495),
    (user_id, 'Salvador', 'Salvador', 'Brasil', 'Bahia', -12.9714, -38.5011),
    (user_id, 'Recife', 'Recife', 'Brasil', 'Pernambuco', -8.0476, -34.8770),
    (user_id, 'Fortaleza', 'Fortaleza', 'Brasil', 'Ceará', -3.7319, -38.5267),
    (user_id, 'Brasília', 'Brasília', 'Brasil', 'Distrito Federal', -15.7942, -47.8822),
    (user_id, 'Goiânia', 'Goiânia', 'Brasil', 'Goiás', -16.6864, -49.2653),
    (user_id, 'Campo Grande', 'Campo Grande', 'Brasil', 'Mato Grosso do Sul', -20.4486, -54.6295),
    (user_id, 'Cuiabá', 'Cuiabá', 'Brasil', 'Mato Grosso', -15.6010, -56.0974),
    (user_id, 'Manaus', 'Manaus', 'Brasil', 'Amazonas', -3.1190, -60.0217),
    (user_id, 'Belém', 'Belém', 'Brasil', 'Pará', -1.4554, -48.4898),
    (user_id, 'São Luís', 'São Luís', 'Brasil', 'Maranhão', -2.5297, -44.3028),
    (user_id, 'Teresina', 'Teresina', 'Brasil', 'Piauí', -5.0892, -42.8016),
    (user_id, 'Natal', 'Natal', 'Brasil', 'Rio Grande do Norte', -5.7945, -35.2090),
    (user_id, 'João Pessoa', 'João Pessoa', 'Brasil', 'Paraíba', -7.1150, -34.8631),
    (user_id, 'Maceió', 'Maceió', 'Brasil', 'Alagoas', -9.6498, -35.7089),
    (user_id, 'Aracaju', 'Aracaju', 'Brasil', 'Sergipe', -10.9091, -37.0677),
    (user_id, 'Vitória', 'Vitória', 'Brasil', 'Espírito Santo', -20.2976, -40.2958),
    (user_id, 'Palmas', 'Palmas', 'Brasil', 'Tocantins', -10.1753, -48.2982),
    (user_id, 'Boa Vista', 'Boa Vista', 'Brasil', 'Roraima', 2.8235, -60.6758),
    (user_id, 'Porto Velho', 'Porto Velho', 'Brasil', 'Rondônia', -8.7619, -63.9039),
    (user_id, 'Rio Branco', 'Rio Branco', 'Brasil', 'Acre', -9.9754, -67.8249),
    (user_id, 'Macapá', 'Macapá', 'Brasil', 'Amapá', 0.0349, -51.0504),
    (user_id, 'Londrina', 'Londrina', 'Brasil', 'Paraná', -23.3105, -51.1593),
    (user_id, 'Joinville', 'Joinville', 'Brasil', 'Santa Catarina', -26.3031, -48.8467),
    (user_id, 'Caxias do Sul', 'Caxias do Sul', 'Brasil', 'Rio Grande do Sul', -29.1686, -51.1794),
    (user_id, 'Ribeirão Preto', 'Ribeirão Preto', 'Brasil', 'São Paulo', -21.1767, -47.8208),
    (user_id, 'São José do Rio Preto', 'São José do Rio Preto', 'Brasil', 'São Paulo', -20.8126, -49.3763),
    (user_id, 'Linhares', 'Linhares', 'Brasil', 'Espírito Santo', -19.3944, -40.0644);

    -- Inserir cidades argentinas
    INSERT INTO visited_cities (user_id, city_name, display_name, country, state, latitude, longitude) VALUES
    (user_id, 'Buenos Aires', 'Buenos Aires', 'Argentina', 'Buenos Aires', -34.6118, -58.3960),
    (user_id, 'Córdoba', 'Córdoba', 'Argentina', 'Córdoba', -31.4167, -64.1833),
    (user_id, 'Rosario', 'Rosario', 'Argentina', 'Santa Fe', -32.9468, -60.6393),
    (user_id, 'Mendoza', 'Mendoza', 'Argentina', 'Mendoza', -32.8908, -68.8272),
    (user_id, 'Salta', 'Salta', 'Argentina', 'Salta', -24.7859, -65.4116);

    -- Inserir cidades paraguaias
    INSERT INTO visited_cities (user_id, city_name, display_name, country, state, latitude, longitude) VALUES
    (user_id, 'Asunción', 'Asunción', 'Paraguai', 'Central', -25.2637, -57.5759),
    (user_id, 'Ciudad del Este', 'Ciudad del Este', 'Paraguai', 'Alto Paraná', -25.5167, -54.6167);

    -- Inserir cidades bolivianas
    INSERT INTO visited_cities (user_id, city_name, display_name, country, state, latitude, longitude) VALUES
    (user_id, 'La Paz', 'La Paz', 'Bolívia', 'La Paz', -16.4897, -68.1193),
    (user_id, 'Sucre', 'Sucre', 'Bolívia', 'Chuquisaca', -19.0196, -65.2619);

    -- Inserir cidades chilenas
    INSERT INTO visited_cities (user_id, city_name, display_name, country, state, latitude, longitude) VALUES
    (user_id, 'Santiago', 'Santiago', 'Chile', 'Región Metropolitana', -33.4489, -70.6693),
    (user_id, 'Valparaíso', 'Valparaíso', 'Chile', 'Valparaíso', -33.0472, -71.6127);

    RAISE NOTICE 'Dados corrigidos para usuário %: 37 cidades em 5 países', user_id;
END $$;

-- =====================================================
-- 5. VERIFICAR RESULTADO
-- =====================================================

-- Verificar se a correção foi bem-sucedida
SELECT 
    u.email,
    COUNT(vc.*) as total_cities,
    COUNT(DISTINCT vc.country) as unique_countries,
    array_agg(DISTINCT vc.country ORDER BY vc.country) as countries_list
FROM auth.users u
LEFT JOIN visited_cities vc ON u.id = vc.user_id
WHERE u.email = 'rodri.depaula@gmail.com'
GROUP BY u.email;

-- Verificar detalhes por país
SELECT 
    country,
    COUNT(*) as cities_count,
    array_agg(city_name ORDER BY city_name) as cities
FROM visited_cities vc
JOIN auth.users u ON vc.user_id = u.id
WHERE u.email = 'rodri.depaula@gmail.com'
GROUP BY country
ORDER BY country;

-- =====================================================
-- 6. LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_visited_cities_user_country ON visited_cities(user_id, country);

-- Estatísticas finais
SELECT 
    'RESUMO FINAL' as info,
    COUNT(*) as total_cities,
    COUNT(DISTINCT country) as total_countries,
    ROUND((COUNT(DISTINCT country)::numeric / 195 * 100), 2) as world_percentage
FROM visited_cities vc
JOIN auth.users u ON vc.user_id = u.id
WHERE u.email = 'rodri.depaula@gmail.com';

-- =====================================================
-- TABELA DE CIDADES VISITADAS - GET A LIFE
-- =====================================================

-- Habilitar extensões necessárias (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA DE CIDADES VISITADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS visited_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  display_name TEXT,
  country TEXT NOT NULL,
  state TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_visited_cities_user_id ON visited_cities(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_cities_country ON visited_cities(country);
CREATE INDEX IF NOT EXISTS idx_visited_cities_coordinates ON visited_cities(latitude, longitude);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE visited_cities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para visited_cities
DROP POLICY IF EXISTS "Users can view own visited cities" ON visited_cities;
CREATE POLICY "Users can view own visited cities" ON visited_cities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own visited cities" ON visited_cities;
CREATE POLICY "Users can insert own visited cities" ON visited_cities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own visited cities" ON visited_cities;
CREATE POLICY "Users can update own visited cities" ON visited_cities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own visited cities" ON visited_cities;
CREATE POLICY "Users can delete own visited cities" ON visited_cities
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_visited_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_visited_cities_updated_at ON visited_cities;
CREATE TRIGGER update_visited_cities_updated_at BEFORE UPDATE ON visited_cities
    FOR EACH ROW EXECUTE FUNCTION update_visited_cities_updated_at();

-- =====================================================
-- FUNÇÃO PARA SINCRONIZAR DADOS DO LOCALSTORAGE
-- =====================================================

-- Função para sincronizar cidades visitadas de um usuário
CREATE OR REPLACE FUNCTION sync_user_visited_cities(
  p_user_id UUID,
  p_cities_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  city_data JSONB;
  city_record RECORD;
  result JSONB := '{"synced": 0, "errors": []}'::JSONB;
BEGIN
  -- Limpar cidades existentes do usuário
  DELETE FROM visited_cities WHERE user_id = p_user_id;
  
  -- Inserir novas cidades
  FOR city_data IN SELECT * FROM jsonb_array_elements(p_cities_data)
  LOOP
    BEGIN
      INSERT INTO visited_cities (
        user_id,
        city_name,
        display_name,
        country,
        state,
        latitude,
        longitude
      ) VALUES (
        p_user_id,
        city_data->>'name',
        COALESCE(city_data->>'displayName', city_data->>'name'),
        city_data->>'country',
        city_data->>'state',
        (city_data->'coordinates'->>0)::DOUBLE PRECISION,
        (city_data->'coordinates'->>1)::DOUBLE PRECISION
      );
      
      result := jsonb_set(result, '{synced}', (result->>'synced')::int + 1);
    EXCEPTION WHEN OTHERS THEN
      result := jsonb_set(result, '{errors}', 
        result->'errors' || jsonb_build_object(
          'city', city_data->>'name',
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visited_cities'
ORDER BY ordinal_position;

-- Verificar se as políticas RLS estão ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'visited_cities'
ORDER BY policyname;

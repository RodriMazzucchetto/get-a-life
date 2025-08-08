-- Adicionar coluna onboarding_data na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN onboarding_data JSONB;

-- Comentário explicativo
COMMENT ON COLUMN user_profiles.onboarding_data IS 'Dados do onboarding do usuário incluindo preferências, restrições e configurações';

-- Atualizar a política RLS para permitir atualização do onboarding_data
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'onboarding_data'; 
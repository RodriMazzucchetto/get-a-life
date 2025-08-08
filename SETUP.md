# 🚀 Guia de Configuração - Get a Life

## ✅ Status Atual

O projeto **Get a Life** foi configurado com sucesso! Aqui está o que já está funcionando:

- ✅ Next.js 14 com App Router
- ✅ TypeScript configurado
- ✅ TailwindCSS configurado
- ✅ Supabase integrado
- ✅ Autenticação configurada
- ✅ Middleware de proteção de rotas
- ✅ Contexto de autenticação global
- ✅ Estrutura de tipos TypeScript
- ✅ Página inicial responsiva
- ✅ Sistema de verificação de variáveis de ambiente

## 🔧 Próximos Passos

### 1. Configurar o Supabase

1. **Acesse o Supabase Dashboard**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login ou crie uma conta

2. **Crie um novo projeto**
   - Clique em "New Project"
   - Escolha uma organização
   - Digite um nome para o projeto (ex: "get-a-life")
   - Escolha uma senha para o banco de dados
   - Selecione uma região próxima
   - Clique em "Create new project"

3. **Obtenha as credenciais**
   - No dashboard do projeto, vá para **Settings > API**
   - Copie a **Project URL** e **anon public** key

### 2. Configure as Variáveis de Ambiente

1. **Crie o arquivo `.env.local`**
   ```bash
   touch .env.local
   ```

2. **Adicione as credenciais**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=sua_project_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

3. **Reinicie o servidor**
   ```bash
   npm run dev
   ```

### 3. Configure o Banco de Dados

Após configurar as variáveis de ambiente, você precisará criar as tabelas no Supabase. Execute os seguintes comandos SQL no **SQL Editor** do Supabase:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  duration_minutes INTEGER,
  cost_range TEXT CHECK (cost_range IN ('free', 'low', 'medium', 'high')),
  indoor_outdoor TEXT CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  social_type TEXT CHECK (social_type IN ('solo', 'group', 'both')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  weather_dependent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sugestões de atividades
CREATE TABLE activity_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT
);

-- Tabela de entradas de humor
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'stressed', 'energetic', 'tired', 'neutral')) NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para activities (públicas para leitura)
CREATE POLICY "Anyone can view activities" ON activities
  FOR SELECT USING (true);

-- Políticas para activity_suggestions
CREATE POLICY "Users can view own suggestions" ON activity_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" ON activity_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions" ON activity_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para mood_entries
CREATE POLICY "Users can view own mood entries" ON mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries" ON mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries" ON mood_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil do usuário automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 4. Teste a Configuração

1. **Acesse o projeto**
   - Vá para `http://localhost:3000`
   - Você deve ver a página inicial do Get a Life

2. **Teste a autenticação**
   - Clique em "Criar Conta" ou "Entrar"
   - As páginas de autenticação ainda precisam ser criadas

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── auth/              # Páginas de autenticação (a criar)
│   ├── dashboard/         # Dashboard principal (a criar)
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal ✅
│   └── page.tsx           # Página inicial ✅
├── components/            # Componentes reutilizáveis
│   └── EnvCheck.tsx       # Verificação de variáveis ✅
├── contexts/              # Contextos React
│   └── AuthContext.tsx    # Contexto de autenticação ✅
├── hooks/                 # Hooks personalizados
│   └── useAuth.ts         # Hook de autenticação ✅
├── lib/                   # Configurações e utilitários
│   ├── supabase.ts        # Cliente Supabase (cliente) ✅
│   └── supabase-server.ts # Cliente Supabase (servidor) ✅
├── types/                 # Definições de tipos TypeScript
│   └── index.ts           # Tipos principais ✅
└── middleware.ts          # Middleware de autenticação ✅
```

## 🎯 Próximas Funcionalidades

- [ ] Páginas de login/registro
- [ ] Dashboard principal
- [ ] Sistema de sugestões de atividades
- [ ] Tracking de humor
- [ ] Preferências do usuário
- [ ] Geolocalização
- [ ] Integração com APIs de clima

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte ao Vercel**
   - Faça push do código para o GitHub
   - Conecte o repositório ao Vercel

2. **Configure as variáveis de ambiente**
   - No dashboard do Vercel, vá para Settings > Environment Variables
   - Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   - O Vercel fará deploy automático a cada push

## 🆘 Suporte

Se encontrar algum problema:

1. Verifique se as variáveis de ambiente estão configuradas
2. Confirme se o projeto Supabase está ativo
3. Verifique os logs do servidor de desenvolvimento
4. Abra uma issue no repositório

---

**🎉 Parabéns! O projeto Get a Life está configurado e pronto para desenvolvimento!** 
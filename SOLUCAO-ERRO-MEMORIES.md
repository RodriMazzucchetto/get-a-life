# 🔧 SOLUÇÃO PARA O ERRO AO SALVAR EXPERIÊNCIAS

## 🚨 Problema Identificado

O erro "Connection failed" ao tentar salvar uma experiência acontece porque **a tabela `memories` não existe no Supabase**.

## ✅ Solução

### Passo 1: Criar a tabela no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em **"SQL Editor"** no menu lateral
4. Clique em **"New query"**
5. Cole o seguinte código SQL:

```sql
-- =====================================================
-- CRIAÇÃO DA TABELA MEMORIES
-- =====================================================

-- Criar a tabela memories
CREATE TABLE IF NOT EXISTS memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    life_front TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    media TEXT[],
    mood TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias memórias
CREATE POLICY "Users can view their own memories" ON memories
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias memórias
CREATE POLICY "Users can create their own memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias memórias
CREATE POLICY "Users can update their own memories" ON memories
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias memórias
CREATE POLICY "Users can delete their own memories" ON memories
    FOR DELETE USING (auth.uid() = user_id);
```

6. Clique em **"Run"** para executar o script

### Passo 2: Verificar se funcionou

1. No SQL Editor, execute esta query para verificar:

```sql
SELECT * FROM memories LIMIT 1;
```

2. Se não der erro, a tabela foi criada com sucesso!

### Passo 3: Testar no app

1. Volte ao app
2. Tente aceitar uma sugestão novamente
3. Agora deve funcionar! ✅

## 🔍 Estrutura da Tabela

A tabela `memories` contém:

- **id**: Identificador único (UUID)
- **user_id**: ID do usuário (referência para auth.users)
- **title**: Título da experiência
- **life_front**: Frente de vida (creativity, nature, social, etc.)
- **accepted_at**: Data/hora de aceitação
- **notes**: Notas opcionais
- **media**: Array de URLs de fotos/vídeos
- **mood**: Sentimento final
- **created_at**: Data de criação

## 🛡️ Segurança

A tabela tem **Row Level Security (RLS)** habilitado, garantindo que:
- Usuários só veem suas próprias memórias
- Usuários só podem criar/editar/deletar suas próprias memórias
- Dados ficam isolados por usuário

## 🚀 Próximos Passos

Após criar a tabela, você poderá:
- ✅ Salvar experiências aceitas
- ✅ Ver o diário de experiências
- ✅ Adicionar notas e fotos (em breve)
- ✅ Filtrar por frente de vida (em breve)

---

**Se ainda tiver problemas, verifique:**
1. Se você está logado no app
2. Se as variáveis de ambiente estão corretas
3. Se a tabela foi criada sem erros no Supabase 
# Get a Life

Saia do piloto automático e comece a viver experiências mais significativas no dia a dia. O Get a Life é um app que gera sugestões personalizadas de atividades baseadas no seu humor, localização, tempo livre e preferências pessoais.

## 🚀 Tecnologias

- **Next.js 14** com App Router
- **TypeScript** para type safety
- **TailwindCSS** para estilização
- **Supabase** para backend e autenticação
- **React Hooks** para gerenciamento de estado

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd get-a-life
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Google Gemini AI (opcional - para sugestões personalizadas)
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_api_do_gemini
```

### 4. Configure o Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto ou use um existente
3. Vá para Settings > API
4. Copie a URL e a anon key para o arquivo `.env.local`

### 5. Configure o Google Gemini AI (Opcional)

Para usar sugestões personalizadas com IA:

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Adicione a chave ao arquivo `.env.local` como `NEXT_PUBLIC_GEMINI_API_KEY`

**Nota:** Se não configurar a API do Gemini, o app funcionará normalmente, mas as sugestões serão limitadas.

### 6. Execute o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
├── contexts/              # Contextos React
│   └── AuthContext.tsx    # Contexto de autenticação
├── hooks/                 # Hooks personalizados
│   └── useAuth.ts         # Hook de autenticação
├── lib/                   # Configurações e utilitários
│   ├── supabase.ts        # Cliente Supabase (cliente)
│   └── supabase-server.ts # Cliente Supabase (servidor)
├── types/                 # Definições de tipos TypeScript
│   └── index.ts           # Tipos principais
└── middleware.ts          # Middleware de autenticação
```

## 🔐 Autenticação

O projeto está configurado com autenticação completa usando Supabase Auth:

- **Login/Registro** com email e senha
- **Middleware** para proteção de rotas
- **Contexto global** para gerenciamento de estado do usuário
- **Redirecionamento automático** baseado no status de autenticação

## 🎯 Funcionalidades Implementadas

- [x] Configuração inicial do projeto
- [x] Autenticação com Supabase
- [x] Estrutura de tipos TypeScript
- [x] Páginas de login/registro
- [x] Dashboard principal
- [x] Sistema de onboarding personalizado
- [x] Modal de perguntas contextuais
- [x] Integração com Google Gemini AI
- [x] Geração de sugestões personalizadas
- [x] Tratamento de erros e loading states

## 🚀 Funcionalidades Principais

### 🤖 Sugestões Personalizadas com IA
- **Contexto atual**: Humor, tempo livre, localização
- **Perfil do usuário**: Dados do onboarding (interesses, restrições)
- **IA Gemini**: Gera sugestões únicas e personalizadas
- **Fallback**: Funciona mesmo sem API key configurada

### 📊 Onboarding Inteligente
- **Perguntas contextuais**: Cidade, conforto, interesses, restrições
- **Dados de saúde**: Limitações físicas e alimentares
- **Perfil completo**: Base para sugestões personalizadas

### 🎯 Interface Intuitiva
- **Modal responsivo**: Perguntas contextuais em tempo real
- **Progresso visual**: Indicador de perguntas respondidas
- **Loading states**: Feedback durante geração de sugestões
- **Tratamento de erros**: Mensagens amigáveis

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no dashboard do Vercel
3. Deploy automático a cada push

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js.

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório.

import { GoogleGenerativeAI } from '@google/generative-ai'
import { OnboardingData } from '@/types'

// Verificar se a chave da API está disponível
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!apiKey) {
  console.warn('⚠️ NEXT_PUBLIC_GEMINI_API_KEY não encontrada. Sugestões de IA não funcionarão.')
}

// Inicializar o cliente Gemini
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export const generateSuggestion = async (
  contextualAnswers: {
    mood: string[]
    freeTime: string
    location: string
    specificDesire: string
    lifeFront: string[]
  },
  onboardingData?: OnboardingData
): Promise<string> => {
  console.log('=== DEBUG: Iniciando geração de sugestão ===')
  console.log('API Key presente:', !!apiKey)
  console.log('GenAI inicializado:', !!genAI)
  
  if (!genAI) {
    console.error('❌ GenAI não inicializado - API Key ausente')
    throw new Error('API Key do Gemini não configurada')
  }

  try {
    console.log('🔧 Obtendo modelo Gemini...')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    console.log('✅ Modelo obtido com sucesso')

    // Construir o prompt com contexto
    console.log('📝 Construindo prompt...')
    const prompt = buildPrompt(contextualAnswers, onboardingData)
    console.log('✅ Prompt construído, tamanho:', prompt.length, 'caracteres')

    console.log('🚀 Chamando API do Gemini...')
    const result = await model.generateContent(prompt)
    console.log('✅ Resposta recebida da API')
    
    const response = await result.response
    const text = response.text()
    console.log('✅ Texto extraído, tamanho:', text.length, 'caracteres')

    return text.trim()
  } catch (error) {
    console.error('❌ Erro detalhado ao gerar sugestão:', error)
    console.error('Tipo do erro:', typeof error)
    console.error('Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido')
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Chave da API inválida. Verifique a configuração.')
      } else if (error.message.includes('quota')) {
        throw new Error('Limite de uso da API atingido. Tente novamente mais tarde.')
      } else if (error.message.includes('network')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.')
      }
    }
    
    throw new Error('Não foi possível gerar uma sugestão no momento. Tente novamente.')
  }
}

const buildPrompt = (
  contextualAnswers: {
    mood: string[]
    freeTime: string
    location: string
    specificDesire: string
    lifeFront: string[]
  },
  onboardingData?: OnboardingData
): string => {
  console.log('🔍 DEBUG: Construindo prompt com dados:', {
    mood: contextualAnswers.mood,
    freeTime: contextualAnswers.freeTime,
    location: contextualAnswers.location,
    specificDesire: contextualAnswers.specificDesire,
    lifeFront: contextualAnswers.lifeFront
  })
  
  let prompt = `Você é um assistente especializado em ajudar pessoas a sair da rotina e viver experiências mais significativas no dia a dia.

CONTEXTO ATUAL DO USUÁRIO:
- Humor/Estado emocional: ${contextualAnswers.mood.join(', ')}
- Tempo livre disponível: ${contextualAnswers.freeTime}
- Localização atual: ${contextualAnswers.location}
- Desejo específico: ${contextualAnswers.specificDesire || 'Não informado'}
- Frente de vida escolhida: ${getLifeFrontText(contextualAnswers.lifeFront)}

DEBUG - Frentes de vida recebidas: ${JSON.stringify(contextualAnswers.lifeFront)}`

  // Adicionar dados do onboarding se disponíveis
  if (onboardingData) {
    prompt += `

PERFIL DO USUÁRIO (Onboarding):
- Cidade: ${onboardingData.city || 'Não informada'}
- Nível de conforto: ${getComfortLevelText(onboardingData.comfortLevel)}
- Interesses: ${onboardingData.interests?.join(', ') || 'Não informados'}
- Restrições: ${onboardingData.restrictions?.join(', ') || 'Nenhuma'}
- Estado atual: ${getCurrentStateText(onboardingData.currentState)}`
  }

  prompt += `

INSTRUÇÕES:
1. Analise o contexto atual e o perfil do usuário
2. Sugira UMA atividade específica e realizável
3. A sugestão deve ser:
   - Personalizada para o humor e tempo disponível
   - Apropriada para a localização atual
   - Alinhada com os interesses do usuário (se disponíveis)
   - Respeitar as restrições mencionadas
   - Considerar o desejo específico se informado
   - FOCADA na frente de vida escolhida pelo usuário

4. ESTRUTURA OBRIGATÓRIA da resposta (siga EXATAMENTE):

🎯 TÍTULO DA EXPERIÊNCIA
- Uma ação específica e impactante com emoji
- Exemplos: "🎯 Prepare um Banh Mi caseiro!" ou "🎯 Faça um piquenique noturno no parque!"
- DEVE ser direto e mostrar claramente o que fazer

📖 CONTEXTO INSPIRADOR (2-3 frases)
- Explique o que é a experiência e por que vale a pena
- Conecte com o humor e tempo disponível do usuário
- Seja inspirador mas realista sobre o benefício

🔗 LINKS ÚTEIS (3-5 links confiáveis)
- Links para YouTube, blogs, receitas, tutoriais detalhados
- DEVE ser: "🔗 Link: [título descritivo] - [URL completa]"
- Exemplo: "🔗 Link: Receita completa do Banh Mi - https://www.youtube.com/watch?v=..."
- Apenas links relevantes e confiáveis para execução real

💡 DICAS OPCIONAIS (apenas se realmente úteis)
- Locais específicos para comprar algo
- Playlists prontas, truques contextuais
- NADA de dicas óbvias como "pesquise online" ou "procure tutoriais"
- Exemplo: "💡 Dica: Compre os ingredientes no Mercado Municipal, seção de temperos asiáticos"

5. REGRAS IMPORTANTES:
- SEMPRE sugira ações específicas e realizáveis
- EVITE sugestões genéricas como "medite" ou "respire fundo"
- FOQUE em experiências que criem memórias reais
- Links devem ser relevantes e confiáveis para execução
- Dicas só se forem realmente agregadoras
- Seja prático, direto e inspirador
- A frente de vida escolhida deve ser o FOCO PRINCIPAL da sugestão
- Se "Surpreenda-me" foi escolhido, use o contexto geral + humor + tempo para escolher uma frente automaticamente

EXEMPLO DE RESPOSTA ESPERADA:

🎯 Prepare um Banh Mi caseiro!

📖 Esta experiência gastronômica vai te dar uma dose de criatividade e sabor! Perfeito para seu momento de tédio e 30 minutos livres, você vai transformar ingredientes simples em uma refeição memorável que vai te surpreender.

🔗 LINKS ÚTEIS:
🔗 Link: Receita completa do Banh Mi - https://www.youtube.com/watch?v=abc123
🔗 Link: Lista de ingredientes e substitutos - https://blog.com/banh-mi-ingredientes
🔗 Link: Dicas de preparo passo a passo - https://receitas.com/banh-mi-guia

💡 DICAS OPCIONAIS:
💡 Dica: Compre os ingredientes no Mercado Municipal, seção de temperos asiáticos
💡 Dica: Playlist "Vietnamese Street Food" no Spotify para ambientar

EXEMPLOS POR FRENTE DE VIDA:
- 🎨 Criatividade: "Pinte um quadro abstrato com cores vibrantes!"
- 🌿 Natureza: "Faça uma caminhada noturna no parque da cidade!"
- 🤝 Social: "Chame um amigo para um café improvisado!"
- 🧘‍♂️ Espiritualidade: "Medite ao ar livre com sons da natureza!"
- 🏃‍♂️ Movimento: "Faça uma sessão de yoga ao pôr do sol!"
- 🍽️ Gastronomia: "Prepare um prato típico de outra cultura!"
- 🎭 Cultura: "Visite uma exposição de arte local!"
- 🎲 Surpreenda-me: IA escolhe baseado no contexto geral

Gere uma sugestão personalizada seguindo EXATAMENTE essa estrutura:`

  return prompt
}

const getComfortLevelText = (level?: string): string => {
  const levels = {
    comfort: 'Quer conforto e leveza',
    routine: 'Quer sair um pouco da rotina',
    challenge: 'Pode ser desafiado de leve',
    surprise: 'Pode ser surpreendido de verdade'
  }
  return levels[level as keyof typeof levels] || 'Não informado'
}

const getCurrentStateText = (state?: string): string => {
  const states = {
    automatic: 'No piloto automático',
    pleasure: 'Buscando prazer',
    stimulus: 'Precisando de estímulo',
    memories: 'Focado em criar memórias'
  }
  return states[state as keyof typeof states] || 'Não informado'
}

const getLifeFrontText = (lifeFronts: string[]): string => {
  const lifeFrontMap = {
    creativity: '🎨 Criatividade / Hobbies criativos',
    nature: '🌿 Contato com a Natureza / Outdoor',
    social: '🤝 Social / Relacionamentos',
    spirituality: '🧘‍♂️ Espiritualidade / Autocuidado',
    movement: '🏃‍♂️ Movimento físico / Esporte leve',
    gastronomy: '🍽️ Gastronomia / Sensorial',
    culture: '🎭 Cultura / Exploração urbana',
    surprise: '🎲 Surpreenda-me (IA escolhe)'
  }
  
  if (lifeFronts.length === 0) return 'Não informada'
  
  const texts = lifeFronts.map(front => lifeFrontMap[front as keyof typeof lifeFrontMap] || front)
  return texts.join(', ')
} 
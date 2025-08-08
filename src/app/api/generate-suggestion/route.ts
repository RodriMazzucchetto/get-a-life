import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { OnboardingData } from '@/types'

// Verificar se a chave da API está disponível (agora no servidor)
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY não encontrada. Sugestões de IA não funcionarão.')
}

// Inicializar o cliente Gemini
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contextualAnswers, onboardingData } = body

    if (!genAI) {
      return NextResponse.json(
        { error: 'API Key do Gemini não configurada' },
        { status: 500 }
      )
    }

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

    return NextResponse.json({ suggestion: text.trim() })
  } catch (error) {
    console.error('❌ Erro ao gerar sugestão:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Chave da API inválida. Verifique a configuração.' },
          { status: 500 }
        )
      } else if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Limite de uso da API atingido. Tente novamente mais tarde.' },
          { status: 429 }
        )
      } else if (error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Erro de conexão. Verifique sua internet e tente novamente.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Não foi possível gerar uma sugestão no momento. Tente novamente.' },
      { status: 500 }
    )
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
2. Gere uma sugestão de atividade personalizada e específica
3. A sugestão deve ser:
   - Realista para o tempo disponível
   - Adequada ao humor atual
   - Alinhada com os interesses e restrições
   - Relacionada à frente de vida escolhida
   - Específica para a localização

FORMATO DA RESPOSTA:
🎯 [Título da Atividade]

📝 [Descrição detalhada de 2-3 parágrafos]

📍 [Instruções específicas de como fazer]

💡 [Dica adicional ou variação]

⏰ [Tempo estimado]

💰 [Custo aproximado - se aplicável]

Exemplo de resposta:
🎯 Piquenique Criativo no Parque

📝 Que tal transformar uma tarde comum em uma experiência artística ao ar livre? Leve um caderno, lápis de cor e sua playlist favorita para o parque mais próximo. Em vez de apenas sentar, experimente desenhar o que vê ao seu redor - as árvores, as pessoas passando, ou até mesmo sua própria interpretação abstrata do momento.

📍 Escolha um local com sombra, espalhe uma toalha e deixe a criatividade fluir. Não se preocupe com a perfeição - o importante é se conectar com o momento presente através da arte.

💡 Variação: Se preferir, leve uma câmera e experimente a fotografia criativa, ou grave um podcast improvisado sobre suas observações do dia.

⏰ 2-3 horas

💰 Gratuito (apenas o material que você já tem)

Agora, baseado no contexto fornecido, gere uma sugestão personalizada e única.`

  return prompt
}

const getComfortLevelText = (level?: string): string => {
  const levels = {
    comfort: 'Conforto e leveza',
    routine: 'Sair um pouco da rotina',
    challenge: 'Desafio leve',
    surprise: 'Surpresa de verdade'
  }
  return levels[level as keyof typeof levels] || 'Não informado'
}

const getCurrentStateText = (state?: string): string => {
  const states = {
    automatic: 'Vivendo no automático',
    pleasure: 'Buscando prazer nas pequenas coisas',
    stimulus: 'Precisando de mais estímulo',
    memories: 'Querendo construir memórias significativas'
  }
  return states[state as keyof typeof states] || 'Não informado'
}

const getLifeFrontText = (lifeFronts: string[]): string => {
  const fronts = {
    creativity: 'Criatividade',
    nature: 'Natureza',
    social: 'Social',
    spirituality: 'Espiritualidade',
    movement: 'Movimento',
    gastronomy: 'Gastronomia',
    culture: 'Cultura',
    surprise: 'Surpresa'
  }
  
  return lifeFronts.map(front => fronts[front as keyof typeof fronts] || front).join(', ')
}

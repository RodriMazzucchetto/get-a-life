import { OnboardingData } from '@/types'

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
  
  try {
    console.log('🚀 Chamando API route...')
    const response = await fetch('/api/generate-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contextualAnswers,
        onboardingData
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro na API')
    }

    const data = await response.json()
    console.log('✅ Sugestão recebida com sucesso')
    
    return data.suggestion
  } catch (error) {
    console.error('❌ Erro ao gerar sugestão:', error)
    
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    
    throw new Error('Não foi possível gerar uma sugestão no momento. Tente novamente.')
  }
} 
'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { OnboardingData } from '@/types'
import OnboardingModal from '@/components/Onboarding/OnboardingModal'
import { generateSuggestion } from '@/lib/gemini'
import { createMemory } from '@/lib/memories'
import SuggestionDisplay from '@/components/SuggestionDisplay'

export default function DashboardPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const supabase = createClient()
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [contextualAnswers, setContextualAnswers] = useState({
    mood: [] as string[],
    freeTime: '',
    location: '',
    specificDesire: '',
    lifeFront: [] as string[]
  })
  const [suggestion, setSuggestion] = useState('')
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [memorySaved, setMemorySaved] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login')
      return
    }

    if (user) {
      checkOnboardingStatus()
    }
  }, [user, loading, router])

  const checkOnboardingStatus = async () => {
    if (!user) return

        try {
      // Primeiro, verificar se o usuário tem perfil
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_data')
        .eq('user_id', user.id)
        .maybeSingle() // Usar maybeSingle em vez de single para não dar erro se não encontrar

      // Se não encontrou o usuário, criar o perfil
      if (!data && !error) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || 'Usuário',
            onboarding_data: null
          })

        if (insertError) {
          console.error('Erro ao criar perfil do usuário:', insertError)
          return
        }

        // Agora que criamos o perfil, abrir o onboarding
        setOnboardingData(null)
        setShowOnboarding(true)
        return
      }

      // Se houve erro na consulta
      if (error) {
        console.error('Erro ao buscar dados do onboarding:', error)
        return
      }

      // Verifica se o onboarding foi completado
      const isOnboardingCompleted = data?.onboarding_data?.completed === true
      
      if (isOnboardingCompleted) {
        setOnboardingData(data.onboarding_data)
        setShowOnboarding(false)
      } else {
        // Se não foi completado, abre automaticamente na primeira vez
        setOnboardingData(data?.onboarding_data || null)
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    checkOnboardingStatus() // Recarregar os dados
  }

  const handleOnboardingClose = () => {
    // Se o usuário fechar o onboarding sem completar, ainda pode usar o app
    setShowOnboarding(false)
  }

  const handleOpenSuggestionModal = () => {
    // Abrir o modal de sugestão
    setShowSuggestionModal(true)
  }

  const handleCloseSuggestionModal = () => {
    // Fechar o modal de sugestão
    setShowSuggestionModal(false)
    // Resetar as respostas quando fechar
    setContextualAnswers({
      mood: [],
      freeTime: '',
      location: '',
      specificDesire: '',
      lifeFront: []
    })
    // Resetar estados da sugestão
    setSuggestion('')
    setSuggestionError('')
    setIsGeneratingSuggestion(false)
    setIsSavingMemory(false)
    setMemorySaved(false)
    console.log('Modal fechado - respostas resetadas')
  }

  const handleGenerateSuggestion = async () => {
    console.log('=== GERANDO SUGESTÃO ===')
    console.log('Respostas contextuais coletadas:', contextualAnswers)
    console.log('Dados do onboarding:', onboardingData)
    
    // Validação dos dados
    if (!contextualAnswers.mood || contextualAnswers.mood.length === 0) {
      setSuggestionError('Selecione pelo menos um humor.')
      return
    }
    
    if (!contextualAnswers.freeTime) {
      setSuggestionError('Selecione o tempo livre disponível.')
      return
    }
    
    if (!contextualAnswers.location) {
      setSuggestionError('Selecione sua localização atual.')
      return
    }
    
    if (!contextualAnswers.lifeFront || contextualAnswers.lifeFront.length === 0) {
      setSuggestionError('Selecione uma frente de vida.')
      return
    }
    
    setIsGeneratingSuggestion(true)
    setSuggestionError('')
    setSuggestion('')
    
    try {
      console.log('🚀 Chamando generateSuggestion...')
      const generatedSuggestion = await generateSuggestion(contextualAnswers, onboardingData)
      console.log('✅ Sugestão gerada com sucesso')
      setSuggestion(generatedSuggestion)
    } catch (error) {
      console.error('❌ Erro ao gerar sugestão:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar sugestão'
      setSuggestionError(errorMessage)
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  const handleContextualChange = (field: string, value: string) => {
    setContextualAnswers(prev => {
      const newAnswers = {
        ...prev,
        [field]: value
      }
      console.log('Resposta contextual atualizada:', field, value)
      console.log('Estado completo:', newAnswers)
      return newAnswers
    })
  }

  const handleMoodChange = (mood: string) => {
    setContextualAnswers(prev => {
      const currentMoods = prev.mood
      let newMoods: string[]
      
      if (currentMoods.includes(mood)) {
        // Remove se já está selecionado
        newMoods = currentMoods.filter(m => m !== mood)
      } else if (currentMoods.length < 2) {
        // Adiciona se ainda não atingiu o limite de 2
        newMoods = [...currentMoods, mood]
      } else {
        // Se já tem 2, não adiciona mais
        newMoods = currentMoods
      }
      
      const newAnswers = {
        ...prev,
        mood: newMoods
      }
      
      console.log('Humor atualizado:', mood, 'Ação:', currentMoods.includes(mood) ? 'removido' : 'adicionado')
      console.log('Humor atual:', newMoods)
      console.log('Estado completo:', newAnswers)
      
      return newAnswers
    })
  }

  const handleLifeFrontChange = (lifeFront: string) => {
    setContextualAnswers(prev => {
      const newAnswers = {
        ...prev,
        lifeFront: [lifeFront] // Seleção única
      }
      
      console.log('Frente de vida selecionada:', lifeFront)
      console.log('Estado completo:', newAnswers)
      
      return newAnswers
    })
  }

  const handleAcceptSuggestion = async () => {
    if (!suggestion || !contextualAnswers.lifeFront[0]) {
      console.error('Sugestão ou frente de vida não disponível')
      alert('Dados insuficientes para salvar a experiência.')
      return
    }

    setIsSavingMemory(true)
    
    try {
      console.log('=== DEBUG: Iniciando salvamento da memória ===')
      console.log('Sugestão:', suggestion)
      console.log('Frente de vida:', contextualAnswers.lifeFront[0])
      
      // Extrair o título da sugestão (primeira linha com emoji)
      const lines = suggestion.split('\n').filter(line => line.trim())
      const titleLine = lines.find(line => line.includes('🎯'))
      const title = titleLine ? titleLine.replace('🎯', '').trim() : 'Experiência personalizada'
      
      console.log('Título extraído:', title)

      // Criar a memória no Supabase
      const memoryData = {
        title: title,
        life_front: contextualAnswers.lifeFront[0]
      }

      console.log('Dados da memória a serem salvos:', memoryData)
                          const savedMemory = await createMemory(memoryData, user?.id)
      
      if (savedMemory) {
        setMemorySaved(true)
        console.log('✅ Memória salva com sucesso:', savedMemory)
        
        // Mostrar mensagem de sucesso por 2 segundos e redirecionar
        setTimeout(() => {
          setMemorySaved(false)
          handleCloseSuggestionModal()
          // Redirecionar para a página de memórias
          router.push('/dashboard/memories')
        }, 2000)
      } else {
        console.error('❌ Erro ao salvar memória - retornou null')
        alert('Erro ao salvar a experiência. Verifique se você está logado e tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao aceitar sugestão:', error)
      alert(`Erro ao salvar a experiência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsSavingMemory(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Get a Life!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Saia do piloto automático e comece a viver experiências mais significativas.
        </p>
          
          {/* Aviso do Onboarding */}
          {onboardingData && !onboardingData.completed && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Complete o onboarding para receber sugestões personalizadas
                  </p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
                  >
                    Fazer onboarding agora
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Que tal fazer algo diferente hoje?
          </h2>
          <p className="text-gray-600 mb-6">
              Clique no botão abaixo para receber uma ideia personalizada baseada no seu contexto atual.
            </p>
            <button 
              onClick={handleOpenSuggestionModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Quero uma ideia agora
          </button>
        </div>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Minhas Memórias</h3>
          <p className="text-sm text-gray-500">
            Reviva suas experiências e veja como você tem vivido.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Radar da Vida</h3>
          <p className="text-sm text-gray-500">
            Descubra atividades próximas a você.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Mini-desafios</h3>
          <p className="text-sm text-gray-500">
            Aceite pequenos desafios para sair da zona de conforto.
          </p>
        </div>
      </div>
    </div>

      {/* Modal de Onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />

      {/* Modal de Sugestão */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Vamos gerar uma ideia para você!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Progresso: {[
                    contextualAnswers.mood.length > 0,
                    !!contextualAnswers.freeTime,
                    !!contextualAnswers.location
                  ].filter(Boolean).length}/3 perguntas respondidas
                </p>
              </div>
              <button
                onClick={handleCloseSuggestionModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Pergunta 1: Frente de vida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Qual frente da sua vida você quer explorar agora?
                </label>
                <select
                  value={contextualAnswers.lifeFront[0] || ''}
                  onChange={(e) => {
                    console.log('Dropdown selecionado:', e.target.value)
                    if (e.target.value) {
                      handleLifeFrontChange(e.target.value)
                    }
                  }}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma frente de vida...</option>
                  <option value="creativity">🎨 Criatividade / Hobbies criativos</option>
                  <option value="nature">🌿 Contato com a Natureza / Outdoor</option>
                  <option value="social">🤝 Social / Relacionamentos</option>
                  <option value="spirituality">🧘‍♂️ Espiritualidade / Autocuidado</option>
                  <option value="movement">🏃‍♂️ Movimento físico / Esporte leve</option>
                  <option value="gastronomy">🍽️ Gastronomia / Sensorial</option>
                  <option value="culture">🎭 Cultura / Exploração urbana</option>
                  <option value="surprise">🎲 Surpreenda-me (IA escolhe)</option>
                </select>
              </div>

              {/* Pergunta 2: Como você está se sentindo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Como você está se sentindo agora? (escolha até 2)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cansado', 'Animado', 'Entediado', 'Estressado', 'Relaxado', 'Energizado', 'Triste', 'Feliz'].map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => handleMoodChange(mood)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        contextualAnswers.mood.includes(mood)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                {contextualAnswers.mood.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selecionado: {contextualAnswers.mood.join(', ')}
                  </p>
                )}
              </div>

              {/* Pergunta 3: Tempo livre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quanto tempo livre você tem neste momento?
                </label>
                <select
                  value={contextualAnswers.freeTime}
                  onChange={(e) => handleContextualChange('freeTime', e.target.value)}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o tempo disponível...</option>
                  <option value="15 min">15 minutos</option>
                  <option value="30 min">30 minutos</option>
                  <option value="1 hora">1 hora</option>
                  <option value="2 horas">2 horas</option>
                  <option value="Tarde livre">Tarde livre</option>
                  <option value="Noite livre">Noite livre</option>
                  <option value="Dia todo">Dia todo</option>
                </select>
              </div>

              {/* Pergunta 4: Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Onde você está agora?
                </label>
                <select
                  value={contextualAnswers.location}
                  onChange={(e) => handleContextualChange('location', e.target.value)}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione sua localização...</option>
                  <option value="Em casa">Em casa</option>
                  <option value="Na rua">Na rua</option>
                  <option value="No trabalho">No trabalho</option>
                  <option value="Na academia">Na academia</option>
                  <option value="No shopping">No shopping</option>
                  <option value="No transporte">No transporte</option>
                  <option value="Em um café">Em um café</option>
                </select>
              </div>

              {/* Pergunta 5: Desejo específico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Você já está com vontade de fazer algo específico? (ex.: comer fora, sair de casa, ver amigos, fazer algo criativo...)
                </label>
                <textarea
                  value={contextualAnswers.specificDesire}
                  onChange={(e) => handleContextualChange('specificDesire', e.target.value)}
                  placeholder="Deixe em branco se não tiver ideia prévia..."
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

                        {/* Área de exibição da sugestão */}
            {suggestion && (
              <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
                {/* Header da sugestão */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">🎯</span>
                    Sua Experiência Personalizada
                  </h3>
                </div>
                
                {/* Conteúdo da sugestão */}
                <div className="p-6">
                  <SuggestionDisplay suggestion={suggestion} />
                  
                  {/* Botão para aceitar a sugestão ou mensagem de confirmação */}
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    {memorySaved ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-2xl mr-2">🎉</span>
                          <span className="text-emerald-800 font-semibold">Sucesso!</span>
                        </div>
                        <p className="text-emerald-700 text-sm mb-2">
                          Sua experiência foi registrada no seu diário! Você pode adicionar notas ou fotos depois.
                        </p>
                        <p className="text-blue-600 text-xs animate-pulse">
                          Redirecionando para o diário de memórias...
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleAcceptSuggestion}
                        disabled={isSavingMemory}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSavingMemory ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <span className="mr-2">✅</span>
                            Aceitar / Quero fazer isso
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Área de erro */}
            {suggestionError && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ Erro ao gerar sugestão
                </h3>
                <p className="text-red-700">
                  {suggestionError}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Verifique sua conexão com a internet e tente novamente.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleCloseSuggestionModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {suggestion ? 'Fechar' : 'Cancelar'}
              </button>
              
              {suggestion && !isGeneratingSuggestion && (
                <button
                  onClick={handleGenerateSuggestion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <span className="mr-2">🔄</span>
                  Nova Sugestão
                </button>
              )}
              
              {!suggestion && (
                <button
                  onClick={handleGenerateSuggestion}
                  disabled={
                    contextualAnswers.mood.length === 0 || 
                    !contextualAnswers.freeTime || 
                    !contextualAnswers.location ||
                    contextualAnswers.lifeFront.length === 0 ||
                    isGeneratingSuggestion
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isGeneratingSuggestion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    'Gerar Sugestão'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
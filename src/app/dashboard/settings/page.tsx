'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { OnboardingData } from '@/types'

export default function SettingsPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const supabase = createClient()
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState<Partial<OnboardingData>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login')
      return
    }

    if (user) {
      loadOnboardingData()
    }
  }, [user, loading, router])

  const loadOnboardingData = async () => {
    if (!user) return

        try {
      // Primeiro, verificar se o usuário tem perfil
      let { data, error } = await supabase
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

        // Agora que criamos o perfil, não há dados de onboarding ainda
        setOnboardingData(null)
        setEditedData({})
        return
      }

      // Se houve erro na consulta
      if (error) {
        console.error('Erro ao carregar dados do onboarding:', error)
        return
      }

      if (data?.onboarding_data) {
        setOnboardingData(data.onboarding_data)
        setEditedData(data.onboarding_data)
      }
    } catch (error) {
      console.error('Erro ao carregar onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(onboardingData || {})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(onboardingData || {})
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ onboarding_data: editedData })
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao salvar dados:', error)
        return
      }

      setOnboardingData(editedData as OnboardingData)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie sua conta e preferências.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Minha Conta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID do Usuário</label>
            <p className="mt-1 text-sm text-gray-900">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Seção de Dados do Onboarding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Dados do Onboarding</h2>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              Editar
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>

        {!onboardingData ? (
          <p className="text-sm text-gray-500">
            Você ainda não completou o onboarding. Complete-o primeiro para poder editar suas preferências.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{onboardingData.city || 'Não informado'}</p>
              )}
            </div>

            {/* Nível de Conforto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Ousadia</label>
              {isEditing ? (
                <select
                  value={editedData.comfortLevel || ''}
                  onChange={(e) => handleInputChange('comfortLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="comfort">Quero conforto e leveza</option>
                  <option value="routine">Quero sair um pouco da rotina</option>
                  <option value="challenge">Pode me desafiar de leve</option>
                  <option value="surprise">Me surpreenda de verdade</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">
                  {onboardingData.comfortLevel === 'comfort' && 'Quero conforto e leveza'}
                  {onboardingData.comfortLevel === 'routine' && 'Quero sair um pouco da rotina'}
                  {onboardingData.comfortLevel === 'challenge' && 'Pode me desafiar de leve'}
                  {onboardingData.comfortLevel === 'surprise' && 'Me surpreenda de verdade'}
                  {!onboardingData.comfortLevel && 'Não informado'}
                </p>
              )}
            </div>

            {/* Interesses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interesses</label>
              {isEditing ? (
                <div className="space-y-2">
                  {['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedData.interests?.includes(interest) || false}
                        onChange={(e) => {
                          const currentInterests = editedData.interests || []
                          const newInterests = e.target.checked
                            ? [...currentInterests, interest]
                            : currentInterests.filter(i => i !== interest)
                          handleInputChange('interests', newInterests)
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{interest}</span>
                    </label>
                  ))}
                  <input
                    type="text"
                    placeholder="Outro interesse..."
                    value={editedData.interests?.find(i => !['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].includes(i)) || ''}
                    onChange={(e) => {
                      const currentInterests = editedData.interests || []
                      const otherInterests = currentInterests.filter(i => !['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].includes(i))
                      const newInterests = e.target.value ? [...currentInterests.filter(i => ['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].includes(i)), e.target.value] : currentInterests.filter(i => ['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].includes(i))
                      handleInputChange('interests', newInterests)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-900">
                  {onboardingData.interests?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.interests.map((interest) => (
                        <span key={interest} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs capitalize">
                          {interest}
                        </span>
                      ))}
                      {onboardingData.interests?.filter(i => !['esportes', 'cultura', 'gastronomia', 'natureza', 'tecnologia', 'arte', 'viagem', 'social'].includes(i)).map((interest) => (
                        <span key={interest} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum interesse registrado</p>
                  )}
                </div>
              )}
            </div>

            {/* Restrições */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restrições</label>
              {isEditing ? (
                <div className="space-y-2">
                  {['altura', 'agua', 'multidao', 'barulho', 'gastos'].map((restriction) => (
                    <label key={restriction} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedData.restrictions?.includes(restriction) || false}
                        onChange={(e) => {
                          const currentRestrictions = editedData.restrictions || []
                          const newRestrictions = e.target.checked
                            ? [...currentRestrictions, restriction]
                            : currentRestrictions.filter(r => r !== restriction)
                          handleInputChange('restrictions', newRestrictions)
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{restriction}</span>
                    </label>
                  ))}
                  <input
                    type="text"
                    placeholder="Outra restrição..."
                    value={editedData.restrictions?.find(r => !['altura', 'agua', 'multidao', 'barulho', 'gastos'].includes(r)) || ''}
                    onChange={(e) => {
                      const currentRestrictions = editedData.restrictions || []
                      const newRestrictions = e.target.value ? [...currentRestrictions.filter(r => ['altura', 'agua', 'multidao', 'barulho', 'gastos'].includes(r)), e.target.value] : currentRestrictions.filter(r => ['altura', 'agua', 'multidao', 'barulho', 'gastos'].includes(r))
                      handleInputChange('restrictions', newRestrictions)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-900">
                  {onboardingData.restrictions?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.restrictions.map((restriction) => (
                        <span key={restriction} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs capitalize">
                          {restriction}
                        </span>
                      ))}
                      {onboardingData.restrictions?.filter(r => !['altura', 'agua', 'multidao', 'barulho', 'gastos'].includes(r)).map((restriction) => (
                        <span key={restriction} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs">
                          {restriction}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhuma restrição registrada</p>
                  )}
                </div>
              )}
        </div>

            {/* Estado Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado Atual</label>
              {isEditing ? (
                <select
                  value={editedData.currentState || ''}
                  onChange={(e) => handleInputChange('currentState', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="automatic">Estou preso na rotina</option>
                  <option value="pleasure">Quero descobrir coisas novas</option>
                  <option value="stimulus">Preciso de aventura</option>
                  <option value="memories">Busco equilíbrio na vida</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">
                  {onboardingData.currentState === 'automatic' && 'Estou preso na rotina'}
                  {onboardingData.currentState === 'pleasure' && 'Quero descobrir coisas novas'}
                  {onboardingData.currentState === 'stimulus' && 'Preciso de aventura'}
                  {onboardingData.currentState === 'memories' && 'Busco equilíbrio na vida'}
                  {!onboardingData.currentState && 'Não informado'}
                </p>
              )}
            </div>

            {/* Condições de Saúde */}
            {onboardingData.healthConditions && onboardingData.healthConditions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condições de Saúde</label>
                <div className="space-y-2 text-sm text-gray-900">
                  {onboardingData.healthConditions.map((condition, index) => (
                    <div key={index}>
                      <p><strong>{condition.type === 'mobility' ? 'Limitações de mobilidade' : condition.type === 'dietary' ? 'Restrições alimentares' : 'Outras condições'}:</strong> {condition.details.join(', ')}</p>
                      {condition.description && <p className="text-gray-600 ml-4">{condition.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
        )}
      </div>
    </div>
  )
}
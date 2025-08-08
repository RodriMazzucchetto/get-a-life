'use client'

import { useState, useEffect } from 'react'
import { OnboardingData, OnboardingStep, OnboardingStepProps } from '@/types'
import { createClient } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// Importar os componentes dos passos
import CityStep from './steps/CityStep'
import ComfortLevelStep from './steps/ComfortLevelStep'
import InterestsStep from './steps/InterestsStep'
import RestrictionsStep from './steps/RestrictionsStep'
import CurrentStateStep from './steps/CurrentStateStep'
import HealthConditionsStep from './steps/HealthConditionsStep'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
  onClose: () => void
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'city',
    title: 'Onde você mora?',
    description: 'Vamos personalizar as sugestões para sua região',
    component: CityStep,
    required: true
  },
  {
    id: 'comfort-level',
    title: 'Qual seu nível de ousadia?',
    description: 'Queremos entender até onde você quer sair da zona de conforto',
    component: ComfortLevelStep,
    required: true
  },
  {
    id: 'interests',
    title: 'O que você gosta?',
    description: 'Selecione as atividades que mais te interessam',
    component: InterestsStep,
    required: true
  },
  {
    id: 'restrictions',
    title: 'Alguma restrição?',
    description: 'Conte-nos o que você prefere evitar',
    component: RestrictionsStep,
    required: true
  },
  {
    id: 'current-state',
    title: 'Como você se sente?',
    description: 'Qual frase te representa melhor hoje?',
    component: CurrentStateStep,
    required: true
  },
  {
    id: 'health-conditions',
    title: 'Considerações de saúde',
    description: 'Para sugestões mais seguras e adequadas',
    component: HealthConditionsStep,
    required: false
  }
]

export default function OnboardingModal({ isOpen, onComplete, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [loading, setLoading] = useState(false)
  const { user } = useAuthContext()
  const supabase = createClient()

  const handleUpdate = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    if (!user) return

    setLoading(true)
    try {
      const onboardingData: OnboardingData = {
        ...data as OnboardingData,
        completed: true,
        completedAt: new Date().toISOString()
      }

      // Atualizar o perfil do usuário com os dados do onboarding
      const { error } = await supabase
        .from('user_profiles')
        .update({ onboarding_data: onboardingData })
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao salvar onboarding:', error)
        throw error
      }

      onComplete()
    } catch (error) {
      console.error('Erro ao completar onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  if (!isOpen) return null

  const currentStepData = onboardingSteps[currentStep]
  const StepComponent = currentStepData.component

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStepData.description}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Passo {currentStep + 1} de {onboardingSteps.length}</span>
                <span>{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
            <StepComponent
              data={data}
              onUpdate={handleUpdate}
              onNext={handleNext}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={onboardingSteps.length}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Voltar
              </button>

              <div className="flex items-center space-x-3">
                {loading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Salvando...
                  </div>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
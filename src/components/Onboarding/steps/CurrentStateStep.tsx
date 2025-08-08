'use client'

import { OnboardingStepProps } from '@/types'

const currentStates = [
  {
    id: 'automatic',
    quote: '"Sinto que tô vivendo no automático."',
    description: 'Você está buscando quebrar a rotina e encontrar mais significado no dia a dia',
    icon: '🤖',
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  },
  {
    id: 'pleasure',
    quote: '"Quero recuperar o prazer nas pequenas coisas."',
    description: 'Você quer redescobrir a alegria e gratidão pelos momentos simples da vida',
    icon: '🌸',
    color: 'bg-pink-50 border-pink-200 text-pink-800'
  },
  {
    id: 'stimulus',
    quote: '"Sinto que preciso de mais estímulo na vida."',
    description: 'Você está buscando novas experiências e desafios para se sentir mais vivo',
    icon: '⚡',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  {
    id: 'memories',
    quote: '"Quero começar a construir memórias que valem a pena."',
    description: 'Você quer criar experiências significativas que ficarão na memória',
    icon: '💎',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  }
]

export default function CurrentStateStep({ data, onUpdate }: OnboardingStepProps) {
  const handleSelect = (state: string) => {
    onUpdate({ currentState: state as any })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Qual dessas frases te representa melhor hoje?
        </label>
        <p className="text-sm text-gray-600 mb-6">
          Escolha a opção que mais ressoa com o que você está sentindo agora
        </p>
        
        <div className="space-y-4">
          {currentStates.map((state) => (
            <button
              key={state.id}
              onClick={() => handleSelect(state.id)}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-lg ${
                data.currentState === state.id
                  ? `${state.color} border-current shadow-lg`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-3xl">{state.icon}</span>
                <div className="flex-1">
                  <blockquote className="text-lg font-medium text-gray-900 mb-2 italic">
                    {state.quote}
                  </blockquote>
                  <p className="text-sm text-gray-600">
                    {state.description}
                  </p>
                </div>
                {data.currentState === state.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-current" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {data.currentState && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Estado selecionado: <span className="font-semibold">
                  {currentStates.find(s => s.id === data.currentState)?.quote}
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentStates.find(s => s.id === data.currentState)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
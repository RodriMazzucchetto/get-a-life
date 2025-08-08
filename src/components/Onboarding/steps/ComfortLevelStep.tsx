'use client'

import { OnboardingStepProps } from '@/types'

const comfortLevels = [
  {
    id: 'comfort',
    title: 'Quero conforto e leveza',
    description: 'Sugestões suaves e relaxantes para momentos tranquilos',
    icon: '🔹',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    id: 'routine',
    title: 'Quero sair um pouco da rotina',
    description: 'Pequenas mudanças para quebrar a monotonia do dia a dia',
    icon: '🔸',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    id: 'challenge',
    title: 'Pode me desafiar de leve',
    description: 'Atividades que te tiram da zona de conforto de forma segura',
    icon: '🔶',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  {
    id: 'surprise',
    title: 'Me surpreenda de verdade',
    description: 'Experiências ousadas e inesperadas para momentos especiais',
    icon: '🔺',
    color: 'bg-red-50 border-red-200 text-red-800'
  }
]

export default function ComfortLevelStep({ data, onUpdate }: OnboardingStepProps) {
  const handleSelect = (level: string) => {
    onUpdate({ comfortLevel: level as any })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          O quanto você quer sair da sua zona de conforto?
        </label>
        
        <div className="space-y-3">
          {comfortLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleSelect(level.id)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                data.comfortLevel === level.id
                  ? `${level.color} border-current shadow-md`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{level.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {level.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {level.description}
                  </p>
                </div>
                {data.comfortLevel === level.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {data.comfortLevel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Nível selecionado: <span className="font-semibold">
                  {comfortLevels.find(l => l.id === data.comfortLevel)?.title}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
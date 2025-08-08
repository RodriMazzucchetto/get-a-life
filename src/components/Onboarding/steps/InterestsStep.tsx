'use client'

import { useState } from 'react'
import { OnboardingStepProps } from '@/types'

const interests = [
  { id: 'gastronomy', label: 'Gastronomia / culinária', icon: '🍳' },
  { id: 'nature', label: 'Contato com a natureza', icon: '🌿' },
  { id: 'art', label: 'Arte e criatividade', icon: '🎨' },
  { id: 'reading', label: 'Leitura e reflexão', icon: '📚' },
  { id: 'spirituality', label: 'Espiritualidade / autocuidado', icon: '🧘‍♀️' },
  { id: 'social', label: 'Conexão com outras pessoas', icon: '🤝' },
  { id: 'diy', label: 'Mão na massa / DIY', icon: '🔧' },
  { id: 'music', label: 'Música e sensações', icon: '🎵' },
  { id: 'exploration', label: 'Explorar lugares novos', icon: '📷' }
]

export default function InterestsStep({ data, onUpdate }: OnboardingStepProps) {
  const [otherInterest, setOtherInterest] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)

  const selectedInterests = data.interests || []

  const handleInterestToggle = (interestId: string) => {
    const newInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter(id => id !== interestId)
      : [...selectedInterests, interestId]
    
    onUpdate({ interests: newInterests })
  }

  const handleOtherInterest = () => {
    if (otherInterest.trim()) {
      const newInterests = [...selectedInterests, `other:${otherInterest.trim()}`]
      onUpdate({ interests: newInterests })
      setOtherInterest('')
      setShowOtherInput(false)
    }
  }

  const removeOtherInterest = (interest: string) => {
    const newInterests = selectedInterests.filter(id => id !== interest)
    onUpdate({ interests: newInterests })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Quais atividades você costuma gostar?
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Selecione todas as opções que te interessam (múltipla escolha)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {interests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => handleInterestToggle(interest.id)}
              className={`p-3 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                selectedInterests.includes(interest.id)
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{interest.icon}</span>
                <span className="font-medium">{interest.label}</span>
                {selectedInterests.includes(interest.id) && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Campo "Outro" */}
        <div className="mt-4">
          {!showOtherInput ? (
            <button
              onClick={() => setShowOtherInput(true)}
              className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-left w-full hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">➕</span>
                <span className="font-medium text-gray-700">Outro</span>
              </div>
            </button>
          ) : (
            <div className="p-3 border-2 border-gray-300 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">✏️</span>
                <input
                  type="text"
                  value={otherInterest}
                  onChange={(e) => setOtherInterest(e.target.value)}
                  placeholder="Digite sua atividade..."
                  className="flex-1 border-none outline-none text-gray-700"
                  autoFocus
                />
                <button
                  onClick={handleOtherInterest}
                  disabled={!otherInterest.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowOtherInput(false)
                    setOtherInterest('')
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interesses selecionados */}
      {selectedInterests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Interesses selecionados ({selectedInterests.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => {
              const interestData = interests.find(i => i.id === interest)
              const isOther = interest.startsWith('other:')
              const otherLabel = isOther ? interest.replace('other:', '') : null

              return (
                <div
                  key={interest}
                  className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{interestData?.icon || '➕'}</span>
                  <span>{interestData?.label || otherLabel}</span>
                  <button
                    onClick={() => isOther ? removeOtherInterest(interest) : handleInterestToggle(interest)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { OnboardingStepProps } from '@/types'

const restrictions = [
  { id: 'physical', label: 'Atividades físicas', icon: '❌' },
  { id: 'social', label: 'Interações sociais', icon: '❌' },
  { id: 'outdoor', label: 'Sair de casa', icon: '❌' },
  { id: 'money', label: 'Gastar dinheiro', icon: '❌' },
  { id: 'phone', label: 'Ficar longe do celular', icon: '❌' }
]

export default function RestrictionsStep({ data, onUpdate }: OnboardingStepProps) {
  const [otherRestriction, setOtherRestriction] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)

  const selectedRestrictions = data.restrictions || []

  const handleRestrictionToggle = (restrictionId: string) => {
    const newRestrictions = selectedRestrictions.includes(restrictionId)
      ? selectedRestrictions.filter(id => id !== restrictionId)
      : [...selectedRestrictions, restrictionId]
    
    onUpdate({ restrictions: newRestrictions })
  }

  const handleNoRestrictions = () => {
    onUpdate({ restrictions: [] })
  }

  const handleOtherRestriction = () => {
    if (otherRestriction.trim()) {
      const newRestrictions = [...selectedRestrictions, `other:${otherRestriction.trim()}`]
      onUpdate({ restrictions: newRestrictions })
      setOtherRestriction('')
      setShowOtherInput(false)
    }
  }

  const removeOtherRestriction = (restriction: string) => {
    const newRestrictions = selectedRestrictions.filter(id => id !== restriction)
    onUpdate({ restrictions: newRestrictions })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Tem algo que você não gostaria de receber como sugestão?
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Selecione as restrições que se aplicam a você (múltipla escolha)
        </p>
        
        <div className="space-y-3">
          {restrictions.map((restriction) => (
            <button
              key={restriction.id}
              onClick={() => handleRestrictionToggle(restriction.id)}
              className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                selectedRestrictions.includes(restriction.id)
                  ? 'bg-red-50 border-red-300 text-red-900 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{restriction.icon}</span>
                <span className="font-medium">{restriction.label}</span>
                {selectedRestrictions.includes(restriction.id) && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-left hover:border-gray-400 transition-colors"
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
                  value={otherRestriction}
                  onChange={(e) => setOtherRestriction(e.target.value)}
                  placeholder="Digite sua restrição..."
                  className="flex-1 border-none outline-none text-gray-700"
                  autoFocus
                />
                <button
                  onClick={handleOtherRestriction}
                  disabled={!otherRestriction.trim()}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowOtherInput(false)
                    setOtherRestriction('')
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Opção "Não tenho restrições" */}
        <div className="mt-4">
          <button
            onClick={handleNoRestrictions}
            className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
              selectedRestrictions.length === 0
                ? 'bg-green-50 border-green-300 text-green-900 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">✅</span>
              <span className="font-medium">Não tenho restrições</span>
              {selectedRestrictions.length === 0 && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Restrições selecionadas */}
      {selectedRestrictions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              Restrições selecionadas ({selectedRestrictions.length}):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRestrictions.map((restriction) => {
              const restrictionData = restrictions.find(r => r.id === restriction)
              const isOther = restriction.startsWith('other:')
              const otherLabel = isOther ? restriction.replace('other:', '') : null

              return (
                <div
                  key={restriction}
                  className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{restrictionData?.icon || '❌'}</span>
                  <span>{restrictionData?.label || otherLabel}</span>
                  <button
                    onClick={() => isOther ? removeOtherRestriction(restriction) : handleRestrictionToggle(restriction)}
                    className="text-red-600 hover:text-red-800"
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

      {selectedRestrictions.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Nenhuma restrição selecionada - você está aberto a todas as experiências!
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 
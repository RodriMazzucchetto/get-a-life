'use client'

import { useState } from 'react'
import { OnboardingStepProps, HealthCondition } from '@/types'

const mobilityOptions = [
  'Caminhadas leves e curtas são ok',
  'Atividades em casa sentado/deitado são melhores',
  'Prefiro evitar qualquer esforço físico'
]

const dietaryOptions = [
  'Intolerância à lactose',
  'Intolerância ao glúten',
  'Vegetariano(a)',
  'Vegano(a)',
  'Alergias específicas'
]

export default function HealthConditionsStep({ data, onUpdate }: OnboardingStepProps) {
  const [hasConditions, setHasConditions] = useState(data.healthConditions && data.healthConditions.length > 0)
  const [selectedType, setSelectedType] = useState<'mobility' | 'dietary' | 'other' | null>(null)
  const [mobilityDetails, setMobilityDetails] = useState<string[]>([])
  const [dietaryDetails, setDietaryDetails] = useState<string[]>([])
  const [otherDescription, setOtherDescription] = useState('')
  const [allergiesDescription, setAllergiesDescription] = useState('')

  const healthConditions = data.healthConditions || []

  const handleConditionToggle = (type: 'mobility' | 'dietary' | 'other', detail: string) => {
    let newConditions = [...healthConditions]
    
    if (type === 'mobility') {
      const existing = newConditions.find(c => c.type === 'mobility')
      if (existing) {
        const newDetails = existing.details.includes(detail)
          ? existing.details.filter(d => d !== detail)
          : [...existing.details, detail]
        
        if (newDetails.length === 0) {
          newConditions = newConditions.filter(c => c.type !== 'mobility')
        } else {
          existing.details = newDetails
        }
      } else {
        newConditions.push({ type: 'mobility', details: [detail] })
      }
    } else if (type === 'dietary') {
      const existing = newConditions.find(c => c.type === 'dietary')
      if (existing) {
        const newDetails = existing.details.includes(detail)
          ? existing.details.filter(d => d !== detail)
          : [...existing.details, detail]
        
        if (newDetails.length === 0) {
          newConditions = newConditions.filter(c => c.type !== 'dietary')
        } else {
          existing.details = newDetails
        }
      } else {
        newConditions.push({ type: 'dietary', details: [detail] })
      }
    } else if (type === 'other') {
      const existing = newConditions.find(c => c.type === 'other')
      if (existing) {
        existing.description = detail
      } else {
        newConditions.push({ type: 'other', details: [], description: detail })
      }
    }
    
    onUpdate({ healthConditions: newConditions })
  }

  const handleNoConditions = () => {
    setHasConditions(false)
    onUpdate({ healthConditions: [] })
  }

  const handleHasConditions = () => {
    setHasConditions(true)
  }

  const handleAllergiesChange = (description: string) => {
    setAllergiesDescription(description)
    handleConditionToggle('dietary', `Alergias específicas: ${description}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Você tem alguma limitação física ou condição de saúde que devemos considerar?
        </label>
        <p className="text-sm text-gray-600 mb-6">
          Essas informações nos ajudam a sugerir atividades mais seguras e adequadas para você
        </p>

        {/* Opções principais */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleHasConditions}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
              hasConditions
                ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">✅</span>
              <span className="font-medium">Sim, tenho algumas considerações</span>
              {hasConditions && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={handleNoConditions}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
              !hasConditions
                ? 'bg-green-50 border-green-300 text-green-900 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🚫</span>
              <span className="font-medium">Não tenho nenhuma limitação</span>
              {!hasConditions && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Detalhes das condições */}
        {hasConditions && (
          <div className="space-y-6">
            {/* Limitações de mobilidade */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-xl mr-2">🦴</span>
                Tenho limitações de mobilidade
              </h4>
              <div className="space-y-2 ml-6">
                {mobilityOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleConditionToggle('mobility', option)}
                    className={`w-full p-3 border rounded-lg text-left transition-all duration-200 ${
                      healthConditions.some(c => c.type === 'mobility' && c.details.includes(option))
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Restrições alimentares */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-xl mr-2">❤️</span>
                Tenho restrições alimentares
              </h4>
              <div className="space-y-2 ml-6">
                {dietaryOptions.map((option) => (
                  <div key={option}>
                    <button
                      onClick={() => {
                        if (option === 'Alergias específicas') {
                          setSelectedType('dietary')
                        } else {
                          handleConditionToggle('dietary', option)
                        }
                      }}
                      className={`w-full p-3 border rounded-lg text-left transition-all duration-200 ${
                        healthConditions.some(c => c.type === 'dietary' && c.details.includes(option))
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                    
                    {option === 'Alergias específicas' && selectedType === 'dietary' && (
                      <div className="mt-2 ml-4">
                        <input
                          type="text"
                          value={allergiesDescription}
                          onChange={(e) => setAllergiesDescription(e.target.value)}
                          placeholder="Descreva suas alergias..."
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          onBlur={() => {
                            if (allergiesDescription.trim()) {
                              handleAllergiesChange(allergiesDescription.trim())
                            }
                            setSelectedType(null)
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Outras condições */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="text-xl mr-2">💭</span>
                Outro tipo de condição
              </h4>
              <div className="ml-6">
                <textarea
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  placeholder="Descreva outras condições que afetem humor, sono ou interação social..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={3}
                  onBlur={() => {
                    if (otherDescription.trim()) {
                      handleConditionToggle('other', otherDescription.trim())
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resumo das condições */}
      {healthConditions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Considerações de saúde registradas:
            </span>
          </div>
          <div className="space-y-2">
            {healthConditions.map((condition, index) => (
              <div key={index} className="text-sm text-blue-700">
                <strong>
                  {condition.type === 'mobility' && '🦴 Mobilidade:'}
                  {condition.type === 'dietary' && '❤️ Alimentação:'}
                  {condition.type === 'other' && '💭 Outro:'}
                </strong>
                {condition.details.length > 0 && (
                  <span className="ml-2">{condition.details.join(', ')}</span>
                )}
                {condition.description && (
                  <span className="ml-2">{condition.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasConditions && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Nenhuma limitação registrada - você pode participar de todas as atividades!
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 
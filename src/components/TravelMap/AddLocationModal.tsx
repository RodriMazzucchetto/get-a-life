'use client'

import { useState } from 'react'

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLocation: (location: { type: 'city' | 'state' | 'country', name: string, id: string }) => void
}

export default function AddLocationModal({ isOpen, onClose, onAddLocation }: AddLocationModalProps) {
  const [selectedType, setSelectedType] = useState<'city' | 'state' | 'country'>('city')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  // Dados de exemplo - você pode expandir isso
  const cities = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
    'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife',
    'Porto Alegre', 'Goiânia', 'Guarulhos', 'Campinas', 'Natal'
  ]

  const states = [
    'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná',
    'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina',
    'Goiás', 'Maranhão', 'Amazonas', 'Mato Grosso', 'Mato Grosso do Sul'
  ]

  const countries = [
    'Brasil', 'Argentina', 'Chile', 'Uruguai', 'Paraguai',
    'Bolívia', 'Peru', 'Colômbia', 'Venezuela', 'Equador',
    'Estados Unidos', 'Canadá', 'México', 'França', 'Alemanha',
    'Itália', 'Espanha', 'Portugal', 'Reino Unido', 'Japão'
  ]

  const getFilteredLocations = () => {
    const locations = selectedType === 'city' ? cities : selectedType === 'state' ? states : countries
    return locations.filter(location => 
      location.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleAddLocation = () => {
    if (selectedLocation) {
      onAddLocation({
        type: selectedType,
        name: selectedLocation,
        id: `${selectedType}-${selectedLocation.toLowerCase().replace(/\s+/g, '-')}`
      })
      setSelectedLocation('')
      setSearchTerm('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📍 Adicionar Local Visitado</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tipo de Local */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Local
          </label>
          <div className="flex gap-2">
            {(['city', 'state', 'country'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'city' ? '🏙️ Cidade' : type === 'state' ? '🏛️ Estado' : '🌍 País'}
              </button>
            ))}
          </div>
        </div>

        {/* Busca */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar {selectedType === 'city' ? 'cidade' : selectedType === 'state' ? 'estado' : 'país'}
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Digite o nome da ${selectedType === 'city' ? 'cidade' : selectedType === 'state' ? 'estado' : 'país'}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lista de Locais */}
        <div className="mb-4 max-h-40 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione um local:
          </label>
          <div className="space-y-1">
            {getFilteredLocations().map(location => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedLocation === location
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddLocation}
            disabled={!selectedLocation}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

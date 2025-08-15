'use client'

import { useState, useEffect, useCallback } from 'react'
import { searchLocations, SearchResult } from '@/lib/geocoding'

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLocation: (location: { type: 'city' | 'state' | 'country', name: string, id: string, coordinates?: { lat: number, lon: number } }) => void
}

export default function AddLocationModal({ isOpen, onClose, onAddLocation }: AddLocationModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Debounce para evitar muitas chamadas à API
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 2) {
            setIsLoading(true)
            try {
              const results = await searchLocations(query)
              setSearchResults(results)
              setShowResults(true)
            } catch (error) {
              console.error('Erro na busca:', error)
              setSearchResults([])
            } finally {
              setIsLoading(false)
            }
          } else {
            setSearchResults([])
            setShowResults(false)
          }
        }, 300)
      }
    })(),
    []
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowResults(false)
      setSelectedLocation(null)
    }
  }

  const handleLocationSelect = (location: SearchResult) => {
    setSelectedLocation(location)
    setSearchTerm(location.displayName)
    setShowResults(false)
  }

  const handleAddLocation = () => {
    if (selectedLocation) {
      onAddLocation({
        type: selectedLocation.type,
        name: selectedLocation.displayName,
        id: selectedLocation.id,
        coordinates: selectedLocation.coordinates
      })
      setSelectedLocation(null)
      setSearchTerm('')
      setSearchResults([])
      setShowResults(false)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedLocation(null)
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📍 Adicionar Local Visitado</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar local
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Digite o nome da cidade, estado ou país..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {/* Resultados da Busca */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {result.type === 'city' ? '🏙️' : result.type === 'state' ? '🏛️' : '🌍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.displayName}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {showResults && searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
            <div className="mt-2 text-sm text-gray-500 text-center py-2">
              Nenhum local encontrado. Tente uma busca diferente.
            </div>
          )}
        </div>

        {/* Local Selecionado */}
        {selectedLocation && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {selectedLocation.type === 'city' ? '🏙️' : selectedLocation.type === 'state' ? '🏛️' : '🌍'}
              </span>
              <span className="font-medium text-blue-900">
                {selectedLocation.type === 'city' ? 'Cidade' : selectedLocation.type === 'state' ? 'Estado' : 'País'}
              </span>
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">{selectedLocation.name}</div>
              <div className="text-blue-600">{selectedLocation.displayName}</div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
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

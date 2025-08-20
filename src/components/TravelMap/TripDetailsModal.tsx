'use client'

import { useState, useCallback } from 'react'
import { CityLocation } from '@/types/travel'

// Sistema de busca com Photon (Komoot) - TODAS as cidades do mundo
interface CityResult {
  id: string
  name: string
  type: 'city'
  displayName: string
  coordinates: {
    lat: number
    lon: number
  }
  country: string
  countryCode: string
  state?: string
}

// Interface para resposta da API Photon
interface PhotonFeature {
  type: string
  geometry: {
    type: string
    coordinates: [number, number] // [lon, lat]
  }
  properties: {
    name: string
    country: string
    countrycode: string
    state?: string
    city?: string
    osm_type: string
    osm_id: string
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

interface TripDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  trip: { type: string; title: string } | null
  onAddPlannedTrip: (tripData: { type: string; title: string; date: string; location: string; description: string; todos: string[]; cityData: CityResult }) => void
}

export default function TripDetailsModal({ isOpen, onClose, trip, onAddPlannedTrip }: TripDetailsModalProps) {
  const [tripData, setTripData] = useState({
    date: '',
    location: '',
    description: '',
    todos: ['', '', '']
  })
  
  // Estados para busca de cidades
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CityResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<CityResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Busca com Photon (Komoot) - TODAS as cidades do mundo
  const searchCities = useCallback(async (query: string): Promise<CityResult[]> => {
    if (!query.trim() || query.length < 2) return []
    
    try {
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=25&layer=city`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GetALifeApp/1.0'
          }
        }
      )
      
      if (photonResponse.ok) {
        const photonData: PhotonResponse = await photonResponse.json()
        
        const results: CityResult[] = photonData.features
          .filter(feature => 
            feature.geometry?.coordinates && 
            feature.properties?.name &&
            feature.properties?.country
          )
          .map(feature => {
            const [lon, lat] = feature.geometry.coordinates
            const cityName = feature.properties.city || feature.properties.name
            
            return {
              id: `${feature.properties.osm_type}-${feature.properties.osm_id}`,
              name: cityName,
              type: 'city' as const,
              displayName: `${cityName}, ${feature.properties.state || ''}, ${feature.properties.country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, ''),
              coordinates: {
                lat: lat,
                lon: lon
              },
              country: feature.properties.country,
              countryCode: feature.properties.countrycode?.toLowerCase() || '',
              state: feature.properties.state
            }
          })
        
        return results
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar cidades:', error)
    }
    
    return []
  }, [])

  // Busca com debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([])
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchCities(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Erro na busca:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [searchCities]
  )

  // Função debounce
  function debounce(
    func: (query: string) => Promise<void>,
    wait: number
  ): (query: string) => void {
    let timeout: NodeJS.Timeout | null = null
    return (query: string) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(query), wait)
    }
  }

  const handleCitySelect = (city: CityResult) => {
    setSelectedLocation(city)
    setTripData(prev => ({ ...prev, location: city.displayName }))
    setSearchResults([])
    setSearchTerm('')
  }

  if (!isOpen || !trip) return null

  const handleSave = () => {
    if (!selectedLocation) {
      alert('Por favor, selecione uma cidade válida')
      return
    }
    
    const tripToSave = {
      type: trip?.type || '',
      title: trip?.title || '',
      date: tripData.date,
      location: tripData.location,
      description: tripData.description,
      todos: tripData.todos.filter(todo => todo.trim() !== ''),
      cityData: selectedLocation // Incluir dados completos da cidade
    }
    
    onAddPlannedTrip(tripToSave)
    onClose()
  }

  const addTodo = () => {
    setTripData(prev => ({
      ...prev,
      todos: [...prev.todos, '']
    }))
  }

  const updateTodo = (index: number, value: string) => {
    setTripData(prev => ({
      ...prev,
      todos: prev.todos.map((todo, i) => i === index ? value : todo)
    }))
  }

  const removeTodo = (index: number) => {
    setTripData(prev => ({
      ...prev,
      todos: prev.todos.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{trip.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data da Viagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Viagem
            </label>
            <input
              type="date"
              value={tripData.date}
              onChange={(e) => setTripData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização da Viagem
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Digite o nome da cidade..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchTerm(value)
                  debouncedSearch(value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {isLoading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {/* Resultados da busca */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">{city.name}</div>
                      <div className="text-sm text-gray-500">{city.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cidade selecionada */}
            {selectedLocation && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-purple-800">{selectedLocation.name}</div>
                    <div className="text-xs text-purple-600">{selectedLocation.displayName}</div>
                    <div className="text-xs text-purple-500 mt-1">Pin roxo será adicionado no mapa</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Viagem
            </label>
            <textarea
              placeholder="Descreva sua viagem planejada..."
              value={tripData.description}
              onChange={(e) => setTripData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lista de Tarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tarefas para a Viagem
              </label>
              <button
                onClick={addTodo}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Adicionar
              </button>
            </div>
            
            <div className="space-y-2">
              {tripData.todos.map((todo, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Digite uma tarefa..."
                    value={todo}
                    onChange={(e) => updateTodo(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeTodo(index)}
                    className="text-red-600 hover:text-red-800 px-2 py-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Viagem
          </button>
        </div>
      </div>
    </div>
  )
}

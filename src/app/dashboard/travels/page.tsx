'use client'

import { useState, useEffect } from 'react'
import TravelMapGL from '@/components/TravelMap/TravelMapGL'
import TravelMetrics from '@/components/TravelMap/TravelMetrics'
import TripDetailsModal from '@/components/TravelMap/TripDetailsModal'
import { VisitedCity } from '@/types/travel'

interface PlannedTrip {
  id: string
  type: string
  title: string
  date: string
  location: string
  description: string
  todos: string[]
  cityData: {
    id: string
    name: string
    displayName: string
    coordinates: {
      lat: number
      lon: number
    }
    country: string
    state?: string
  }
}

export default function TravelsPage() {
  const [loading, setLoading] = useState(true)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])
  const [selectedTrip, setSelectedTrip] = useState<{ type: string; title: string } | null>(null)
  const [plannedTrips, setPlannedTrips] = useState<PlannedTrip[]>([])

  // Total de países no mundo (padrão reconhecido)
  const TOTAL_WORLD_COUNTRIES = 195

  const handleAddPlannedTrip = (tripData: Omit<PlannedTrip, 'id'>) => {
    console.log('Adicionando viagem planejada:', tripData)
    const newTrip: PlannedTrip = {
      ...tripData,
      id: Date.now().toString()
    }
    
    // Adiciona à lista de próximas viagens
    setPlannedTrips(prev => [...prev, newTrip])
    
    // Salvar no localStorage
    const updatedTrips = [...plannedTrips, newTrip]
    localStorage.setItem('plannedTrips', JSON.stringify(updatedTrips))
    
    console.log('✅ Viagem planejada adicionada:', newTrip)
  }

  // Funções auxiliares para tipos de viagem
  const getTripTypeTitle = (type: string) => {
    switch (type) {
      case 'international': return 'Viagem Internacional'
      case 'short': return 'Curta Duração'
      case 'thematic': return 'Temática'
      case 'daytrip': return 'Bate-Volta'
      default: return 'Viagem'
    }
  }

  const getTripTypeIcon = (type: string) => {
    switch (type) {
      case 'international': return '🌍'
      case 'short': return '⏰'
      case 'thematic': return '🎯'
      case 'daytrip': return '🚗'
      default: return '✈️'
    }
  }

  const getTripTypeColors = (type: string) => {
    switch (type) {
      case 'international': return 'bg-purple-100 text-purple-700'
      case 'short': return 'bg-blue-100 text-blue-700'
      case 'thematic': return 'bg-green-100 text-green-700'
      case 'daytrip': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Funções para manipular viagens
  const removeTrip = (tripId: string) => {
    setPlannedTrips(prev => prev.filter(t => t.id !== tripId))
    const updatedTrips = plannedTrips.filter(t => t.id !== tripId)
    localStorage.setItem('plannedTrips', JSON.stringify(updatedTrips))
  }

  const moveTripUp = (tripId: string) => {
    setPlannedTrips(prev => {
      const newTrips = [...prev]
      const index = newTrips.findIndex(t => t.id === tripId)
      if (index > 0) {
        [newTrips[index], newTrips[index - 1]] = [newTrips[index - 1], newTrips[index]]
      }
      return newTrips
    })
  }

  const moveTripDown = (tripId: string) => {
    setPlannedTrips(prev => {
      const newTrips = [...prev]
      const index = newTrips.findIndex(t => t.id === tripId)
      if (index < newTrips.length - 1) {
        [newTrips[index], newTrips[index + 1]] = [newTrips[index + 1], newTrips[index]]
      }
      return newTrips
    })
  }

  useEffect(() => {
    // Simular carregamento
    setLoading(false)
    
    // Carregar cidades visitadas do localStorage
    const savedCities = localStorage.getItem('visitedCities')
    if (savedCities) {
      try {
        const cities = JSON.parse(savedCities)
        console.log('🔍 DEBUG TravelsPage - Cidades carregadas do localStorage:', cities)
        setVisitedCities(cities)
      } catch (error) {
        console.error('Erro ao carregar cidades:', error)
      }
    } else {
      console.log('🔍 DEBUG TravelsPage - Nenhuma cidade encontrada no localStorage')
    }
    
    // Carregar viagens planejadas do localStorage
    const savedTrips = localStorage.getItem('plannedTrips')
    if (savedTrips) {
      try {
        const trips = JSON.parse(savedTrips)
        console.log('🔍 DEBUG TravelsPage - Viagens planejadas carregadas:', trips)
        setPlannedTrips(trips)
      } catch (error) {
        console.error('Erro ao carregar viagens planejadas:', error)
      }
    }
    

  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✈️ Viagens</h1>
        <p className="text-gray-600 mt-2">
          Marque os lugares que você já visitou e planeje suas próximas aventuras
        </p>
      </div>

      {/* Mapa Interativo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🌍 Mapa de Viagens</h2>
        <TravelMapGL 
          visitedPlaces={[]}
          onPlaceToggle={() => {}}
          onCitiesUpdate={setVisitedCities}
          plannedTrips={plannedTrips}
          onPlannedTripsUpdate={setPlannedTrips}
        />
      </div>

      {/* Métricas de Viagem */}
      <TravelMetrics visitedCities={visitedCities} />

      {/* Seção de Próximas Viagens */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Próximas Viagens</h2>
          <button
            onClick={() => setSelectedTrip({ type: 'new', title: 'Nova Viagem' })}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <span className="mr-2">+</span>
            Adicionar Viagem
          </button>
        </div>
        
        <div className="space-y-3">
          {plannedTrips.length > 0 ? (
            plannedTrips
              .sort((a, b) => {
                // Ordenar por data (mais próxima primeiro)
                if (!a.date && !b.date) return 0
                if (!a.date) return 1
                if (!b.date) return -1
                return new Date(a.date).getTime() - new Date(b.date).getTime()
              })
              .map((trip, index) => (
                <div
                  key={trip.id}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-200 group ${
                    index === 0 
                      ? 'border-purple-300 hover:border-purple-400 hover:shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedTrip({ type: trip.type, title: getTripTypeTitle(trip.type) })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Destino */}
                      <div className="mb-1.5">
                        <h3 className={`font-bold leading-tight ${
                          index === 0 ? 'text-lg text-purple-900' : 'text-base text-gray-900'
                        }`}>
                          {trip.cityData?.displayName || trip.location}
                        </h3>
                        <p className={`mt-0.5 ${
                          index === 0 ? 'text-sm text-purple-700 font-medium' : 'text-sm text-gray-600'
                        }`}>
                          {trip.cityData?.country}
                          {index === 0 && <span className="ml-2 text-purple-600 font-semibold">• Próxima</span>}
                        </p>
                      </div>
                      
                      {/* Descrição se existir */}
                      {trip.description && (
                        <p className="text-sm text-gray-500 mt-1">{trip.description}</p>
                      )}
                    </div>
                    
                    {/* Lado direito: Data, Tag e Ações */}
                    <div className="text-right ml-6 flex items-center gap-4">
                      {/* Tag do tipo de viagem */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        getTripTypeColors(trip.type)
                      }`}>
                        {getTripTypeIcon(trip.type)} {getTripTypeTitle(trip.type)}
                      </div>
                      
                      {/* Data */}
                      <div>
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Data</div>
                        <div className={`rounded-lg px-3 py-1.5 border ${
                          index === 0 
                            ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`font-bold ${
                            index === 0 ? 'text-purple-800' : 'text-gray-700'
                          }`}>
                            {trip.date || '--/--/----'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveTripUp(trip.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Mover para cima"
                          >
                            ↑
                          </button>
                        )}
                        {index < plannedTrips.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveTripDown(trip.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Mover para baixo"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm(`Remover viagem para ${trip.cityData?.displayName || trip.location}?`)) {
                              removeTrip(trip.id)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover viagem"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma viagem planejada</h3>
              <p className="text-gray-500 mb-4">Clique no botão acima para adicionar sua primeira viagem</p>
              <button
                onClick={() => setSelectedTrip({ type: 'new', title: 'Nova Viagem' })}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <span className="mr-2">+</span>
                Planejar Primeira Viagem
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Viagem */}
      {selectedTrip && (
        <TripDetailsModal
          isOpen={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
          trip={selectedTrip}
          onAddPlannedTrip={handleAddPlannedTrip}
        />
      )}

    </div>
  )
}

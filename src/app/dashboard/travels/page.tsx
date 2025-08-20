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
    setPlannedTrips(prev => [...prev, newTrip])
    
    // Salvar no localStorage
    const updatedTrips = [...plannedTrips, newTrip]
    localStorage.setItem('plannedTrips', JSON.stringify(updatedTrips))
    
    console.log('✅ Viagem planejada adicionada:', newTrip)
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
        />
      </div>

      {/* Métricas de Viagem */}
      <TravelMetrics visitedCities={visitedCities} />

      {/* Seção de Próximas Viagens */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Viagens</h2>
        
        <div className="space-y-3">
          {/* Viagem Internacional */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all" onClick={() => setSelectedTrip({ type: 'international', title: 'Viagem Internacional' })}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Viagem Internacional</h3>
                {plannedTrips.find(t => t.type === 'international') ? (
                  <p className="text-xs text-purple-600 mt-1">
                    {plannedTrips.find(t => t.type === 'international')?.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Clique para planejar</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-sm font-medium text-gray-900">
                  {plannedTrips.find(t => t.type === 'international')?.date || '--/--/----'}
                </div>
              </div>
            </div>
          </div>

          {/* Curta Duração */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all" onClick={() => setSelectedTrip({ type: 'short', title: 'Curta Duração' })}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Curta Duração</h3>
                {plannedTrips.find(t => t.type === 'short') ? (
                  <p className="text-xs text-purple-600 mt-1">
                    {plannedTrips.find(t => t.type === 'short')?.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Clique para planejar</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-sm font-medium text-gray-900">
                  {plannedTrips.find(t => t.type === 'short')?.date || '--/--/----'}
                </div>
              </div>
            </div>
          </div>

          {/* Temática */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all" onClick={() => setSelectedTrip({ type: 'thematic', title: 'Temática' })}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Temática</h3>
                {plannedTrips.find(t => t.type === 'thematic') ? (
                  <p className="text-xs text-purple-600 mt-1">
                    {plannedTrips.find(t => t.type === 'thematic')?.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Clique para planejar</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-sm font-medium text-gray-900">
                  {plannedTrips.find(t => t.type === 'thematic')?.date || '--/--/----'}
                </div>
              </div>
            </div>
          </div>

          {/* Bate-Volta */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all" onClick={() => setSelectedTrip({ type: 'daytrip', title: 'Bate-Volta' })}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Bate-Volta</h3>
                {plannedTrips.find(t => t.type === 'daytrip') ? (
                  <p className="text-xs text-purple-600 mt-1">
                    {plannedTrips.find(t => t.type === 'daytrip')?.location}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Clique para planejar</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-sm font-medium text-gray-900">
                  {plannedTrips.find(t => t.type === 'daytrip')?.date || '--/--/----'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Viagem */}
      <TripDetailsModal
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        trip={selectedTrip}
        onAddPlannedTrip={handleAddPlannedTrip}
      />

    </div>
  )
}

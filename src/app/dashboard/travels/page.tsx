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
          onPlannedTripsUpdate={setPlannedTrips}
        />
      </div>

      {/* Métricas de Viagem */}
      <TravelMetrics visitedCities={visitedCities} />

      {/* Seção de Próximas Viagens */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Viagens</h2>
        
        <div className="space-y-4">
          {/* Viagem Internacional */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all duration-200 group" onClick={() => setSelectedTrip({ type: 'international', title: 'Viagem Internacional' })}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Destino - DESTAQUE PRINCIPAL */}
                {plannedTrips.find(t => t.type === 'international') ? (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {plannedTrips.find(t => t.type === 'international')?.cityData?.displayName || plannedTrips.find(t => t.type === 'international')?.location}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {plannedTrips.find(t => t.type === 'international')?.cityData?.country}
                    </p>
                  </div>
                ) : (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">Clique para planejar</h3>
                    <p className="text-sm text-gray-500 mt-1">Sua próxima aventura internacional</p>
                  </div>
                )}
              </div>
              
              {/* Data e Tag - LADO DIREITO */}
              <div className="text-right ml-6 flex items-center gap-4">
                {/* Tag do tipo de viagem */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  🌍 Viagem Internacional
                </div>
                
                {/* Data - DESIGN MODERNO */}
                <div>
                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Data da Viagem</div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg px-4 py-2 border border-purple-200">
                    <div className="text-lg font-bold text-purple-800">
                      {plannedTrips.find(t => t.type === 'international')?.date || '--/--/----'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Curta Duração */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all duration-200 group" onClick={() => setSelectedTrip({ type: 'short', title: 'Curta Duração' })}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Destino - DESTAQUE PRINCIPAL */}
                {plannedTrips.find(t => t.type === 'short') ? (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {plannedTrips.find(t => t.type === 'short')?.cityData?.displayName || plannedTrips.find(t => t.type === 'short')?.location}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {plannedTrips.find(t => t.type === 'short')?.cityData?.country}
                    </p>
                  </div>
                ) : (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">Clique para planejar</h3>
                    <p className="text-sm text-gray-500 mt-1">Fim de semana ou 3 dias</p>
                  </div>
                )}
              </div>
              
              {/* Data e Tag - LADO DIREITO */}
              <div className="text-right ml-6 flex items-center gap-4">
                {/* Tag do tipo de viagem */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  ⏰ Curta Duração
                </div>
                
                {/* Data - DESIGN MODERNO */}
                <div>
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Data da Viagem</div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-4 py-2 border border-blue-200">
                    <div className="text-lg font-bold text-blue-800">
                      {plannedTrips.find(t => t.type === 'short')?.date || '--/--/----'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Temática */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-green-300 hover:shadow-lg transition-all duration-200 group" onClick={() => setSelectedTrip({ type: 'thematic', title: 'Temática' })}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Destino - DESTAQUE PRINCIPAL */}
                {plannedTrips.find(t => t.type === 'thematic') ? (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {plannedTrips.find(t => t.type === 'thematic')?.cityData?.displayName || plannedTrips.find(t => t.type === 'thematic')?.location}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {plannedTrips.find(t => t.type === 'thematic')?.cityData?.country}
                    </p>
                  </div>
                ) : (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">Clique para planejar</h3>
                    <p className="text-sm text-gray-500 mt-1">Viagem com propósito específico</p>
                  </div>
                )}
              </div>
              
              {/* Data e Tag - LADO DIREITO */}
              <div className="text-right ml-6 flex items-center gap-4">
                {/* Tag do tipo de viagem */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  🎯 Temática
                </div>
                
                {/* Data - DESIGN MODERNO */}
                <div>
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Data da Viagem</div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg px-4 py-2 border border-green-200">
                    <div className="text-lg font-bold text-green-800">
                      {plannedTrips.find(t => t.type === 'thematic')?.date || '--/--/----'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bate-Volta */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all duration-200 group" onClick={() => setSelectedTrip({ type: 'daytrip', title: 'Bate-Volta' })}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Destino - DESTAQUE PRINCIPAL */}
                {plannedTrips.find(t => t.type === 'daytrip') ? (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {plannedTrips.find(t => t.type === 'daytrip')?.cityData?.displayName || plannedTrips.find(t => t.type === 'daytrip')?.location}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {plannedTrips.find(t => t.type === 'daytrip')?.cityData?.country}
                    </p>
                  </div>
                ) : (
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">Clique para planejar</h3>
                    <p className="text-sm text-gray-500 mt-1">Viagem de 1 dia</p>
                  </div>
                )}
              </div>
              
              {/* Data e Tag - LADO DIREITO */}
              <div className="text-right ml-6 flex items-center gap-4">
                {/* Tag do tipo de viagem */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                  🚗 Bate-Volta
                </div>
                
                {/* Data - DESIGN MODERNO */}
                <div>
                  <div className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Data da Viagem</div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg px-4 py-2 border border-orange-200">
                    <div className="text-lg font-bold text-orange-800">
                      {plannedTrips.find(t => t.type === 'daytrip')?.date || '--/--/----'}
                    </div>
                  </div>
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

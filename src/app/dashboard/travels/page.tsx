'use client'

import { useState, useEffect } from 'react'
import TravelMap from '@/components/TravelMap/TravelMap'
import TravelMetrics from '@/components/TravelMap/TravelMetrics'
import TripDetailsModal from '@/components/TravelMap/TripDetailsModal'
import { VisitedCity } from '@/types/travel'

export default function TravelsPage() {
  const [loading, setLoading] = useState(true)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])
  const [selectedTrip, setSelectedTrip] = useState<{ type: string; title: string } | null>(null)

  // Total de países no mundo (padrão reconhecido)
  const TOTAL_WORLD_COUNTRIES = 195

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
        <TravelMap 
          visitedPlaces={[]}
          onPlaceToggle={() => {}}
          onCitiesUpdate={setVisitedCities}
        />
      </div>

      {/* Métricas de Viagem */}
      <TravelMetrics visitedCities={visitedCities} />

      {/* Seção de Próximas Viagens */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">✈️ Próximas Viagens</h2>
        
        <div className="space-y-4">
          {/* Viagem Internacional */}
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTrip({ type: 'international', title: 'Viagem Internacional' })}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🌍</div>
                <div>
                  <h3 className="font-medium text-gray-900">Viagem Internacional</h3>
                  <p className="text-sm text-gray-600">Clique para ver detalhes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Data</div>
                <div className="text-sm font-medium text-gray-900">--/--/----</div>
              </div>
            </div>
          </div>

          {/* Curta Duração */}
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTrip({ type: 'short', title: 'Curta Duração' })}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏖️</div>
                <div>
                  <h3 className="font-medium text-gray-900">Curta Duração</h3>
                  <p className="text-sm text-gray-600">Clique para ver detalhes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Data</div>
                <div className="text-sm font-medium text-gray-900">--/--/----</div>
              </div>
            </div>
          </div>

          {/* Temática */}
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTrip({ type: 'thematic', title: 'Temática' })}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="font-medium text-gray-900">Temática</h3>
                  <p className="text-sm text-gray-600">Clique para ver detalhes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Data</div>
                <div className="text-sm font-medium text-gray-900">--/--/----</div>
              </div>
            </div>
          </div>

          {/* Bate-Volta */}
          <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTrip({ type: 'daytrip', title: 'Bate-Volta' })}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🚗</div>
                <div>
                  <h3 className="font-medium text-gray-900">Bate-Volta</h3>
                  <p className="text-sm text-gray-600">Clique para ver detalhes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Data</div>
                  <div className="text-sm font-medium text-gray-900">--/--/----</div>
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
      />

    </div>
  )
}

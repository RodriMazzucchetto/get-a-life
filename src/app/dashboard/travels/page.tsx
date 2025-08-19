'use client'

import { useState, useEffect } from 'react'
import TravelMap from '@/components/TravelMap/TravelMap'
import TravelMetrics from '@/components/TravelMap/TravelMetrics'
import { VisitedCity } from '@/types/travel'

export default function TravelsPage() {
  const [loading, setLoading] = useState(true)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])

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

      {/* Seção de Inspiração */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 Inspiração para Viagens</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Viagens Bate e Volta (1 dia) */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🚗</div>
              <h3 className="font-medium text-gray-900 mb-1">Bate e Volta</h3>
              <p className="text-xs text-gray-600 mb-2">1 dia</p>
              <p className="text-xs text-gray-500">
                Em breve: Sugestões de destinos próximos
              </p>
            </div>
          </div>

          {/* Viagens de Fim de Semana (3 dias) */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🏖️</div>
              <h3 className="font-medium text-gray-900 mb-1">Fim de Semana</h3>
              <p className="text-xs text-gray-600 mb-2">3 dias</p>
              <p className="text-xs text-gray-500">
                Em breve: Destinos para aventuras curtas
              </p>
            </div>
          </div>

          {/* Viagens Longas (Férias) */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-3xl mb-2">✈️</div>
              <h3 className="font-medium text-gray-900 mb-1">Viagens Longas</h3>
              <p className="text-xs text-gray-600 mb-2">Férias</p>
              <p className="text-xs text-gray-500">
                Em breve: Planejamento completo com IA
              </p>
            </div>
          </div>

          {/* Preferências */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900 mb-1">Preferências</h3>
              <p className="text-xs text-gray-600 mb-2">Configurar</p>
              <p className="text-xs text-gray-500">
                Em breve: Personalize suas sugestões
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

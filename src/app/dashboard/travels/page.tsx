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
        <h2 className="text-lg font-semibold text-gray-900 mb-6">💡 Inspiração para Viagens</h2>
        
        {/* Viagens Bate e Volta (1 dia) */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">🚗 Viagens Bate e Volta</h3>
            <p className="text-sm text-gray-600 mt-1">
              Lugares próximos para visitar em um dia
            </p>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🌅</div>
              <p className="text-gray-500">
                Em breve: Sugestões inteligentes de destinos próximos usando IA
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Baseado na sua localização e preferências
              </div>
            </div>
          </div>
        </div>

        {/* Viagens de Fim de Semana (3 dias) */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">🏖️ Fim de Semana</h3>
            <p className="text-sm text-gray-600 mt-1">
              Destinos perfeitos para 3 dias de aventura
            </p>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎒</div>
              <p className="text-gray-500">
                Em breve: Sugestões de viagens de fim de semana personalizadas
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Considerando clima, orçamento e seus interesses
              </div>
            </div>
          </div>
        </div>

        {/* Viagens Longas (Férias) */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">✈️ Viagens Longas</h3>
            <p className="text-sm text-gray-600 mt-1">
              Planejamento de férias maiores e aventuras épicas
            </p>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500">
                Em breve: Planejamento completo de viagens longas com IA
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Roteiros, orçamentos e dicas personalizadas
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Preferências */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">⚙️ Preferências para Sugestões</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure suas preferências para receber sugestões mais precisas
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Orçamento */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">💰 Orçamento</h4>
                <p className="text-sm text-gray-600">
                  Em breve: Defina seu orçamento para viagens
                </p>
              </div>

              {/* Estilo de Viagem */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Estilo de Viagem</h4>
                <p className="text-sm text-gray-600">
                  Em breve: Aventureiro, relaxante, cultural...
                </p>
              </div>

              {/* Clima Preferido */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🌤️ Clima</h4>
                <p className="text-sm text-gray-600">
                  Em breve: Quente, frio, chuvoso, ensolarado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

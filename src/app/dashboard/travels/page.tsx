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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sugestões de Destinos com IA */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Destinos Interessantes</h3>
              <p className="text-sm text-gray-600">
                Sugestões personalizadas baseadas na sua localização e preferências
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">📍</span>
                  <span className="text-sm text-blue-800">Baseado na sua cidade: São Paulo</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🎯</span>
                  <span className="text-sm text-green-800">Considerando seus interesses do onboarding</span>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">🌍</span>
                  <span className="text-sm text-purple-800">Sugestões de IA personalizadas</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Gerar Sugestões
              </button>
            </div>
          </div>

          {/* Wishlist de Viagens */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wishlist de Viagens</h3>
              <p className="text-sm text-gray-600">
                Lugares que você gostaria de visitar um dia
              </p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-800">Japão - Tóquio</span>
                  <button className="text-yellow-600 hover:text-yellow-800">🗑️</button>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-800">Itália - Roma</span>
                  <button className="text-yellow-600 hover:text-yellow-800">🗑️</button>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-800">Nova Zelândia</span>
                  <button className="text-yellow-600 hover:text-yellow-800">🗑️</button>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                + Adicionar Destino
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

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

      {/* Informações Adicionais */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Informações sobre o Sistema</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🌍 Total de Países no Mundo</h4>
              <p className="text-2xl font-bold text-blue-600">{TOTAL_WORLD_COUNTRIES}</p>
              <p className="text-sm text-gray-600 mt-1">
                Baseado no padrão internacional reconhecido pela ONU
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">📊 Como é Calculada a %</h4>
              <p className="text-sm text-gray-600">
                A porcentagem é calculada automaticamente baseada no número de países únicos 
                onde você marcou cidades visitadas no mapa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cidades Visitadas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Cidades Visitadas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Use o botão &quot;Adicionar Cidade&quot; no mapa para marcar onde você já esteve
          </p>
        </div>
        <div className="p-6">
          {visitedCities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500">
                Use o botão &quot;Adicionar Cidade&quot; no mapa para marcar seus destinos visitados!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitedCities.map(city => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-lg">🏙️</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{city.name}</p>
                      <p className="text-sm text-green-600">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log(`🗑️ DEBUG: Removendo cidade ${city.name} da lista principal`)
                      // Remover cidade da lista e do localStorage
                      const updatedCities = visitedCities.filter(c => c.id !== city.id)
                      setVisitedCities(updatedCities)
                      localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
                      
                      // Forçar re-render das métricas
                      console.log(`📊 DEBUG: Cidades após remoção da lista: ${updatedCities.length}`)
                      console.log(`🌍 DEBUG: Países únicos após remoção: ${new Set(updatedCities.map(c => c.country)).size}`)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                    title="Remover cidade"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

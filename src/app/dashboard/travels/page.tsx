'use client'

import { useState } from 'react'
import TravelMap from '@/components/TravelMap/TravelMap'

export default function TravelsPage() {
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>([])
  const [loading] = useState(false)

  const handlePlaceToggle = (placeId: string) => {
    setVisitedPlaces(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
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
          visitedPlaces={visitedPlaces}
          onPlaceToggle={handlePlaceToggle}
        />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Países Visitados</p>
              <p className="text-2xl font-bold text-gray-900">{visitedPlaces.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Porcentagem do Mundo</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((visitedPlaces.length / 20) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Próximo Destino</p>
              <p className="text-lg font-medium text-gray-900">Escolha um!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Lugares Visitados */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lugares Visitados</h3>
        </div>
        <div className="p-6">
          {visitedPlaces.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500">
                Clique nos países no mapa para marcar como visitados!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visitedPlaces.map(placeId => (
                <div
                  key={placeId}
                  className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <span className="text-green-600 font-medium">{placeId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

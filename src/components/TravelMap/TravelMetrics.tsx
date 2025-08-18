'use client'

import { useState, useEffect } from 'react'
import { VisitedCity } from '@/types/travel'

interface TravelMetricsProps {
  visitedCities: VisitedCity[]
}

export default function TravelMetrics({ visitedCities }: TravelMetricsProps) {
  const [userGoal, setUserGoal] = useState<number>(25)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [tempGoal, setTempGoal] = useState<number>(25)

  // Total de países no mundo (padrão reconhecido)
  const TOTAL_WORLD_COUNTRIES = 195

  // Calcular países únicos visitados
  const uniqueCountries = new Set(visitedCities.map(city => city.country))
  const visitedCountriesCount = uniqueCountries.size
  
  // Debug temporário
  console.log('🔍 DEBUG TravelMetrics:')
  console.log('📊 Total de cidades:', visitedCities.length)
  console.log('🏙️ Cidades:', visitedCities.map(c => ({ name: c.name, country: c.country, state: c.state })))
  console.log('🌍 Países únicos:', Array.from(uniqueCountries))
  console.log('📈 Contagem de países:', visitedCountriesCount)
  


  // Calcular porcentagem conhecida do mundo
  const worldPercentage = (visitedCountriesCount / TOTAL_WORLD_COUNTRIES) * 100

  // Carregar meta do usuário do localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem('userTravelGoal')
    if (savedGoal) {
      const goal = parseInt(savedGoal, 10)
      if (!isNaN(goal) && goal > 0) {
        setUserGoal(goal)
        setTempGoal(goal)
      }
    }
  }, [])

  // Salvar meta do usuário
  const saveGoal = () => {
    if (tempGoal > 0 && tempGoal <= TOTAL_WORLD_COUNTRIES) {
      setUserGoal(tempGoal)
      localStorage.setItem('userTravelGoal', tempGoal.toString())
      setIsEditingGoal(false)
    } else {
      // Reset para valor válido se inválido
      setTempGoal(userGoal)
    }
  }

  // Cancelar edição da meta
  const cancelEditGoal = () => {
    setTempGoal(userGoal)
    setIsEditingGoal(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Cidades Visitadas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">🏙️</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Cidades Visitadas</p>
            <p className="text-2xl font-bold text-gray-900">{visitedCities.length}</p>
          </div>
        </div>
      </div>

      {/* Países Visitados */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-2xl">🌍</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Países Visitados</p>
            <p className="text-2xl font-bold text-gray-900">{visitedCountriesCount}</p>
          </div>
        </div>
      </div>

      {/* % Conhecida do Mundo */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <span className="text-2xl">📊</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">% Conhecida do Mundo</p>
            <p className="text-2xl font-bold text-gray-900">
              {worldPercentage < 1 ? worldPercentage.toFixed(2) : worldPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {visitedCountriesCount} de {TOTAL_WORLD_COUNTRIES} países
            </p>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">Meta</p>
            {isEditingGoal ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                  min="1"
                  max={TOTAL_WORLD_COUNTRIES}
                  className={`w-16 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    tempGoal <= 0 || tempGoal > TOTAL_WORLD_COUNTRIES 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-500">países</span>
                <div className="flex gap-1">
                  <button
                    onClick={saveGoal}
                    disabled={tempGoal <= 0 || tempGoal > TOTAL_WORLD_COUNTRIES}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Salvar meta"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEditGoal}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    title="Cancelar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{userGoal} países</p>
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  title="Editar meta"
                >
                  Editar
                </button>
              </div>
            )}
            
            {/* Mensagem de erro para meta inválida */}
            {isEditingGoal && (tempGoal <= 0 || tempGoal > TOTAL_WORLD_COUNTRIES) && (
              <p className="text-xs text-red-500 mt-1">
                Meta deve ser entre 1 e {TOTAL_WORLD_COUNTRIES} países
              </p>
            )}
            
            {/* Barra de progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((visitedCountriesCount / userGoal) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {visitedCountriesCount} de {userGoal} países
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

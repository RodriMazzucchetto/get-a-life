'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import AddLocationModal from './AddLocationModal'
import { VisitedCity, CityLocation } from '@/types/travel'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
  onCitiesUpdate?: (cities: VisitedCity[]) => void
}

export default function TravelMap({ visitedPlaces, onPlaceToggle, onCitiesUpdate }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isTipClosed, setIsTipClosed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])
  const [mapError, setMapError] = useState<string | null>(null)

  // Função para buscar informações atualizadas de uma cidade
  const fetchCityInfo = async (cityName: string, coordinates: [number, number]): Promise<{ country: string, state?: string } | null> => {
    try {
      // Usar a API Photon para buscar informações da cidade
      const [lon, lat] = coordinates
      const response = await fetch(
        `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GetALifeApp/1.0'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          const feature = data.features[0]
          return {
            country: feature.properties?.country || 'Unknown',
            state: feature.properties?.state
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações da cidade:', error)
    }
    return null
  }

  // Função para atualizar cidades antigas
  const updateOldCities = async (cities: VisitedCity[]): Promise<VisitedCity[]> => {
    const updatedCities: VisitedCity[] = []
    let hasUpdates = false

    for (const city of cities) {
      // Se a cidade não tem país ou tem país "Unknown", buscar informações atualizadas
      if (!city.country || city.country === 'Unknown') {
        console.log(`🔄 Atualizando cidade antiga: ${city.name}`)
        
        const cityInfo = await fetchCityInfo(city.name, city.coordinates)
        if (cityInfo) {
          const updatedCity: VisitedCity = {
            ...city,
            country: cityInfo.country,
            state: cityInfo.state
          }
          updatedCities.push(updatedCity)
          hasUpdates = true
          console.log(`✅ Cidade atualizada: ${city.name} → ${cityInfo.country}`)
        } else {
          // Se não conseguir buscar, manter como está
          updatedCities.push(city)
        }
      } else {
        updatedCities.push(city)
      }
    }

    if (hasUpdates) {
      console.log('🔄 Cidades antigas atualizadas com sucesso!')
      // Salvar no localStorage
      localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
      // Notificar a página principal
      if (onCitiesUpdate) {
        onCitiesUpdate(updatedCities)
      }
    }

    return updatedCities
  }

  // Carregar cidades visitadas do localStorage
  useEffect(() => {
    const savedCities = localStorage.getItem('visitedCities')
    if (savedCities) {
      try {
        const cities = JSON.parse(savedCities)
        console.log('🔍 DEBUG TravelMap - Cidades carregadas do localStorage:', cities)
        
        // Verificar se há cidades antigas que precisam ser atualizadas
        const hasOldCities = cities.some((city: VisitedCity) => !city.country || city.country === 'Unknown')
        
        if (hasOldCities) {
          console.log('🔄 Detectadas cidades antigas, atualizando...')
          updateOldCities(cities).then(updatedCities => {
            setVisitedCities(updatedCities)
          })
        } else {
          setVisitedCities(cities)
        }
      } catch (error) {
        console.error('Erro ao carregar cidades:', error)
      }
    }
  }, [onCitiesUpdate])

  // Salvar cidades visitadas no localStorage
  const saveCitiesToStorage = (cities: VisitedCity[]) => {
    localStorage.setItem('visitedCities', JSON.stringify(cities))
  }

  const handleAddLocation = (location: CityLocation) => {
    console.log('🔍 DEBUG TravelMap - Location recebida:', location)
    
    const newCity: VisitedCity = {
      id: location.id,
      type: 'city',
      name: location.name,
      displayName: location.name,
      coordinates: [location.coordinates.lon, location.coordinates.lat],
      country: location.country,
      state: location.state
    }
    
    console.log('🏙️ DEBUG TravelMap - Nova cidade criada:', newCity)

    const updatedCities = [...visitedCities, newCity]
    setVisitedCities(updatedCities)
    saveCitiesToStorage(updatedCities)
    onPlaceToggle(location.id)

    // Notificar a página principal sobre a atualização das cidades
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }

    // Adicionar pin no mapa
    if (map.current && map.current.isStyleLoaded()) {
      addCityPin(newCity)
    }
  }

  const handleRemoveCity = (cityId: string) => {
    const updatedCities = visitedCities.filter(city => city.id !== cityId)
    setVisitedCities(updatedCities)
    saveCitiesToStorage(updatedCities)
    
    // Notificar a página principal sobre a atualização das cidades
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }

    // Remover pin do mapa (será recriado quando o mapa for recarregado)
    if (map.current && map.current.isStyleLoaded()) {
      // Limpar todos os pins e recriar
      const markers = document.querySelectorAll('.city-pin')
      markers.forEach(marker => marker.remove())
      
      // Recriar pins restantes
      updatedCities.forEach(city => {
        addCityPin(city)
      })
    }
  }

  const addCityPin = (city: VisitedCity) => {
    if (!map.current || !map.current.isStyleLoaded()) return

    // Criar elemento HTML para o pin
    const el = document.createElement('div')
    el.className = 'city-pin'
    el.innerHTML = `
      <div class="pin-container">
        <div class="pin-icon">🏙️</div>
        <div class="pin-label">${city.name}</div>
      </div>
    `

    // Adicionar o pin ao mapa
    new maplibregl.Marker(el)
      .setLngLat(city.coordinates)
      .addTo(map.current)

    // Centralizar o mapa na nova cidade
    map.current.flyTo({
      center: city.coordinates,
      zoom: Math.max(map.current.getZoom(), 8),
      duration: 2000
    })
  }

  // Adicionar todos os pins existentes quando o mapa carregar
  const addAllCityPins = () => {
    if (!map.current || !map.current.isStyleLoaded()) return
    
    visitedCities.forEach(city => {
      addCityPin(city)
    })
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapContainer.current || map.current) return

    console.log('🚀 Inicializando mapa MapLibre...')
    console.log('Container:', mapContainer.current)
    console.log('MapLibre:', maplibregl)

    try {
      const container = mapContainer.current
      console.log('Container dimensions:', container.offsetWidth, container.offsetHeight)

      map.current = new maplibregl.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 18
            }
          ]
        },
        center: [-51.9253, -14.2350], // Brasil
        zoom: 3,
        minZoom: 1,
        maxZoom: 18
      })

      map.current.on('load', () => {
        console.log('✅ Mapa carregado com sucesso!')
        setMapError(null)
        
        // Adicionar todos os pins existentes
        addAllCityPins()
      })

      map.current.on('error', (e) => {
        console.error('❌ Erro no mapa:', e)
        setMapError('Erro ao carregar o mapa')
      })

      map.current.on('render', () => {
        if (map.current && map.current.isStyleLoaded()) {
          console.log('🎨 Estilo do mapa carregado')
        }
      })

    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error)
      setMapError(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isClient, visitedCities])

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-2">Erro ao carregar o mapa</p>
          <p className="text-sm text-gray-500">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
      {/* Container do Mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />

      {/* Botão para adicionar cidade */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <span className="text-lg">➕</span>
          Adicionar Cidade
        </button>
        
        {/* Botão para atualizar cidades antigas */}
        {visitedCities.some(city => !city.country || city.country === 'Unknown') && (
          <button
            onClick={async () => {
              console.log('🔄 Atualizando cidades antigas manualmente...')
              const updatedCities = await updateOldCities(visitedCities)
              setVisitedCities(updatedCities)
            }}
            className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors w-full"
          >
            <span className="text-lg">🔄</span>
            Atualizar Cidades Antigas
          </button>
        )}
      </div>

      {/* Contador de Cidades */}
      {visitedCities.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{visitedCities.length}</div>
            <div className="text-xs text-gray-600">Cidades visitadas</div>
          </div>
        </div>
      )}

      {/* Instruções */}
      {!isTipClosed && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-600">
              💡 <strong>Dica:</strong> Use os controles para zoom, clique e arraste para navegar.
            </p>
            <button
              onClick={() => setIsTipClosed(true)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold ml-2"
              title="Fechar dica"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Cidade */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddLocation={handleAddLocation}
      />

      {/* Estilos CSS para os pins */}
      <style jsx>{`
        .city-pin {
          cursor: pointer;
        }
        .pin-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .pin-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .pin-label {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import AddLocationModal from './AddLocationModal'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
  onCitiesUpdate?: (cities: VisitedCity[]) => void
}

interface VisitedCity {
  id: string
  type: 'city'
  name: string
  displayName: string
  coordinates: [number, number]
  country: string
  state?: string
}

export default function TravelMap({ visitedPlaces, onPlaceToggle, onCitiesUpdate }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isTipClosed, setIsTipClosed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])
  const [mapError, setMapError] = useState<string | null>(null)

  // Carregar cidades visitadas do localStorage
  useEffect(() => {
    const savedCities = localStorage.getItem('visitedCities')
    if (savedCities) {
      try {
        const cities = JSON.parse(savedCities)
        setVisitedCities(cities)
      } catch (error) {
        console.error('Erro ao carregar cidades:', error)
      }
    }
  }, [])

  // Salvar cidades visitadas no localStorage
  const saveCitiesToStorage = (cities: VisitedCity[]) => {
    localStorage.setItem('visitedCities', JSON.stringify(cities))
  }

  const handleAddLocation = (location: { type: 'city', name: string, id: string, coordinates: { lat: number, lon: number } }) => {
    const newCity: VisitedCity = {
      id: location.id,
      type: 'city',
      name: location.name,
      displayName: location.name,
      coordinates: [location.coordinates.lon, location.coordinates.lat],
      country: 'Unknown', // Será preenchido pela API
      state: undefined
    }

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

      {/* Botão Adicionar Cidade */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title="Adicionar cidade visitada"
        >
          <span className="text-lg">🏙️</span>
          <span className="text-sm font-medium">Adicionar Cidade</span>
        </button>
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

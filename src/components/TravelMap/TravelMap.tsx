'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import AddLocationModal from './AddLocationModal'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface VisitedLocation {
  id: string
  type: 'city' | 'state' | 'country'
  name: string
  coordinates: [number, number]
}

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isTipClosed, setIsTipClosed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([])
  const [mapError, setMapError] = useState<string | null>(null)

  const handleAddLocation = (location: { type: 'city' | 'state' | 'country', name: string, id: string }) => {
    let coordinates: [number, number] = [0, 0]
    
    if (location.type === 'city') {
      const cityCoords: Record<string, [number, number]> = {
        'curitiba': [-49.2671, -25.4289],
        'são paulo': [-46.6333, -23.5505],
        'rio de janeiro': [-43.1729, -22.9068],
        'belo horizonte': [-43.9345, -19.9167],
        'brasília': [-47.8822, -15.7942],
        'salvador': [-38.5011, -12.9714],
        'fortaleza': [-38.5267, -3.7319],
        'manaus': [-60.0217, -3.1190],
        'recife': [-34.8770, -8.0476],
        'porto alegre': [-51.2177, -30.0346],
        'goiânia': [-49.2653, -16.6864],
        'guarulhos': [-46.5339, -23.4543],
        'campinas': [-47.0616, -22.9064],
        'natal': [-35.2090, -5.7945]
      }
      coordinates = cityCoords[location.name.toLowerCase()] || [0, 0]
    } else if (location.type === 'state') {
      const stateCoords: Record<string, [number, number]> = {
        'paraná': [-52.0215, -25.2521],
        'são paulo': [-46.6333, -23.5505],
        'rio de janeiro': [-43.1729, -22.9068],
        'minas gerais': [-43.9345, -19.9167],
        'bahia': [-38.5011, -12.9714],
        'rio grande do sul': [-51.2177, -30.0346],
        'pernambuco': [-34.8770, -8.0476],
        'ceará': [-38.5267, -3.7319],
        'pará': [-48.4898, -1.4554],
        'santa catarina': [-50.2189, -27.2423],
        'goiás': [-49.2653, -16.6864],
        'maranhão': [-44.3028, -2.5297],
        'amazonas': [-60.0217, -3.1190],
        'mato grosso': [-56.0974, -15.6010],
        'mato grosso do sul': [-54.6478, -20.4435]
      }
      coordinates = stateCoords[location.name.toLowerCase()] || [0, 0]
    } else {
      const countryCoords: Record<string, [number, number]> = {
        'brasil': [-51.9253, -14.2350],
        'argentina': [-63.6167, -38.4161],
        'chile': [-71.5430, -35.6751],
        'uruguai': [-55.7658, -32.5228],
        'paraguai': [-58.4438, -23.4425],
        'bolívia': [-63.5887, -16.2902],
        'peru': [-75.0152, -9.1900],
        'colômbia': [-74.2973, 4.5709],
        'venezuela': [-66.5897, 6.4238],
        'equador': [-78.1834, -1.8312],
        'estados unidos': [-98.5795, 39.8283],
        'canadá': [-106.3468, 56.1304],
        'méxico': [-102.5528, 23.6345],
        'frança': [2.2137, 46.2276],
        'alemanha': [10.4515, 51.1657],
        'itália': [12.5674, 41.8719],
        'espanha': [-3.7492, 40.4637],
        'portugal': [-8.2245, 39.3999],
        'reino unido': [-3.4360, 55.3781],
        'japão': [138.2529, 36.2048]
      }
      coordinates = countryCoords[location.name.toLowerCase()] || [0, 0]
    }

    const newLocation: VisitedLocation = {
      id: location.id,
      type: location.type,
      name: location.name,
      coordinates
    }

    setVisitedLocations(prev => [...prev, newLocation])
    onPlaceToggle(location.id)
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
      // Verificar se o container tem dimensões
      const container = mapContainer.current
      console.log('Container dimensions:', container.offsetWidth, container.offsetHeight)

      // Inicializar o mapa com configurações mais simples
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

      // Eventos do mapa
      map.current.on('load', () => {
        console.log('✅ Mapa carregado com sucesso!')
        setMapError(null)
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
  }, [isClient])

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

      {/* Botão Adicionar Local */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title="Adicionar local visitado"
        >
          <span className="text-lg">📍</span>
          <span className="text-sm font-medium">Adicionar Local</span>
        </button>
      </div>

      {/* Instruções */}
      {!isTipClosed && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
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

      {/* Modal de Adicionar Local */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddLocation={handleAddLocation}
      />
    </div>
  )
}

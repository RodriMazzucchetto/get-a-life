'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import AddLocationModal from './AddLocationModal'
import { VisitedCity, CityLocation } from '@/types/travel'

// Interface para pontos do mapa (GeoJSON Feature)
interface MapPoint {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    id: string
    name: string
    status: 'visited' | 'upcoming'
    type: string
    title?: string
    cityId?: string
  }
}

interface PlannedTrip {
  id: string
  type: string
  title: string
  date: string
  location: string
  description: string
  todos: string[]
  cityData: {
    id: string
    name: string
    displayName: string
    coordinates: {
      lat: number
      lon: number
    }
    country: string
    state?: string
  }
}

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
  onCitiesUpdate?: (cities: VisitedCity[]) => void
  plannedTrips?: PlannedTrip[]
  onPlannedTripsUpdate?: (trips: PlannedTrip[]) => void
}

export default function TravelMapGL({ visitedPlaces, onPlaceToggle, onCitiesUpdate, plannedTrips = [], onPlannedTripsUpdate }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isTipClosed, setIsTipClosed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedCities, setVisitedCities] = useState<VisitedCity[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<PlannedTrip | null>(null)

  // 🎯 FUNÇÃO PARA CRIAR SOURCE GEOJSON ÚNICO
  const createMapSource = useCallback(() => {
    if (!map.current || map.current.getSource('map-points')) return

    console.log('🗺️ GL: Criando source GeoJSON único')
    
    map.current.addSource('map-points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    console.log('✅ GL: Source map-points criado')
  }, [])

  // 🎯 FUNÇÃO PARA CRIAR 2 LAYERS GL COM FILTER POR STATUS
  const createMapLayers = useCallback(() => {
    if (!map.current || !map.current.getSource('map-points')) return

    console.log('🎨 GL: Criando 2 layers GL com filter por status')

    // Layer 1: Cidades visitadas (azul) - base layer
    if (!map.current.getLayer('visited-cities')) {
      map.current.addLayer({
        id: 'visited-cities',
        type: 'circle',
        source: 'map-points',
        filter: ['==', ['get', 'status'], 'visited'],
        paint: {
          'circle-color': '#3b82f6',      // Azul
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 4,
            5, 6,
            10, 8,
            15, 12
          ],
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9
        }
      })
      console.log('✅ GL: Layer visited-cities criado (azul)')
    }

    // Layer 2: Viagens planejadas (roxo) - SEMPRE POR CIMA
    if (!map.current.getLayer('upcoming-trips')) {
      map.current.addLayer({
        id: 'upcoming-trips',
        type: 'circle',
        source: 'map-points',
        filter: ['==', ['get', 'status'], 'upcoming'],
        paint: {
          'circle-color': '#9333ea',      // Roxo
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 5,
            5, 7,
            10, 10,
            15, 14
          ],
          'circle-stroke-color': '#7c3aed',
          'circle-stroke-width': 3,
          'circle-opacity': 0.95
        }
      })
      console.log('✅ GL: Layer upcoming-trips criado (roxo) - POR CIMA')
    }

    console.log('🎯 GL: 2 layers criados com sucesso - sem Marker!')
  }, [])

  // 🎯 FUNÇÃO updateMapData - ATUALIZA CORES VIA setData
  const updateMapData = useCallback((visitedCities: VisitedCity[], plannedTrips: PlannedTrip[]) => {
    if (!map.current || !map.current.getSource('map-points')) return

    console.log('🔄 GL: updateMapData chamado')
    console.log(`📊 GL: ${visitedCities.length} cidades visitadas, ${plannedTrips.length} viagens planejadas`)

    const features: MapPoint[] = [
      // Cidades visitadas -> status: 'visited'
      ...visitedCities.map(city => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [city.coordinates[0], city.coordinates[1]] as [number, number]
        },
        properties: {
          id: city.id,
          name: city.name,
          status: 'visited' as const,
          type: 'city',
          cityId: city.id
        }
      })),
      // Viagens planejadas -> status: 'upcoming'
      ...plannedTrips.map(trip => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [trip.cityData.coordinates.lon, trip.cityData.coordinates.lat] as [number, number]
        },
        properties: {
          id: trip.id,
          name: trip.cityData.name,
          status: 'upcoming' as const,
          type: trip.type,
          title: trip.title
        }
      }))
    ]

    const source = map.current.getSource('map-points') as maplibregl.GeoJSONSource
    source.setData({
      type: 'FeatureCollection',
      features
    })

    console.log(`✅ GL: setData atualizado - ${features.length} features`)
    console.log('🎨 GL: Cores atualizadas via filter por status')
  }, [])

  // Handle clicks
  const handleCityClick = useCallback((e: maplibregl.MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return
    
    const feature = e.features[0]
    const cityId = feature.properties?.cityId || feature.properties?.id
    
    console.log('🖱️ GL: Clique em cidade visitada:', feature.properties?.name)
    
    if (cityId) {
      const city = visitedCities.find(c => c.id === cityId)
      if (city) {
        showDeleteConfirmation(city)
      }
    }
  }, [visitedCities])

  const handleTripClick = useCallback((e: maplibregl.MapLayerMouseEvent) => {
    if (!e.features || e.features.length === 0) return
    
    const feature = e.features[0]
    const tripId = feature.properties?.id
    
    console.log('🖱️ GL: Clique em viagem planejada:', feature.properties?.name)
    
    if (tripId) {
      const trip = plannedTrips.find(t => t.id === tripId)
      if (trip) {
        setSelectedTrip(trip)
        console.log('📋 GL: Abrindo modal para viagem:', trip.title)
      }
    }
  }, [plannedTrips])

  // 🎯 FUNÇÃO PARA CONFIGURAR EVENT LISTENERS
  const setupEventListeners = useCallback(() => {
    if (!map.current) return

    console.log('🎯 GL: Configurando event listeners para cliques')

    // Adicionar event listeners para clique
    map.current.on('click', 'visited-cities', handleCityClick)
    map.current.on('click', 'upcoming-trips', handleTripClick)
    
    // Cursor pointer nos pins
    map.current.on('mouseenter', 'visited-cities', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', 'visited-cities', () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })
    map.current.on('mouseenter', 'upcoming-trips', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', 'upcoming-trips', () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })

    console.log('✅ GL: Event listeners configurados com sucesso')
  }, [handleCityClick, handleTripClick])

  // Carregar cidades visitadas do localStorage
  useEffect(() => {
    const savedCities = localStorage.getItem('visitedCities')
    if (savedCities) {
      try {
        const cities = JSON.parse(savedCities)
        console.log('📦 GL: Cidades carregadas do localStorage:', cities.length)
        setVisitedCities(cities)
      } catch (error) {
        console.error('❌ GL: Erro ao carregar cidades:', error)
      }
    }
  }, [])

  // Função para adicionar nova cidade
  const handleAddLocation = useCallback((location: CityLocation) => {
    console.log('➕ GL: Adicionando nova cidade:', location.name)
    
    const newCity: VisitedCity = {
      id: location.id,
      type: 'city',
      name: location.name,
      displayName: location.name,
      coordinates: [location.coordinates.lon, location.coordinates.lat],
      country: location.country,
      state: location.state
    }

    const updatedCities = [...visitedCities, newCity]
    setVisitedCities(updatedCities)
    localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
    
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }

    onPlaceToggle(location.id)
    console.log('✅ GL: Cidade adicionada e dados atualizados')
  }, [visitedCities, onCitiesUpdate, onPlaceToggle])

  // Função para remover cidade
  const handleRemoveCity = useCallback((cityId: string) => {
    console.log('🗑️ GL: Removendo cidade:', cityId)
    
    const updatedCities = visitedCities.filter(city => city.id !== cityId)
    setVisitedCities(updatedCities)
    localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
    
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }

    console.log('✅ GL: Cidade removida e dados atualizados')
  }, [visitedCities, onCitiesUpdate])

  // Função para mostrar confirmação de exclusão
  const showDeleteConfirmation = useCallback((city: VisitedCity) => {
    if (window.confirm(`Remover ${city.name} da lista de cidades visitadas?`)) {
      handleRemoveCity(city.id)
    }
  }, [handleRemoveCity])

  // Função para remover viagem planejada
  const handleRemovePlannedTrip = useCallback((tripId: string) => {
    console.log('🗑️ GL: Removendo viagem planejada:', tripId)
    
    const updatedTrips = plannedTrips.filter(trip => trip.id !== tripId)
    
    if (onPlannedTripsUpdate) {
      onPlannedTripsUpdate(updatedTrips)
    }
    
    // Atualizar localStorage
    localStorage.setItem('plannedTrips', JSON.stringify(updatedTrips))
    
    console.log('✅ GL: Viagem planejada removida')
  }, [plannedTrips, onPlannedTripsUpdate])

  // Função para marcar viagem como concluída (mover para visitadas)
  const handleMarkTripAsCompleted = useCallback((trip: PlannedTrip) => {
    console.log('✅ GL: Marcando viagem como concluída:', trip.title)
    
    // Criar nova cidade visitada
    const newCity: VisitedCity = {
      id: trip.cityData.id,
      type: 'city',
      name: trip.cityData.name,
      displayName: trip.cityData.displayName,
      coordinates: [trip.cityData.coordinates.lon, trip.cityData.coordinates.lat],
      country: trip.cityData.country,
      state: trip.cityData.state
    }
    
    // Adicionar às cidades visitadas
    const updatedCities = [...visitedCities, newCity]
    setVisitedCities(updatedCities)
    localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
    
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }
    
    // Remover das viagens planejadas
    const updatedTrips = plannedTrips.filter(t => t.id !== trip.id)
    
    if (onPlannedTripsUpdate) {
      onPlannedTripsUpdate(updatedTrips)
    }
    
    localStorage.setItem('plannedTrips', JSON.stringify(updatedTrips))
    
    console.log('🎉 GL: Viagem concluída e movida para visitadas!')
  }, [visitedCities, plannedTrips, onCitiesUpdate, onPlannedTripsUpdate])

  // Initialize client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainer.current || map.current) return

    console.log('🚀 GL: Inicializando mapa MapLibre GL...')

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
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

      // 🎯 SOBREVIVE A setStyle - recria source/layers no styledata/load
      const handleStyleLoad = () => {
        console.log('🎨 GL: Style loaded - recriando source/layers')
        createMapSource()
        createMapLayers()
        updateMapData(visitedCities, plannedTrips)
        
        // Configurar event listeners após os layers serem criados
        setTimeout(() => {
          setupEventListeners()
        }, 100)
      }

      map.current.on('load', handleStyleLoad)
      map.current.on('styledata', handleStyleLoad)

      map.current.on('error', (e) => {
        console.error('❌ GL: Erro no mapa:', e)
        setMapError('Erro ao carregar o mapa')
      })

      console.log('✅ GL: Mapa inicializado com sucesso')

    } catch (error) {
      console.error('❌ GL: Erro ao inicializar mapa:', error)
      setMapError(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isClient, createMapSource, createMapLayers, visitedCities, plannedTrips, updateMapData, setupEventListeners])

  // Update data when cities or trips change
  useEffect(() => {
    console.log('🔄 GL: Dados mudaram - atualizando mapa')
    updateMapData(visitedCities, plannedTrips)
  }, [visitedCities, plannedTrips, updateMapData])

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-gray-600">Carregando mapa GL...</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-2">Erro ao carregar o mapa GL</p>
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
      </div>

      {/* Instruções */}
      {!isTipClosed && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-600">
              💡 <strong>GL Nativo:</strong> Pins azuis = visitadas, roxos = planejadas. 
              Pan/zoom/rotate funcionam perfeitamente!
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

      {/* Modal de Viagem Planejada */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🟣 {selectedTrip.title}
              </h2>
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm font-medium text-gray-600">Destino:</span>
                <p className="text-gray-900">{selectedTrip.cityData.name}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Data:</span>
                <p className="text-gray-900">{selectedTrip.date || 'Não definida'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Tipo:</span>
                <p className="text-gray-900 capitalize">{selectedTrip.type}</p>
              </div>
              
              {selectedTrip.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Descrição:</span>
                  <p className="text-gray-900">{selectedTrip.description}</p>
                </div>
              )}
              
              {selectedTrip.todos && selectedTrip.todos.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600">To-do:</span>
                  <ul className="mt-1 space-y-1">
                    {selectedTrip.todos.map((todo, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {todo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleMarkTripAsCompleted(selectedTrip)
                  setSelectedTrip(null)
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ✅ Marcar como Concluída
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm(`Remover a viagem para ${selectedTrip.cityData.name}?`)) {
                    handleRemovePlannedTrip(selectedTrip.id)
                    setSelectedTrip(null)
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
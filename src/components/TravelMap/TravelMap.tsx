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
        // Manter cidade que já tem informações completas
        updatedCities.push(city)
      }
    }

    if (hasUpdates) {
      console.log('🔄 Cidades antigas atualizadas com sucesso!')
      console.log('📊 Total de cidades mantidas:', updatedCities.length)
      // Salvar no localStorage
      localStorage.setItem('visitedCities', JSON.stringify(updatedCities))
      // NÃO notificar aqui para evitar loop infinito
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
        console.log('📊 Total de cidades encontradas:', cities.length)
        
        // Apenas carregar as cidades, sem atualização automática
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
      addCityPin(newCity, true) // true = é cidade nova
    }
  }

  const handleRemoveCity = (cityId: string) => {
    console.log(`🗑️ Removendo cidade com ID: ${cityId}`)
    
    const cityToRemove = visitedCities.find(city => city.id === cityId)
    if (cityToRemove) {
      console.log(`🗑️ Removendo cidade: ${cityToRemove.name}`)
    }
    
    const updatedCities = visitedCities.filter(city => city.id !== cityId)
    setVisitedCities(updatedCities)
    saveCitiesToStorage(updatedCities)
    
    // Notificar a página principal sobre a atualização das cidades
    if (onCitiesUpdate) {
      onCitiesUpdate(updatedCities)
    }

    // Remover pin do mapa e recriar todos os pins restantes
    if (map.current && map.current.isStyleLoaded()) {
      // Limpar todos os pins existentes
      const markers = document.querySelectorAll('.city-pin')
      markers.forEach(marker => marker.remove())
      
      // Recriar pins restantes (sem centralizar o mapa)
      updatedCities.forEach(city => {
        addCityPin(city, false)
      })
      
      console.log(`✅ Cidade removida. Total de cidades restantes: ${updatedCities.length}`)
    }

    // Mostrar notificação de sucesso
    showSuccessNotification(cityToRemove?.name || 'Cidade')
  }

  const addCityPin = (city: VisitedCity, isNewCity: boolean = false) => {
    if (!map.current || !map.current.isStyleLoaded()) return

    console.log(`🔍 DEBUG: Criando pin para cidade: ${city.name}`)

    // Criar elemento HTML para o pin
    const el = document.createElement('div')
    el.className = 'city-pin'
    el.innerHTML = `
      <div class="pin-container">
        <div class="pin-icon">🏙️</div>
        <div class="pin-label">${city.name}</div>
        <div class="pin-hint">Clique para remover</div>
      </div>
    `

    // Adicionar o pin ao mapa
    const marker = new maplibregl.Marker(el)
      .setLngLat(city.coordinates)
      .addTo(map.current)

    // Adicionar evento de clique diretamente no elemento do marker
    const markerElement = marker.getElement()
    console.log(`🔍 DEBUG: Elemento do marker para ${city.name}:`, markerElement)

    // Função para lidar com o clique
    const handleClick = (e: Event) => {
      console.log(`🖱️ DEBUG: Clique detectado no pin de ${city.name}`)
      e.preventDefault()
      e.stopPropagation()
      showDeleteConfirmation(city)
    }

    // Adicionar evento de clique
    markerElement.addEventListener('click', handleClick)
    
    // Também adicionar no elemento original para garantir
    el.addEventListener('click', handleClick)

    // Adicionar evento de mousedown para debug
    markerElement.addEventListener('mousedown', (e) => {
      console.log(`🖱️ DEBUG: Mousedown detectado no pin de ${city.name}`)
    })

    console.log(`✅ DEBUG: Pin criado e adicionado ao mapa para ${city.name}`)

    // Centralizar o mapa apenas para cidades novas (não para pins recriados)
    if (isNewCity) {
      map.current.flyTo({
        center: city.coordinates,
        zoom: Math.max(map.current.getZoom(), 8),
        duration: 2000
      })
    }
  }

  // Função para mostrar notificação de sucesso
  const showSuccessNotification = (cityName: string) => {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.success-notification')
    if (existingNotification) {
      existingNotification.remove()
    }

    // Criar notificação
    const notification = document.createElement('div')
    notification.className = 'success-notification'
    notification.innerHTML = `
      <div class="success-notification-content">
        <span class="text-lg">✅</span>
        <span class="text-sm">${cityName} removida com sucesso!</span>
      </div>
    `

    // Adicionar estilos CSS inline
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `

    // Adicionar animação CSS
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)

    // Adicionar ao body
    document.body.appendChild(notification)

    // Remover automaticamente após 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }

  // Função para mostrar confirmação de exclusão
  const showDeleteConfirmation = (city: VisitedCity) => {
    // Remover confirmação anterior se existir
    const existingConfirmation = document.querySelector('.delete-confirmation')
    if (existingConfirmation) {
      existingConfirmation.remove()
    }

    // Criar elemento de confirmação
    const confirmation = document.createElement('div')
    confirmation.className = 'delete-confirmation'
    confirmation.innerHTML = `
      <div class="delete-confirmation-content">
        <div class="delete-confirmation-header">
          <span class="text-lg">🗑️</span>
          <h3 class="text-lg font-semibold">Remover cidade?</h3>
        </div>
        <p class="text-gray-600 mb-4">
          Tem certeza que deseja remover <strong>${city.name}</strong> da lista de cidades visitadas?
        </p>
        <div class="delete-confirmation-actions">
          <button class="delete-confirm-btn" data-city-id="${city.id}">
            Sim, remover
          </button>
          <button class="delete-cancel-btn">
            Cancelar
          </button>
        </div>
      </div>
    `

    // Adicionar estilos CSS inline
    confirmation.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 24px;
      z-index: 1000;
      min-width: 320px;
      border: 1px solid #e5e7eb;
    `

    // Adicionar ao body
    document.body.appendChild(confirmation)

    // Adicionar estilos para os botões
    const style = document.createElement('style')
    style.textContent = `
      .delete-confirmation-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .delete-confirmation-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .delete-confirm-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .delete-confirm-btn:hover {
        background: #b91c1c;
      }
      
      .delete-cancel-btn {
        background: #6b7280;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .delete-cancel-btn:hover {
        background: #4b5563;
      }
    `
    document.head.appendChild(style)

    // Adicionar overlay de fundo
    const overlay = document.createElement('div')
    overlay.className = 'delete-confirmation-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    `
    document.body.appendChild(overlay)

    // Event listeners para os botões
    const confirmBtn = confirmation.querySelector('.delete-confirm-btn')
    const cancelBtn = confirmation.querySelector('.delete-cancel-btn')

    confirmBtn?.addEventListener('click', () => {
      const cityId = confirmBtn.getAttribute('data-city-id')
      if (cityId) {
        handleRemoveCity(cityId)
      }
      removeConfirmation()
    })

    cancelBtn?.addEventListener('click', removeConfirmation)
    overlay.addEventListener('click', removeConfirmation)

    // Função para remover confirmação
    function removeConfirmation() {
      confirmation.remove()
      overlay.remove()
    }
  }

  // Adicionar todos os pins existentes quando o mapa carregar
  const addAllCityPins = () => {
    if (!map.current || !map.current.isStyleLoaded()) return
    
    visitedCities.forEach(city => {
      addCityPin(city, false) // false = não é cidade nova
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
              console.log('📊 Cidades antes da atualização:', visitedCities.length)
              
              const updatedCities = await updateOldCities(visitedCities)
              console.log('📊 Cidades após atualização:', updatedCities.length)
              
              // Atualizar o estado local
              setVisitedCities(updatedCities)
              
              // Notificar a página principal sobre a atualização
              if (onCitiesUpdate) {
                onCitiesUpdate(updatedCities)
              }
              
              console.log('✅ Atualização concluída!')
            }}
            className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors w-full"
          >
            <span className="text-lg">🔄</span>
            Atualizar Cidades Antigas
          </button>
        )}
      </div>



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
          cursor: pointer !important;
          transition: transform 0.2s ease;
          pointer-events: auto !important;
          z-index: 1000 !important;
          position: relative;
        }
        .city-pin:hover {
          transform: scale(1.1);
        }
        .city-pin * {
          pointer-events: none;
        }
        .pin-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          pointer-events: none;
        }
        .pin-icon {
          font-size: 24px;
          margin-bottom: 4px;
          pointer-events: none;
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
          margin-bottom: 2px;
          pointer-events: none;
        }
        .pin-hint {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 8px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .city-pin:hover .pin-hint {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface Country {
  id: string
  name: string
  visited: boolean
}

// Dados GeoJSON simplificados para países principais
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => {
    setScale(prev => Math.min(4, prev * 1.5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev / 1.5))
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleGeographyClick = (geo: any) => {
    const countryId = geo.properties.ISO_A2
    if (countryId) {
      onPlaceToggle(countryId)
    }
  }

  const handleGeographyHover = (geo: any, event: any) => {
    if (geo.properties) {
      setTooltip({
        show: true,
        content: geo.properties.NAME || geo.properties.ADMIN || 'País',
        x: event.clientX,
        y: event.clientY
      })
    }
  }

  const handleGeographyLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 })
  }

  const isCountryVisited = (geo: any) => {
    const countryId = geo.properties.ISO_A2
    return countryId && visitedPlaces.includes(countryId)
  }

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden" ref={mapRef}>
      {/* Controles de Zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors text-xs"
          title="Resetar visualização"
        >
          🏠
        </button>
      </div>

      {/* Mapa */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 100,
          center: [0, 0]
        }}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <ZoomableGroup
          zoom={scale}
          center={[position.x, position.y]}
          maxZoom={4}
          minZoom={0.5}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isVisited = isCountryVisited(geo)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleGeographyClick(geo)}
                    onMouseEnter={(e) => handleGeographyHover(geo, e)}
                    onMouseLeave={handleGeographyLeave}
                    style={{
                      default: {
                        fill: isVisited ? '#10b981' : '#e5e7eb',
                        stroke: isVisited ? '#059669' : '#d1d5db',
                        strokeWidth: isVisited ? 1.5 : 0.5,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      hover: {
                        fill: isVisited ? '#34d399' : '#d1d5db',
                        stroke: isVisited ? '#059669' : '#9ca3af',
                        strokeWidth: isVisited ? 2 : 1,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: isVisited ? '#059669' : '#9ca3af',
                        stroke: isVisited ? '#047857' : '#6b7280',
                        strokeWidth: isVisited ? 2 : 1,
                        outline: 'none'
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-20 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Não visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Visitado</span>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <p className="text-xs text-gray-600">
          💡 <strong>Dica:</strong> Clique nos países para marcar como visitados. Use os botões de zoom para navegar.
        </p>
      </div>
    </div>
  )
}

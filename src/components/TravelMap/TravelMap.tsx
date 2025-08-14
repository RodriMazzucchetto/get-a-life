'use client'

import { useState, useRef, useEffect } from 'react'
import { geoPath, geoMercator } from 'd3-geo'
import { Feature, Geometry } from 'geojson'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface Country {
  id: string
  name: string
  coordinates: [number, number]
  visited: boolean
}

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  // Lista simplificada de países principais
  const countries: Country[] = [
    { id: 'BR', name: 'Brasil', coordinates: [-52.0, -10.0], visited: false },
    { id: 'US', name: 'Estados Unidos', coordinates: [-95.0, 38.0], visited: false },
    { id: 'AR', name: 'Argentina', coordinates: [-64.0, -34.0], visited: false },
    { id: 'CL', name: 'Chile', coordinates: [-71.0, -30.0], visited: false },
    { id: 'PE', name: 'Peru', coordinates: [-75.0, -10.0], visited: false },
    { id: 'CO', name: 'Colômbia', coordinates: [-74.0, 4.0], visited: false },
    { id: 'MX', name: 'México', coordinates: [-102.0, 23.0], visited: false },
    { id: 'CA', name: 'Canadá', coordinates: [-96.0, 60.0], visited: false },
    { id: 'FR', name: 'França', coordinates: [2.0, 46.0], visited: false },
    { id: 'DE', name: 'Alemanha', coordinates: [10.0, 51.0], visited: false },
    { id: 'IT', name: 'Itália', coordinates: [12.0, 42.0], visited: false },
    { id: 'ES', name: 'Espanha', coordinates: [-3.0, 40.0], visited: false },
    { id: 'GB', name: 'Reino Unido', coordinates: [-2.0, 54.0], visited: false },
    { id: 'JP', name: 'Japão', coordinates: [138.0, 36.0], visited: false },
    { id: 'CN', name: 'China', coordinates: [105.0, 35.0], visited: false },
    { id: 'IN', name: 'Índia', coordinates: [78.0, 20.0], visited: false },
    { id: 'AU', name: 'Austrália', coordinates: [135.0, -25.0], visited: false },
    { id: 'ZA', name: 'África do Sul', coordinates: [24.0, -29.0], visited: false },
    { id: 'EG', name: 'Egito', coordinates: [30.0, 27.0], visited: false },
    { id: 'RU', name: 'Rússia', coordinates: [105.0, 60.0], visited: false },
  ]

  // Atualizar países visitados baseado na prop
  const updatedCountries = countries.map(country => ({
    ...country,
    visited: visitedPlaces.includes(country.id)
  }))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCountryClick = (countryId: string) => {
    onPlaceToggle(countryId)
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      {/* Controles */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.5, prev * 0.8))}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 text-xs"
        >
          🏠
        </button>
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 400"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Fundo do mapa */}
          <rect width="800" height="400" fill="#f3f4f6" />
          
          {/* Continentes simplificados */}
          <g className="continents">
            {/* América do Norte */}
            <path
              d="M 100 150 Q 150 120 200 130 Q 250 140 300 150 Q 350 160 400 150 L 400 200 L 100 200 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* América do Sul */}
            <path
              d="M 200 200 Q 250 220 300 240 Q 350 260 400 280 L 400 350 L 200 350 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Europa */}
            <path
              d="M 450 150 Q 500 140 550 150 Q 600 160 650 150 L 650 180 L 450 180 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* África */}
            <path
              d="M 450 200 Q 500 220 550 240 Q 600 260 650 280 L 650 350 L 450 350 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Ásia */}
            <path
              d="M 650 100 Q 700 90 750 100 Q 800 110 850 100 L 850 200 L 650 200 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Oceania */}
            <path
              d="M 700 300 Q 750 290 800 300 Q 850 310 900 300 L 900 350 L 700 350 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
          </g>

          {/* Países como pontos clicáveis */}
          {updatedCountries.map((country) => {
            const [x, y] = country.coordinates
            const svgX = ((x + 180) / 360) * 800
            const svgY = ((90 - y) / 180) * 400
            
            return (
              <g key={country.id}>
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={country.visited ? 8 : 6}
                  fill={country.visited ? '#10b981' : '#6b7280'}
                  stroke={country.visited ? '#059669' : '#374151'}
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleCountryClick(country.id)}
                />
                {country.visited && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r="12"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                )}
                <text
                  x={svgX}
                  y={svgY + 25}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                  className="pointer-events-none"
                >
                  {country.id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Não visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Visitado</span>
          </div>
        </div>
      </div>
    </div>
  )
}

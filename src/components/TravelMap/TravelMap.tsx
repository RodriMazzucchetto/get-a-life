'use client'

import { useState, useRef } from 'react'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface Country {
  id: string
  name: string
  path: string
  visited: boolean
}

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  // Dados simplificados de países principais com coordenadas SVG
  const countries: Country[] = [
    // América do Norte
    { id: 'US', name: 'Estados Unidos', path: 'M 100 150 L 300 150 L 300 200 L 100 200 Z', visited: false },
    { id: 'CA', name: 'Canadá', path: 'M 100 100 L 300 100 L 300 150 L 100 150 Z', visited: false },
    { id: 'MX', name: 'México', path: 'M 100 200 L 200 200 L 200 250 L 100 250 Z', visited: false },
    
    // América do Sul
    { id: 'BR', name: 'Brasil', path: 'M 200 250 L 300 250 L 300 350 L 200 350 Z', visited: false },
    { id: 'AR', name: 'Argentina', path: 'M 250 300 L 300 300 L 300 380 L 250 380 Z', visited: false },
    { id: 'CL', name: 'Chile', path: 'M 280 300 L 320 300 L 320 380 L 280 380 Z', visited: false },
    { id: 'PE', name: 'Peru', path: 'M 200 250 L 250 250 L 250 300 L 200 300 Z', visited: false },
    { id: 'CO', name: 'Colômbia', path: 'M 180 250 L 220 250 L 220 280 L 180 280 Z', visited: false },
    { id: 'VE', name: 'Venezuela', path: 'M 180 230 L 200 230 L 200 250 L 180 250 Z', visited: false },
    
    // Europa
    { id: 'FR', name: 'França', path: 'M 450 150 L 480 150 L 480 170 L 450 170 Z', visited: false },
    { id: 'DE', name: 'Alemanha', path: 'M 470 140 L 500 140 L 500 160 L 470 160 Z', visited: false },
    { id: 'IT', name: 'Itália', path: 'M 470 160 L 500 160 L 500 180 L 470 180 Z', visited: false },
    { id: 'ES', name: 'Espanha', path: 'M 430 160 L 450 160 L 450 180 L 430 180 Z', visited: false },
    { id: 'GB', name: 'Reino Unido', path: 'M 440 140 L 450 140 L 450 150 L 440 150 Z', visited: false },
    { id: 'PT', name: 'Portugal', path: 'M 420 160 L 430 160 L 430 170 L 420 170 Z', visited: false },
    
    // África
    { id: 'ZA', name: 'África do Sul', path: 'M 480 300 L 520 300 L 520 350 L 480 350 Z', visited: false },
    { id: 'EG', name: 'Egito', path: 'M 500 200 L 540 200 L 540 230 L 500 230 Z', visited: false },
    { id: 'NG', name: 'Nigéria', path: 'M 470 250 L 490 250 L 490 270 L 470 270 Z', visited: false },
    { id: 'KE', name: 'Quênia', path: 'M 520 270 L 540 270 L 540 290 L 520 290 Z', visited: false },
    
    // Ásia
    { id: 'CN', name: 'China', path: 'M 650 150 L 750 150 L 750 200 L 650 200 Z', visited: false },
    { id: 'JP', name: 'Japão', path: 'M 780 160 L 800 160 L 800 180 L 780 180 Z', visited: false },
    { id: 'IN', name: 'Índia', path: 'M 600 200 L 650 200 L 650 250 L 600 250 Z', visited: false },
    { id: 'KR', name: 'Coreia do Sul', path: 'M 750 160 L 770 160 L 770 180 L 750 180 Z', visited: false },
    { id: 'TH', name: 'Tailândia', path: 'M 680 220 L 700 220 L 700 240 L 680 240 Z', visited: false },
    { id: 'VN', name: 'Vietnã', path: 'M 700 220 L 720 220 L 720 240 L 700 240 Z', visited: false },
    
    // Oceania
    { id: 'AU', name: 'Austrália', path: 'M 700 300 L 800 300 L 800 380 L 700 380 Z', visited: false },
    { id: 'NZ', name: 'Nova Zelândia', path: 'M 780 380 L 800 380 L 800 390 L 780 390 Z', visited: false }
  ]

  const updatedCountries = countries.map(country => ({
    ...country,
    visited: visitedPlaces.includes(country.id)
  }))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)))
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

  const handleCountryHover = (country: Country, event: React.MouseEvent) => {
    setTooltip({
      show: true,
      content: country.name,
      x: event.clientX,
      y: event.clientY
    })
  }

  const handleCountryLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev * 1.2))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev * 0.8))
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
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
      <div
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
          viewBox="0 0 900 400"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Fundo do mapa */}
          <rect width="900" height="400" fill="#f3f4f6" />
          
          {/* Continentes base */}
          <g className="continents">
            {/* América do Norte */}
            <path
              d="M 50 100 L 350 100 L 350 200 L 50 200 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* América do Sul */}
            <path
              d="M 150 200 L 350 200 L 350 400 L 150 400 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Europa */}
            <path
              d="M 400 100 L 500 100 L 500 200 L 400 200 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* África */}
            <path
              d="M 450 200 L 550 200 L 550 400 L 450 400 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Ásia */}
            <path
              d="M 550 100 L 850 100 L 850 250 L 550 250 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            
            {/* Oceania */}
            <path
              d="M 650 300 L 850 300 L 850 400 L 650 400 Z"
              fill="#e5e7eb"
              stroke="#d1d5db"
              strokeWidth="1"
            />
          </g>

          {/* Países */}
          {updatedCountries.map((country) => (
            <g key={country.id}>
              <path
                d={country.path}
                fill={country.visited ? '#10b981' : '#6b7280'}
                stroke={country.visited ? '#059669' : '#374151'}
                strokeWidth={country.visited ? 2 : 1}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleCountryClick(country.id)}
                onMouseEnter={(e) => handleCountryHover(country, e)}
                onMouseLeave={handleCountryLeave}
              />
              {country.visited && (
                <path
                  d={country.path}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  opacity="0.6"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

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
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
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

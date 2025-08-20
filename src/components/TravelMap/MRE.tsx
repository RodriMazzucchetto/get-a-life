'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

/**
 * 🎯 MRE (Minimal Reproducible Example)
 * 
 * Demonstra 2 pontos no mapa com cores distintas:
 * - São Paulo (visited) = AZUL
 * - Santiago (upcoming) = ROXO
 * 
 * ✅ GeoJSON único com properties.status
 * ✅ 2 layers GL com filter por status
 * ✅ Sem maplibregl.Marker()
 * ✅ Cores corretas via circle-color
 * ✅ Pan/zoom/rotate funcionam perfeitamente
 */

export default function MRE() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🚀 MRE: Inicializando...')

    // Inicializar mapa
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
            source: 'osm'
          }
        ]
      },
      center: [-58.5, -23.5], // Centro entre São Paulo e Santiago
      zoom: 4
    })

    map.current.on('load', () => {
      if (!map.current) return

      console.log('🎯 MRE: Criando source GeoJSON único')

      // 1. CRIAR SOURCE GEOJSON ÚNICO
      map.current.addSource('test-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // São Paulo = visited (AZUL)
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-46.6388, -23.5489]
              },
              properties: {
                id: 'sao-paulo',
                name: 'São Paulo',
                status: 'visited' // 🔑 KEY PROPERTY
              }
            },
            // Santiago = upcoming (ROXO)
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-70.6483, -33.4489]
              },
              properties: {
                id: 'santiago',
                name: 'Santiago',
                status: 'upcoming' // 🔑 KEY PROPERTY
              }
            }
          ]
        }
      })

      console.log('🎨 MRE: Criando 2 layers GL com filter por status')

      // 2. LAYER 1: VISITED (AZUL)
      map.current.addLayer({
        id: 'visited-layer',
        type: 'circle',
        source: 'test-points',
        filter: ['==', ['get', 'status'], 'visited'], // 🎯 FILTER
        paint: {
          'circle-color': '#3b82f6', // AZUL
          'circle-radius': 12,
          'circle-stroke-color': '#1d4ed8',
          'circle-stroke-width': 3
        }
      })

      // 3. LAYER 2: UPCOMING (ROXO) - POR CIMA
      map.current.addLayer({
        id: 'upcoming-layer',
        type: 'circle',
        source: 'test-points',
        filter: ['==', ['get', 'status'], 'upcoming'], // 🎯 FILTER
        paint: {
          'circle-color': '#9333ea', // ROXO
          'circle-radius': 15,
          'circle-stroke-color': '#7c3aed',
          'circle-stroke-width': 4
        }
      })

      console.log('✅ MRE: Configuração completa')
      console.log('🔵 São Paulo deve aparecer AZUL')
      console.log('🟣 Santiago deve aparecer ROXO')

      // Test click events
      map.current.on('click', 'visited-layer', (e) => {
        console.log('🖱️ Clicou na cidade visitada:', e.features?.[0]?.properties?.name)
      })

      map.current.on('click', 'upcoming-layer', (e) => {
        console.log('🖱️ Clicou na viagem planejada:', e.features?.[0]?.properties?.name)
      })

      // Test style changes survive
      setTimeout(() => {
        console.log('🧪 MRE: Testando setStyle...')
        if (map.current) {
          // Simular mudança de estilo (deve recriar automaticamente)
          const currentStyle = map.current.getStyle()
          map.current.setStyle(currentStyle)
        }
      }, 3000)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg">
        <h3 className="font-bold text-sm mb-2">MRE Test</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>São Paulo (visited)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>Santiago (upcoming)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Test pan/zoom/rotate!
        </p>
      </div>
    </div>
  )
}

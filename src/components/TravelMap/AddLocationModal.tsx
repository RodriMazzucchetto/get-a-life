'use client'

import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'

// Sistema de busca com Photon (Komoot) - TODAS as cidades do mundo
interface CityResult {
  id: string
  name: string
  type: 'city'
  displayName: string
  coordinates: {
    lat: number
    lon: number
  }
  country: string
  countryCode: string
  state?: string
}

// Interface para resposta da API Photon
interface PhotonFeature {
  type: string
  geometry: {
    type: string
    coordinates: [number, number] // [lon, lat]
  }
  properties: {
    name: string
    country: string
    countrycode: string
    state?: string
    city?: string
    osm_type: string
    osm_id: string
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLocation: (location: { type: 'city', name: string, id: string, coordinates: { lat: number, lon: number } }) => void
}

export default function AddLocationModal({ isOpen, onClose, onAddLocation }: AddLocationModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CityResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<CityResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Busca com Photon (Komoot) - TODAS as cidades do mundo
  const searchCities = useCallback(async (query: string): Promise<CityResult[]> => {
    if (!query.trim() || query.length < 2) return []
    
    const searchTerm = query.toLowerCase().trim()
    console.log('🔍 Buscando TODAS as cidades com Photon:', searchTerm)
    
    try {
      // Photon (Komoot) - API gratuita, sem rate limits, TODAS as cidades
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=pt&limit=25&layer=city`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GetALifeApp/1.0'
          }
        }
      )
      
      if (photonResponse.ok) {
        const photonData: PhotonResponse = await photonResponse.json()
        
        const results: CityResult[] = photonData.features
          .filter(feature => 
            feature.geometry?.coordinates && 
            feature.properties?.name &&
            feature.properties?.country
          )
          .map(feature => {
            const [lon, lat] = feature.geometry.coordinates
            const cityName = feature.properties.city || feature.properties.name
            
            return {
              id: `${feature.properties.osm_type}-${feature.properties.osm_id}`,
              name: cityName,
              type: 'city',
              displayName: `${cityName}, ${feature.properties.state || ''}, ${feature.properties.country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, ''),
              coordinates: {
                lat: lat,
                lon: lon
              },
              country: feature.properties.country,
              countryCode: feature.properties.countrycode?.toLowerCase() || '',
              state: feature.properties.state
            }
          })
        
        console.log('📍 Cidades encontradas com Photon:', results.length)
        return results
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar cidades com Photon:', error)
    }
    
    return []
  }, [])

  // Busca com debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([])
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchCities(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Erro na busca:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [searchCities]
  )

  // Função debounce
  function debounce(
    func: (query: string) => Promise<void>,
    wait: number
  ): (query: string) => void {
    let timeout: NodeJS.Timeout
    return (query: string) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(query), wait)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedLocation(null)
    
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setSearchResults([])
    }
  }

  const handleLocationSelect = (location: CityResult) => {
    setSelectedLocation(location)
    setSearchTerm(location.displayName)
  }

  const handleAddLocation = () => {
    if (selectedLocation) {
      onAddLocation({
        type: 'city',
        name: selectedLocation.name,
        id: selectedLocation.id,
        coordinates: selectedLocation.coordinates
      })
      onClose()
      setSearchTerm('')
      setSearchResults([])
      setSelectedLocation(null)
    }
  }

  const handleClose = () => {
    onClose()
    setSearchTerm('')
    setSearchResults([])
    setSelectedLocation(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Adicionar Cidade</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Digite o nome da cidade..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Buscando TODAS as cidades do mundo...</p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {searchResults.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0 ${
                  selectedLocation?.id === location.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {location.countryCode && (
                    <img 
                      src={`https://flagcdn.com/${location.countryCode}.svg`}
                      alt={location.country}
                      className="w-6 h-4 rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-600">{location.displayName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Nenhuma cidade encontrada. Tente outro termo.
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddLocation}
            disabled={!selectedLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          🔍 Powered by <strong>Photon (Komoot)</strong> - <strong>TODAS as cidades do mundo</strong>
        </div>
      </div>
    </div>
  )
}

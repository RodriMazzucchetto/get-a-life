'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

// Sistema de busca em múltiplas fontes para TODAS as cidades do mundo
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
  state?: string
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

  // Sistema de busca em múltiplas fontes
  const searchCities = useCallback(async (query: string): Promise<CityResult[]> => {
    if (!query.trim() || query.length < 2) return []
    
    const searchTerm = query.toLowerCase().trim()
    console.log('🔍 Buscando TODAS as cidades:', searchTerm)
    
    const results: CityResult[] = []
    
    try {
      // 1. PRIMEIRA FONTE: Nominatim (OpenStreetMap) - 100+ milhões de lugares
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&featuretype=city&limit=20&accept-language=pt,en`,
        {
          headers: {
            'User-Agent': 'GetALifeApp/1.0'
          }
        }
      )
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json()
        nominatimData.forEach((place: any) => {
          if (place.lat && place.lon) {
            results.push({
              id: `nominatim-${place.place_id}`,
              name: place.name || place.display_name.split(',')[0],
              type: 'city',
              displayName: place.display_name,
              coordinates: {
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon)
              },
              country: place.address?.country || 'Desconhecido',
              state: place.address?.state || place.address?.province || place.address?.region
            })
          }
        })
      }
      
      // 2. SEGUNDA FONTE: GeoNames - Base oficial com 11 milhões de cidades
      const geonamesResponse = await fetch(
        `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=20&featureClass=P&featureCode=PPL&featureCode=PPLA&featureCode=PPLA2&featureCode=PPLA3&featureCode=PPLA4&username=demo`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (geonamesResponse.ok) {
        const geonamesData = await geonamesResponse.json()
        if (geonamesData.geonames) {
          geonamesData.geonames.forEach((place: any) => {
            if (place.lat && place.lng) {
              results.push({
                id: `geonames-${place.geonameId}`,
                name: place.name,
                type: 'city',
                displayName: `${place.name}, ${place.adminName1 || ''}, ${place.countryName}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, ''),
                coordinates: {
                  lat: parseFloat(place.lat),
                  lon: parseFloat(place.lng)
                },
                country: place.countryName,
                state: place.adminName1
              })
            }
          })
        }
      }
      
      // 3. TERCEIRA FONTE: API de cidades do mundo (fallback)
      const citiesResponse = await fetch(
        `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(query)}&limit=20`,
        {
          headers: {
            'X-Api-Key': 'demo' // Usar chave real em produção
          }
        }
      )
      
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json()
        citiesData.forEach((city: any) => {
          if (city.latitude && city.longitude) {
            results.push({
              id: `cities-${city.name}-${city.country}`,
              name: city.name,
              type: 'city',
              displayName: `${city.name}, ${city.state || ''}, ${city.country}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, ''),
              coordinates: {
                lat: parseFloat(city.latitude),
                lon: parseFloat(city.longitude)
              },
              country: city.country,
              state: city.state
            })
          }
        })
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar cidades:', error)
    }
    
    // Remover duplicatas e ordenar por relevância
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => 
        r.name.toLowerCase() === result.name.toLowerCase() && 
        r.country.toLowerCase() === result.country.toLowerCase()
      )
    )
    
    // Ordenar por relevância (nome exato primeiro)
    uniqueResults.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchTerm
      const bExact = b.name.toLowerCase() === searchTerm
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.name.localeCompare(b.name)
    })
    
    console.log('📍 Resultados encontrados:', uniqueResults.length)
    return uniqueResults.slice(0, 25) // Retornar até 25 resultados
    
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
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
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
                className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                  selectedLocation?.id === location.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{location.name}</div>
                <div className="text-sm text-gray-600">{location.displayName}</div>
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
          🔍 Buscando em <strong>MÚLTIPLAS BASES</strong> com <strong>TODAS as cidades do mundo</strong>
        </div>
      </div>
    </div>
  )
}

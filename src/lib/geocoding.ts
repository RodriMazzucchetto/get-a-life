import { API_CONFIG, getNominatimHeaders } from './api-config'

export interface GeocodingResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
  icon?: string
}

export interface SearchResult {
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

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  console.log('🔍 Buscando cidades para:', searchTerm)

  try {
    // Buscar cidades via API do Nominatim (OpenStreetMap)
    console.log('🌐 Buscando cidades globais...')
    const response = await fetch(
      `${API_CONFIG.NOMINATIM.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=${API_CONFIG.NOMINATIM.MAX_RESULTS}&addressdetails=1&accept-language=${API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE}&featuretype=city`,
      {
        headers: getNominatimHeaders()
      }
    )

    if (response.ok) {
      const results: GeocodingResult[] = await response.json()
      console.log('✅ API retornou:', results.length, 'resultados')
      
      if (results.length > 0) {
        const cityResults = results
          .filter(result => {
            // Filtrar apenas cidades e municípios
            const type = result.type
            return type === 'city' || type === 'municipality' || type === 'town' || 
                   (type === 'administrative' && result.class === 'place')
          })
          .map(result => {
            // Extrair informações da cidade
            const parts = result.display_name.split(', ')
            const cityName = parts[0]
            const country = parts[parts.length - 1]
            const state = parts.length > 2 ? parts[parts.length - 2] : undefined

            return {
              id: `city-${result.osm_type}-${result.osm_id}`,
              name: cityName,
              type: 'city' as const,
              displayName: result.display_name,
              coordinates: {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon)
              },
              country,
              state
            }
          })
          .slice(0, 10) // Mostrar mais resultados para cidades

        console.log('🏙️ Cidades encontradas:', cityResults.length)
        return cityResults
      }
    } else {
      console.log('⚠️ API falhou:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Erro na API:', error)
  }

  // Se não encontrou nada, retornar array vazio
  console.log('📍 Nenhuma cidade encontrada')
  return []
}

export const getLocationDetails = async (lat: number, lon: number): Promise<SearchResult | null> => {
  try {
    const response = await fetch(
      `${API_CONFIG.NOMINATIM.BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=${API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE}`,
      {
        headers: getNominatimHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Erro na API de geocoding reverso')
    }

    const result = await response.json()
    
    if (!result.display_name) {
      return null
    }

    const parts = result.display_name.split(', ')
    const cityName = parts[0]
    const country = parts[parts.length - 1]
    const state = parts.length > 2 ? parts[parts.length - 2] : undefined

    return {
      id: `city-${result.osm_type}-${result.osm_id}`,
      name: cityName,
      type: 'city',
      displayName: result.display_name,
      coordinates: {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      },
      country,
      state
    }

  } catch (error) {
    console.error('Erro ao obter detalhes da localização:', error)
    return null
  }
}

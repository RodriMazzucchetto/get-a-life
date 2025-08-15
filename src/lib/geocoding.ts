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
  type: 'city' | 'state' | 'country'
  displayName: string
  coordinates: {
    lat: number
    lon: number
  }
  country?: string
  state?: string
}

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim() || query.length < 2) {
    return []
  }

  try {
    // Usar a API do Nominatim (OpenStreetMap) - gratuita e open source
    const response = await fetch(
      `${API_CONFIG.NOMINATIM.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=${API_CONFIG.NOMINATIM.MAX_RESULTS}&addressdetails=1&accept-language=${API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE}`,
      {
        headers: getNominatimHeaders()
      }
    )

    if (!response.ok) {
      throw new Error('Erro na API de geocoding')
    }

    const results: GeocodingResult[] = await response.json()
    
    return results
      .filter(result => {
        // Filtrar apenas resultados relevantes (cidades, estados, países)
        const type = result.type
        return type === 'city' || type === 'state' || type === 'country' || 
               type === 'administrative' || type === 'municipality'
      })
      .map(result => {
        // Determinar o tipo baseado no resultado
        let locationType: 'city' | 'state' | 'country' = 'city'
        if (result.type === 'country') {
          locationType = 'country'
        } else if (result.type === 'state' || result.type === 'administrative') {
          locationType = 'state'
        }

        // Extrair informações do display_name
        const parts = result.display_name.split(', ')
        const country = parts[parts.length - 1]
        const state = parts.length > 2 ? parts[parts.length - 2] : undefined

        return {
          id: `${result.osm_type}-${result.osm_id}`,
          name: result.display_name.split(',')[0], // Nome principal
          type: locationType,
          displayName: result.display_name,
          coordinates: {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
          },
          country,
          state
        }
      })
      .slice(0, 8) // Limitar a 8 resultados para melhor UX

  } catch (error) {
    console.error('Erro ao buscar localizações:', error)
    return []
  }
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

    // Determinar o tipo baseado no resultado
    let locationType: 'city' | 'state' | 'country' = 'city'
    if (result.address?.country) {
      if (!result.address.state && !result.address.city) {
        locationType = 'country'
      } else if (!result.address.city) {
        locationType = 'state'
      }
    }

    const parts = result.display_name.split(', ')
    const country = parts[parts.length - 1]
    const state = parts.length > 2 ? parts[parts.length - 2] : undefined

    return {
      id: `${result.osm_type}-${result.osm_id}`,
      name: result.display_name.split(',')[0],
      type: locationType,
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

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

interface FallbackLocation {
  name: string
  type: 'city' | 'state' | 'country'
  coordinates: {
    lat: number
    lon: number
  }
  country?: string
  state?: string
}

// Dados de fallback para quando a API não funcionar
const fallbackCities: FallbackLocation[] = [
  { name: 'Curitiba', type: 'city', coordinates: { lat: -25.4289, lon: -49.2671 }, country: 'Brasil', state: 'Paraná' },
  { name: 'São Paulo', type: 'city', coordinates: { lat: -23.5505, lon: -46.6333 }, country: 'Brasil', state: 'São Paulo' },
  { name: 'Rio de Janeiro', type: 'city', coordinates: { lat: -22.9068, lon: -43.1729 }, country: 'Brasil', state: 'Rio de Janeiro' },
  { name: 'Belo Horizonte', type: 'city', coordinates: { lat: -19.9167, lon: -43.9345 }, country: 'Brasil', state: 'Minas Gerais' },
  { name: 'Brasília', type: 'city', coordinates: { lat: -15.7942, lon: -47.8822 }, country: 'Brasil', state: 'Distrito Federal' },
  { name: 'Salvador', type: 'city', coordinates: { lat: -12.9714, lon: -38.5011 }, country: 'Brasil', state: 'Bahia' },
  { name: 'Fortaleza', type: 'city', coordinates: { lat: -3.7319, lon: -38.5267 }, country: 'Brasil', state: 'Ceará' },
  { name: 'Manaus', type: 'city', coordinates: { lat: -3.1190, lon: -60.0217 }, country: 'Brasil', state: 'Amazonas' },
  { name: 'Recife', type: 'city', coordinates: { lat: -8.0476, lon: -34.8770 }, country: 'Brasil', state: 'Pernambuco' },
  { name: 'Porto Alegre', type: 'city', coordinates: { lat: -30.0346, lon: -51.2177 }, country: 'Brasil', state: 'Rio Grande do Sul' },
  { name: 'Goiânia', type: 'city', coordinates: { lat: -16.6864, lon: -49.2653 }, country: 'Brasil', state: 'Goiás' },
  { name: 'Guarulhos', type: 'city', coordinates: { lat: -23.4543, lon: -46.5339 }, country: 'Brasil', state: 'São Paulo' },
  { name: 'Campinas', type: 'city', coordinates: { lat: -22.9064, lon: -47.0616 }, country: 'Brasil', state: 'São Paulo' },
  { name: 'Natal', type: 'city', coordinates: { lat: -5.7945, lon: -35.2090 }, country: 'Brasil', state: 'Rio Grande do Norte' },
  { name: 'Curitibanos', type: 'city', coordinates: { lat: -27.2833, lon: -50.5833 }, country: 'Brasil', state: 'Santa Catarina' }
]

const fallbackStates: FallbackLocation[] = [
  { name: 'Paraná', type: 'state', coordinates: { lat: -25.2521, lon: -52.0215 }, country: 'Brasil' },
  { name: 'São Paulo', type: 'state', coordinates: { lat: -23.5505, lon: -46.6333 }, country: 'Brasil' },
  { name: 'Rio de Janeiro', type: 'state', coordinates: { lat: -22.9068, lon: -43.1729 }, country: 'Brasil' },
  { name: 'Minas Gerais', type: 'state', coordinates: { lat: -19.9167, lon: -43.9345 }, country: 'Brasil' },
  { name: 'Bahia', type: 'state', coordinates: { lat: -12.9714, lon: -38.5011 }, country: 'Brasil' },
  { name: 'Rio Grande do Sul', type: 'state', coordinates: { lat: -30.0346, lon: -51.2177 }, country: 'Brasil' },
  { name: 'Pernambuco', type: 'state', coordinates: { lat: -8.0476, lon: -34.8770 }, country: 'Brasil' },
  { name: 'Ceará', type: 'state', coordinates: { lat: -3.7319, lon: -38.5267 }, country: 'Brasil' },
  { name: 'Pará', type: 'state', coordinates: { lat: -1.4554, lon: -48.4898 }, country: 'Brasil' },
  { name: 'Santa Catarina', type: 'state', coordinates: { lat: -27.2423, lon: -50.2189 }, country: 'Brasil' },
  { name: 'Goiás', type: 'state', coordinates: { lat: -16.6864, lon: -49.2653 }, country: 'Brasil' },
  { name: 'Maranhão', type: 'state', coordinates: { lat: -2.5297, lon: -44.3028 }, country: 'Brasil' },
  { name: 'Amazonas', type: 'state', coordinates: { lat: -3.1190, lon: -60.0217 }, country: 'Brasil' },
  { name: 'Mato Grosso', type: 'state', coordinates: { lat: -15.6010, lon: -56.0974 }, country: 'Brasil' },
  { name: 'Mato Grosso do Sul', type: 'state', coordinates: { lat: -20.4435, lon: -54.6478 }, country: 'Brasil' }
]

const fallbackCountries: FallbackLocation[] = [
  { name: 'Brasil', type: 'country', coordinates: { lat: -14.2350, lon: -51.9253 } },
  { name: 'Argentina', type: 'country', coordinates: { lat: -38.4161, lon: -63.6167 } },
  { name: 'Chile', type: 'country', coordinates: { lat: -35.6751, lon: -71.5430 } },
  { name: 'Uruguai', type: 'country', coordinates: { lat: -32.5228, lon: -55.7658 } },
  { name: 'Paraguai', type: 'country', coordinates: { lat: -23.4425, lon: -58.4438 } },
  { name: 'Bolívia', type: 'country', coordinates: { lat: -16.2902, lon: -63.5887 } },
  { name: 'Peru', type: 'country', coordinates: { lat: -9.1900, lon: -75.0152 } },
  { name: 'Colômbia', type: 'country', coordinates: { lat: 4.5709, lon: -74.2973 } },
  { name: 'Venezuela', type: 'country', coordinates: { lat: 6.4238, lon: -66.5897 } },
  { name: 'Equador', type: 'country', coordinates: { lat: -1.8312, lon: -78.1834 } },
  { name: 'Estados Unidos', type: 'country', coordinates: { lat: 39.8283, lon: -98.5795 } },
  { name: 'Canadá', type: 'country', coordinates: { lat: 56.1304, lon: -106.3468 } },
  { name: 'México', type: 'country', coordinates: { lat: 23.6345, lon: -102.5528 } },
  { name: 'França', type: 'country', coordinates: { lat: 46.2276, lon: 2.2137 } },
  { name: 'Alemanha', type: 'country', coordinates: { lat: 51.1657, lon: 10.4515 } },
  { name: 'Itália', type: 'country', coordinates: { lat: 41.8719, lon: 12.5674 } },
  { name: 'Espanha', type: 'country', coordinates: { lat: 40.4637, lon: -3.7492 } },
  { name: 'Portugal', type: 'country', coordinates: { lat: 39.3999, lon: -8.2245 } },
  { name: 'Reino Unido', type: 'country', coordinates: { lat: 55.3781, lon: -3.4360 } },
  { name: 'Japão', type: 'country', coordinates: { lat: 36.2048, lon: 138.2529 } }
]

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  console.log('🔍 Buscando localizações para:', searchTerm)

  try {
    // Primeiro, tentar com a API do Nominatim
    console.log('🌐 Tentando API Nominatim...')
    const response = await fetch(
      `${API_CONFIG.NOMINATIM.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=${API_CONFIG.NOMINATIM.MAX_RESULTS}&addressdetails=1&accept-language=${API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE}`,
      {
        headers: getNominatimHeaders()
      }
    )

    if (response.ok) {
      const results: GeocodingResult[] = await response.json()
      console.log('✅ API Nominatim retornou:', results.length, 'resultados')
      
      if (results.length > 0) {
        const formattedResults = results
          .filter(result => {
            const type = result.type
            return type === 'city' || type === 'state' || type === 'country' || 
                   type === 'administrative' || type === 'municipality'
          })
          .map(result => {
            let locationType: 'city' | 'state' | 'country' = 'city'
            if (result.type === 'country') {
              locationType = 'country'
            } else if (result.type === 'state' || result.type === 'administrative') {
              locationType = 'state'
            }

            const parts = result.display_name.split(', ')
            const country = parts[parts.length - 1]
            const state = parts.length > 2 ? parts[parts.length - 2] : undefined

            return {
              id: `nominatim-${result.osm_type}-${result.osm_id}`,
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
          })
          .slice(0, 8)

        return formattedResults
      }
    } else {
      console.log('⚠️ API Nominatim falhou:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Erro na API Nominatim:', error)
  }

  // Fallback para dados locais se a API falhar
  console.log('🔄 Usando dados de fallback...')
  
  const allLocations = [
    ...fallbackCities.map(loc => ({ ...loc, id: `fallback-city-${loc.name.toLowerCase().replace(/\s+/g, '-')}` })),
    ...fallbackStates.map(loc => ({ ...loc, id: `fallback-state-${loc.name.toLowerCase().replace(/\s+/g, '-')}` })),
    ...fallbackCountries.map(loc => ({ ...loc, id: `fallback-country-${loc.name.toLowerCase().replace(/\s+/g, '-')}` }))
  ]

  const filteredResults = allLocations
    .filter(location => 
      location.name.toLowerCase().includes(searchTerm) ||
      location.country?.toLowerCase().includes(searchTerm) ||
      location.state?.toLowerCase().includes(searchTerm)
    )
    .map(location => ({
      id: location.id,
      name: location.name,
      type: location.type,
      displayName: location.state && location.country 
        ? `${location.name}, ${location.state}, ${location.country}`
        : location.country 
        ? `${location.name}, ${location.country}`
        : location.name,
      coordinates: location.coordinates,
      country: location.country,
      state: location.state
    }))
    .slice(0, 8)

  console.log('📍 Resultados de fallback:', filteredResults.length)
  return filteredResults

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

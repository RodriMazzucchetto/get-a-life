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

// Base de dados local com milhares de cidades do mundo
const worldCities = [
  // Brasil
  { name: 'Curitiba', country: 'Brasil', state: 'Paraná', lat: -25.4289, lon: -49.2671 },
  { name: 'São Paulo', country: 'Brasil', state: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brasil', state: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { name: 'Belo Horizonte', country: 'Brasil', state: 'Minas Gerais', lat: -19.9167, lon: -43.9345 },
  { name: 'Brasília', country: 'Brasil', state: 'Distrito Federal', lat: -15.7942, lon: -47.8822 },
  { name: 'Salvador', country: 'Brasil', state: 'Bahia', lat: -12.9714, lon: -38.5011 },
  { name: 'Fortaleza', country: 'Brasil', state: 'Ceará', lat: -3.7319, lon: -38.5267 },
  { name: 'Manaus', country: 'Brasil', state: 'Amazonas', lat: -3.1190, lon: -60.0217 },
  { name: 'Recife', country: 'Brasil', state: 'Pernambuco', lat: -8.0476, lon: -34.8770 },
  { name: 'Porto Alegre', country: 'Brasil', state: 'Rio Grande do Sul', lat: -30.0346, lon: -51.2177 },
  { name: 'Goiânia', country: 'Brasil', state: 'Goiás', lat: -16.6864, lon: -49.2653 },
  { name: 'Guarulhos', country: 'Brasil', state: 'São Paulo', lat: -23.4543, lon: -46.5339 },
  { name: 'Campinas', country: 'Brasil', state: 'São Paulo', lat: -22.9064, lon: -47.0616 },
  { name: 'Natal', country: 'Brasil', state: 'Rio Grande do Norte', lat: -5.7945, lon: -35.2090 },
  { name: 'Curitibanos', country: 'Brasil', state: 'Santa Catarina', lat: -27.2833, lon: -50.5833 },
  
  // Estados Unidos
  { name: 'New York', country: 'Estados Unidos', state: 'Nova York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'Estados Unidos', state: 'Califórnia', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', country: 'Estados Unidos', state: 'Illinois', lat: 41.8781, lon: -87.6298 },
  { name: 'Houston', country: 'Estados Unidos', state: 'Texas', lat: 29.7604, lon: -95.3698 },
  { name: 'Phoenix', country: 'Estados Unidos', state: 'Arizona', lat: 33.4484, lon: -112.0740 },
  { name: 'Philadelphia', country: 'Estados Unidos', state: 'Pensilvânia', lat: 39.9526, lon: -75.1652 },
  { name: 'San Antonio', country: 'Estados Unidos', state: 'Texas', lat: 29.4241, lon: -98.4936 },
  { name: 'San Diego', country: 'Estados Unidos', state: 'Califórnia', lat: 32.7157, lon: -117.1611 },
  { name: 'Dallas', country: 'Estados Unidos', state: 'Texas', lat: 32.7767, lon: -96.7970 },
  { name: 'San Jose', country: 'Estados Unidos', state: 'Califórnia', lat: 37.3382, lon: -121.8863 },
  
  // Europa
  { name: 'London', country: 'Reino Unido', state: 'Inglaterra', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'França', state: 'Île-de-France', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', country: 'Alemanha', state: 'Berlim', lat: 52.5200, lon: 13.4050 },
  { name: 'Madrid', country: 'Espanha', state: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', country: 'Itália', state: 'Lazio', lat: 41.9028, lon: 12.4964 },
  { name: 'Amsterdam', country: 'Países Baixos', state: 'Holanda do Norte', lat: 52.3676, lon: 4.9041 },
  { name: 'Barcelona', country: 'Espanha', state: 'Catalunha', lat: 41.3851, lon: 2.1734 },
  { name: 'Vienna', country: 'Áustria', state: 'Viena', lat: 48.2082, lon: 16.3738 },
  { name: 'Prague', country: 'República Tcheca', state: 'Praga', lat: 50.0755, lon: 14.4378 },
  { name: 'Budapest', country: 'Hungria', state: 'Budapeste', lat: 47.4979, lon: 19.0402 },
  { name: 'Warsaw', country: 'Polônia', state: 'Mazóvia', lat: 52.2297, lon: 21.0122 },
  { name: 'Stockholm', country: 'Suécia', state: 'Estocolmo', lat: 59.3293, lon: 18.0686 },
  { name: 'Copenhagen', country: 'Dinamarca', state: 'Hovedstaden', lat: 55.6761, lon: 12.5683 },
  { name: 'Oslo', country: 'Noruega', state: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'Helsinki', country: 'Finlândia', state: 'Uusimaa', lat: 60.1699, lon: 24.9384 },
  
  // Ásia
  { name: 'Tokyo', country: 'Japão', state: 'Tóquio', lat: 35.6762, lon: 139.6503 },
  { name: 'Seoul', country: 'Coreia do Sul', state: 'Seul', lat: 37.5665, lon: 126.9780 },
  { name: 'Beijing', country: 'China', state: 'Pequim', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', country: 'China', state: 'Xangai', lat: 31.2304, lon: 121.4737 },
  { name: 'Hong Kong', country: 'China', state: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Singapore', country: 'Singapura', state: 'Singapura', lat: 1.3521, lon: 103.8198 },
  { name: 'Bangkok', country: 'Tailândia', state: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Jakarta', country: 'Indonésia', state: 'Jacarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Kuala Lumpur', country: 'Malásia', state: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
  { name: 'Manila', country: 'Filipinas', state: 'Manila', lat: 14.5995, lon: 120.9842 },
  { name: 'Ho Chi Minh City', country: 'Vietnã', state: 'Ho Chi Minh', lat: 10.8231, lon: 106.6297 },
  { name: 'Hanoi', country: 'Vietnã', state: 'Hanoi', lat: 21.0285, lon: 105.8542 },
  { name: 'Phnom Penh', country: 'Camboja', state: 'Phnom Penh', lat: 11.5564, lon: 104.9282 },
  { name: 'Vientiane', country: 'Laos', state: 'Vientiane', lat: 17.9757, lon: 102.6331 },
  { name: 'Yangon', country: 'Myanmar', state: 'Yangon', lat: 16.8661, lon: 96.1951 },
  
  // América Latina
  { name: 'Mexico City', country: 'México', state: 'Cidade do México', lat: 19.4326, lon: -99.1332 },
  { name: 'Buenos Aires', country: 'Argentina', state: 'Buenos Aires', lat: -34.6118, lon: -58.3960 },
  { name: 'Santiago', country: 'Chile', state: 'Região Metropolitana', lat: -33.4489, lon: -70.6693 },
  { name: 'Lima', country: 'Peru', state: 'Lima', lat: -12.0464, lon: -77.0428 },
  { name: 'Bogota', country: 'Colômbia', state: 'Bogotá', lat: 4.7110, lon: -74.0721 },
  { name: 'Caracas', country: 'Venezuela', state: 'Distrito Capital', lat: 10.4806, lon: -66.9036 },
  { name: 'Quito', country: 'Equador', state: 'Pichincha', lat: -0.2299, lon: -78.5249 },
  { name: 'La Paz', country: 'Bolívia', state: 'La Paz', lat: -16.4897, lon: -68.1193 },
  { name: 'Asuncion', country: 'Paraguai', state: 'Asunción', lat: -25.2637, lon: -57.5759 },
  { name: 'Montevideo', country: 'Uruguai', state: 'Montevidéu', lat: -34.9011, lon: -56.1645 },
  { name: 'Havana', country: 'Cuba', state: 'Havana', lat: 23.1136, lon: -82.3666 },
  { name: 'Santo Domingo', country: 'República Dominicana', state: 'Distrito Nacional', lat: 18.4861, lon: -69.9312 },
  { name: 'San Juan', country: 'Porto Rico', state: 'San Juan', lat: 18.4655, lon: -66.1057 },
  { name: 'Panama City', country: 'Panamá', state: 'Panamá', lat: 8.5380, lon: -80.7821 },
  { name: 'San Jose', country: 'Costa Rica', state: 'San José', lat: 9.9281, lon: -84.0907 },
  
  // África
  { name: 'Cairo', country: 'Egito', state: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Lagos', country: 'Nigéria', state: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Kinshasa', country: 'República Democrática do Congo', state: 'Kinshasa', lat: -4.4419, lon: 15.2663 },
  { name: 'Johannesburg', country: 'África do Sul', state: 'Gauteng', lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', country: 'África do Sul', state: 'Cabo Ocidental', lat: -33.9249, lon: 18.4241 },
  { name: 'Nairobi', country: 'Quênia', state: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { name: 'Addis Ababa', country: 'Etiópia', state: 'Adis Abeba', lat: 9.0320, lon: 38.7636 },
  { name: 'Casablanca', country: 'Marrocos', state: 'Casablanca-Settat', lat: 33.5731, lon: -7.5898 },
  { name: 'Algiers', country: 'Argélia', state: 'Argel', lat: 36.7538, lon: 3.0588 },
  { name: 'Tunis', country: 'Tunísia', state: 'Túnis', lat: 36.8065, lon: 10.1815 },
  { name: 'Tripoli', country: 'Líbia', state: 'Trípoli', lat: 32.8872, lon: 13.1913 },
  { name: 'Khartoum', country: 'Sudão', state: 'Cartum', lat: 15.5007, lon: 32.5599 },
  { name: 'Dar es Salaam', country: 'Tanzânia', state: 'Dar es Salaam', lat: -6.8230, lon: 39.2695 },
  { name: 'Accra', country: 'Gana', state: 'Grande Acra', lat: 5.5600, lon: -0.2057 },
  { name: 'Dakar', country: 'Senegal', state: 'Dakar', lat: 14.7167, lon: -17.4677 },
  
  // Oceania
  { name: 'Sydney', country: 'Austrália', state: 'Nova Gales do Sul', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', country: 'Austrália', state: 'Vitória', lat: -37.8136, lon: 144.9631 },
  { name: 'Brisbane', country: 'Austrália', state: 'Queensland', lat: -27.4698, lon: 153.0251 },
  { name: 'Perth', country: 'Austrália', state: 'Austrália Ocidental', lat: -31.9505, lon: 115.8605 },
  { name: 'Adelaide', country: 'Austrália', state: 'Austrália Meridional', lat: -34.9285, lon: 138.6007 },
  { name: 'Auckland', country: 'Nova Zelândia', state: 'Auckland', lat: -36.8485, lon: 174.7633 },
  { name: 'Wellington', country: 'Nova Zelândia', state: 'Wellington', lat: -41.2866, lon: 174.7756 },
  { name: 'Port Moresby', country: 'Papua Nova Guiné', state: 'Port Moresby', lat: -9.4438, lon: 147.1803 },
  { name: 'Suva', country: 'Fiji', state: 'Central', lat: -18.1416, lon: 178.4419 },
  { name: 'Noumea', country: 'Nova Caledônia', state: 'Nova Caledônia', lat: -22.2558, lon: 166.4505 },
  
  // Canadá
  { name: 'Toronto', country: 'Canadá', state: 'Ontário', lat: 43.6532, lon: -79.3832 },
  { name: 'Montreal', country: 'Canadá', state: 'Quebec', lat: 45.5017, lon: -73.5673 },
  { name: 'Vancouver', country: 'Canadá', state: 'Colúmbia Britânica', lat: 49.2827, lon: -123.1207 },
  { name: 'Calgary', country: 'Canadá', state: 'Alberta', lat: 51.0447, lon: -114.0719 },
  { name: 'Edmonton', country: 'Canadá', state: 'Alberta', lat: 53.5461, lon: -113.4938 },
  { name: 'Ottawa', country: 'Canadá', state: 'Ontário', lat: 45.4215, lon: -75.6972 },
  { name: 'Winnipeg', country: 'Canadá', state: 'Manitoba', lat: 49.8951, lon: -97.1384 },
  { name: 'Quebec City', country: 'Canadá', state: 'Quebec', lat: 46.8139, lon: -71.2080 },
  { name: 'Halifax', country: 'Canadá', state: 'Nova Escócia', lat: 44.6488, lon: -63.5752 },
  { name: 'Victoria', country: 'Canadá', state: 'Colúmbia Britânica', lat: 48.4284, lon: -123.3656 }
]

export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  console.log('🔍 Buscando cidades para:', searchTerm)

  try {
    // Primeiro, tentar com a API do Nominatim
    console.log('🌐 Tentando API Nominatim...')
    const response = await fetch(
      `${API_CONFIG.NOMINATIM.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=20&addressdetails=1&accept-language=${API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE}&featuretype=city`,
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
            const type = result.type
            return type === 'city' || type === 'municipality' || type === 'town' || 
                   (type === 'administrative' && result.class === 'place')
          })
          .map(result => {
            const parts = result.display_name.split(', ')
            const cityName = parts[0]
            const country = parts[parts.length - 1]
            const state = parts.length > 2 ? parts[parts.length - 2] : undefined

            return {
              id: `nominatim-${result.osm_type}-${result.osm_id}`,
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
          .slice(0, 15)

        console.log('🏙️ Cidades da API:', cityResults.length)
        return cityResults
      }
    } else {
      console.log('⚠️ API falhou:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Erro na API:', error)
  }

  // Fallback para base de dados local
  console.log('🔄 Usando base de dados local...')
  
  const localResults = worldCities
    .filter(city => 
      city.name.toLowerCase().includes(searchTerm) ||
      city.country.toLowerCase().includes(searchTerm) ||
      city.state?.toLowerCase().includes(searchTerm)
    )
    .map(city => ({
      id: `local-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: city.name,
      type: 'city' as const,
      displayName: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`,
      coordinates: {
        lat: city.lat,
        lon: city.lon
      },
      country: city.country,
      state: city.state
    }))
    .slice(0, 15)

  console.log('📍 Cidades locais encontradas:', localResults.length)
  return localResults
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

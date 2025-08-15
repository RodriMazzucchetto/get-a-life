// Configurações para APIs externas
export const API_CONFIG = {
  // Nominatim (OpenStreetMap) - API gratuita para geocoding
  NOMINATIM: {
    BASE_URL: 'https://nominatim.openstreetmap.org',
    USER_AGENT: 'GetALifeApp/1.0',
    ACCEPT_LANGUAGE: 'pt-BR,en',
    RATE_LIMIT: 1000, // ms entre requisições
    MAX_RESULTS: 10
  },
  
  // Outras APIs podem ser adicionadas aqui
}

// Headers padrão para requisições à API do Nominatim
export const getNominatimHeaders = () => ({
  'Accept-Language': API_CONFIG.NOMINATIM.ACCEPT_LANGUAGE,
  'User-Agent': API_CONFIG.NOMINATIM.USER_AGENT
})

// Função para adicionar delay entre requisições (respeitar rate limit)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

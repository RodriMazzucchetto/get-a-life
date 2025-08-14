'use client'

import { useState, useEffect } from 'react'
import TravelMap from '@/components/TravelMap/TravelMap'

interface Country {
  id: string
  name: string
  continent: string
  visited: boolean
}

export default function TravelsPage() {
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  // Lista completa de países com continentes
  const allCountries: Country[] = [
    // América do Norte
    { id: 'US', name: 'Estados Unidos', continent: 'América do Norte', visited: false },
    { id: 'CA', name: 'Canadá', continent: 'América do Norte', visited: false },
    { id: 'MX', name: 'México', continent: 'América do Norte', visited: false },
    
    // América do Sul
    { id: 'BR', name: 'Brasil', continent: 'América do Sul', visited: false },
    { id: 'AR', name: 'Argentina', continent: 'América do Sul', visited: false },
    { id: 'CL', name: 'Chile', continent: 'América do Sul', visited: false },
    { id: 'PE', name: 'Peru', continent: 'América do Sul', visited: false },
    { id: 'CO', name: 'Colômbia', continent: 'América do Sul', visited: false },
    { id: 'VE', name: 'Venezuela', continent: 'América do Sul', visited: false },
    { id: 'EC', name: 'Equador', continent: 'América do Sul', visited: false },
    { id: 'BO', name: 'Bolívia', continent: 'América do Sul', visited: false },
    { id: 'PY', name: 'Paraguai', continent: 'América do Sul', visited: false },
    { id: 'UY', name: 'Uruguai', continent: 'América do Sul', visited: false },
    { id: 'GY', name: 'Guiana', continent: 'América do Sul', visited: false },
    { id: 'SR', name: 'Suriname', continent: 'América do Sul', visited: false },
    
    // Europa
    { id: 'FR', name: 'França', continent: 'Europa', visited: false },
    { id: 'DE', name: 'Alemanha', continent: 'Europa', visited: false },
    { id: 'IT', name: 'Itália', continent: 'Europa', visited: false },
    { id: 'ES', name: 'Espanha', continent: 'Europa', visited: false },
    { id: 'GB', name: 'Reino Unido', continent: 'Europa', visited: false },
    { id: 'PT', name: 'Portugal', continent: 'Europa', visited: false },
    { id: 'NL', name: 'Países Baixos', continent: 'Europa', visited: false },
    { id: 'BE', name: 'Bélgica', continent: 'Europa', visited: false },
    { id: 'CH', name: 'Suíça', continent: 'Europa', visited: false },
    { id: 'AT', name: 'Áustria', continent: 'Europa', visited: false },
    { id: 'SE', name: 'Suécia', continent: 'Europa', visited: false },
    { id: 'NO', name: 'Noruega', continent: 'Europa', visited: false },
    { id: 'DK', name: 'Dinamarca', continent: 'Europa', visited: false },
    { id: 'FI', name: 'Finlândia', continent: 'Europa', visited: false },
    { id: 'PL', name: 'Polônia', continent: 'Europa', visited: false },
    { id: 'CZ', name: 'República Tcheca', continent: 'Europa', visited: false },
    { id: 'HU', name: 'Hungria', continent: 'Europa', visited: false },
    { id: 'RO', name: 'Romênia', continent: 'Europa', visited: false },
    { id: 'BG', name: 'Bulgária', continent: 'Europa', visited: false },
    { id: 'GR', name: 'Grécia', continent: 'Europa', visited: false },
    { id: 'HR', name: 'Croácia', continent: 'Europa', visited: false },
    { id: 'RS', name: 'Sérvia', continent: 'Europa', visited: false },
    { id: 'SI', name: 'Eslovênia', continent: 'Europa', visited: false },
    { id: 'SK', name: 'Eslováquia', continent: 'Europa', visited: false },
    { id: 'LT', name: 'Lituânia', continent: 'Europa', visited: false },
    { id: 'LV', name: 'Letônia', continent: 'Europa', visited: false },
    { id: 'EE', name: 'Estônia', continent: 'Europa', visited: false },
    { id: 'IE', name: 'Irlanda', continent: 'Europa', visited: false },
    { id: 'IS', name: 'Islândia', continent: 'Europa', visited: false },
    
    // Ásia
    { id: 'CN', name: 'China', continent: 'Ásia', visited: false },
    { id: 'JP', name: 'Japão', continent: 'Ásia', visited: false },
    { id: 'IN', name: 'Índia', continent: 'Ásia', visited: false },
    { id: 'KR', name: 'Coreia do Sul', continent: 'Ásia', visited: false },
    { id: 'TH', name: 'Tailândia', continent: 'Ásia', visited: false },
    { id: 'VN', name: 'Vietnã', continent: 'Ásia', visited: false },
    { id: 'MY', name: 'Malásia', continent: 'Ásia', visited: false },
    { id: 'SG', name: 'Singapura', continent: 'Ásia', visited: false },
    { id: 'ID', name: 'Indonésia', continent: 'Ásia', visited: false },
    { id: 'PH', name: 'Filipinas', continent: 'Ásia', visited: false },
    { id: 'TW', name: 'Taiwan', continent: 'Ásia', visited: false },
    { id: 'HK', name: 'Hong Kong', continent: 'Ásia', visited: false },
    { id: 'MO', name: 'Macau', continent: 'Ásia', visited: false },
    { id: 'MM', name: 'Mianmar', continent: 'Ásia', visited: false },
    { id: 'LA', name: 'Laos', continent: 'Ásia', visited: false },
    { id: 'KH', name: 'Camboja', continent: 'Ásia', visited: false },
    { id: 'BD', name: 'Bangladesh', continent: 'Ásia', visited: false },
    { id: 'LK', name: 'Sri Lanka', continent: 'Ásia', visited: false },
    { id: 'NP', name: 'Nepal', continent: 'Ásia', visited: false },
    { id: 'BT', name: 'Butão', continent: 'Ásia', visited: false },
    { id: 'MN', name: 'Mongólia', continent: 'Ásia', visited: false },
    { id: 'KZ', name: 'Cazaquistão', continent: 'Ásia', visited: false },
    { id: 'UZ', name: 'Uzbequistão', continent: 'Ásia', visited: false },
    { id: 'KG', name: 'Quirguistão', continent: 'Ásia', visited: false },
    { id: 'TJ', name: 'Tajiquistão', continent: 'Ásia', visited: false },
    { id: 'TM', name: 'Turcomenistão', continent: 'Ásia', visited: false },
    { id: 'AF', name: 'Afeganistão', continent: 'Ásia', visited: false },
    { id: 'PK', name: 'Paquistão', continent: 'Ásia', visited: false },
    { id: 'IR', name: 'Irã', continent: 'Ásia', visited: false },
    { id: 'IQ', name: 'Iraque', continent: 'Ásia', visited: false },
    { id: 'SY', name: 'Síria', continent: 'Ásia', visited: false },
    { id: 'LB', name: 'Líbano', continent: 'Ásia', visited: false },
    { id: 'JO', name: 'Jordânia', continent: 'Ásia', visited: false },
    { id: 'IL', name: 'Israel', continent: 'Ásia', visited: false },
    { id: 'PS', name: 'Palestina', continent: 'Ásia', visited: false },
    { id: 'SA', name: 'Arábia Saudita', continent: 'Ásia', visited: false },
    { id: 'AE', name: 'Emirados Árabes Unidos', continent: 'Ásia', visited: false },
    { id: 'QA', name: 'Catar', continent: 'Ásia', visited: false },
    { id: 'KW', name: 'Kuwait', continent: 'Ásia', visited: false },
    { id: 'BH', name: 'Bahrain', continent: 'Ásia', visited: false },
    { id: 'OM', name: 'Omã', continent: 'Ásia', visited: false },
    { id: 'YE', name: 'Iêmen', continent: 'Ásia', visited: false },
    { id: 'TR', name: 'Turquia', continent: 'Ásia', visited: false },
    { id: 'CY', name: 'Chipre', continent: 'Ásia', visited: false },
    { id: 'GE', name: 'Geórgia', continent: 'Ásia', visited: false },
    { id: 'AM', name: 'Armênia', continent: 'Ásia', visited: false },
    { id: 'AZ', name: 'Azerbaijão', continent: 'Ásia', visited: false },
    
    // África
    { id: 'ZA', name: 'África do Sul', continent: 'África', visited: false },
    { id: 'EG', name: 'Egito', continent: 'África', visited: false },
    { id: 'NG', name: 'Nigéria', continent: 'África', visited: false },
    { id: 'KE', name: 'Quênia', continent: 'África', visited: false },
    { id: 'ET', name: 'Etiópia', continent: 'África', visited: false },
    { id: 'TZ', name: 'Tanzânia', continent: 'África', visited: false },
    { id: 'UG', name: 'Uganda', continent: 'África', visited: false },
    { id: 'GH', name: 'Gana', continent: 'África', visited: false },
    { id: 'CI', name: 'Costa do Marfim', continent: 'África', visited: false },
    { id: 'SN', name: 'Senegal', continent: 'África', visited: false },
    { id: 'ML', name: 'Mali', continent: 'África', visited: false },
    { id: 'BF', name: 'Burkina Faso', continent: 'África', visited: false },
    { id: 'NE', name: 'Níger', continent: 'África', visited: false },
    { id: 'TD', name: 'Chade', continent: 'África', visited: false },
    { id: 'SD', name: 'Sudão', continent: 'África', visited: false },
    { id: 'LY', name: 'Líbia', continent: 'África', visited: false },
    { id: 'TN', name: 'Tunísia', continent: 'África', visited: false },
    { id: 'DZ', name: 'Argélia', continent: 'África', visited: false },
    { id: 'MA', name: 'Marrocos', continent: 'África', visited: false },
    { id: 'AO', name: 'Angola', continent: 'África', visited: false },
    { id: 'CD', name: 'República Democrática do Congo', continent: 'África', visited: false },
    { id: 'CG', name: 'República do Congo', continent: 'África', visited: false },
    { id: 'GA', name: 'Gabão', continent: 'África', visited: false },
    { id: 'CM', name: 'Camarões', continent: 'África', visited: false },
    { id: 'CF', name: 'República Centro-Africana', continent: 'África', visited: false },
    { id: 'GQ', name: 'Guiné Equatorial', continent: 'África', visited: false },
    { id: 'ST', name: 'São Tomé e Príncipe', continent: 'África', visited: false },
    { id: 'GW', name: 'Guiné-Bissau', continent: 'África', visited: false },
    { id: 'GN', name: 'Guiné', continent: 'África', visited: false },
    { id: 'SL', name: 'Serra Leoa', continent: 'África', visited: false },
    { id: 'LR', name: 'Libéria', continent: 'África', visited: false },
    { id: 'TG', name: 'Togo', continent: 'África', visited: false },
    { id: 'BJ', name: 'Benin', continent: 'África', visited: false },
    { id: 'MR', name: 'Mauritânia', continent: 'África', visited: false },
    { id: 'EH', name: 'Saara Ocidental', continent: 'África', visited: false },
    { id: 'CV', name: 'Cabo Verde', continent: 'África', visited: false },
    { id: 'GM', name: 'Gâmbia', continent: 'África', visited: false },
    { id: 'DJ', name: 'Djibouti', continent: 'África', visited: false },
    { id: 'SO', name: 'Somália', continent: 'África', visited: false },
    { id: 'ER', name: 'Eritreia', continent: 'África', visited: false },
    { id: 'SS', name: 'Sudão do Sul', continent: 'África', visited: false },
    { id: 'CF', name: 'República Centro-Africana', continent: 'África', visited: false },
    { id: 'SS', name: 'Sudão do Sul', continent: 'África', visited: false },
    { id: 'BI', name: 'Burundi', continent: 'África', visited: false },
    { id: 'RW', name: 'Ruanda', continent: 'África', visited: false },
    { id: 'MG', name: 'Madagascar', continent: 'África', visited: false },
    { id: 'MU', name: 'Maurício', continent: 'África', visited: false },
    { id: 'SC', name: 'Seychelles', continent: 'África', visited: false },
    { id: 'KM', name: 'Comores', continent: 'África', visited: false },
    { id: 'YT', name: 'Mayotte', continent: 'África', visited: false },
    { id: 'RE', name: 'Reunião', continent: 'África', visited: false },
    
    // Oceania
    { id: 'AU', name: 'Austrália', continent: 'Oceania', visited: false },
    { id: 'NZ', name: 'Nova Zelândia', continent: 'Oceania', visited: false },
    { id: 'FJ', name: 'Fiji', continent: 'Oceania', visited: false },
    { id: 'PG', name: 'Papua Nova Guiné', continent: 'Oceania', visited: false },
    { id: 'NC', name: 'Nova Caledônia', continent: 'Oceania', visited: false },
    { id: 'VU', name: 'Vanuatu', continent: 'Oceania', visited: false },
    { id: 'SB', name: 'Ilhas Salomão', continent: 'Oceania', visited: false },
    { id: 'TO', name: 'Tonga', continent: 'Oceania', visited: false },
    { id: 'WS', name: 'Samoa', continent: 'Oceania', visited: false },
    { id: 'KI', name: 'Kiribati', continent: 'Oceania', visited: false },
    { id: 'TV', name: 'Tuvalu', continent: 'Oceania', visited: false },
    { id: 'NR', name: 'Nauru', continent: 'Oceania', visited: false },
    { id: 'PW', name: 'Palau', continent: 'Oceania', visited: false },
    { id: 'MH', name: 'Ilhas Marshall', continent: 'Oceania', visited: false },
    { id: 'FM', name: 'Micronésia', continent: 'Oceania', visited: false },
    { id: 'CK', name: 'Ilhas Cook', continent: 'Oceania', visited: false },
    { id: 'NU', name: 'Niue', continent: 'Oceania', visited: false },
    { id: 'TK', name: 'Tokelau', continent: 'Oceania', visited: false },
    { id: 'AS', name: 'Samoa Americana', continent: 'Oceania', visited: false },
    { id: 'GU', name: 'Guam', continent: 'Oceania', visited: false },
    { id: 'MP', name: 'Ilhas Marianas do Norte', continent: 'Oceania', visited: false },
    { id: 'PF', name: 'Polinésia Francesa', continent: 'Oceania', visited: false },
    { id: 'WF', name: 'Wallis e Futuna', continent: 'Oceania', visited: false },
    { id: 'TK', name: 'Tokelau', continent: 'Oceania', visited: false },
    { id: 'NU', name: 'Niue', continent: 'Oceania', visited: false },
    { id: 'CK', name: 'Ilhas Cook', continent: 'Oceania', visited: false },
    { id: 'TV', name: 'Tuvalu', continent: 'Oceania', visited: false },
    { id: 'NR', name: 'Nauru', continent: 'Oceania', visited: false },
    { id: 'PW', name: 'Palau', continent: 'Oceania', visited: false },
    { id: 'MH', name: 'Ilhas Marshall', continent: 'Oceania', visited: false },
    { id: 'FM', name: 'Micronésia', continent: 'Oceania', visited: false },
    { id: 'KI', name: 'Kiribati', continent: 'Oceania', visited: false },
    { id: 'WS', name: 'Samoa', continent: 'Oceania', visited: false },
    { id: 'TO', name: 'Tonga', continent: 'Oceania', visited: false },
    { id: 'SB', name: 'Ilhas Salomão', continent: 'Oceania', visited: false },
    { id: 'VU', name: 'Vanuatu', continent: 'Oceania', visited: false },
    { id: 'NC', name: 'Nova Caledônia', continent: 'Oceania', visited: false },
    { id: 'PG', name: 'Papua Nova Guiné', continent: 'Oceania', visited: false },
    { id: 'FJ', name: 'Fiji', continent: 'Oceania', visited: false },
    { id: 'NZ', name: 'Nova Zelândia', continent: 'Oceania', visited: false },
    { id: 'AU', name: 'Austrália', continent: 'Oceania', visited: false }
  ]

  useEffect(() => {
    // Simular carregamento
    setLoading(false)
    setCountries(allCountries)
  }, [])

  const handlePlaceToggle = (placeId: string) => {
    setVisitedPlaces(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    )
  }

  const getContinentStats = () => {
    const stats: { [key: string]: { total: number; visited: number } } = {}
    
    countries.forEach(country => {
      if (!stats[country.continent]) {
        stats[country.continent] = { total: 0, visited: 0 }
      }
      stats[country.continent].total++
      if (visitedPlaces.includes(country.id)) {
        stats[country.continent].visited++
      }
    })
    
    return stats
  }

  const continentStats = getContinentStats()

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✈️ Viagens</h1>
        <p className="text-gray-600 mt-2">
          Marque os lugares que você já visitou e planeje suas próximas aventuras
        </p>
      </div>

      {/* Mapa Interativo */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🌍 Mapa de Viagens</h2>
        <TravelMap 
          visitedPlaces={visitedPlaces}
          onPlaceToggle={handlePlaceToggle}
        />
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Países Visitados</p>
              <p className="text-2xl font-bold text-gray-900">{visitedPlaces.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Porcentagem do Mundo</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((visitedPlaces.length / countries.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Países</p>
              <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Meta Sugerida</p>
              <p className="text-lg font-medium text-gray-900">25 países</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas por Continente */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Estatísticas por Continente</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(continentStats).map(([continent, stats]) => (
              <div key={continent} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{continent}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {stats.visited} de {stats.total} países
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round((stats.visited / stats.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.visited / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Lugares Visitados */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lugares Visitados</h3>
        </div>
        <div className="p-6">
          {visitedPlaces.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500">
                Clique nos países no mapa para marcar como visitados!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visitedPlaces.map(placeId => {
                const country = countries.find(c => c.id === placeId)
                return (
                  <div
                    key={placeId}
                    className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <span className="text-green-600 font-medium text-sm">{placeId}</span>
                    {country && (
                      <span className="text-xs text-green-500 mt-1">{country.name}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

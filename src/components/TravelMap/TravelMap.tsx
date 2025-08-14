'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Importação dinâmica para evitar problemas de SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
)

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface Country {
  id: string
  name: string
  coordinates: [number, number]
  visited: boolean
}

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const [isClient, setIsClient] = useState(false)

  // Lista completa de países com coordenadas reais
  const countries: Country[] = [
    // América do Norte
    { id: 'US', name: 'Estados Unidos', coordinates: [39.8283, -98.5795], visited: false },
    { id: 'CA', name: 'Canadá', coordinates: [56.1304, -106.3468], visited: false },
    { id: 'MX', name: 'México', coordinates: [23.6345, -102.5528], visited: false },
    
    // América do Sul
    { id: 'BR', name: 'Brasil', coordinates: [-14.2350, -51.9253], visited: false },
    { id: 'AR', name: 'Argentina', coordinates: [-38.4161, -63.6167], visited: false },
    { id: 'CL', name: 'Chile', coordinates: [-35.6751, -71.5430], visited: false },
    { id: 'PE', name: 'Peru', coordinates: [-9.1900, -75.0152], visited: false },
    { id: 'CO', name: 'Colômbia', coordinates: [4.5709, -74.2973], visited: false },
    { id: 'VE', name: 'Venezuela', coordinates: [6.4238, -66.5897], visited: false },
    { id: 'EC', name: 'Equador', coordinates: [-1.8312, -78.1834], visited: false },
    { id: 'BO', name: 'Bolívia', coordinates: [-16.2902, -63.5887], visited: false },
    { id: 'PY', name: 'Paraguai', coordinates: [-23.4425, -58.4438], visited: false },
    { id: 'UY', name: 'Uruguai', coordinates: [-32.5228, -55.7658], visited: false },
    { id: 'GY', name: 'Guiana', coordinates: [4.8604, -58.9302], visited: false },
    { id: 'SR', name: 'Suriname', coordinates: [3.9193, -56.0278], visited: false },
    
    // Europa
    { id: 'FR', name: 'França', coordinates: [46.2276, 2.2137], visited: false },
    { id: 'DE', name: 'Alemanha', coordinates: [51.1657, 10.4515], visited: false },
    { id: 'IT', name: 'Itália', coordinates: [41.8719, 12.5674], visited: false },
    { id: 'ES', name: 'Espanha', coordinates: [40.4637, -3.7492], visited: false },
    { id: 'GB', name: 'Reino Unido', coordinates: [55.3781, -3.4360], visited: false },
    { id: 'PT', name: 'Portugal', coordinates: [39.3999, -8.2245], visited: false },
    { id: 'NL', name: 'Países Baixos', coordinates: [52.1326, 5.2913], visited: false },
    { id: 'BE', name: 'Bélgica', coordinates: [50.8503, 4.3517], visited: false },
    { id: 'CH', name: 'Suíça', coordinates: [46.8182, 8.2275], visited: false },
    { id: 'AT', name: 'Áustria', coordinates: [47.5162, 14.5501], visited: false },
    { id: 'SE', name: 'Suécia', coordinates: [60.1282, 18.6435], visited: false },
    { id: 'NO', name: 'Noruega', coordinates: [60.4720, 8.4689], visited: false },
    { id: 'DK', name: 'Dinamarca', coordinates: [56.2639, 9.5018], visited: false },
    { id: 'FI', name: 'Finlândia', coordinates: [61.9241, 25.7482], visited: false },
    { id: 'PL', name: 'Polônia', coordinates: [51.9194, 19.1451], visited: false },
    { id: 'CZ', name: 'República Tcheca', coordinates: [49.8175, 15.4730], visited: false },
    { id: 'HU', name: 'Hungria', coordinates: [47.1625, 19.5033], visited: false },
    { id: 'RO', name: 'Romênia', coordinates: [45.9432, 24.9668], visited: false },
    { id: 'BG', name: 'Bulgária', coordinates: [42.7339, 25.4858], visited: false },
    { id: 'GR', name: 'Grécia', coordinates: [39.0742, 21.8243], visited: false },
    { id: 'HR', name: 'Croácia', coordinates: [45.1000, 15.2000], visited: false },
    { id: 'RS', name: 'Sérvia', coordinates: [44.0165, 21.0059], visited: false },
    { id: 'SI', name: 'Eslovênia', coordinates: [46.1512, 14.9955], visited: false },
    { id: 'SK', name: 'Eslováquia', coordinates: [48.6690, 19.6990], visited: false },
    { id: 'LT', name: 'Lituânia', coordinates: [55.1694, 23.8813], visited: false },
    { id: 'LV', name: 'Letônia', coordinates: [56.8796, 24.6032], visited: false },
    { id: 'EE', name: 'Estônia', coordinates: [58.5953, 25.0136], visited: false },
    { id: 'IE', name: 'Irlanda', coordinates: [53.4129, -8.2439], visited: false },
    { id: 'IS', name: 'Islândia', coordinates: [64.9631, -19.0208], visited: false },
    
    // Ásia
    { id: 'CN', name: 'China', coordinates: [35.8617, 104.1954], visited: false },
    { id: 'JP', name: 'Japão', coordinates: [36.2048, 138.2529], visited: false },
    { id: 'IN', name: 'Índia', coordinates: [20.5937, 78.9629], visited: false },
    { id: 'KR', name: 'Coreia do Sul', coordinates: [35.9078, 127.7669], visited: false },
    { id: 'TH', name: 'Tailândia', coordinates: [15.8700, 100.9925], visited: false },
    { id: 'VN', name: 'Vietnã', coordinates: [14.0583, 108.2772], visited: false },
    { id: 'MY', name: 'Malásia', coordinates: [4.2105, 108.9758], visited: false },
    { id: 'SG', name: 'Singapura', coordinates: [1.3521, 103.8198], visited: false },
    { id: 'ID', name: 'Indonésia', coordinates: [-0.7893, 113.9213], visited: false },
    { id: 'PH', name: 'Filipinas', coordinates: [12.8797, 121.7740], visited: false },
    { id: 'TW', name: 'Taiwan', coordinates: [23.6978, 120.9605], visited: false },
    { id: 'HK', name: 'Hong Kong', coordinates: [22.3193, 114.1694], visited: false },
    { id: 'MO', name: 'Macau', coordinates: [22.1987, 113.5439], visited: false },
    { id: 'MM', name: 'Mianmar', coordinates: [21.9162, 95.9560], visited: false },
    { id: 'LA', name: 'Laos', coordinates: [19.8563, 102.4955], visited: false },
    { id: 'KH', name: 'Camboja', coordinates: [12.5657, 104.9910], visited: false },
    { id: 'BD', name: 'Bangladesh', coordinates: [23.6850, 90.3563], visited: false },
    { id: 'LK', name: 'Sri Lanka', coordinates: [7.8731, 80.7718], visited: false },
    { id: 'NP', name: 'Nepal', coordinates: [28.3949, 84.1240], visited: false },
    { id: 'BT', name: 'Butão', coordinates: [27.5142, 90.4336], visited: false },
    { id: 'MN', name: 'Mongólia', coordinates: [46.8625, 103.8467], visited: false },
    { id: 'KZ', name: 'Cazaquistão', coordinates: [48.0196, 66.9237], visited: false },
    { id: 'UZ', name: 'Uzbequistão', coordinates: [41.3775, 64.5853], visited: false },
    { id: 'KG', name: 'Quirguistão', coordinates: [41.2044, 74.7661], visited: false },
    { id: 'TJ', name: 'Tajiquistão', coordinates: [38.5358, 71.3645], visited: false },
    { id: 'TM', name: 'Turcomenistão', coordinates: [38.9697, 59.5563], visited: false },
    { id: 'AF', name: 'Afeganistão', coordinates: [33.9391, 67.7100], visited: false },
    { id: 'PK', name: 'Paquistão', coordinates: [30.3753, 69.3451], visited: false },
    { id: 'IR', name: 'Irã', coordinates: [32.4279, 53.6880], visited: false },
    { id: 'IQ', name: 'Iraque', coordinates: [33.2232, 43.6793], visited: false },
    { id: 'SY', name: 'Síria', coordinates: [34.8021, 38.9968], visited: false },
    { id: 'LB', name: 'Líbano', coordinates: [33.8547, 35.8623], visited: false },
    { id: 'JO', name: 'Jordânia', coordinates: [30.5852, 36.2384], visited: false },
    { id: 'IL', name: 'Israel', coordinates: [31.0461, 34.8516], visited: false },
    { id: 'PS', name: 'Palestina', coordinates: [31.9522, 35.2332], visited: false },
    { id: 'SA', name: 'Arábia Saudita', coordinates: [23.8859, 45.0792], visited: false },
    { id: 'AE', name: 'Emirados Árabes Unidos', coordinates: [24.0000, 54.0000], visited: false },
    { id: 'QA', name: 'Catar', coordinates: [25.3548, 51.1839], visited: false },
    { id: 'KW', name: 'Kuwait', coordinates: [29.3117, 47.4818], visited: false },
    { id: 'BH', name: 'Bahrain', coordinates: [26.0667, 50.5577], visited: false },
    { id: 'OM', name: 'Omã', coordinates: [21.4735, 55.9754], visited: false },
    { id: 'YE', name: 'Iêmen', coordinates: [15.5527, 48.5164], visited: false },
    { id: 'TR', name: 'Turquia', coordinates: [38.9637, 35.2433], visited: false },
    { id: 'CY', name: 'Chipre', coordinates: [35.1264, 33.4299], visited: false },
    { id: 'GE', name: 'Geórgia', coordinates: [42.3154, 43.3569], visited: false },
    { id: 'AM', name: 'Armênia', coordinates: [40.0691, 45.0382], visited: false },
    { id: 'AZ', name: 'Azerbaijão', coordinates: [40.1431, 47.5769], visited: false },
    
    // África
    { id: 'ZA', name: 'África do Sul', coordinates: [-30.5595, 22.9375], visited: false },
    { id: 'EG', name: 'Egito', coordinates: [26.8206, 30.8025], visited: false },
    { id: 'NG', name: 'Nigéria', coordinates: [9.0820, 8.6753], visited: false },
    { id: 'KE', name: 'Quênia', coordinates: [-0.0236, 37.9062], visited: false },
    { id: 'ET', name: 'Etiópia', coordinates: [9.1450, 40.4897], visited: false },
    { id: 'TZ', name: 'Tanzânia', coordinates: [-6.3690, 34.8888], visited: false },
    { id: 'UG', name: 'Uganda', coordinates: [1.3733, 32.2903], visited: false },
    { id: 'GH', name: 'Gana', coordinates: [7.9465, -1.0232], visited: false },
    { id: 'CI', name: 'Costa do Marfim', coordinates: [7.5400, -5.5471], visited: false },
    { id: 'SN', name: 'Senegal', coordinates: [14.4974, -14.4524], visited: false },
    { id: 'ML', name: 'Mali', coordinates: [17.5707, -3.9962], visited: false },
    { id: 'BF', name: 'Burkina Faso', coordinates: [12.2383, -1.5616], visited: false },
    { id: 'NE', name: 'Níger', coordinates: [17.6078, 8.0817], visited: false },
    { id: 'TD', name: 'Chade', coordinates: [15.4542, 18.7322], visited: false },
    { id: 'SD', name: 'Sudão', coordinates: [12.8628, 30.2176], visited: false },
    { id: 'LY', name: 'Líbia', coordinates: [26.3351, 17.2283], visited: false },
    { id: 'TN', name: 'Tunísia', coordinates: [33.8869, 9.5375], visited: false },
    { id: 'DZ', name: 'Argélia', coordinates: [28.0339, 1.6596], visited: false },
    { id: 'MA', name: 'Marrocos', coordinates: [31.7917, -7.0926], visited: false },
    { id: 'AO', name: 'Angola', coordinates: [-11.2027, 17.8739], visited: false },
    { id: 'CD', name: 'República Democrática do Congo', coordinates: [-4.0383, 21.7587], visited: false },
    { id: 'CG', name: 'República do Congo', coordinates: [-0.2280, 15.8277], visited: false },
    { id: 'GA', name: 'Gabão', coordinates: [-0.8037, 11.6094], visited: false },
    { id: 'CM', name: 'Camarões', coordinates: [7.3697, 12.3547], visited: false },
    { id: 'CF', name: 'República Centro-Africana', coordinates: [6.6111, 20.9394], visited: false },
    { id: 'GQ', name: 'Guiné Equatorial', coordinates: [1.6508, 10.2679], visited: false },
    { id: 'ST', name: 'São Tomé e Príncipe', coordinates: [0.1864, 6.6131], visited: false },
    { id: 'GW', name: 'Guiné-Bissau', coordinates: [11.8037, -15.1804], visited: false },
    { id: 'GN', name: 'Guiné', coordinates: [9.9456, -9.6966], visited: false },
    { id: 'SL', name: 'Serra Leoa', coordinates: [8.4606, -11.7799], visited: false },
    { id: 'LR', name: 'Libéria', coordinates: [6.4281, -9.4295], visited: false },
    { id: 'TG', name: 'Togo', coordinates: [8.6195, 0.8248], visited: false },
    { id: 'BJ', name: 'Benin', coordinates: [9.3077, 2.3158], visited: false },
    { id: 'MR', name: 'Mauritânia', coordinates: [21.0079, -10.9408], visited: false },
    { id: 'EH', name: 'Saara Ocidental', coordinates: [24.2155, -12.8858], visited: false },
    { id: 'CV', name: 'Cabo Verde', coordinates: [16.5388, -23.0418], visited: false },
    { id: 'GM', name: 'Gâmbia', coordinates: [13.4432, -15.3101], visited: false },
    { id: 'DJ', name: 'Djibouti', coordinates: [11.8251, 42.5903], visited: false },
    { id: 'SO', name: 'Somália', coordinates: [5.1521, 46.1996], visited: false },
    { id: 'ER', name: 'Eritreia', coordinates: [15.1794, 39.7823], visited: false },
    { id: 'SS', name: 'Sudão do Sul', coordinates: [6.8770, 31.3070], visited: false },
    { id: 'BI', name: 'Burundi', coordinates: [-3.3731, 29.9189], visited: false },
    { id: 'RW', name: 'Ruanda', coordinates: [-1.9403, 30.0596], visited: false },
    { id: 'MG', name: 'Madagascar', coordinates: [-18.7669, 46.8691], visited: false },
    { id: 'MU', name: 'Maurício', coordinates: [-20.3484, 57.5522], visited: false },
    { id: 'SC', name: 'Seychelles', coordinates: [-4.6796, 55.4920], visited: false },
    { id: 'KM', name: 'Comores', coordinates: [-11.6455, 43.3333], visited: false },
    { id: 'YT', name: 'Mayotte', coordinates: [-12.8275, 45.1662], visited: false },
    { id: 'RE', name: 'Reunião', coordinates: [-21.1151, 55.5364], visited: false },
    
    // Oceania
    { id: 'AU', name: 'Austrália', coordinates: [-25.2744, 133.7751], visited: false },
    { id: 'NZ', name: 'Nova Zelândia', coordinates: [-40.9006, 174.8860], visited: false },
    { id: 'FJ', name: 'Fiji', coordinates: [-17.7134, 178.0650], visited: false },
    { id: 'PG', name: 'Papua Nova Guiné', coordinates: [-6.3150, 143.9555], visited: false },
    { id: 'NC', name: 'Nova Caledônia', coordinates: [-20.9043, 165.6180], visited: false },
    { id: 'VU', name: 'Vanuatu', coordinates: [-15.3767, 166.9592], visited: false },
    { id: 'SB', name: 'Ilhas Salomão', coordinates: [-9.6457, 160.1562], visited: false },
    { id: 'TO', name: 'Tonga', coordinates: [-21.1790, -175.1982], visited: false },
    { id: 'WS', name: 'Samoa', coordinates: [-13.7590, -172.1046], visited: false },
    { id: 'KI', name: 'Kiribati', coordinates: [-3.3704, -168.7340], visited: false },
    { id: 'TV', name: 'Tuvalu', coordinates: [-7.1095, 177.6493], visited: false },
    { id: 'NR', name: 'Nauru', coordinates: [-0.5228, 166.9315], visited: false },
    { id: 'PW', name: 'Palau', coordinates: [7.5150, 134.5825], visited: false },
    { id: 'MH', name: 'Ilhas Marshall', coordinates: [7.1315, 171.1845], visited: false },
    { id: 'FM', name: 'Micronésia', coordinates: [7.4256, 150.5508], visited: false },
    { id: 'CK', name: 'Ilhas Cook', coordinates: [-21.2368, -159.7777], visited: false },
    { id: 'NU', name: 'Niue', coordinates: [-19.0544, -169.8672], visited: false },
    { id: 'TK', name: 'Tokelau', coordinates: [-8.9674, -171.8559], visited: false },
    { id: 'AS', name: 'Samoa Americana', coordinates: [-14.2710, -170.1322], visited: false },
    { id: 'GU', name: 'Guam', coordinates: [13.4443, 144.7937], visited: false },
    { id: 'MP', name: 'Ilhas Marianas do Norte', coordinates: [17.3308, 145.3847], visited: false },
    { id: 'PF', name: 'Polinésia Francesa', coordinates: [-17.6797, -149.4068], visited: false },
    { id: 'WF', name: 'Wallis e Futuna', coordinates: [-14.2938, -178.1165], visited: false }
  ]

  const updatedCountries = countries.map(country => ({
    ...country,
    visited: visitedPlaces.includes(country.id)
  }))

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleCountryClick = (countryId: string) => {
    onPlaceToggle(countryId)
  }

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
      {/* Mapa Leaflet */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Marcadores dos países */}
        {updatedCountries.map((country) => (
          <Marker
            key={country.id}
            position={country.coordinates}
            eventHandlers={{
              click: () => handleCountryClick(country.id)
            }}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold text-lg">{country.name}</div>
                <div className="text-sm text-gray-600">
                  {country.visited ? '✅ Visitado' : '❌ Não visitado'}
                </div>
                <button
                  onClick={() => handleCountryClick(country.id)}
                  className={`mt-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    country.visited
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {country.visited ? 'Marcar como não visitado' : 'Marcar como visitado'}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Não visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Visitado</span>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
        <p className="text-xs text-gray-600">
          💡 <strong>Dica:</strong> Clique nos marcadores dos países para marcar como visitados. Use o mouse para navegar no mapa.
        </p>
      </div>
    </div>
  )
}

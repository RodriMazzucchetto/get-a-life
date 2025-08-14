'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import AddLocationModal from './AddLocationModal'

interface TravelMapProps {
  visitedPlaces: string[]
  onPlaceToggle: (placeId: string) => void
}

interface VisitedLocation {
  id: string
  type: 'city' | 'state' | 'country'
  name: string
  coordinates: [number, number]
}

interface Country {
  id: string
  name: string
  coordinates: [number, number]
  visited: boolean
}

export default function TravelMap({ visitedPlaces, onPlaceToggle }: TravelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [popupInfo, setPopupInfo] = useState<Country | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isTipClosed, setIsTipClosed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([])

  // Lista de países principais com coordenadas reais
  const countries: Country[] = [
    // América do Norte
    { id: 'US', name: 'Estados Unidos', coordinates: [-98.5795, 39.8283], visited: false },
    { id: 'CA', name: 'Canadá', coordinates: [-106.3468, 56.1304], visited: false },
    { id: 'MX', name: 'México', coordinates: [-102.5528, 23.6345], visited: false },
    
    // América do Sul
    { id: 'BR', name: 'Brasil', coordinates: [-51.9253, -14.2350], visited: false },
    { id: 'AR', name: 'Argentina', coordinates: [-63.6167, -38.4161], visited: false },
    { id: 'CL', name: 'Chile', coordinates: [-71.5430, -35.6751], visited: false },
    { id: 'PE', name: 'Peru', coordinates: [-75.0152, -9.1900], visited: false },
    { id: 'CO', name: 'Colômbia', coordinates: [-74.2973, 4.5709], visited: false },
    { id: 'VE', name: 'Venezuela', coordinates: [-66.5897, 6.4238], visited: false },
    { id: 'EC', name: 'Equador', coordinates: [-78.1834, -1.8312], visited: false },
    { id: 'BO', name: 'Bolívia', coordinates: [-63.5887, -16.2902], visited: false },
    { id: 'PY', name: 'Paraguai', coordinates: [-58.4438, -23.4425], visited: false },
    { id: 'UY', name: 'Uruguai', coordinates: [-55.7658, -32.5228], visited: false },
    
    // Europa
    { id: 'FR', name: 'França', coordinates: [2.2137, 46.2276], visited: false },
    { id: 'DE', name: 'Alemanha', coordinates: [10.4515, 51.1657], visited: false },
    { id: 'IT', name: 'Itália', coordinates: [12.5674, 41.8719], visited: false },
    { id: 'ES', name: 'Espanha', coordinates: [-3.7492, 40.4637], visited: false },
    { id: 'GB', name: 'Reino Unido', coordinates: [-3.4360, 55.3781], visited: false },
    { id: 'PT', name: 'Portugal', coordinates: [-8.2245, 39.3999], visited: false },
    { id: 'NL', name: 'Países Baixos', coordinates: [5.2913, 52.1326], visited: false },
    { id: 'BE', name: 'Bélgica', coordinates: [4.3517, 50.8503], visited: false },
    { id: 'CH', name: 'Suíça', coordinates: [8.2275, 46.8182], visited: false },
    { id: 'AT', name: 'Áustria', coordinates: [14.5501, 47.5162], visited: false },
    { id: 'SE', name: 'Suécia', coordinates: [18.6435, 60.1282], visited: false },
    { id: 'NO', name: 'Noruega', coordinates: [8.4689, 60.4720], visited: false },
    { id: 'DK', name: 'Dinamarca', coordinates: [9.5018, 56.2639], visited: false },
    { id: 'FI', name: 'Finlândia', coordinates: [25.7482, 61.9241], visited: false },
    { id: 'PL', name: 'Polônia', coordinates: [19.1451, 51.9194], visited: false },
    { id: 'CZ', name: 'República Tcheca', coordinates: [15.4730, 49.8175], visited: false },
    { id: 'HU', name: 'Hungria', coordinates: [19.5033, 47.1625], visited: false },
    { id: 'RO', name: 'Romênia', coordinates: [24.9668, 45.9432], visited: false },
    { id: 'BG', name: 'Bulgária', coordinates: [25.4858, 42.7339], visited: false },
    { id: 'GR', name: 'Grécia', coordinates: [21.8243, 39.0742], visited: false },
    { id: 'HR', name: 'Croácia', coordinates: [15.2000, 45.1000], visited: false },
    { id: 'RS', name: 'Sérvia', coordinates: [21.0059, 44.0165], visited: false },
    { id: 'SI', name: 'Eslovênia', coordinates: [14.9955, 46.1512], visited: false },
    { id: 'SK', name: 'Eslováquia', coordinates: [19.6990, 48.6690], visited: false },
    { id: 'LT', name: 'Lituânia', coordinates: [23.8813, 55.1694], visited: false },
    { id: 'LV', name: 'Letônia', coordinates: [24.6032, 56.8796], visited: false },
    { id: 'EE', name: 'Estônia', coordinates: [25.0136, 58.5953], visited: false },
    { id: 'IE', name: 'Irlanda', coordinates: [-8.2439, 53.4129], visited: false },
    { id: 'IS', name: 'Islândia', coordinates: [-19.0208, 64.9631], visited: false },
    
    // Ásia
    { id: 'CN', name: 'China', coordinates: [104.1954, 35.8617], visited: false },
    { id: 'JP', name: 'Japão', coordinates: [138.2529, 36.2048], visited: false },
    { id: 'IN', name: 'Índia', coordinates: [78.9629, 20.5937], visited: false },
    { id: 'KR', name: 'Coreia do Sul', coordinates: [127.7669, 35.9078], visited: false },
    { id: 'TH', name: 'Tailândia', coordinates: [100.9925, 15.8700], visited: false },
    { id: 'VN', name: 'Vietnã', coordinates: [108.2772, 14.0583], visited: false },
    { id: 'MY', name: 'Malásia', coordinates: [108.9758, 4.2105], visited: false },
    { id: 'SG', name: 'Singapura', coordinates: [103.8198, 1.3521], visited: false },
    { id: 'ID', name: 'Indonésia', coordinates: [113.9213, -0.7893], visited: false },
    { id: 'PH', name: 'Filipinas', coordinates: [121.7740, 12.8797], visited: false },
    { id: 'TW', name: 'Taiwan', coordinates: [120.9605, 23.6978], visited: false },
    { id: 'HK', name: 'Hong Kong', coordinates: [114.1694, 22.3193], visited: false },
    { id: 'MO', name: 'Macau', coordinates: [113.5439, 22.1987], visited: false },
    { id: 'MM', name: 'Mianmar', coordinates: [95.9560, 21.9162], visited: false },
    { id: 'LA', name: 'Laos', coordinates: [102.4955, 19.8563], visited: false },
    { id: 'KH', name: 'Camboja', coordinates: [104.9910, 12.5657], visited: false },
    { id: 'BD', name: 'Bangladesh', coordinates: [90.3563, 23.6850], visited: false },
    { id: 'LK', name: 'Sri Lanka', coordinates: [80.7718, 7.8731], visited: false },
    { id: 'NP', name: 'Nepal', coordinates: [84.1240, 28.3949], visited: false },
    { id: 'BT', name: 'Butão', coordinates: [90.4336, 27.5142], visited: false },
    { id: 'MN', name: 'Mongólia', coordinates: [103.8467, 46.8625], visited: false },
    { id: 'KZ', name: 'Cazaquistão', coordinates: [66.9237, 48.0196], visited: false },
    { id: 'UZ', name: 'Uzbequistão', coordinates: [64.5853, 41.3775], visited: false },
    { id: 'KG', name: 'Quirguistão', coordinates: [74.7661, 41.2044], visited: false },
    { id: 'TJ', name: 'Tajiquistão', coordinates: [71.3645, 38.5358], visited: false },
    { id: 'TM', name: 'Turcomenistão', coordinates: [59.5563, 38.9697], visited: false },
    { id: 'AF', name: 'Afeganistão', coordinates: [67.7100, 33.9391], visited: false },
    { id: 'PK', name: 'Paquistão', coordinates: [69.3451, 30.3753], visited: false },
    { id: 'IR', name: 'Irã', coordinates: [53.6880, 32.4279], visited: false },
    { id: 'IQ', name: 'Iraque', coordinates: [43.6793, 33.2232], visited: false },
    { id: 'SY', name: 'Síria', coordinates: [38.9968, 34.8021], visited: false },
    { id: 'LB', name: 'Líbano', coordinates: [35.8623, 33.8547], visited: false },
    { id: 'JO', name: 'Jordânia', coordinates: [36.2384, 30.5852], visited: false },
    { id: 'IL', name: 'Israel', coordinates: [34.8516, 31.0461], visited: false },
    { id: 'PS', name: 'Palestina', coordinates: [35.2332, 31.9522], visited: false },
    { id: 'SA', name: 'Arábia Saudita', coordinates: [45.0792, 23.8859], visited: false },
    { id: 'AE', name: 'Emirados Árabes Unidos', coordinates: [54.0000, 24.0000], visited: false },
    { id: 'QA', name: 'Catar', coordinates: [51.1839, 25.3548], visited: false },
    { id: 'KW', name: 'Kuwait', coordinates: [47.4818, 29.3117], visited: false },
    { id: 'BH', name: 'Bahrain', coordinates: [50.5577, 26.0667], visited: false },
    { id: 'OM', name: 'Omã', coordinates: [55.9754, 21.4735], visited: false },
    { id: 'YE', name: 'Iêmen', coordinates: [48.5164, 15.5527], visited: false },
    { id: 'TR', name: 'Turquia', coordinates: [35.2433, 38.9637], visited: false },
    { id: 'CY', name: 'Chipre', coordinates: [33.4299, 35.1264], visited: false },
    { id: 'GE', name: 'Geórgia', coordinates: [43.3569, 42.3154], visited: false },
    { id: 'AM', name: 'Armênia', coordinates: [45.0382, 40.0691], visited: false },
    { id: 'AZ', name: 'Azerbaijão', coordinates: [47.5769, 40.1431], visited: false },
    
    // África
    { id: 'ZA', name: 'África do Sul', coordinates: [22.9375, -30.5595], visited: false },
    { id: 'EG', name: 'Egito', coordinates: [30.8025, 26.8206], visited: false },
    { id: 'NG', name: 'Nigéria', coordinates: [8.6753, 9.0820], visited: false },
    { id: 'KE', name: 'Quênia', coordinates: [37.9062, -0.0236], visited: false },
    { id: 'ET', name: 'Etiópia', coordinates: [40.4897, 9.1450], visited: false },
    { id: 'TZ', name: 'Tanzânia', coordinates: [34.8888, -6.3690], visited: false },
    { id: 'UG', name: 'Uganda', coordinates: [32.2903, 1.3733], visited: false },
    { id: 'GH', name: 'Gana', coordinates: [-1.0232, 7.9465], visited: false },
    { id: 'CI', name: 'Costa do Marfim', coordinates: [-5.5471, 7.5400], visited: false },
    { id: 'SN', name: 'Senegal', coordinates: [-14.4524, 14.4974], visited: false },
    { id: 'ML', name: 'Mali', coordinates: [-3.9962, 17.5707], visited: false },
    { id: 'BF', name: 'Burkina Faso', coordinates: [-1.5616, 12.2383], visited: false },
    { id: 'NE', name: 'Níger', coordinates: [8.0817, 17.6078], visited: false },
    { id: 'TD', name: 'Chade', coordinates: [18.7322, 15.4542], visited: false },
    { id: 'SD', name: 'Sudão', coordinates: [30.2176, 12.8628], visited: false },
    { id: 'LY', name: 'Líbia', coordinates: [17.2283, 26.3351], visited: false },
    { id: 'TN', name: 'Tunísia', coordinates: [9.5375, 33.8869], visited: false },
    { id: 'DZ', name: 'Argélia', coordinates: [1.6596, 28.0339], visited: false },
    { id: 'MA', name: 'Marrocos', coordinates: [-7.0926, 31.7917], visited: false },
    { id: 'AO', name: 'Angola', coordinates: [17.8739, -11.2027], visited: false },
    { id: 'CD', name: 'República Democrática do Congo', coordinates: [21.7587, -4.0383], visited: false },
    { id: 'CG', name: 'República do Congo', coordinates: [15.8277, -0.2280], visited: false },
    { id: 'GA', name: 'Gabão', coordinates: [11.6094, -0.8037], visited: false },
    { id: 'CM', name: 'Camarões', coordinates: [12.3547, 7.3697], visited: false },
    { id: 'CF', name: 'República Centro-Africana', coordinates: [20.9394, 6.6111], visited: false },
    { id: 'GQ', name: 'Guiné Equatorial', coordinates: [10.2679, 1.6508], visited: false },
    { id: 'ST', name: 'São Tomé e Príncipe', coordinates: [6.6131, 0.1864], visited: false },
    { id: 'GW', name: 'Guiné-Bissau', coordinates: [-15.1804, 11.8037], visited: false },
    { id: 'GN', name: 'Guiné', coordinates: [-9.6966, 9.9456], visited: false },
    { id: 'SL', name: 'Serra Leoa', coordinates: [-11.7799, 8.4606], visited: false },
    { id: 'LR', name: 'Libéria', coordinates: [-9.4295, 6.4281], visited: false },
    { id: 'TG', name: 'Togo', coordinates: [0.8248, 8.6195], visited: false },
    { id: 'BJ', name: 'Benin', coordinates: [2.3158, 9.3077], visited: false },
    { id: 'MR', name: 'Mauritânia', coordinates: [-10.9408, 21.0079], visited: false },
    { id: 'EH', name: 'Saara Ocidental', coordinates: [-12.8858, 24.2155], visited: false },
    { id: 'CV', name: 'Cabo Verde', coordinates: [-23.0418, 16.5388], visited: false },
    { id: 'GM', name: 'Gâmbia', coordinates: [-15.3101, 13.4432], visited: false },
    { id: 'DJ', name: 'Djibouti', coordinates: [42.5903, 11.8251], visited: false },
    { id: 'SO', name: 'Somália', coordinates: [46.1996, 5.1521], visited: false },
    { id: 'ER', name: 'Eritreia', coordinates: [39.7823, 15.1794], visited: false },
    { id: 'SS', name: 'Sudão do Sul', coordinates: [31.3070, 6.8770], visited: false },
    { id: 'BI', name: 'Burundi', coordinates: [29.9189, -3.3731], visited: false },
    { id: 'RW', name: 'Ruanda', coordinates: [30.0596, -1.9403], visited: false },
    { id: 'MG', name: 'Madagascar', coordinates: [46.8691, -18.7669], visited: false },
    { id: 'MU', name: 'Maurício', coordinates: [57.5522, -20.3484], visited: false },
    { id: 'SC', name: 'Seychelles', coordinates: [55.4920, -4.6796], visited: false },
    { id: 'KM', name: 'Comores', coordinates: [43.3333, -11.6455], visited: false },
    { id: 'YT', name: 'Mayotte', coordinates: [45.1662, -12.8275], visited: false },
    { id: 'RE', name: 'Reunião', coordinates: [55.5364, -21.1151], visited: false },
    
    // Oceania
    { id: 'AU', name: 'Austrália', coordinates: [133.7751, -25.2744], visited: false },
    { id: 'NZ', name: 'Nova Zelândia', coordinates: [174.8860, -40.9006], visited: false },
    { id: 'FJ', name: 'Fiji', coordinates: [178.0650, -17.7134], visited: false },
    { id: 'PG', name: 'Papua Nova Guiné', coordinates: [143.9555, -6.3150], visited: false },
    { id: 'NC', name: 'Nova Caledônia', coordinates: [165.6180, -20.9043], visited: false },
    { id: 'VU', name: 'Vanuatu', coordinates: [166.9592, -15.3767], visited: false },
    { id: 'SB', name: 'Ilhas Salomão', coordinates: [160.1562, -9.6457], visited: false },
    { id: 'TO', name: 'Tonga', coordinates: [-175.1982, -21.1790], visited: false },
    { id: 'WS', name: 'Samoa', coordinates: [-172.1046, -13.7590], visited: false },
    { id: 'KI', name: 'Kiribati', coordinates: [-168.7340, -3.3704], visited: false },
    { id: 'TV', name: 'Tuvalu', coordinates: [177.6493, -7.1095], visited: false },
    { id: 'NR', name: 'Nauru', coordinates: [166.9315, -0.5228], visited: false },
    { id: 'PW', name: 'Palau', coordinates: [134.5825, 7.5150], visited: false },
    { id: 'MH', name: 'Ilhas Marshall', coordinates: [171.1845, 7.1315], visited: false },
    { id: 'FM', name: 'Micronésia', coordinates: [150.5508, 7.4256], visited: false },
    { id: 'CK', name: 'Ilhas Cook', coordinates: [-159.7777, -21.2368], visited: false },
    { id: 'NU', name: 'Niue', coordinates: [-169.8672, -19.0544], visited: false },
    { id: 'TK', name: 'Tokelau', coordinates: [-171.8559, -8.9674], visited: false },
    { id: 'AS', name: 'Samoa Americana', coordinates: [-170.1322, -14.2710], visited: false },
    { id: 'GU', name: 'Guam', coordinates: [144.7937, 13.4443], visited: false },
    { id: 'MP', name: 'Ilhas Marianas do Norte', coordinates: [145.3847, 17.3308], visited: false },
    { id: 'PF', name: 'Polinésia Francesa', coordinates: [-149.4068, -17.6797], visited: false },
    { id: 'WF', name: 'Wallis e Futuna', coordinates: [-178.1165, -14.2938], visited: false }
  ]

  const updatedCountries = countries.map(country => ({
    ...country,
    visited: visitedPlaces.includes(country.id)
  }))

  const handleAddLocation = (location: { type: 'city' | 'state' | 'country', name: string, id: string }) => {
    // Para este exemplo, vamos usar coordenadas fixas baseadas no tipo
    // Em uma implementação real, você teria um banco de dados com coordenadas precisas
    let coordinates: [number, number] = [0, 0]
    
    if (location.type === 'city') {
      // Coordenadas aproximadas para algumas cidades brasileiras
      const cityCoords: Record<string, [number, number]> = {
        'curitiba': [-25.4289, -49.2671],
        'são paulo': [-23.5505, -46.6333],
        'rio de janeiro': [-22.9068, -43.1729],
        'belo horizonte': [-19.9167, -43.9345],
        'brasília': [-15.7942, -47.8822],
        'salvador': [-12.9714, -38.5011],
        'fortaleza': [-3.7319, -38.5267],
        'manaus': [-3.1190, -60.0217],
        'recife': [-8.0476, -34.8770],
        'porto alegre': [-30.0346, -51.2177],
        'goiânia': [-16.6864, -49.2653],
        'guarulhos': [-23.4543, -46.5339],
        'campinas': [-22.9064, -47.0616],
        'natal': [-5.7945, -35.2090]
      }
      coordinates = cityCoords[location.name.toLowerCase()] || [0, 0]
    } else if (location.type === 'state') {
      // Coordenadas aproximadas para centros dos estados
      const stateCoords: Record<string, [number, number]> = {
        'paraná': [-25.2521, -52.0215],
        'são paulo': [-23.5505, -46.6333],
        'rio de janeiro': [-22.9068, -43.1729],
        'minas gerais': [-19.9167, -43.9345],
        'bahia': [-12.9714, -38.5011],
        'rio grande do sul': [-30.0346, -51.2177],
        'pernambuco': [-8.0476, -34.8770],
        'ceará': [-3.7319, -38.5267],
        'pará': [-1.4554, -48.4898],
        'santa catarina': [-27.2423, -50.2189],
        'goiás': [-16.6864, -49.2653],
        'maranhão': [-2.5297, -44.3028],
        'amazonas': [-3.1190, -60.0217],
        'mato grosso': [-15.6010, -56.0974],
        'mato grosso do sul': [-20.4435, -54.6478]
      }
      coordinates = stateCoords[location.name.toLowerCase()] || [0, 0]
    } else {
      // Coordenadas aproximadas para países
      const countryCoords: Record<string, [number, number]> = {
        'brasil': [-14.2350, -51.9253],
        'argentina': [-38.4161, -63.6167],
        'chile': [-35.6751, -71.5430],
        'uruguai': [-32.5228, -55.7658],
        'paraguai': [-23.4425, -58.4438],
        'bolívia': [-16.2902, -63.5887],
        'peru': [-9.1900, -75.0152],
        'colômbia': [4.5709, -74.2973],
        'venezuela': [6.4238, -66.5897],
        'equador': [-1.8312, -78.1834],
        'estados unidos': [39.8283, -98.5795],
        'canadá': [56.1304, -106.3468],
        'méxico': [23.6345, -102.5528],
        'frança': [46.2276, 2.2137],
        'alemanha': [51.1657, 10.4515],
        'itália': [41.8719, 12.5674],
        'espanha': [40.4637, -3.7492],
        'portugal': [39.3999, -8.2245],
        'reino unido': [55.3781, -3.4360],
        'japão': [36.2048, 138.2529]
      }
      coordinates = countryCoords[location.name.toLowerCase()] || [0, 0]
    }

    const newLocation: VisitedLocation = {
      id: location.id,
      type: location.type,
      name: location.name,
      coordinates
    }

    setVisitedLocations(prev => [...prev, newLocation])
    onPlaceToggle(location.id)
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🚀 Inicializando mapa MapLibre...')

    try {
      // Inicializar o mapa
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [0, 20],
        zoom: 2,
        attributionControl: false,
        renderWorldCopies: false,
        maxZoom: 18,
        minZoom: 1
      })

      // Adicionar controles de navegação
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Aguardar o mapa carregar
      map.current.on('load', () => {
        console.log('✅ Mapa carregado com sucesso!')
      })

      // Tratar erros
      map.current.on('error', (e) => {
        console.error('❌ Erro no mapa:', e)
      })

    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error)
    }

    // Limpar o mapa quando o componente for desmontado
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

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
      {/* Mapa MapLibre GL JS */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Botão Adicionar Local */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          title="Adicionar local visitado"
        >
          <span className="text-lg">📍</span>
          <span className="text-sm font-medium">Adicionar Local</span>
        </button>
      </div>

      {/* Instruções */}
      {!isTipClosed && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-600">
              💡 <strong>Dica:</strong> Use os controles para zoom, clique e arraste para navegar.
            </p>
            <button
              onClick={() => setIsTipClosed(true)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold ml-2"
              title="Fechar dica"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Local */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddLocation={handleAddLocation}
      />
    </div>
  )
}

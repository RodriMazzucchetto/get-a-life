'use client'

import { useState } from 'react'

interface CityResult {
  id: string
  name: string
  type: string
  displayName: string
  coordinates: {
    lat: number
    lon: number
  }
  country: string
  state?: string
}

// Base de dados local com cidades do mundo
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
  { name: 'Lille', country: 'França', state: 'Hauts-de-France', lat: 50.6292, lon: 3.0573 },
  { name: 'Lyon', country: 'França', state: 'Auvergne-Rhône-Alpes', lat: 45.7640, lon: 4.8357 },
  { name: 'Marseille', country: 'França', state: 'Provence-Alpes-Côte d\'Azur', lat: 43.2965, lon: 5.3698 },
  { name: 'Toulouse', country: 'França', state: 'Occitanie', lat: 43.6047, lon: 1.4442 },
  { name: 'Nice', country: 'França', state: 'Provence-Alpes-Côte d\'Azur', lat: 43.7102, lon: 7.2620 },
  { name: 'Nantes', country: 'França', state: 'Pays de la Loire', lat: 47.2184, lon: -1.5536 },
  { name: 'Strasbourg', country: 'França', state: 'Grand Est', lat: 48.5734, lon: 7.7521 },
  { name: 'Montpellier', country: 'França', state: 'Occitanie', lat: 43.6108, lon: 3.8767 },
  { name: 'Bordeaux', country: 'França', state: 'Nouvelle-Aquitaine', lat: 44.8378, lon: -0.5792 },
  { name: 'Berlin', country: 'Alemanha', state: 'Berlim', lat: 52.5200, lon: 13.4050 },
  { name: 'Munich', country: 'Alemanha', state: 'Baviera', lat: 48.1351, lon: 11.5820 },
  { name: 'Hamburg', country: 'Alemanha', state: 'Hamburgo', lat: 53.5511, lon: 9.9937 },
  { name: 'Cologne', country: 'Alemanha', state: 'Renânia do Norte-Vestfália', lat: 50.9375, lon: 6.9603 },
  { name: 'Frankfurt', country: 'Alemanha', state: 'Hesse', lat: 50.1109, lon: 8.6821 },
  { name: 'Stuttgart', country: 'Alemanha', state: 'Baden-Württemberg', lat: 48.7758, lon: 9.1829 },
  { name: 'Düsseldorf', country: 'Alemanha', state: 'Renânia do Norte-Vestfália', lat: 51.2277, lon: 6.7735 },
  { name: 'Dortmund', country: 'Alemanha', state: 'Renânia do Norte-Vestfália', lat: 51.5136, lon: 7.4653 },
  { name: 'Essen', country: 'Alemanha', state: 'Renânia do Norte-Vestfália', lat: 51.4556, lon: 7.0116 },
  { name: 'Leipzig', country: 'Alemanha', state: 'Saxônia', lat: 51.3397, lon: 12.3731 },
  { name: 'Madrid', country: 'Espanha', state: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', country: 'Espanha', state: 'Catalunha', lat: 41.3851, lon: 2.1734 },
  { name: 'Valencia', country: 'Espanha', state: 'Valência', lat: 39.4699, lon: -0.3763 },
  { name: 'Seville', country: 'Espanha', state: 'Andaluzia', lat: 37.3891, lon: -5.9845 },
  { name: 'Zaragoza', country: 'Espanha', state: 'Aragão', lat: 41.6488, lon: -0.8891 },
  { name: 'Málaga', country: 'Espanha', state: 'Andaluzia', lat: 36.7213, lon: -4.4217 },
  { name: 'Murcia', country: 'Espanha', state: 'Múrcia', lat: 37.9922, lon: -1.1307 },
  { name: 'Palma', country: 'Espanha', state: 'Ilhas Baleares', lat: 39.5696, lon: 2.6502 },
  { name: 'Las Palmas', country: 'Espanha', state: 'Ilhas Canárias', lat: 28.1235, lon: -15.4366 },
  { name: 'Bilbao', country: 'Espanha', state: 'País Basco', lat: 43.2627, lon: -2.9253 },
  { name: 'Rome', country: 'Itália', state: 'Lazio', lat: 41.9028, lon: 12.4964 },
  { name: 'Milan', country: 'Itália', state: 'Lombardia', lat: 45.4642, lon: 9.1900 },
  { name: 'Naples', country: 'Itália', state: 'Campânia', lat: 40.8518, lon: 14.2681 },
  { name: 'Turin', country: 'Itália', state: 'Piemonte', lat: 45.0703, lon: 7.6869 },
  { name: 'Palermo', country: 'Itália', state: 'Sicília', lat: 38.1157, lon: 13.3615 },
  { name: 'Genoa', country: 'Itália', state: 'Ligúria', lat: 44.4056, lon: 8.9463 },
  { name: 'Bologna', country: 'Itália', state: 'Emília-Romanha', lat: 44.4949, lon: 11.3426 },
  { name: 'Florence', country: 'Itália', state: 'Toscana', lat: 43.7696, lon: 11.2558 },
  { name: 'Bari', country: 'Itália', state: 'Puglia', lat: 41.1171, lon: 16.8719 },
  { name: 'Catania', country: 'Itália', state: 'Sicília', lat: 37.5079, lon: 15.0830 },
  { name: 'Venice', country: 'Itália', state: 'Vêneto', lat: 45.4371, lon: 12.3326 },
  { name: 'Amsterdam', country: 'Países Baixos', state: 'Holanda do Norte', lat: 52.3676, lon: 4.9041 },
  { name: 'Rotterdam', country: 'Países Baixos', state: 'Holanda do Sul', lat: 51.9225, lon: 4.4792 },
  { name: 'The Hague', country: 'Países Baixos', state: 'Holanda do Sul', lat: 52.0705, lon: 4.3007 },
  { name: 'Utrecht', country: 'Países Baixos', state: 'Utrecht', lat: 52.0907, lon: 5.1214 },
  { name: 'Eindhoven', country: 'Países Baixos', state: 'Brabante do Norte', lat: 51.4416, lon: 5.4697 },
  { name: 'Groningen', country: 'Países Baixos', state: 'Groningen', lat: 53.2194, lon: 6.5665 },
  { name: 'Tilburg', country: 'Países Baixos', state: 'Brabante do Norte', lat: 51.5719, lon: 5.0672 },
  { name: 'Almere', country: 'Países Baixos', state: 'Flevolândia', lat: 52.3508, lon: 5.2647 },
  { name: 'Breda', country: 'Países Baixos', state: 'Brabante do Norte', lat: 51.5719, lon: 4.7683 },
  { name: 'Nijmegen', country: 'Países Baixos', state: 'Guelderlândia', lat: 51.8425, lon: 5.8533 },
  { name: 'Vienna', country: 'Áustria', state: 'Viena', lat: 48.2082, lon: 16.3738 },
  { name: 'Graz', country: 'Áustria', state: 'Estíria', lat: 47.0707, lon: 15.4395 },
  { name: 'Linz', country: 'Áustria', state: 'Alta Áustria', lat: 48.3069, lon: 14.2858 },
  { name: 'Salzburg', country: 'Áustria', state: 'Salzburgo', lat: 47.8095, lon: 13.0550 },
  { name: 'Innsbruck', country: 'Áustria', state: 'Tirol', lat: 47.2692, lon: 11.4041 },
  { name: 'Klagenfurt', country: 'Áustria', state: 'Caríntia', lat: 46.6249, lon: 14.3052 },
  { name: 'Villach', country: 'Áustria', state: 'Caríntia', lat: 46.6111, lon: 13.8558 },
  { name: 'Wels', country: 'Áustria', state: 'Alta Áustria', lat: 48.1575, lon: 14.0289 },
  { name: 'Sankt Pölten', country: 'Áustria', state: 'Baixa Áustria', lat: 48.2082, lon: 15.6269 },
  { name: 'Prague', country: 'República Tcheca', state: 'Praga', lat: 50.0755, lon: 14.4378 },
  { name: 'Brno', country: 'República Tcheca', state: 'Morávia do Sul', lat: 49.1951, lon: 16.6068 },
  { name: 'Ostrava', country: 'República Tcheca', state: 'Morávia-Silésia', lat: 49.8209, lon: 18.2625 },
  { name: 'Plzen', country: 'República Tcheca', state: 'Boêmia Ocidental', lat: 49.7475, lon: 13.3776 },
  { name: 'Liberec', country: 'República Tcheca', state: 'Liberec', lat: 50.7663, lon: 15.0543 },
  { name: 'Olomouc', country: 'República Tcheca', state: 'Olomouc', lat: 49.5938, lon: 17.2508 },
  { name: 'Ústí nad Labem', country: 'República Tcheca', state: 'Ústí nad Labem', lat: 50.6611, lon: 14.0531 },
  { name: 'České Budějovice', country: 'República Tcheca', state: 'Boêmia do Sul', lat: 48.9745, lon: 14.4747 },
  { name: 'Hradec Králové', country: 'República Tcheca', state: 'Hradec Králové', lat: 50.2092, lon: 15.8327 },
  { name: 'Pardubice', country: 'República Tcheca', state: 'Pardubice', lat: 50.0343, lon: 15.7812 },
  { name: 'Budapest', country: 'Hungria', state: 'Budapeste', lat: 47.4979, lon: 19.0402 },
  { name: 'Debrecen', country: 'Hungria', state: 'Hajdú-Bihar', lat: 47.5299, lon: 21.6392 },
  { name: 'Szeged', country: 'Hungria', state: 'Csongrád', lat: 46.2530, lon: 20.1414 },
  { name: 'Miskolc', country: 'Hungria', state: 'Borsod-Abaúj-Zemplén', lat: 48.1034, lon: 20.7784 },
  { name: 'Pécs', country: 'Hungria', state: 'Baranya', lat: 46.0759, lon: 18.2284 },
  { name: 'Győr', country: 'Hungria', state: 'Győr-Moson-Sopron', lat: 47.6875, lon: 17.6504 },
  { name: 'Nyíregyháza', country: 'Hungria', state: 'Szabolcs-Szatmár-Bereg', lat: 47.9495, lon: 21.7244 },
  { name: 'Kecskemét', country: 'Hungria', state: 'Bács-Kiskun', lat: 46.9062, lon: 19.6897 },
  { name: 'Székesfehérvár', country: 'Hungria', state: 'Fejér', lat: 47.1860, lon: 18.4221 },
  { name: 'Warsaw', country: 'Polônia', state: 'Mazóvia', lat: 52.2297, lon: 21.0122 },
  { name: 'Krakow', country: 'Polônia', state: 'Pequena Polônia', lat: 50.0647, lon: 19.9450 },
  { name: 'Lodz', country: 'Polônia', state: 'Łódź', lat: 51.7592, lon: 19.4559 },
  { name: 'Wroclaw', country: 'Polônia', state: 'Baixa Silésia', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznan', country: 'Polônia', state: 'Grande Polônia', lat: 52.4064, lon: 16.9252 },
  { name: 'Gdansk', country: 'Polônia', state: 'Pomerânia', lat: 54.3520, lon: 18.6466 },
  { name: 'Szczecin', country: 'Polônia', state: 'Pomerânia Ocidental', lat: 53.4285, lon: 14.5528 },
  { name: 'Bydgoszcz', country: 'Polônia', state: 'Cujávia-Pomerânia', lat: 53.1235, lon: 18.0084 },
  { name: 'Lublin', country: 'Polônia', state: 'Lublin', lat: 51.2465, lon: 22.5684 },
  { name: 'Katowice', country: 'Polônia', state: 'Silésia', lat: 50.2613, lon: 19.0239 },
  { name: 'Stockholm', country: 'Suécia', state: 'Estocolmo', lat: 59.3293, lon: 18.0686 },
  { name: 'Gothenburg', country: 'Suécia', state: 'Västra Götaland', lat: 57.7089, lon: 11.9746 },
  { name: 'Malmö', country: 'Suécia', state: 'Escânia', lat: 55.6050, lon: 13.0038 },
  { name: 'Uppsala', country: 'Suécia', state: 'Uppsala', lat: 59.8586, lon: 17.6389 },
  { name: 'Västerås', country: 'Suécia', state: 'Västmanland', lat: 59.6162, lon: 16.5528 },
  { name: 'Örebro', country: 'Suécia', state: 'Örebro', lat: 59.2753, lon: 15.2134 },
  { name: 'Linköping', country: 'Suécia', state: 'Östergötland', lat: 58.4108, lon: 15.6214 },
  { name: 'Helsingborg', country: 'Suécia', state: 'Escânia', lat: 56.0465, lon: 12.6945 },
  { name: 'Jönköping', country: 'Suécia', state: 'Jönköping', lat: 57.7826, lon: 14.1618 },
  { name: 'Norrköping', country: 'Suécia', state: 'Östergötland', lat: 58.5877, lon: 16.1924 },
  { name: 'Copenhagen', country: 'Dinamarca', state: 'Hovedstaden', lat: 55.6761, lon: 12.5683 },
  { name: 'Aarhus', country: 'Dinamarca', state: 'Jutlândia Central', lat: 56.1629, lon: 10.2039 },
  { name: 'Odense', country: 'Dinamarca', state: 'Syddanmark', lat: 55.4038, lon: 10.4024 },
  { name: 'Aalborg', country: 'Dinamarca', state: 'Jutlândia do Norte', lat: 57.0488, lon: 9.9217 },
  { name: 'Esbjerg', country: 'Dinamarca', state: 'Syddanmark', lat: 55.4669, lon: 8.4517 },
  { name: 'Randers', country: 'Dinamarca', state: 'Jutlândia Central', lat: 56.4607, lon: 10.0367 },
  { name: 'Kolding', country: 'Dinamarca', state: 'Syddanmark', lat: 55.4904, lon: 9.4721 },
  { name: 'Horsens', country: 'Dinamarca', state: 'Jutlândia Central', lat: 55.8607, lon: 9.8501 },
  { name: 'Vejle', country: 'Dinamarca', state: 'Syddanmark', lat: 55.7084, lon: 9.5367 },
  { name: 'Oslo', country: 'Noruega', state: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'Bergen', country: 'Noruega', state: 'Vestland', lat: 60.3913, lon: 5.3221 },
  { name: 'Trondheim', country: 'Noruega', state: 'Trøndelag', lat: 63.4305, lon: 10.3951 },
  { name: 'Stavanger', country: 'Noruega', state: 'Rogaland', lat: 58.9700, lon: 5.7331 },
  { name: 'Kristiansand', country: 'Noruega', state: 'Agder', lat: 58.1599, lon: 8.0182 },
  { name: 'Drammen', country: 'Noruega', state: 'Viken', lat: 59.7440, lon: 10.2045 },
  { name: 'Fredrikstad', country: 'Noruega', state: 'Viken', lat: 59.2181, lon: 10.9298 },
  { name: 'Sandnes', country: 'Noruega', state: 'Rogaland', lat: 58.8511, lon: 5.7394 },
  { name: 'Bodø', country: 'Noruega', state: 'Nordland', lat: 67.2804, lon: 14.4050 },
  { name: 'Tromsø', country: 'Noruega', state: 'Troms og Finnmark', lat: 69.6492, lon: 18.9553 },
  { name: 'Helsinki', country: 'Finlândia', state: 'Uusimaa', lat: 60.1699, lon: 24.9384 },
  { name: 'Espoo', country: 'Finlândia', state: 'Uusimaa', lat: 60.2055, lon: 24.6559 },
  { name: 'Tampere', country: 'Finlândia', state: 'Pirkanmaa', lat: 61.4978, lon: 23.7610 },
  { name: 'Vantaa', country: 'Finlândia', state: 'Uusimaa', lat: 60.2934, lon: 25.0378 },
  { name: 'Oulu', country: 'Finlândia', state: 'Ostrobothnia do Norte', lat: 65.0121, lon: 25.4651 },
  { name: 'Turku', country: 'Finlândia', state: 'Finlândia Própria', lat: 60.4518, lon: 22.2666 },
  { name: 'Jyväskylä', country: 'Finlândia', state: 'Finlândia Central', lat: 62.2415, lon: 25.7209 },
  { name: 'Lahti', country: 'Finlândia', state: 'Päijänne Tavastia', lat: 60.9827, lon: 25.6612 },
  { name: 'Kuopio', country: 'Finlândia', state: 'Savônia do Norte', lat: 62.8924, lon: 27.6768 },
  { name: 'Pori', country: 'Finlândia', state: 'Satakunta', lat: 61.4851, lon: 21.7974 },
  
  // Ásia
  { name: 'Tokyo', country: 'Japão', state: 'Tóquio', lat: 35.6762, lon: 139.6503 },
  { name: 'Yokohama', country: 'Japão', state: 'Kanagawa', lat: 35.4437, lon: 139.6380 },
  { name: 'Osaka', country: 'Japão', state: 'Osaka', lat: 34.6937, lon: 135.5023 },
  { name: 'Nagoya', country: 'Japão', state: 'Aichi', lat: 35.1815, lon: 136.9066 },
  { name: 'Sapporo', country: 'Japão', state: 'Hokkaido', lat: 43.0618, lon: 141.3545 },
  { name: 'Kobe', country: 'Japão', state: 'Hyogo', lat: 34.6901, lon: 135.1955 },
  { name: 'Kyoto', country: 'Japão', state: 'Kyoto', lat: 35.0116, lon: 135.7681 },
  { name: 'Fukuoka', country: 'Japão', state: 'Fukuoka', lat: 33.5902, lon: 130.4017 },
  { name: 'Kawasaki', country: 'Japão', state: 'Kanagawa', lat: 35.5309, lon: 139.7030 },
  { name: 'Saitama', country: 'Japão', state: 'Saitama', lat: 35.8616, lon: 139.6455 },
  { name: 'Seoul', country: 'Coreia do Sul', state: 'Seul', lat: 37.5665, lon: 126.9780 },
  { name: 'Busan', country: 'Coreia do Sul', state: 'Busan', lat: 35.1796, lon: 129.0756 },
  { name: 'Incheon', country: 'Coreia do Sul', state: 'Incheon', lat: 37.4563, lon: 126.7052 },
  { name: 'Daegu', country: 'Coreia do Sul', state: 'Daegu', lat: 35.8714, lon: 128.6014 },
  { name: 'Daejeon', country: 'Coreia do Sul', state: 'Daejeon', lat: 36.3504, lon: 127.3845 },
  { name: 'Gwangju', country: 'Coreia do Sul', state: 'Gwangju', lat: 35.1595, lon: 126.8526 },
  { name: 'Suwon', country: 'Coreia do Sul', state: 'Gyeonggi', lat: 37.2636, lon: 127.0286 },
  { name: 'Ulsan', country: 'Coreia do Sul', state: 'Ulsan', lat: 35.5384, lon: 129.3114 },
  { name: 'Changwon', country: 'Coreia do Sul', state: 'Gyeongsang do Sul', lat: 35.2278, lon: 128.6817 },
  { name: 'Seongnam', country: 'Coreia do Sul', state: 'Gyeonggi', lat: 37.4449, lon: 127.1389 },
  { name: 'Beijing', country: 'China', state: 'Pequim', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', country: 'China', state: 'Xangai', lat: 31.2304, lon: 121.4737 },
  { name: 'Guangzhou', country: 'China', state: 'Guangdong', lat: 23.1291, lon: 113.2644 },
  { name: 'Shenzhen', country: 'China', state: 'Guangdong', lat: 22.3193, lon: 114.1694 },
  { name: 'Tianjin', country: 'China', state: 'Tianjin', lat: 39.0842, lon: 117.2009 },
  { name: 'Chongqing', country: 'China', state: 'Chongqing', lat: 29.4316, lon: 106.9123 },
  { name: 'Chengdu', country: 'China', state: 'Sichuan', lat: 30.5728, lon: 104.0668 },
  { name: 'Nanjing', country: 'China', state: 'Jiangsu', lat: 32.0603, lon: 118.7969 },
  { name: 'Wuhan', country: 'China', state: 'Hubei', lat: 30.5928, lon: 114.3055 },
  { name: 'Xi\'an', country: 'China', state: 'Shaanxi', lat: 34.3416, lon: 108.9398 },
  { name: 'Hangzhou', country: 'China', state: 'Zhejiang', lat: 30.2741, lon: 120.1551 },
  { name: 'Hong Kong', country: 'China', state: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Singapore', country: 'Singapura', state: 'Singapura', lat: 1.3521, lon: 103.8198 },
  { name: 'Bangkok', country: 'Tailândia', state: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Chiang Mai', country: 'Tailândia', state: 'Chiang Mai', lat: 18.7883, lon: 98.9853 },
  { name: 'Phuket', country: 'Tailândia', state: 'Phuket', lat: 7.8804, lon: 98.3923 },
  { name: 'Pattaya', country: 'Tailândia', state: 'Chonburi', lat: 12.9236, lon: 100.8824 },
  { name: 'Jakarta', country: 'Indonésia', state: 'Jacarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Surabaya', country: 'Indonésia', state: 'Java Oriental', lat: -7.2575, lon: 112.7521 },
  { name: 'Bandung', country: 'Indonésia', state: 'Java Ocidental', lat: -6.9175, lon: 107.6191 },
  { name: 'Medan', country: 'Indonésia', state: 'Sumatra do Norte', lat: 3.5952, lon: 98.6722 },
  { name: 'Semarang', country: 'Indonésia', state: 'Java Central', lat: -6.9932, lon: 110.4203 },
  { name: 'Kuala Lumpur', country: 'Malásia', state: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
  { name: 'George Town', country: 'Malásia', state: 'Penang', lat: 5.4164, lon: 100.3327 },
  { name: 'Ipoh', country: 'Malásia', state: 'Perak', lat: 4.5973, lon: 101.0901 },
  { name: 'Shah Alam', country: 'Malásia', state: 'Selangor', lat: 3.0738, lon: 101.5183 },
  { name: 'Manila', country: 'Filipinas', state: 'Manila', lat: 14.5995, lon: 120.9842 },
  { name: 'Quezon City', country: 'Filipinas', state: 'Metro Manila', lat: 14.6760, lon: 121.0437 },
  { name: 'Davao City', country: 'Filipinas', state: 'Davao', lat: 7.1907, lon: 125.4553 },
  { name: 'Cebu City', country: 'Filipinas', state: 'Cebu', lat: 10.3157, lon: 123.8854 },
  { name: 'Zamboanga City', country: 'Filipinas', state: 'Zamboanga', lat: 6.9214, lon: 122.0790 },
  { name: 'Ho Chi Minh City', country: 'Vietnã', state: 'Ho Chi Minh', lat: 10.8231, lon: 106.6297 },
  { name: 'Hanoi', country: 'Vietnã', state: 'Hanoi', lat: 21.0285, lon: 105.8542 },
  { name: 'Da Nang', country: 'Vietnã', state: 'Da Nang', lat: 16.0544, lon: 108.2022 },
  { name: 'Hai Phong', country: 'Vietnã', state: 'Hai Phong', lat: 20.8449, lon: 106.6881 },
  { name: 'Can Tho', country: 'Vietnã', state: 'Can Tho', lat: 10.0452, lon: 105.7469 },
  { name: 'Phnom Penh', country: 'Camboja', state: 'Phnom Penh', lat: 11.5564, lon: 104.9282 },
  { name: 'Siem Reap', country: 'Camboja', state: 'Siem Reap', lat: 13.3671, lon: 103.8448 },
  { name: 'Battambang', country: 'Camboja', state: 'Battambang', lat: 13.0957, lon: 103.2022 },
  { name: 'Vientiane', country: 'Laos', state: 'Vientiane', lat: 17.9757, lon: 102.6331 },
  { name: 'Luang Prabang', country: 'Laos', state: 'Luang Prabang', lat: 19.8834, lon: 102.1347 },
  { name: 'Yangon', country: 'Myanmar', state: 'Yangon', lat: 16.8661, lon: 96.1951 },
  { name: 'Mandalay', country: 'Myanmar', state: 'Mandalay', lat: 21.9588, lon: 96.0891 },
  { name: 'Naypyidaw', country: 'Myanmar', state: 'Naypyidaw', lat: 19.7633, lon: 96.0785 },
  
  // América Latina
  { name: 'São Paulo', country: 'Brasil', state: 'SP', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'Brasil', state: 'RJ', lat: -22.9068, lon: -43.1729 },
  { name: 'Brasília', country: 'Brasil', state: 'DF', lat: -15.7942, lon: -47.8822 },
  { name: 'Salvador', country: 'Brasil', state: 'BA', lat: -12.9714, lon: -38.5011 },
  { name: 'Fortaleza', country: 'Brasil', state: 'CE', lat: -3.7319, lon: -38.5267 },
  { name: 'Belo Horizonte', country: 'Brasil', state: 'MG', lat: -19.9167, lon: -43.9345 },
  { name: 'Manaus', country: 'Brasil', state: 'AM', lat: -3.1190, lon: -60.0217 },
  { name: 'Curitiba', country: 'Brasil', state: 'PR', lat: -25.4284, lon: -49.2733 },
  { name: 'Recife', country: 'Brasil', state: 'PE', lat: -8.0476, lon: -34.8770 },
  { name: 'Porto Alegre', country: 'Brasil', state: 'RS', lat: -30.0346, lon: -51.2177 },
  { name: 'Goiânia', country: 'Brasil', state: 'GO', lat: -16.6864, lon: -49.2653 },
  { name: 'Guarulhos', country: 'Brasil', state: 'SP', lat: -23.4542, lon: -46.5333 },
  { name: 'Campinas', country: 'Brasil', state: 'SP', lat: -22.9064, lon: -47.0616 },
  { name: 'Nova Iguaçu', country: 'Brasil', state: 'RJ', lat: -22.7559, lon: -43.4606 },
  { name: 'São Gonçalo', country: 'Brasil', state: 'RJ', lat: -22.8269, lon: -43.0539 },
  { name: 'Maceió', country: 'Brasil', state: 'AL', lat: -9.6498, lon: -35.7089 },
  { name: 'João Pessoa', country: 'Brasil', state: 'PB', lat: -7.1150, lon: -34.8631 },
  { name: 'Teresina', country: 'Brasil', state: 'PI', lat: -5.0892, lon: -42.8016 },
  { name: 'Natal', country: 'Brasil', state: 'RN', lat: -5.7945, lon: -35.2090 },
  { name: 'Campo Grande', country: 'Brasil', state: 'MS', lat: -20.4486, lon: -54.6295 },
  { name: 'Cuiabá', country: 'Brasil', state: 'MT', lat: -15.6010, lon: -56.0974 },
  { name: 'Palmas', country: 'Brasil', state: 'TO', lat: -10.1753, lon: -48.2982 },
  { name: 'Boa Vista', country: 'Brasil', state: 'RR', lat: 2.8235, lon: -60.6758 },
  { name: 'Porto Velho', country: 'Brasil', state: 'RO', lat: -8.7619, lon: -63.9039 },
  { name: 'Rio Branco', country: 'Brasil', state: 'AC', lat: -9.9754, lon: -67.8249 },
  { name: 'Macapá', country: 'Brasil', state: 'AP', lat: 0.0349, lon: -51.0505 },
  { name: 'Aracaju', country: 'Brasil', state: 'SE', lat: -10.9091, lon: -37.0677 },
  { name: 'Vitória', country: 'Brasil', state: 'ES', lat: -20.2976, lon: -40.2958 },
  { name: 'Florianópolis', country: 'Brasil', state: 'SC', lat: -27.5969, lon: -48.5495 },
  { name: 'Mexico City', country: 'México', state: 'Cidade do México', lat: 19.4326, lon: -99.1332 },
  { name: 'Guadalajara', country: 'México', state: 'Jalisco', lat: 20.6597, lon: -103.3496 },
  { name: 'Monterrey', country: 'México', state: 'Nuevo León', lat: 25.6866, lon: -100.3161 },
  { name: 'Puebla', country: 'México', state: 'Puebla', lat: 19.0413, lon: -98.2062 },
  { name: 'Tijuana', country: 'México', state: 'Baja California', lat: 32.5149, lon: -117.0382 },
  { name: 'Ciudad Juárez', country: 'México', state: 'Chihuahua', lat: 31.7385, lon: -106.4874 },
  { name: 'León', country: 'México', state: 'Guanajuato', lat: 21.1214, lon: -101.6832 },
  { name: 'Zapopan', country: 'México', state: 'Jalisco', lat: 20.7238, lon: -103.3849 },
  { name: 'Ecatepec', country: 'México', state: 'México', lat: 19.6018, lon: -99.0505 },
  { name: 'Mérida', country: 'México', state: 'Yucatán', lat: 20.9674, lon: -89.5926 },
  { name: 'Aguascalientes', country: 'México', state: 'Aguascalientes', lat: 21.8853, lon: -102.2916 },
  { name: 'Tlalnepantla', country: 'México', state: 'México', lat: 19.5389, lon: -99.1944 },
  { name: 'Buenos Aires', country: 'Argentina', state: 'Buenos Aires', lat: -34.6118, lon: -58.3960 },
  { name: 'Córdoba', country: 'Argentina', state: 'Córdoba', lat: -31.4201, lon: -64.1888 },
  { name: 'Rosario', country: 'Argentina', state: 'Santa Fe', lat: -32.9587, lon: -60.6934 },
  { name: 'Mendoza', country: 'Argentina', state: 'Mendoza', lat: -32.8895, lon: -68.8458 },
  { name: 'San Miguel de Tucumán', country: 'Argentina', state: 'Tucumán', lat: -26.8083, lon: -65.2176 },
  { name: 'La Plata', country: 'Argentina', state: 'Buenos Aires', lat: -34.9205, lon: -57.9536 },
  { name: 'Mar del Plata', country: 'Argentina', state: 'Buenos Aires', lat: -38.0000, lon: -57.5500 },
  { name: 'Salta', country: 'Argentina', state: 'Salta', lat: -24.7859, lon: -65.4117 },
  { name: 'San Juan', country: 'Argentina', state: 'San Juan', lat: -31.5375, lon: -68.5364 },
  { name: 'Resistencia', country: 'Argentina', state: 'Chaco', lat: -27.4512, lon: -58.9866 },
  { name: 'Neuquén', country: 'Argentina', state: 'Neuquén', lat: -38.9516, lon: -68.0591 },
  { name: 'Santiago', country: 'Chile', state: 'Região Metropolitana', lat: -33.4489, lon: -70.6693 },
  { name: 'Valparaíso', country: 'Chile', state: 'Valparaíso', lat: -33.0472, lon: -71.6127 },
  { name: 'Concepción', country: 'Chile', state: 'Biobío', lat: -36.8201, lon: -73.0444 },
  { name: 'La Serena', country: 'Chile', state: 'Coquimbo', lat: -29.9027, lon: -71.2519 },
  { name: 'Antofagasta', country: 'Chile', state: 'Antofagasta', lat: -23.6509, lon: -70.4006 },
  { name: 'Temuco', country: 'Chile', state: 'Araucanía', lat: -38.7397, lon: -72.5984 },
  { name: 'Iquique', country: 'Chile', state: 'Tarapacá', lat: -20.2307, lon: -70.1353 },
  { name: 'Rancagua', country: 'Chile', state: 'O\'Higgins', lat: -34.1706, lon: -70.7446 },
  { name: 'Talca', country: 'Chile', state: 'Maule', lat: -35.4264, lon: -71.6554 },
  { name: 'Arica', country: 'Chile', state: 'Arica y Parinacota', lat: -18.4783, lon: -70.3126 },
  { name: 'Lima', country: 'Peru', state: 'Lima', lat: -12.0464, lon: -77.0428 },
  { name: 'Arequipa', country: 'Peru', state: 'Arequipa', lat: -16.4090, lon: -71.5375 },
  { name: 'Trujillo', country: 'Peru', state: 'La Libertad', lat: -8.1090, lon: -79.0215 },
  { name: 'Chiclayo', country: 'Peru', state: 'Lambayeque', lat: -6.7760, lon: -79.8443 },
  { name: 'Piura', country: 'Peru', state: 'Piura', lat: -5.1945, lon: -80.6328 },
  { name: 'Iquitos', country: 'Peru', state: 'Loreto', lat: -3.7491, lon: -73.2538 },
  { name: 'Cusco', country: 'Peru', state: 'Cusco', lat: -13.5167, lon: -71.9789 },
  { name: 'Chimbote', country: 'Peru', state: 'Ancash', lat: -9.0745, lon: -78.5936 },
  { name: 'Huancayo', country: 'Peru', state: 'Junín', lat: -12.0670, lon: -75.2096 },
  { name: 'Tacna', country: 'Peru', state: 'Tacna', lat: -18.0120, lon: -70.2490 },
  { name: 'Bogotá', country: 'Colômbia', state: 'Bogotá', lat: 4.7110, lon: -74.0721 },
  { name: 'Medellín', country: 'Colômbia', state: 'Antioquia', lat: 6.2442, lon: -75.5812 },
  { name: 'Cali', country: 'Colômbia', state: 'Valle del Cauca', lat: 3.4516, lon: -76.5320 },
  { name: 'Barranquilla', country: 'Colômbia', state: 'Atlántico', lat: 10.9685, lon: -74.7813 },
  { name: 'Cartagena', country: 'Colômbia', state: 'Bolívar', lat: 10.3932, lon: -75.4792 },
  { name: 'Bucaramanga', country: 'Colômbia', state: 'Santander', lat: 7.1258, lon: -73.1293 },
  { name: 'Pereira', country: 'Colômbia', state: 'Risaralda', lat: 4.8143, lon: -75.6946 },
  { name: 'Manizales', country: 'Colômbia', state: 'Caldas', lat: 5.0689, lon: -75.5174 },
  { name: 'Neiva', country: 'Colômbia', state: 'Huila', lat: 2.9273, lon: -75.2819 },
  { name: 'Pasto', country: 'Colômbia', state: 'Nariño', lat: 1.2084, lon: -77.2785 },
  { name: 'Caracas', country: 'Venezuela', state: 'Distrito Capital', lat: 10.4806, lon: -66.9036 },
  { name: 'Maracaibo', country: 'Venezuela', state: 'Zulia', lat: 10.6427, lon: -71.6125 },
  { name: 'Valencia', country: 'Venezuela', state: 'Carabobo', lat: 10.1579, lon: -67.9972 },
  { name: 'Barquisimeto', country: 'Venezuela', state: 'Lara', lat: 10.0731, lon: -69.3227 },
  { name: 'Maracay', country: 'Venezuela', state: 'Aragua', lat: 10.2353, lon: -67.5911 },
  { name: 'Ciudad Guayana', country: 'Venezuela', state: 'Bolívar', lat: 8.3535, lon: -62.6413 },
  { name: 'Maturín', country: 'Venezuela', state: 'Monagas', lat: 9.7499, lon: -63.1763 },
  { name: 'Barcelona', country: 'Venezuela', state: 'Anzoátegui', lat: 10.1363, lon: -64.6862 },
  { name: 'Mérida', country: 'Venezuela', state: 'Mérida', lat: 8.5826, lon: -71.1803 },
  { name: 'San Cristóbal', country: 'Venezuela', state: 'Táchira', lat: 7.7669, lon: -72.2211 },
  { name: 'Quito', country: 'Equador', state: 'Pichincha', lat: -0.1807, lon: -78.4678 },
  { name: 'Guayaquil', country: 'Equador', state: 'Guayas', lat: -2.1894, lon: -79.8891 },
  { name: 'Cuenca', country: 'Equador', state: 'Azuay', lat: -2.9006, lon: -79.0045 },
  { name: 'Manta', country: 'Equador', state: 'Manabí', lat: -0.9677, lon: -80.7089 },
  { name: 'Machala', country: 'Equador', state: 'El Oro', lat: -3.2581, lon: -79.9558 },
  { name: 'Portoviejo', country: 'Equador', state: 'Manabí', lat: -1.0544, lon: -80.4545 },
  { name: 'Esmeraldas', country: 'Equador', state: 'Esmeraldas', lat: 1.0283, lon: -79.4635 },
  { name: 'Ambato', country: 'Equador', state: 'Tungurahua', lat: -1.2491, lon: -78.6168 },
  { name: 'Riobamba', country: 'Equador', state: 'Chimborazo', lat: -1.6734, lon: -78.6473 },
  { name: 'Loja', country: 'Equador', state: 'Loja', lat: -3.9953, lon: -79.2042 },
  { name: 'La Paz', country: 'Bolívia', state: 'La Paz', lat: -16.4897, lon: -68.1193 },
  { name: 'Santa Cruz de la Sierra', country: 'Bolívia', state: 'Santa Cruz', lat: -17.7863, lon: -63.1812 },
  { name: 'Cochabamba', country: 'Bolívia', state: 'Cochabamba', lat: -17.4139, lon: -66.1093 },
  { name: 'Oruro', country: 'Bolívia', state: 'Oruro', lat: -17.9754, lon: -67.1109 },
  { name: 'Sucre', country: 'Bolívia', state: 'Chuquisaca', lat: -19.0196, lon: -65.2619 },
  { name: 'Tarija', country: 'Bolívia', state: 'Tarija', lat: -21.5318, lon: -64.7296 },
  { name: 'Potosí', country: 'Bolívia', state: 'Potosí', lat: -19.5833, lon: -65.7500 },
  { name: 'Trinidad', country: 'Bolívia', state: 'Beni', lat: -14.8333, lon: -64.9000 },
  { name: 'Cobija', country: 'Bolívia', state: 'Pando', lat: -11.0333, lon: -68.7333 },
  { name: 'Asunción', country: 'Paraguai', state: 'Asunción', lat: -25.2802, lon: -57.6341 },
  { name: 'Ciudad del Este', country: 'Paraguai', state: 'Alto Paraná', lat: -25.5167, lon: -54.6333 },
  { name: 'San Lorenzo', country: 'Paraguai', state: 'Central', lat: -25.3397, lon: -57.5087 },
  { name: 'Luque', country: 'Paraguai', state: 'Central', lat: -25.2667, lon: -57.4833 },
  { name: 'Capiatá', country: 'Paraguai', state: 'Central', lat: -25.3500, lon: -57.4167 },
  { name: 'Lambaré', country: 'Paraguai', state: 'Central', lat: -25.3500, lon: -57.6333 },
  { name: 'Fernando de la Mora', country: 'Paraguai', state: 'Central', lat: -25.3167, lon: -57.6000 },
  { name: 'Limpio', country: 'Paraguai', state: 'Central', lat: -25.1667, lon: -57.4833 },
  { name: 'Ñemby', country: 'Paraguai', state: 'Central', lat: -25.3833, lon: -57.4667 },
  { name: 'Encarnación', country: 'Paraguai', state: 'Itapúa', lat: -27.3333, lon: -55.8667 },
  { name: 'Montevideo', country: 'Uruguai', state: 'Montevidéu', lat: -34.9011, lon: -56.1645 },
  { name: 'Salto', country: 'Uruguai', state: 'Salto', lat: -31.3953, lon: -57.9603 },
  { name: 'Paysandú', country: 'Uruguai', state: 'Paysandú', lat: -32.3214, lon: -58.0756 },
  { name: 'Las Piedras', country: 'Uruguai', state: 'Canelones', lat: -34.7263, lon: -56.2200 },
  { name: 'Rivera', country: 'Uruguai', state: 'Rivera', lat: -30.9053, lon: -55.5508 },
  { name: 'Melo', country: 'Uruguai', state: 'Cerro Largo', lat: -32.3667, lon: -54.1833 },
  { name: 'Tacuarembó', country: 'Uruguai', state: 'Tacuarembó', lat: -31.7333, lon: -55.9833 },
  { name: 'Mercedes', country: 'Uruguai', state: 'Soriano', lat: -33.2500, lon: -58.0333 },
  { name: 'Artigas', country: 'Uruguai', state: 'Artigas', lat: -30.4000, lon: -56.4667 },
  { name: 'Havana', country: 'Cuba', state: 'Havana', lat: 23.1136, lon: -82.3666 },
  { name: 'Santiago de Cuba', country: 'Cuba', state: 'Santiago de Cuba', lat: 20.0217, lon: -75.8294 },
  { name: 'Camagüey', country: 'Cuba', state: 'Camagüey', lat: 21.3805, lon: -77.9169 },
  { name: 'Holguín', country: 'Cuba', state: 'Holguín', lat: 20.8883, lon: -76.2573 },
  { name: 'Santa Clara', country: 'Cuba', state: 'Villa Clara', lat: 22.4064, lon: -79.9647 },
  { name: 'Santo Domingo', country: 'República Dominicana', state: 'Distrito Nacional', lat: 18.4861, lon: -69.9312 },
  { name: 'Santiago de los Caballeros', country: 'República Dominicana', state: 'Santiago', lat: 19.4517, lon: -70.6970 },
  { name: 'La Romana', country: 'República Dominicana', state: 'La Romana', lat: 18.4277, lon: -68.9728 },
  { name: 'San Pedro de Macorís', country: 'República Dominicana', state: 'San Pedro de Macorís', lat: 18.4577, lon: -69.3061 },
  { name: 'San Francisco de Macorís', country: 'República Dominicana', state: 'Duarte', lat: 19.3000, lon: -70.2500 },
  { name: 'San Juan', country: 'Porto Rico', state: 'San Juan', lat: 18.4655, lon: -66.1057 },
  { name: 'Bayamón', country: 'Porto Rico', state: 'Bayamón', lat: 18.3985, lon: -66.1619 },
  { name: 'Carolina', country: 'Porto Rico', state: 'Carolina', lat: 18.3808, lon: -65.9574 },
  { name: 'Ponce', country: 'Porto Rico', state: 'Ponce', lat: 18.0111, lon: -66.6141 },
  { name: 'Caguas', country: 'Porto Rico', state: 'Caguas', lat: 18.2341, lon: -66.0355 },
  { name: 'Panama City', country: 'Panamá', state: 'Panamá', lat: 8.5380, lon: -80.7821 },
  { name: 'San Miguelito', country: 'Panamá', state: 'Panamá', lat: 9.0333, lon: -79.5000 },
  { name: 'Tocumen', country: 'Panamá', state: 'Panamá', lat: 9.0833, lon: -79.3833 },
  { name: 'David', country: 'Panamá', state: 'Chiriquí', lat: 8.4333, lon: -82.4333 },
  { name: 'Arraiján', country: 'Panamá', state: 'Panamá', lat: 8.9500, lon: -79.6500 },
  { name: 'San Jose', country: 'Costa Rica', state: 'San José', lat: 9.9281, lon: -84.0907 },
  { name: 'Limón', country: 'Costa Rica', state: 'Limón', lat: 9.9833, lon: -83.0333 },
  { name: 'Alajuela', country: 'Costa Rica', state: 'Alajuela', lat: 10.0167, lon: -84.2167 },
  { name: 'Cartago', country: 'Costa Rica', state: 'Cartago', lat: 9.8667, lon: -83.9167 },
  { name: 'Heredia', country: 'Costa Rica', state: 'Heredia', lat: 9.9985, lon: -84.1165 },
  
  // África
  { name: 'Cairo', country: 'Egito', state: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Alexandria', country: 'Egito', state: 'Alexandria', lat: 31.2001, lon: 29.9187 },
  { name: 'Giza', country: 'Egito', state: 'Giza', lat: 30.0131, lon: 31.2089 },
  { name: 'Shubra El Kheima', country: 'Egito', state: 'Qalyubia', lat: 30.1229, lon: 31.2420 },
  { name: 'Port Said', country: 'Egito', state: 'Port Said', lat: 31.2667, lon: 32.3000 },
  { name: 'Suez', country: 'Egito', state: 'Suez', lat: 29.9667, lon: 32.5500 },
  { name: 'Luxor', country: 'Egito', state: 'Luxor', lat: 25.6872, lon: 32.6396 },
  { name: 'Aswan', country: 'Egito', state: 'Aswan', lat: 24.0889, lon: 32.8997 },
  { name: 'Lagos', country: 'Nigéria', state: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Kano', country: 'Nigéria', state: 'Kano', lat: 11.9914, lon: 8.5313 },
  { name: 'Ibadan', country: 'Nigéria', state: 'Oyo', lat: 7.3964, lon: 3.8966 },
  { name: 'Kaduna', country: 'Nigéria', state: 'Kaduna', lat: 10.5222, lon: 7.4384 },
  { name: 'Port Harcourt', country: 'Nigéria', state: 'Rivers', lat: 4.8156, lon: 7.0498 },
  { name: 'Maiduguri', country: 'Nigéria', state: 'Borno', lat: 11.8333, lon: 13.1500 },
  { name: 'Zaria', country: 'Nigéria', state: 'Kaduna', lat: 11.0667, lon: 7.7000 },
  { name: 'Jos', country: 'Nigéria', state: 'Plateau', lat: 9.8965, lon: 8.8583 },
  { name: 'Kinshasa', country: 'República Democrática do Congo', state: 'Kinshasa', lat: -4.4419, lon: 15.2663 },
  { name: 'Lubumbashi', country: 'República Democrática do Congo', state: 'Alto Katanga', lat: -11.6647, lon: 27.4793 },
  { name: 'Mbuji-Mayi', country: 'República Democrática do Congo', state: 'Kasai Oriental', lat: -6.1500, lon: 23.6000 },
  { name: 'Kananga', country: 'República Democrática do Congo', state: 'Kasai Central', lat: -5.8961, lon: 22.4167 },
  { name: 'Kisangani', country: 'República Democrática do Congo', state: 'Tshopo', lat: 0.5167, lon: 25.2000 },
  { name: 'Bukavu', country: 'República Democrática do Congo', state: 'Kivu do Sul', lat: -2.5000, lon: 28.8667 },
  { name: 'Johannesburg', country: 'África do Sul', state: 'Gauteng', lat: -26.2041, lon: 28.0473 },
  { name: 'Cape Town', country: 'África do Sul', state: 'Cabo Ocidental', lat: -33.9249, lon: 18.4241 },
  { name: 'Durban', country: 'África do Sul', state: 'KwaZulu-Natal', lat: -29.8587, lon: 31.0218 },
  { name: 'Pretoria', country: 'África do Sul', state: 'Gauteng', lat: -25.7479, lon: 28.2293 },
  { name: 'Port Elizabeth', country: 'África do Sul', state: 'Cabo Oriental', lat: -33.7139, lon: 25.5207 },
  { name: 'Bloemfontein', country: 'África do Sul', state: 'Estado Livre', lat: -29.0852, lon: 26.1596 },
  { name: 'East London', country: 'África do Sul', state: 'Cabo Oriental', lat: -33.0292, lon: 27.8546 },
  { name: 'Nelspruit', country: 'África do Sul', state: 'Mpumalanga', lat: -25.4753, lon: 30.9694 },
  { name: 'Kimberley', country: 'África do Sul', state: 'Cabo do Norte', lat: -28.7282, lon: 24.7499 },
  { name: 'Nairobi', country: 'Quênia', state: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { name: 'Mombasa', country: 'Quênia', state: 'Mombasa', lat: -4.0435, lon: 39.6682 },
  { name: 'Kisumu', country: 'Quênia', state: 'Kisumu', lat: -0.1022, lon: 34.7617 },
  { name: 'Nakuru', country: 'Quênia', state: 'Nakuru', lat: -0.3031, lon: 36.0800 },
  { name: 'Eldoret', country: 'Quênia', state: 'Uasin Gishu', lat: 0.5204, lon: 35.2697 },
  { name: 'Thika', country: 'Quênia', state: 'Kiambu', lat: -1.0392, lon: 37.0690 },
  { name: 'Malindi', country: 'Quênia', state: 'Kilifi', lat: -3.2175, lon: 40.1191 },
  { name: 'Addis Ababa', country: 'Etiópia', state: 'Adis Abeba', lat: 9.0320, lon: 38.7636 },
  { name: 'Dire Dawa', country: 'Etiópia', state: 'Dire Dawa', lat: 9.6000, lon: 41.8500 },
  { name: 'Mekelle', country: 'Etiópia', state: 'Tigray', lat: 13.4969, lon: 39.4769 },
  { name: 'Gondar', country: 'Etiópia', state: 'Amhara', lat: 12.6000, lon: 37.4667 },
  { name: 'Bahir Dar', country: 'Etiópia', state: 'Amhara', lat: 11.6000, lon: 37.3833 },
  { name: 'Jimma', country: 'Etiópia', state: 'Oromia', lat: 7.6667, lon: 36.8333 },
  { name: 'Dessie', country: 'Etiópia', state: 'Amhara', lat: 11.1333, lon: 39.6333 },
  { name: 'Shashamane', country: 'Etiópia', state: 'Oromia', lat: 7.2000, lon: 38.6000 },
  { name: 'Casablanca', country: 'Marrocos', state: 'Casablanca-Settat', lat: 33.5731, lon: -7.5898 },
  { name: 'Rabat', country: 'Marrocos', state: 'Rabat-Salé-Kénitra', lat: 34.0209, lon: -6.8416 },
  { name: 'Fez', country: 'Marrocos', state: 'Fez-Meknès', lat: 34.0181, lon: -5.0078 },
  { name: 'Marrakech', country: 'Marrocos', state: 'Marrakech-Safi', lat: 31.6295, lon: -7.9811 },
  { name: 'Agadir', country: 'Marrocos', state: 'Souss-Massa', lat: 30.4278, lon: -9.5981 },
  { name: 'Tangier', country: 'Marrocos', state: 'Tânger-Tetuão-Al Hoceima', lat: 35.7595, lon: -5.8340 },
  { name: 'Meknes', country: 'Marrocos', state: 'Fez-Meknès', lat: 33.8935, lon: -5.5473 },
  { name: 'Oujda', country: 'Marrocos', state: 'Oriental', lat: 34.6814, lon: -1.9086 },
  { name: 'Kenitra', country: 'Marrocos', state: 'Rabat-Salé-Kénitra', lat: 34.2610, lon: -6.5802 },
  { name: 'Algiers', country: 'Argélia', state: 'Argel', lat: 36.7538, lon: 3.0588 },
  { name: 'Oran', country: 'Argélia', state: 'Oran', lat: 35.6969, lon: -0.6331 },
  { name: 'Constantine', country: 'Argélia', state: 'Constantine', lat: 36.3650, lon: 6.6147 },
  { name: 'Annaba', country: 'Argélia', state: 'Annaba', lat: 36.9000, lon: 7.7667 },
  { name: 'Batna', country: 'Argélia', state: 'Batna', lat: 35.5500, lon: 6.1667 },
  { name: 'Blida', country: 'Argélia', state: 'Blida', lat: 36.4700, lon: 2.8300 },
  { name: 'Setif', country: 'Argélia', state: 'Setif', lat: 36.1900, lon: 5.4100 },
  { name: 'Tunis', country: 'Tunísia', state: 'Túnis', lat: 36.8065, lon: 10.1815 },
  { name: 'Sfax', country: 'Tunísia', state: 'Sfax', lat: 34.7475, lon: 10.7662 },
  { name: 'Sousse', country: 'Tunísia', state: 'Sousse', lat: 35.8333, lon: 10.6333 },
  { name: 'Gabès', country: 'Tunísia', state: 'Gabès', lat: 33.8833, lon: 10.1167 },
  { name: 'Ariana', country: 'Tunísia', state: 'Ariana', lat: 36.8667, lon: 10.2000 },
  { name: 'Tripoli', country: 'Líbia', state: 'Trípoli', lat: 32.8872, lon: 13.1913 },
  { name: 'Benghazi', country: 'Líbia', state: 'Benghazi', lat: 32.1167, lon: 20.0667 },
  { name: 'Misrata', country: 'Líbia', state: 'Misrata', lat: 32.3778, lon: 15.0900 },
  { name: 'Khartoum', country: 'Sudão', state: 'Cartum', lat: 15.5007, lon: 32.5599 },
  { name: 'Omdurman', country: 'Sudão', state: 'Cartum', lat: 15.6500, lon: 32.4833 },
  { name: 'Port Sudan', country: 'Sudão', state: 'Mar Vermelho', lat: 19.6167, lon: 37.2167 },
  { name: 'Kassala', country: 'Sudão', state: 'Kassala', lat: 15.4500, lon: 36.4000 },
  { name: 'Dar es Salaam', country: 'Tanzânia', state: 'Dar es Salaam', lat: -6.8230, lon: 39.2695 },
  { name: 'Mwanza', country: 'Tanzânia', state: 'Mwanza', lat: -2.5167, lon: 32.9000 },
  { name: 'Arusha', country: 'Tanzânia', state: 'Arusha', lat: -3.3667, lon: 36.6833 },
  { name: 'Dodoma', country: 'Tanzânia', state: 'Dodoma', lat: -6.1730, lon: 35.7419 },
  { name: 'Mbeya', country: 'Tanzânia', state: 'Mbeya', lat: -8.9000, lon: 33.4500 },
  { name: 'Accra', country: 'Gana', state: 'Grande Acra', lat: 5.5600, lon: -0.2057 },
  { name: 'Kumasi', country: 'Gana', state: 'Ashanti', lat: 6.7000, lon: -1.6167 },
  { name: 'Tamale', country: 'Gana', state: 'Norte', lat: 9.4000, lon: -0.8500 },
  { name: 'Sekondi-Takoradi', country: 'Gana', state: 'Ocidental', lat: 4.9000, lon: -1.7667 },
  { name: 'Sunyani', country: 'Gana', state: 'Bono', lat: 7.3333, lon: -2.3333 },
  { name: 'Dakar', country: 'Senegal', state: 'Dakar', lat: 14.7167, lon: -17.4677 },
  { name: 'Thiès', country: 'Senegal', state: 'Thiès', lat: 14.7833, lon: -16.9333 },
  { name: 'Kaolack', country: 'Senegal', state: 'Kaolack', lat: 14.1500, lon: -16.0833 },
  { name: 'Ziguinchor', country: 'Senegal', state: 'Ziguinchor', lat: 12.5833, lon: -16.2667 },
  { name: 'Saint-Louis', country: 'Senegal', state: 'Saint-Louis', lat: 16.0333, lon: -16.5000 },
  
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

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLocation: (location: { type: 'city', name: string, id: string, coordinates: { lat: number, lon: number } }) => void
}

export default function AddLocationModal({ isOpen, onClose, onAddLocation }: AddLocationModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CityResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<CityResult | null>(null)

  // Busca direta na base local
  const handleSearch = (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    const searchTerm = query.toLowerCase().trim()
    console.log('🔍 Buscando:', searchTerm)

    const results = worldCities
      .filter(city => 
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm) ||
        city.state?.toLowerCase().includes(searchTerm)
      )
      .map(city => ({
        id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        type: 'city',
        displayName: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`,
        coordinates: {
          lat: city.lat,
          lon: city.lon
        },
        country: city.country,
        state: city.state
      }))
      .slice(0, 15)

    console.log('📍 Resultados encontrados:', results.length)
    setSearchResults(results)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    handleSearch(value)
  }

  const handleLocationSelect = (location: CityResult) => {
    setSelectedLocation(location)
    setSearchTerm(location.displayName)
  }

  const handleAddLocation = () => {
    if (selectedLocation) {
      onAddLocation({
        type: 'city',
        name: selectedLocation.displayName,
        id: selectedLocation.id,
        coordinates: selectedLocation.coordinates
      })
      setSelectedLocation(null)
      setSearchTerm('')
      setSearchResults([])
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedLocation(null)
    setSearchTerm('')
    setSearchResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🏙️ Adicionar Cidade Visitada</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar cidade
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Digite o nome da cidade..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Resultados da Busca */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏙️</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.displayName}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="mt-2 text-sm text-gray-500 text-center py-2">
              Nenhuma cidade encontrada. Tente uma busca diferente.
            </div>
          )}
        </div>

        {/* Cidade Selecionada */}
        {selectedLocation && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏙️</span>
              <span className="font-medium text-blue-900">Cidade</span>
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">{selectedLocation.name}</div>
              <div className="text-blue-600">{selectedLocation.displayName}</div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddLocation}
            disabled={!selectedLocation}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar Cidade
          </button>
        </div>
      </div>
    </div>
  )
}

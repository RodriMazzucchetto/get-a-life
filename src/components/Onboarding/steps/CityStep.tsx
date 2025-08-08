'use client'

import { useState, useEffect } from 'react'
import { OnboardingStepProps } from '@/types'

export default function CityStep({ data, onUpdate }: OnboardingStepProps) {
  const [searchTerm, setSearchTerm] = useState(data.city || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Lista de cidades brasileiras para sugestões
  const brazilianCities = [
    'São Paulo, SP',
    'Rio de Janeiro, RJ',
    'Brasília, DF',
    'Salvador, BA',
    'Fortaleza, CE',
    'Belo Horizonte, MG',
    'Manaus, AM',
    'Curitiba, PR',
    'Recife, PE',
    'Porto Alegre, RS',
    'Goiânia, GO',
    'Belém, PA',
    'Guarulhos, SP',
    'Campinas, SP',
    'Nova Iguaçu, RJ',
    'São Gonçalo, RJ',
    'Maceió, AL',
    'Duque de Caxias, RJ',
    'Natal, RN',
    'Teresina, PI',
    'São Luís, MA',
    'Campo Grande, MS',
    'João Pessoa, PB',
    'Jaboatão dos Guararapes, PE',
    'Contagem, MG',
    'São José dos Campos, SP',
    'Uberlândia, MG',
    'Feira de Santana, BA',
    'Ribeirão Preto, SP',
    'Sorocaba, SP',
    'Aracaju, SE',
    'Cuiabá, MT',
    'Juiz de Fora, MG',
    'Londrina, PR',
    'Joinville, SC',
    'Niterói, RJ',
    'Ananindeua, PA',
    'Belford Roxo, RJ',
    'Aparecida de Goiânia, GO',
    'Campos dos Goytacazes, RJ',
    'Mauá, SP',
    'Caxias do Sul, RS',
    'Moji das Cruzes, SP',
    'Diadema, SP',
    'Piracicaba, SP',
    'Bauru, SP',
    'Montes Claros, MG',
    'Itaquaquecetuba, SP',
    'Carapicuíba, SP',
    'São José do Rio Preto, SP',
    'Franca, SP',
    'Ribeirão das Neves, MG',
    'Blumenau, SC',
    'Foz do Iguaçu, PR',
    'Petrópolis, RJ',
    'Vila Velha, ES',
    'Ponta Grossa, PR',
    'Paulista, PE',
    'Uberaba, MG',
    'Cariacica, ES',
    'Boa Vista, RR',
    'Vitória, ES',
    'Petrópolis, RJ',
    'Caucaia, CE',
    'Caruaru, PE',
    'Vitória da Conquista, BA',
    'Itabuna, BA',
    'Santa Maria, RS',
    'Cascavel, PR',
    'Guarujá, SP',
    'Ribeirão Pires, SP',
    'São José, SC',
    'Taubaté, SP',
    'Limeira, SP',
    'Pindamonhangaba, SP',
    'Jundiaí, SP',
    'Itapevi, SP',
    'Cotia, SP',
    'Ferraz de Vasconcelos, SP',
    'Barueri, SP',
    'Santana de Parnaíba, SP',
    'Itu, SP',
    'Pindamonhangaba, SP',
    'Bragança Paulista, SP',
    'Atibaia, SP',
    'Mogi Guaçu, SP',
    'Araraquara, SP',
    'Botucatu, SP',
    'Jaú, SP',
    'Bebedouro, SP',
    'Catanduva, SP',
    'São Carlos, SP',
    'Araras, SP',
    'Leme, SP',
    'Pirassununga, SP',
    'Itapetininga, SP',
    'Tatuí, SP',
    'Ituverava, SP',
    'Barretos, SP',
    'Batatais, SP',
    'Sertãozinho, SP',
    'Jaboticabal, SP',
    'Taquaritinga, SP',
    'Matão, SP',
    'Américo Brasiliense, SP',
    'Santa Bárbara d\'Oeste, SP',
    'Nova Odessa, SP',
    'Sumaré, SP',
    'Hortolândia, SP',
    'Valinhos, SP',
    'Vinhedo, SP',
    'Louveira, SP',
    'Várzea Paulista, SP',
    'Jundiaí, SP',
    'Campo Limpo Paulista, SP',
    'Itatiba, SP',
    'Jarinu, SP',
    'Atibaia, SP',
    'Bom Jesus dos Perdões, SP',
    'Nazaré Paulista, SP',
    'Piracaia, SP',
    'Mairiporã, SP',
    'Franco da Rocha, SP',
    'Caieiras, SP',
    'Cajamar, SP',
    'Santana de Parnaíba, SP',
    'Pirapora do Bom Jesus, SP',
    'Araçariguama, SP',
    'São Roque, SP',
    'Mairinque, SP',
    'Alumínio, SP',
    'Ibiúna, SP',
    'Piedade, SP',
    'Tapiraí, SP',
    'Juquitiba, SP',
    'Embu-Guaçu, SP',
    'Itapecerica da Serra, SP',
    'Cotia, SP',
    'Vargem Grande Paulista, SP',
    'Carapicuíba, SP',
    'Osasco, SP',
    'Barueri, SP',
    'Santana de Parnaíba, SP',
    'Pirapora do Bom Jesus, SP',
    'Cajamar, SP',
    'Caieiras, SP',
    'Franco da Rocha, SP',
    'Mairiporã, SP',
    'Nazaré Paulista, SP',
    'Piracaia, SP',
    'Bom Jesus dos Perdões, SP',
    'Atibaia, SP',
    'Jarinu, SP',
    'Campo Limpo Paulista, SP',
    'Várzea Paulista, SP',
    'Louveira, SP',
    'Vinhedo, SP',
    'Valinhos, SP',
    'Hortolândia, SP',
    'Sumaré, SP',
    'Nova Odessa, SP',
    'Santa Bárbara d\'Oeste, SP',
    'Américo Brasiliense, SP',
    'Matão, SP',
    'Taquaritinga, SP',
    'Jaboticabal, SP',
    'Sertãozinho, SP',
    'Batatais, SP',
    'Barretos, SP',
    'Ituverava, SP',
    'Tatuí, SP',
    'Itapetininga, SP',
    'Pirassununga, SP',
    'Leme, SP',
    'Araras, SP',
    'São Carlos, SP',
    'Catanduva, SP',
    'Bebedouro, SP',
    'Jaú, SP',
    'Botucatu, SP',
    'Araraquara, SP',
    'Mogi Guaçu, SP',
    'Atibaia, SP',
    'Bragança Paulista, SP',
    'Itu, SP',
    'Santana de Parnaíba, SP',
    'Barueri, SP',
    'Cotia, SP',
    'Itapevi, SP',
    'Jundiaí, SP',
    'Pindamonhangaba, SP',
    'Limeira, SP',
    'Taubaté, SP',
    'São José, SC',
    'Ribeirão Pires, SP',
    'Guarujá, SP',
    'Cascavel, PR',
    'Santa Maria, RS',
    'Itabuna, BA',
    'Vitória da Conquista, BA',
    'Caruaru, PE',
    'Caucaia, CE',
    'Petrópolis, RJ',
    'Vitória, ES',
    'Boa Vista, RR',
    'Cariacica, ES',
    'Uberaba, MG',
    'Paulista, PE',
    'Ponta Grossa, PR',
    'Vila Velha, ES',
    'Petrópolis, RJ',
    'Foz do Iguaçu, PR',
    'Blumenau, SC',
    'Ribeirão das Neves, MG',
    'Franca, SP',
    'São José do Rio Preto, SP',
    'Carapicuíba, SP',
    'Itaquaquecetuba, SP',
    'Montes Claros, MG',
    'Bauru, SP',
    'Piracicaba, SP',
    'Diadema, SP',
    'Moji das Cruzes, SP',
    'Caxias do Sul, RS',
    'Mauá, SP',
    'Campos dos Goytacazes, RJ',
    'Aparecida de Goiânia, GO',
    'Belford Roxo, RJ',
    'Ananindeua, PA',
    'Niterói, RJ',
    'Joinville, SC',
    'Londrina, PR',
    'Juiz de Fora, MG',
    'Cuiabá, MT',
    'Aracaju, SE',
    'Sorocaba, SP',
    'Ribeirão Preto, SP',
    'Feira de Santana, BA',
    'Uberlândia, MG',
    'São José dos Campos, SP',
    'Contagem, MG',
    'Jaboatão dos Guararapes, PE',
    'João Pessoa, PB',
    'Campo Grande, MS',
    'São Luís, MA',
    'Teresina, PI',
    'Natal, RN',
    'Duque de Caxias, RJ',
    'Maceió, AL',
    'São Gonçalo, RJ',
    'Nova Iguaçu, RJ',
    'Campinas, SP',
    'Guarulhos, SP',
    'Belém, PA',
    'Goiânia, GO',
    'Porto Alegre, RS',
    'Recife, PE',
    'Curitiba, PR',
    'Manaus, AM',
    'Belo Horizonte, MG',
    'Fortaleza, CE',
    'Salvador, BA',
    'Brasília, DF',
    'Rio de Janeiro, RJ',
    'São Paulo, SP'
  ]

  useEffect(() => {
    if (searchTerm.length > 2) {
      const filtered = brazilianCities.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleCitySelect = (city: string) => {
    setSearchTerm(city)
    setShowSuggestions(false)
    onUpdate({ city })
  }

  const handleInputChange = (value: string) => {
    setSearchTerm(value)
    onUpdate({ city: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qual cidade você mora atualmente?
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Digite o nome da sua cidade..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            autoFocus
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          Digite o nome da sua cidade para receber sugestões personalizadas para sua região.
        </p>
      </div>

      {data.city && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Cidade selecionada: <span className="font-semibold">{data.city}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
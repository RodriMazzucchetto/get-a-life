// =====================================================
// SCRIPT PARA CORRIGIR DADOS DE VIAGENS NO LOCALSTORAGE
// Usuário: rodri.depaula@gmail.com
// =====================================================

console.log('🔧 Iniciando correção dos dados de viagens...');

// Função para corrigir os dados
function fixTravelData() {
  try {
    // 1. Verificar dados atuais
    const currentData = localStorage.getItem('visitedCities');
    if (!currentData) {
      console.log('❌ Nenhum dado de viagens encontrado no localStorage');
      return;
    }

    const cities = JSON.parse(currentData);
    console.log('📊 Dados atuais:', cities.length, 'cidades');

    // 2. Verificar países únicos atuais
    const currentCountries = new Set(cities.map(city => city.country));
    console.log('🌍 Países atuais:', Array.from(currentCountries));
    console.log('📈 Total de países:', currentCountries.size);

    // 3. Dados corretos que deveriam estar lá
    const correctCities = [
      // Brasil (30 cidades)
      { id: 'brasil-1', type: 'city', name: 'São Paulo', displayName: 'São Paulo', coordinates: [-46.6333, -23.5505], country: 'Brasil', state: 'São Paulo' },
      { id: 'brasil-2', type: 'city', name: 'Rio de Janeiro', displayName: 'Rio de Janeiro', coordinates: [-43.1729, -22.9068], country: 'Brasil', state: 'Rio de Janeiro' },
      { id: 'brasil-3', type: 'city', name: 'Belo Horizonte', displayName: 'Belo Horizonte', coordinates: [-43.9345, -19.9167], country: 'Brasil', state: 'Minas Gerais' },
      { id: 'brasil-4', type: 'city', name: 'Curitiba', displayName: 'Curitiba', coordinates: [-49.2671, -25.4289], country: 'Brasil', state: 'Paraná' },
      { id: 'brasil-5', type: 'city', name: 'Porto Alegre', displayName: 'Porto Alegre', coordinates: [-51.2177, -30.0346], country: 'Brasil', state: 'Rio Grande do Sul' },
      { id: 'brasil-6', type: 'city', name: 'Florianópolis', displayName: 'Florianópolis', coordinates: [-48.5495, -27.5969], country: 'Brasil', state: 'Santa Catarina' },
      { id: 'brasil-7', type: 'city', name: 'Salvador', displayName: 'Salvador', coordinates: [-38.5011, -12.9714], country: 'Brasil', state: 'Bahia' },
      { id: 'brasil-8', type: 'city', name: 'Recife', displayName: 'Recife', coordinates: [-34.8770, -8.0476], country: 'Brasil', state: 'Pernambuco' },
      { id: 'brasil-9', type: 'city', name: 'Fortaleza', displayName: 'Fortaleza', coordinates: [-38.5267, -3.7319], country: 'Brasil', state: 'Ceará' },
      { id: 'brasil-10', type: 'city', name: 'Brasília', displayName: 'Brasília', coordinates: [-47.8822, -15.7942], country: 'Brasil', state: 'Distrito Federal' },
      { id: 'brasil-11', type: 'city', name: 'Goiânia', displayName: 'Goiânia', coordinates: [-49.2653, -16.6864], country: 'Brasil', state: 'Goiás' },
      { id: 'brasil-12', type: 'city', name: 'Campo Grande', displayName: 'Campo Grande', coordinates: [-54.6295, -20.4486], country: 'Brasil', state: 'Mato Grosso do Sul' },
      { id: 'brasil-13', type: 'city', name: 'Cuiabá', displayName: 'Cuiabá', coordinates: [-56.0974, -15.6010], country: 'Brasil', state: 'Mato Grosso' },
      { id: 'brasil-14', type: 'city', name: 'Manaus', displayName: 'Manaus', coordinates: [-60.0217, -3.1190], country: 'Brasil', state: 'Amazonas' },
      { id: 'brasil-15', type: 'city', name: 'Belém', displayName: 'Belém', coordinates: [-48.4898, -1.4554], country: 'Brasil', state: 'Pará' },
      { id: 'brasil-16', type: 'city', name: 'São Luís', displayName: 'São Luís', coordinates: [-44.3028, -2.5297], country: 'Brasil', state: 'Maranhão' },
      { id: 'brasil-17', type: 'city', name: 'Teresina', displayName: 'Teresina', coordinates: [-42.8016, -5.0892], country: 'Brasil', state: 'Piauí' },
      { id: 'brasil-18', type: 'city', name: 'Natal', displayName: 'Natal', coordinates: [-35.2090, -5.7945], country: 'Brasil', state: 'Rio Grande do Norte' },
      { id: 'brasil-19', type: 'city', name: 'João Pessoa', displayName: 'João Pessoa', coordinates: [-34.8631, -7.1150], country: 'Brasil', state: 'Paraíba' },
      { id: 'brasil-20', type: 'city', name: 'Maceió', displayName: 'Maceió', coordinates: [-35.7089, -9.6498], country: 'Brasil', state: 'Alagoas' },
      { id: 'brasil-21', type: 'city', name: 'Aracaju', displayName: 'Aracaju', coordinates: [-37.0677, -10.9091], country: 'Brasil', state: 'Sergipe' },
      { id: 'brasil-22', type: 'city', name: 'Vitória', displayName: 'Vitória', coordinates: [-40.2958, -20.2976], country: 'Brasil', state: 'Espírito Santo' },
      { id: 'brasil-23', type: 'city', name: 'Palmas', displayName: 'Palmas', coordinates: [-48.2982, -10.1753], country: 'Brasil', state: 'Tocantins' },
      { id: 'brasil-24', type: 'city', name: 'Boa Vista', displayName: 'Boa Vista', coordinates: [-60.6758, 2.8235], country: 'Brasil', state: 'Roraima' },
      { id: 'brasil-25', type: 'city', name: 'Porto Velho', displayName: 'Porto Velho', coordinates: [-63.9039, -8.7619], country: 'Brasil', state: 'Rondônia' },
      { id: 'brasil-26', type: 'city', name: 'Rio Branco', displayName: 'Rio Branco', coordinates: [-67.8249, -9.9754], country: 'Brasil', state: 'Acre' },
      { id: 'brasil-27', type: 'city', name: 'Macapá', displayName: 'Macapá', coordinates: [-51.0504, 0.0349], country: 'Brasil', state: 'Amapá' },
      { id: 'brasil-28', type: 'city', name: 'Londrina', displayName: 'Londrina', coordinates: [-51.1593, -23.3105], country: 'Brasil', state: 'Paraná' },
      { id: 'brasil-29', type: 'city', name: 'Joinville', displayName: 'Joinville', coordinates: [-48.8467, -26.3031], country: 'Brasil', state: 'Santa Catarina' },
      { id: 'brasil-30', type: 'city', name: 'Caxias do Sul', displayName: 'Caxias do Sul', coordinates: [-51.1794, -29.1686], country: 'Brasil', state: 'Rio Grande do Sul' },

      // Argentina (5 cidades)
      { id: 'argentina-1', type: 'city', name: 'Buenos Aires', displayName: 'Buenos Aires', coordinates: [-58.3960, -34.6118], country: 'Argentina', state: 'Buenos Aires' },
      { id: 'argentina-2', type: 'city', name: 'Córdoba', displayName: 'Córdoba', coordinates: [-64.1833, -31.4167], country: 'Argentina', state: 'Córdoba' },
      { id: 'argentina-3', type: 'city', name: 'Rosario', displayName: 'Rosario', coordinates: [-60.6393, -32.9468], country: 'Argentina', state: 'Santa Fe' },
      { id: 'argentina-4', type: 'city', name: 'Mendoza', displayName: 'Mendoza', coordinates: [-68.8272, -32.8908], country: 'Argentina', state: 'Mendoza' },
      { id: 'argentina-5', type: 'city', name: 'Salta', displayName: 'Salta', coordinates: [-65.4116, -24.7859], country: 'Argentina', state: 'Salta' },

      // Paraguai (2 cidades)
      { id: 'paraguai-1', type: 'city', name: 'Asunción', displayName: 'Asunción', coordinates: [-57.5759, -25.2637], country: 'Paraguai', state: 'Central' },
      { id: 'paraguai-2', type: 'city', name: 'Ciudad del Este', displayName: 'Ciudad del Este', coordinates: [-54.6167, -25.5167], country: 'Paraguai', state: 'Alto Paraná' },

      // Bolívia (2 cidades)
      { id: 'bolivia-1', type: 'city', name: 'La Paz', displayName: 'La Paz', coordinates: [-68.1193, -16.4897], country: 'Bolívia', state: 'La Paz' },
      { id: 'bolivia-2', type: 'city', name: 'Sucre', displayName: 'Sucre', coordinates: [-65.2619, -19.0196], country: 'Bolívia', state: 'Chuquisaca' },

      // Chile (2 cidades)
      { id: 'chile-1', type: 'city', name: 'Santiago', displayName: 'Santiago', coordinates: [-70.6693, -33.4489], country: 'Chile', state: 'Región Metropolitana' },
      { id: 'chile-2', type: 'city', name: 'Valparaíso', displayName: 'Valparaíso', coordinates: [-71.6127, -33.0472], country: 'Chile', state: 'Valparaíso' }
    ];

    // 4. Limpar dados corrompidos e inserir dados corretos
    localStorage.removeItem('visitedCities');
    localStorage.setItem('visitedCities', JSON.stringify(correctCities));

    // 5. Verificar resultado
    const newData = localStorage.getItem('visitedCities');
    const newCities = JSON.parse(newData);
    const newCountries = new Set(newCities.map(city => city.country));

    console.log('✅ Correção concluída!');
    console.log('📊 Novos dados:', newCities.length, 'cidades');
    console.log('🌍 Novos países:', Array.from(newCountries));
    console.log('📈 Total de países:', newCountries.size);

    // 6. Recarregar a página para aplicar as mudanças
    console.log('🔄 Recarregando página para aplicar mudanças...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar a correção
fixTravelData();

// =====================================================
// INSTRUÇÕES DE USO:
// 1. Abra o console do navegador (F12 → Console)
// 2. Cole e execute este script
// 3. A página será recarregada automaticamente
// 4. Verifique se o contador de países mudou de 6 para 5
// =====================================================

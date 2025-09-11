// Script para inserir atividades funcionando
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const USER_ID = 'd850ecfc-eb14-45fd-8958-907c003576bb'

const activities = [
  // Viagens
  {
    category: 'Viagens',
    title: 'Viagem para Europa',
    description: 'Explorar países europeus como França, Itália e Espanha',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Road trip pelo Brasil',
    description: 'Conhecer diferentes regiões do Brasil de carro',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Viagem para Ásia',
    description: 'Conhecer Japão, Tailândia e Singapura',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Cruzeiro pelo Caribe',
    description: 'Relaxar em ilhas paradisíacas',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Viagem de mochilão',
    description: 'Viajar com orçamento baixo e conhecer pessoas',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Viagem de lua de mel',
    description: 'Destino romântico para comemorar o casamento',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Viagem cultural',
    description: 'Focar em museus, história e arte',
    tags: ['Pessoal', 'Aventura']
  },
  {
    category: 'Viagens',
    title: 'Viagem de aventura',
    description: 'Trekking, escalada e esportes radicais',
    tags: ['Pessoal', 'Aventura']
  },
  
  // Mini Aventuras
  {
    category: 'Mini Aventuras',
    title: 'Caminhada em trilha local',
    description: 'Explorar trilhas próximas da cidade',
    tags: ['Natureza', 'Urbano']
  },
  {
    category: 'Mini Aventuras',
    title: 'Passeio de bicicleta',
    description: 'Pedalar por parques ou ciclovias da cidade',
    tags: ['Natureza', 'Urbano']
  },
  {
    category: 'Mini Aventuras',
    title: 'Acampamento de fim de semana',
    description: 'Passar a noite em camping ou área de camping',
    tags: ['Natureza', 'Urbano']
  },
  {
    category: 'Mini Aventuras',
    title: 'Explorar bairros novos',
    description: 'Conhecer áreas da cidade que nunca visitou',
    tags: ['Natureza', 'Urbano']
  },
  
  // Esporte
  {
    category: 'Esporte',
    title: 'Futebol com amigos',
    description: 'Jogar futebol no final de semana',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Corrida de rua',
    description: 'Participar de corridas de 5K, 10K ou meia maratona',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Natação',
    description: 'Praticar natação regularmente',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Tênis',
    description: 'Aprender ou praticar tênis',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Musculação',
    description: 'Treinar na academia',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Yoga',
    description: 'Praticar yoga para relaxamento',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Ciclismo',
    description: 'Pedalar regularmente',
    tags: ['Individual', 'Equipe']
  },
  {
    category: 'Esporte',
    title: 'Vôlei de praia',
    description: 'Jogar vôlei na praia',
    tags: ['Individual', 'Equipe']
  },
  
  // Crescimento
  {
    category: 'Crescimento',
    title: 'Ler livros de desenvolvimento pessoal',
    description: 'Ler sobre produtividade, liderança e crescimento',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Fazer curso online',
    description: 'Aprender novas habilidades através de cursos',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Aprender novo idioma',
    description: 'Estudar inglês, espanhol ou outro idioma',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Meditação',
    description: 'Praticar meditação diariamente',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Terapia ou coaching',
    description: 'Sessões de terapia ou coaching para desenvolvimento pessoal',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Escrever um diário',
    description: 'Refletir sobre o dia e registrar pensamentos',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Aprender a tocar um instrumento',
    description: 'Estudar música e aprender a tocar',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Fazer networking',
    description: 'Participar de eventos profissionais',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Voluntariado',
    description: 'Contribuir com causas sociais',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Crescimento',
    title: 'Aprender programação',
    description: 'Estudar desenvolvimento de software',
    tags: ['Pessoal', 'Profissional']
  },
  
  // Social
  {
    category: 'Social',
    title: 'Happy hour com colegas',
    description: 'Sair para beber com colegas de trabalho',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Social',
    title: 'Jantar com amigos',
    description: 'Organizar jantares com grupo de amigos',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Social',
    title: 'Festa de aniversário',
    description: 'Celebrar aniversários de amigos e familiares',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Social',
    title: 'Evento de networking',
    description: 'Participar de eventos profissionais',
    tags: ['Pessoal', 'Profissional']
  },
  {
    category: 'Social',
    title: 'Churrasco na casa de alguém',
    description: 'Participar de churrascos e confraternizações',
    tags: ['Pessoal', 'Profissional']
  },
  
  // Relacionamentos
  {
    category: 'Relacionamentos',
    title: 'Encontro romântico',
    description: 'Sair para jantar ou passear com o(a) parceiro(a)',
    tags: ['Romântico', 'Familiar']
  },
  {
    category: 'Relacionamentos',
    title: 'Viagem em casal',
    description: 'Viajar junto com o(a) parceiro(a)',
    tags: ['Romântico', 'Familiar']
  },
  {
    category: 'Relacionamentos',
    title: 'Visitar família',
    description: 'Passar tempo com pais, irmãos e parentes',
    tags: ['Romântico', 'Familiar']
  },
  {
    category: 'Relacionamentos',
    title: 'Celebrar datas especiais',
    description: 'Comemorar aniversários, Dia das Mães, etc.',
    tags: ['Romântico', 'Familiar']
  },
  
  // Lifestyle
  {
    category: 'Lifestyle',
    title: 'Reorganizar a casa',
    description: 'Fazer limpeza e organização do lar',
    tags: ['Pessoal']
  },
  {
    category: 'Lifestyle',
    title: 'Cozinhar uma receita nova',
    description: 'Experimentar pratos diferentes na cozinha',
    tags: ['Pessoal']
  },
  {
    category: 'Lifestyle',
    title: 'Assistir série ou filme',
    description: 'Maratonar séries ou assistir filmes',
    tags: ['Pessoal']
  },
  {
    category: 'Lifestyle',
    title: 'Relaxar em casa',
    description: 'Dia de descanso e relaxamento',
    tags: ['Pessoal']
  }
]

async function insertActivities() {
  console.log('🚀 Inserindo atividades...')
  
  // Primeiro, buscar os IDs das categorias
  const { data: categories, error: categoriesError } = await supabase
    .from('offwork_categories')
    .select('id, name')
  
  if (categoriesError) {
    console.error('❌ Erro ao buscar categorias:', categoriesError)
    return
  }
  
  const categoryMap = {}
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id
  })
  
  console.log('📋 Categorias encontradas:', Object.keys(categoryMap))
  
  // Inserir atividades
  let successCount = 0
  let errorCount = 0
  
  for (const activity of activities) {
    const categoryId = categoryMap[activity.category]
    
    if (!categoryId) {
      console.error(`❌ Categoria não encontrada: ${activity.category}`)
      errorCount++
      continue
    }
    
    const { data, error } = await supabase
      .from('offwork_activities')
      .insert({
        user_id: USER_ID,
        category_id: categoryId,
        title: activity.title,
        description: activity.description,
        tags: activity.tags,
        status: 'pending',
        priority: 'medium'
      })
    
    if (error) {
      console.error(`❌ Erro ao inserir "${activity.title}":`, error.message)
      errorCount++
    } else {
      console.log(`✅ Inserido: ${activity.title}`)
      successCount++
    }
  }
  
  console.log(`\n📊 Resultado:`)
  console.log(`✅ Sucessos: ${successCount}`)
  console.log(`❌ Erros: ${errorCount}`)
  console.log(`📝 Total: ${activities.length}`)
  
  // Verificar quantas atividades foram inseridas
  const { data: insertedActivities, error: checkError } = await supabase
    .from('offwork_activities')
    .select('id')
    .eq('user_id', USER_ID)
  
  if (!checkError) {
    console.log(`\n🎯 Total de atividades no banco: ${insertedActivities.length}`)
  }
}

insertActivities().catch(console.error)

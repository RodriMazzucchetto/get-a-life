// Script para testar se as atividades estão no banco
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testActivities() {
  console.log('🔍 Verificando atividades no banco...')
  
  // Verificar se existem atividades
  const { data: activities, error: activitiesError } = await supabase
    .from('offwork_activities')
    .select(`
      *,
      offwork_categories (
        id,
        name,
        color,
        icon
      )
    `)
    .eq('user_id', 'd850ecfc-eb14-45fd-8958-907c003576bb')
    .order('created_at', { ascending: false })

  if (activitiesError) {
    console.error('❌ Erro ao buscar atividades:', activitiesError)
    return
  }

  console.log(`✅ Encontradas ${activities.length} atividades`)
  
  if (activities.length > 0) {
    console.log('\n📋 Primeiras 5 atividades:')
    activities.slice(0, 5).forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.offwork_categories?.name})`)
      console.log(`   Tags: ${activity.tags?.join(', ') || 'Nenhuma'}`)
    })
  } else {
    console.log('❌ Nenhuma atividade encontrada!')
  }

  // Verificar categorias
  const { data: categories, error: categoriesError } = await supabase
    .from('offwork_categories')
    .select('*')
    .order('order')

  if (categoriesError) {
    console.error('❌ Erro ao buscar categorias:', categoriesError)
    return
  }

  console.log(`\n✅ Encontradas ${categories.length} categorias`)
  categories.forEach(category => {
    console.log(`- ${category.name} (${category.color})`)
  })
}

testActivities().catch(console.error)

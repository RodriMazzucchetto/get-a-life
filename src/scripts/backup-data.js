// SCRIPT DE BACKUP DOS DADOS DE PRODUÇÃO
// Execute com: npm run backup-data

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backupProductionData() {
  console.log('🔄 Iniciando backup dos dados de produção...')
  
  try {
    // 1. Backup de TODOS os todos
    console.log('📝 Buscando todos...')
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })

    if (todosError) {
      console.error('❌ Erro ao buscar todos:', todosError)
      return
    }

    // 2. Backup de projetos
    console.log('📁 Buscando projetos...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    if (projectsError) {
      console.error('❌ Erro ao buscar projetos:', projectsError)
      return
    }

    // 3. Backup de metas
    console.log('🎯 Buscando metas...')
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError)
      return
    }

    // 4. Backup de iniciativas
    console.log('🚀 Buscando iniciativas...')
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')

    if (initiativesError) {
      console.error('❌ Erro ao buscar iniciativas:', initiativesError)
      return
    }

    // 5. Backup de lembretes
    console.log('⏰ Buscando lembretes...')
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')

    if (remindersError) {
      console.error('❌ Erro ao buscar lembretes:', remindersError)
      return
    }

    // 6. Backup de tags
    console.log('🏷️ Buscando tags...')
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')

    if (tagsError) {
      console.error('❌ Erro ao buscar tags:', tagsError)
      return
    }

    // 7. Criar arquivo de backup
    const backupData = {
      timestamp: new Date().toISOString(),
      todos: todos || [],
      projects: projects || [],
      goals: goals || [],
      initiatives: initiatives || [],
      reminders: reminders || [],
      tags: tags || [],
      summary: {
        totalTodos: todos?.length || 0,
        totalProjects: projects?.length || 0,
        totalGoals: goals?.length || 0,
        totalInitiatives: initiatives?.length || 0,
        totalReminders: reminders?.length || 0,
        totalTags: tags?.length || 0
      }
    }

    // Salvar backup
    const fs = require('fs')
    const path = require('path')
    const backupFile = path.join(__dirname, `../backup-production-${new Date().toISOString().split('T')[0]}.json`)
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    
    console.log('✅ Backup concluído com sucesso!')
    console.log(`📁 Arquivo: ${backupFile}`)
    console.log('📊 Resumo:')
    console.log(`   - Todos: ${backupData.summary.totalTodos}`)
    console.log(`   - Projetos: ${backupData.summary.totalProjects}`)
    console.log(`   - Metas: ${backupData.summary.totalGoals}`)
    console.log(`   - Iniciativas: ${backupData.summary.totalInitiatives}`)
    console.log(`   - Lembretes: ${backupData.summary.totalReminders}`)
    console.log(`   - Tags: ${backupData.summary.totalTags}`)
    
    // Mostrar alguns exemplos de todos para verificar
    if (todos && todos.length > 0) {
      console.log('\n📝 Exemplos de todos (primeiros 5):')
      todos.slice(0, 5).forEach((todo, index) => {
        console.log(`   ${index + 1}. [${todo.status}] ${todo.title}`)
        if (todo.rank) console.log(`      Rank: ${todo.rank}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral no backup:', error)
  }
}

// Executar backup
backupProductionData()

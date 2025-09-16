// SCRIPT DE BACKUP DOS DADOS DE PRODUÇÃO
// Execute este script para fazer backup completo antes da refatoração

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function backupProductionData() {
  console.log('🔄 Iniciando backup dos dados de produção...')
  
  try {
    // 1. Backup de TODOS os todos
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })

    if (todosError) {
      console.error('❌ Erro ao buscar todos:', todosError)
      return
    }

    // 2. Backup de projetos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    if (projectsError) {
      console.error('❌ Erro ao buscar projetos:', projectsError)
      return
    }

    // 3. Backup de metas
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError)
      return
    }

    // 4. Backup de iniciativas
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')

    if (initiativesError) {
      console.error('❌ Erro ao buscar iniciativas:', initiativesError)
      return
    }

    // 5. Backup de lembretes
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')

    if (remindersError) {
      console.error('❌ Erro ao buscar lembretes:', remindersError)
      return
    }

    // 6. Backup de tags
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
    const backupFile = `backup-production-${new Date().toISOString().split('T')[0]}.json`
    
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
      console.log('\n📝 Exemplos de todos (primeiros 3):')
      todos.slice(0, 3).forEach((todo, index) => {
        console.log(`   ${index + 1}. [${todo.status}] ${todo.title}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral no backup:', error)
  }
}

// Executar backup
backupProductionData()

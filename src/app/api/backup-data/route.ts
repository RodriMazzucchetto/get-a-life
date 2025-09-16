import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Iniciando backup dos dados de produção...')
    
    // 1. Backup de TODOS os todos
    console.log('📝 Buscando todos...')
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })

    if (todosError) {
      console.error('❌ Erro ao buscar todos:', todosError)
      return NextResponse.json({ error: 'Erro ao buscar todos' }, { status: 500 })
    }

    // 2. Backup de projetos
    console.log('📁 Buscando projetos...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    if (projectsError) {
      console.error('❌ Erro ao buscar projetos:', projectsError)
      return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 })
    }

    // 3. Backup de metas
    console.log('🎯 Buscando metas...')
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError)
      return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 })
    }

    // 4. Backup de iniciativas
    console.log('🚀 Buscando iniciativas...')
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')

    if (initiativesError) {
      console.error('❌ Erro ao buscar iniciativas:', initiativesError)
      return NextResponse.json({ error: 'Erro ao buscar iniciativas' }, { status: 500 })
    }

    // 5. Backup de lembretes
    console.log('⏰ Buscando lembretes...')
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')

    if (remindersError) {
      console.error('❌ Erro ao buscar lembretes:', remindersError)
      return NextResponse.json({ error: 'Erro ao buscar lembretes' }, { status: 500 })
    }

    // 6. Backup de tags
    console.log('🏷️ Buscando tags...')
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')

    if (tagsError) {
      console.error('❌ Erro ao buscar tags:', tagsError)
      return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 })
    }

    // 7. Criar dados de backup
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

    console.log('✅ Backup concluído com sucesso!')
    console.log('📊 Resumo:')
    console.log(`   - Todos: ${backupData.summary.totalTodos}`)
    console.log(`   - Projetos: ${backupData.summary.totalProjects}`)
    console.log(`   - Metas: ${backupData.summary.totalGoals}`)
    console.log(`   - Iniciativas: ${backupData.summary.totalInitiatives}`)
    console.log(`   - Lembretes: ${backupData.summary.totalReminders}`)
    console.log(`   - Tags: ${backupData.summary.totalTags}`)

    return NextResponse.json({
      success: true,
      message: 'Backup concluído com sucesso!',
      data: backupData
    })

  } catch (error) {
    console.error('❌ Erro geral no backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

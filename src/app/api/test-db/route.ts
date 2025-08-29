import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Testar conexão com as tabelas
    const results = {
      projects: null,
      tags: null,
      todos: null,
      goals: null,
      reminders: null
    }
    
    // Testar tabela projects
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('count')
        .limit(1)
      
      if (projectsError) {
        results.projects = { error: projectsError.message }
      } else {
        results.projects = { success: true, count: projectsData?.length || 0 }
      }
    } catch (e) {
      results.projects = { error: 'Erro ao acessar tabela projects' }
    }
    
    // Testar tabela tags
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('count')
        .limit(1)
      
      if (tagsError) {
        results.tags = { error: tagsError.message }
      } else {
        results.tags = { success: true, count: tagsData?.length || 0 }
      }
    } catch (e) {
      results.tags = { error: 'Erro ao acessar tabela tags' }
    }
    
    // Testar tabela todos
    try {
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('count')
        .limit(1)
      
      if (todosError) {
        results.todos = { error: todosError.message }
      } else {
        results.todos = { success: true, count: todosData?.length || 0 }
      }
    } catch (e) {
      results.todos = { error: 'Erro ao acessar tabela todos' }
    }
    
    // Testar tabela goals
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('count')
        .limit(1)
      
      if (goalsError) {
        results.goals = { error: goalsError.message }
      } else {
        results.goals = { success: true, count: goalsData?.length || 0 }
      }
    } catch (e) {
      results.goals = { error: 'Erro ao acessar tabela goals' }
    }
    
    // Testar tabela reminders
    try {
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('count')
        .limit(1)
      
      if (remindersError) {
        results.reminders = { error: remindersError.message }
      } else {
        results.reminders = { success: true, count: remindersData?.length || 0 }
      }
    } catch (e) {
      results.reminders = { error: 'Erro ao acessar tabela reminders' }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Teste de conexão com banco de dados',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Erro no teste de banco:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao testar conexão com banco',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

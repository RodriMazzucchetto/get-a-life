import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🚀 Iniciando migração simples do campo rank...')

    // 1. Verificar se o campo rank já existe
    const { data: checkData, error: checkError } = await supabase
      .from('todos')
      .select('rank')
      .eq('user_id', user.id)
      .limit(1)

    if (checkError) {
      console.error('❌ Erro ao verificar campo rank:', checkError)
      return NextResponse.json({ error: 'Erro ao verificar campo rank' }, { status: 500 })
    }

    // Se o campo rank já existe e tem valores, não fazer nada
    if (checkData && checkData.length > 0 && checkData[0].rank) {
      console.log('✅ Campo rank já existe e tem valores')
      return NextResponse.json({ 
        message: 'Campo rank já existe e tem valores',
        migrated: 0 
      })
    }

    // 2. Buscar todos os todos ordenados por status e pos
    console.log('📋 Buscando todos os todos...')
    const { data: todos, error: fetchError } = await supabase
      .from('todos')
      .select('id, status, pos, title')
      .eq('user_id', user.id)
      .order('status')
      .order('pos')

    if (fetchError) {
      console.error('❌ Erro ao buscar todos:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar todos' }, { status: 500 })
    }

    if (!todos || todos.length === 0) {
      console.log('✅ Nenhum todo encontrado para migrar')
      return NextResponse.json({ 
        message: 'Migração concluída - nenhum todo para migrar',
        migrated: 0 
      })
    }

    console.log(`📝 Encontrados ${todos.length} todos para migrar`)

    // 3. Atualizar ranks sequencialmente
    let counter = 1
    const updates = []
    const errors = []

    for (const todo of todos) {
      try {
        const rank = `0|${counter.toString().padStart(5, '0')}:00000`
        
        const { error: updateError } = await supabase
          .from('todos')
          .update({ rank })
          .eq('id', todo.id)
          .eq('user_id', user.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar todo ${todo.id}:`, updateError)
          errors.push({ id: todo.id, title: todo.title, error: updateError.message })
        } else {
          updates.push({ id: todo.id, title: todo.title, rank })
          console.log(`✅ Todo ${counter}/${todos.length} migrado: ${todo.title}`)
        }
      } catch (error) {
        console.error(`❌ Erro inesperado ao atualizar todo ${todo.id}:`, error)
        errors.push({ 
          id: todo.id, 
          title: todo.title, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        })
      }
      
      counter++
    }

    // 4. Verificar se a migração foi bem-sucedida
    const { data: verifyData, error: verifyError } = await supabase
      .from('todos')
      .select('id, rank')
      .eq('user_id', user.id)
      .not('rank', 'is', null)
      .limit(5)

    if (verifyError) {
      console.error('❌ Erro ao verificar migração:', verifyError)
    }

    console.log(`✅ Migração concluída! ${updates.length} todos migrados com sucesso`)

    return NextResponse.json({
      message: 'Migração concluída',
      migrated: updates.length,
      errors: errors.length,
      sample_updates: updates.slice(0, 3),
      sample_errors: errors.slice(0, 3),
      verification: verifyData ? verifyData.length : 0
    })

  } catch (error) {
    console.error('❌ Erro geral na migração:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função GET para verificar status da migração
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o campo rank existe e tem valores
    const { data, error } = await supabase
      .from('todos')
      .select('id, rank')
      .eq('user_id', user.id)
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Erro ao verificar status da migração',
        error: error.message
      }, { status: 500 })
    }

    const hasRank = data && data.length > 0 && data.some(todo => todo.rank)
    const totalWithRank = data ? data.filter(todo => todo.rank).length : 0

    return NextResponse.json({
      status: hasRank ? 'migrated' : 'not_migrated',
      message: hasRank ? 'Campo rank existe e tem valores' : 'Campo rank não existe ou está vazio',
      sample_data: data,
      total_with_rank: totalWithRank
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Erro ao verificar status da migração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

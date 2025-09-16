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

    console.log('🚀 Iniciando migração do campo rank...')

    // 1. Adicionar campo rank se não existir
    console.log('📝 Adicionando campo rank...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE todos 
        ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT '0|00000:00000';
      `
    })

    if (alterError) {
      console.error('❌ Erro ao adicionar campo rank:', alterError)
      return NextResponse.json({ error: 'Erro ao adicionar campo rank' }, { status: 500 })
    }

    // 2. Inicializar ranks para todos existentes
    console.log('🔄 Inicializando ranks para todos existentes...')
    
    // Buscar todos os todos ordenados por status e pos
    const { data: todos, error: fetchError } = await supabase
      .from('todos')
      .select('id, status, pos')
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

    // Atualizar ranks sequencialmente
    let counter = 1
    const updates = []

    for (const todo of todos) {
      const rank = `0|${counter.toString().padStart(5, '0')}:00000`
      
      const { error: updateError } = await supabase
        .from('todos')
        .update({ rank })
        .eq('id', todo.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error(`❌ Erro ao atualizar todo ${todo.id}:`, updateError)
        return NextResponse.json({ 
          error: `Erro ao atualizar todo ${todo.id}` 
        }, { status: 500 })
      }

      updates.push({ id: todo.id, rank })
      counter++
    }

    // 3. Criar índices para performance
    console.log('📊 Criando índices para performance...')
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_todos_status_hold_priority_rank 
        ON todos (status, on_hold, priority, rank);
        
        CREATE INDEX IF NOT EXISTS idx_todos_rank ON todos (rank);
      `
    })

    if (indexError) {
      console.warn('⚠️ Aviso ao criar índices:', indexError)
      // Não falhar a migração por causa dos índices
    }

    console.log(`✅ Migração concluída! ${updates.length} todos migrados`)

    return NextResponse.json({
      message: 'Migração concluída com sucesso',
      migrated: updates.length,
      updates: updates.slice(0, 5) // Mostrar apenas os primeiros 5 para debug
    })

  } catch (error) {
    console.error('❌ Erro geral na migração:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função auxiliar para executar SQL (se não existir)
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar se o campo rank já existe
    const { data, error } = await supabase
      .from('todos')
      .select('rank')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        status: 'not_migrated',
        message: 'Campo rank não existe ou erro ao verificar',
        error: error.message
      })
    }

    const hasRank = data && data.length > 0 && data[0].rank !== null

    return NextResponse.json({
      status: hasRank ? 'migrated' : 'not_migrated',
      message: hasRank ? 'Campo rank já existe' : 'Campo rank não existe'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Erro ao verificar status da migração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

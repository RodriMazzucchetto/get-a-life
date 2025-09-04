const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://swisapseluqpfudvdgfd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3aXNhcHNlbHVxcGZ1ZHZkZ2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTMxODAsImV4cCI6MjA2OTM2OTE4MH0.5louUBfKSEIDSRXouMX8YIJhQryROT36okm902xSoyc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL() {
  try {
    console.log('🔄 Executando SQL para adicionar coluna pos...')
    
    // 1. Adicionar coluna pos
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE todos ADD COLUMN IF NOT EXISTS pos DECIMAL(10,2);'
    })
    
    if (alterError) {
      console.error('❌ Erro ao adicionar coluna pos:', alterError)
      return
    }
    
    console.log('✅ Coluna pos adicionada')
    
    // 2. Criar índice
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_todos_pos ON todos(pos);'
    })
    
    if (indexError) {
      console.error('❌ Erro ao criar índice:', indexError)
      return
    }
    
    console.log('✅ Índice criado')
    
    // 3. Backfill - atribuir pos baseado no created_at
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE todos 
            SET pos = (ROW_NUMBER() OVER (ORDER BY created_at ASC) * 1000)
            WHERE pos IS NULL;`
    })
    
    if (updateError) {
      console.error('❌ Erro no backfill:', updateError)
      return
    }
    
    console.log('✅ Backfill executado')
    
    // 4. Tornar coluna NOT NULL
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE todos ALTER COLUMN pos SET NOT NULL;'
    })
    
    if (notNullError) {
      console.error('❌ Erro ao tornar coluna NOT NULL:', notNullError)
      return
    }
    
    console.log('✅ Coluna pos configurada como NOT NULL')
    
    // 5. Verificar resultado
    const { data, error: selectError } = await supabase
      .from('todos')
      .select('id, title, pos, created_at')
      .order('pos', { ascending: true })
    
    if (selectError) {
      console.error('❌ Erro ao verificar dados:', selectError)
      return
    }
    
    console.log('✅ Dados verificados:')
    data.forEach(todo => {
      console.log(`  - ${todo.title}: pos=${todo.pos}`)
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

executeSQL()

import { createClient } from '@/lib/supabase'
import { Memory, CreateMemoryData } from '@/types'

const supabase = createClient()

export const createMemory = async (memoryData: CreateMemoryData, userId?: string): Promise<Memory | null> => {
  try {
    console.log('=== DEBUG: Criando memória ===')
    console.log('Dados recebidos:', memoryData)
    console.log('User ID fornecido:', userId)
    
    let currentUserId = userId
    
    // Se não foi fornecido userId, tentar obter do Supabase
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Usuário obtido do Supabase:', user?.id)
      console.log('Erro de autenticação:', authError)
      
      if (!user) {
        console.error('❌ Usuário não autenticado')
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }
      
      currentUserId = user.id
    }

    console.log('✅ Usuário autenticado, tentando inserir memória...')
    console.log('User ID final:', currentUserId)

    const { data, error } = await supabase
      .from('memories')
      .insert({
        user_id: currentUserId, // Adicionar explicitamente o user_id
        title: memoryData.title,
        life_front: memoryData.life_front,
        notes: memoryData.notes,
        media: memoryData.media,
        mood: memoryData.mood
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar memória:', error)
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      if (error.code === '42501') {
        throw new Error('Erro de permissão. Verifique se você está logado corretamente.')
      } else if (error.code === '42P01') {
        throw new Error('Tabela memories não existe. Execute o script SQL para criá-la.')
      } else {
        throw new Error(`Erro ao salvar: ${error.message}`)
      }
    }

    console.log('✅ Memória criada com sucesso:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao criar memória:', error)
    throw error // Re-throw para que o erro seja capturado no frontend
  }
}

export const getUserMemories = async (): Promise<Memory[]> => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('accepted_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar memórias:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar memórias:', error)
    return []
  }
}

export const getMemoryById = async (id: string): Promise<Memory | null> => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar memória:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar memória:', error)
    return null
  }
}

export const updateMemory = async (id: string, updates: Partial<Memory>): Promise<Memory | null> => {
  try {
    console.log('=== DEBUG: Atualizando memória ===')
    console.log('ID da memória:', id)
    console.log('Dados para atualizar:', updates)
    
    const { data, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar memória:', error)
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    console.log('✅ Memória atualizada com sucesso:', data)
    return data
  } catch (error) {
    console.error('❌ Erro ao atualizar memória:', error)
    return null
  }
}

export const deleteMemory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar memória:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao deletar memória:', error)
    return false
  }
}

export const getMemoriesByLifeFront = async (lifeFront: string): Promise<Memory[]> => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('life_front', lifeFront)
      .order('accepted_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar memórias por frente de vida:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar memórias por frente de vida:', error)
    return []
  }
} 
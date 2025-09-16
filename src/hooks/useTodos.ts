import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Todo, DBTodo } from '@/lib/planning'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Funções LexoRank para ordenação
function betweenRanks(prev?: string | null, next?: string | null): string {
  if (!prev && !next) return 'a0'
  if (!prev) return beforeRank(next!)
  if (!next) return afterRank(prev!)
  
  // Implementação simples do LexoRank
  const prevNum = prev!.charCodeAt(0) * 1000 + parseInt(prev!.slice(1) || '0')
  const nextNum = next!.charCodeAt(0) * 1000 + parseInt(next!.slice(1) || '0')
  const newNum = Math.floor((prevNum + nextNum) / 2)
  
  return String.fromCharCode(Math.floor(newNum / 1000)) + (newNum % 1000).toString().padStart(3, '0')
}

function afterRank(rank: string): string {
  const num = rank.charCodeAt(0) * 1000 + parseInt(rank.slice(1) || '0')
  const newNum = num + 1
  return String.fromCharCode(Math.floor(newNum / 1000)) + (newNum % 1000).toString().padStart(3, '0')
}

function beforeRank(rank: string): string {
  const num = rank.charCodeAt(0) * 1000 + parseInt(rank.slice(1) || '0')
  const newNum = num - 1
  return String.fromCharCode(Math.floor(newNum / 1000)) + (newNum % 1000).toString().padStart(3, '0')
}

export type TodoStatus = 'backlog' | 'current_week' | 'in_progress'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UMA ÚNICA ORDENAÇÃO - SIMPLES E EFICIENTE
  const sortedTodos = useMemo(() => {
    return todos.sort((a, b) => {
      // 1. Ordenar por status (backlog -> current_week -> in_progress)
      const statusOrder = { backlog: 0, current_week: 1, in_progress: 2 }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff

      // 2. Dentro do mesmo status: não pausados primeiro
      if (a.onHold !== b.onHold) return a.onHold ? 1 : -1

      // 3. Depois por prioridade (alta primeiro)
      if (a.isHighPriority !== b.isHighPriority) return a.isHighPriority ? -1 : 1

      // 4. Por fim, por rank
      if (a.rank && b.rank) return a.rank.localeCompare(b.rank)
      return 0
    })
  }, [todos])

  // DIVISÃO POR STATUS (SEM ESTADO SEPARADO)
  const todosByStatus = useMemo(() => ({
    backlog: sortedTodos.filter(t => t.status === 'backlog'),
    current_week: sortedTodos.filter(t => t.status === 'current_week'),
    in_progress: sortedTodos.filter(t => t.status === 'in_progress')
  }), [sortedTodos])

  // FUNÇÃO ATOMICA PARA MOVER TODOS
  const moveTodo = useCallback(async (todoId: string, newStatus: TodoStatus, newRank?: string) => {
    const currentTodo = todos.find(t => t.id === todoId)
    if (!currentTodo) {
      throw new Error(`Todo ${todoId} não encontrado`)
    }

    // Update otimista
    setTodos(prev => prev.map(t => 
      t.id === todoId 
        ? { ...t, status: newStatus, rank: newRank || t.rank }
        : t
    ))

    try {
      // Update no banco
      const updates: Partial<DBTodo> = { status: newStatus }
      if (newRank) updates.rank = newRank
      
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todoId)

      if (error) throw error

      console.log(`✅ Todo ${todoId} movido para ${newStatus}`)
    } catch (error) {
      console.error('❌ Erro ao mover todo:', error)
      
      // Rollback
      setTodos(prev => prev.map(t => 
        t.id === todoId 
          ? { ...t, status: currentTodo.status, rank: currentTodo.rank }
          : t
      ))
      
      throw error
    }
  }, [todos])

  // FUNÇÃO PARA CALCULAR NOVA POSIÇÃO
  const calculateNewRank = useCallback((targetStatus: TodoStatus, targetPosition?: string) => {
    const targetTodos = todosByStatus[targetStatus]
    
    if (!targetPosition) {
      // Mover para o final
      const lastTodo = targetTodos[targetTodos.length - 1]
      return lastTodo ? afterRank(lastTodo.rank || 'a0') : 'a0'
    }

    // Encontrar posição específica
    const targetIndex = targetTodos.findIndex(t => t.id === targetPosition)
    if (targetIndex === -1) {
      // Fallback: fim da lista
      const lastTodo = targetTodos[targetTodos.length - 1]
      return lastTodo ? afterRank(lastTodo.rank || 'a0') : 'a0'
    }

    if (targetIndex === 0) {
      // Mover para o início
      const firstTodo = targetTodos[0]
      return firstTodo ? beforeRank(firstTodo.rank || 'a0') : 'a0'
    }

    // Mover entre dois itens
    const prevTodo = targetTodos[targetIndex - 1]
    const nextTodo = targetTodos[targetIndex]
    return betweenRanks(prevTodo?.rank, nextTodo?.rank)
  }, [todosByStatus])

  // CARREGAR TODOS
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Converter DBTodo para Todo
      const convertedTodos: Todo[] = (data || []).map((row: DBTodo) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        category: row.category,
        dueDate: row.due_date,
        completed: row.completed,
        isHighPriority: row.is_high_priority,
        timeSensitive: row.time_sensitive,
        onHold: row.on_hold,
        onHoldReason: row.on_hold_reason,
        status: row.status,
        pos: row.pos || 0, // Adicionar campo pos obrigatório
        rank: row.rank,
        tags: [], // TODO: implementar tags
        projectId: row.project_id,
        goalId: row.goal_id,
        initiativeId: row.initiative_id,
        created_at: row.created_at,
        updated_at: row.updated_at
      }))

      setTodos(convertedTodos)
      console.log(`✅ ${convertedTodos.length} todos carregados`)
    } catch (error) {
      console.error('❌ Erro ao carregar todos:', error)
      setError('Erro ao carregar todos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // CARREGAR DADOS INICIAIS
  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  return {
    // Estado
    todos: sortedTodos,
    todosByStatus,
    isLoading,
    error,

    // Funções
    moveTodo,
    calculateNewRank,
    loadTodos,
    betweenRanks,
    afterRank,
    beforeRank,

    // Utilitários
    getTodoById: (id: string) => todos.find(t => t.id === id),
    getTodosByStatus: (status: TodoStatus) => todosByStatus[status]
  }
}

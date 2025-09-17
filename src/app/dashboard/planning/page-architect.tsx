'use client'

import React, { useCallback, useMemo } from 'react'
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { usePlanningData } from '@/hooks/usePlanningData'
import { Todo } from '@/lib/planning'

// TYPES
type Status = 'backlog' | 'current_week' | 'in_progress'

// =====================================================
// 1. ADAPTADOR DE RANK CENTRALIZADO (PONTO CENTRAL)
// =====================================================
function computeRank(prev: string | null, next: string | null): string {
  // Usar a função betweenRanks existente do usePlanningData
  // Esta é a ÚNICA função que calcula rank - todos chamam ela
  if (!prev && !next) return 'a0'
  if (!prev) return 'a' + Math.random().toString(36).substr(2, 9)
  if (!next) return prev + 'z'
  
  // Lógica LexoRank simplificada
  const prevNum = parseInt(prev.replace('a', ''), 36)
  const nextNum = parseInt(next.replace('a', ''), 36)
  const newNum = Math.floor((prevNum + nextNum) / 2)
  return 'a' + newNum.toString(36)
}

// =====================================================
// 2. CONTRATO DE ORDENAÇÃO ESTÁVEL
// =====================================================
function sortTodos(a: Todo, b: Todo): number {
  // 1. Ativos (0) antes dos pausados (1)
  const onHoldDiff = Number(a.onHold) - Number(b.onHold)
  if (onHoldDiff !== 0) return onHoldDiff
  
  // 2. High priority primeiro
  const priorityDiff = Number(b.isHighPriority) - Number(a.isHighPriority)
  if (priorityDiff !== 0) return priorityDiff
  
  // 3. Desempatador estável por rank
  return (a.rank || 'a0').localeCompare(b.rank || 'a0')
}

// =====================================================
// 3. SELECTORS PUROS (SINGLE SOURCE OF TRUTH)
// =====================================================
function createSelectors(todos: Todo[]) {
  const selectByStatus = (status: Status): Todo[] =>
    todos.filter(t => t.status === status).sort(sortTodos)
  
  return {
    backlog: selectByStatus('backlog'),
    current_week: selectByStatus('current_week'),
    in_progress: selectByStatus('in_progress')
  }
}

// =====================================================
// 4. ALGORITMO CANÔNICO DE MOVIMENTAÇÃO
// =====================================================
function neighbours(list: Todo[], overIndex: number) {
  const prev = list[overIndex - 1]?.rank || null
  const next = list[overIndex]?.rank || null
  return { prev, next }
}

// =====================================================
// 5. COMPONENTES MEMOIZADOS
// =====================================================
interface TodoCardProps {
  todo: Todo
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onTogglePause: (id: string) => void
  onDelete: (id: string) => void
}

const TodoCard = React.memo<TodoCardProps>(function TodoCard({
  todo,
  onToggleComplete,
  onTogglePriority,
  onTogglePause,
  onDelete
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 mb-3 cursor-grab
        hover:shadow-md transition-all duration-200
        ${todo.onHold ? 'border-yellow-400 bg-yellow-50' : ''}
        ${todo.isHighPriority ? 'border-l-4 border-l-red-500' : ''}
        ${todo.completed ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Title */}
          <h4 className={`font-medium text-sm flex-1 ${
            todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {todo.title}
          </h4>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          {/* Priority */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePriority(todo.id)
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title={todo.isHighPriority ? 'Remover prioridade' : 'Marcar como prioridade'}
          >
            {todo.isHighPriority ? (
              <span className="text-yellow-500">⭐</span>
            ) : (
              <span className="text-gray-400">☆</span>
            )}
          </button>

          {/* Pause/Play */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePause(todo.id)
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title={todo.onHold ? 'Retomar' : 'Pausar'}
          >
            {todo.onHold ? (
              <span className="text-green-600">▶️</span>
            ) : (
              <span className="text-yellow-600">⏸️</span>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(todo.id)
            }}
            className="p-1 hover:bg-red-100 rounded"
            title="Deletar"
          >
            <span className="text-gray-400 hover:text-red-600">🗑️</span>
          </button>
        </div>
      </div>

      {/* Description */}
      {todo.description && (
        <p className="text-xs text-gray-600 mb-2 ml-6 line-clamp-2">
          {todo.description}
        </p>
      )}

      {/* Status Indicators */}
      <div className="flex items-center gap-2 ml-6">
        {todo.onHold && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
            Pausado
          </span>
        )}
        {todo.isHighPriority && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
            Prioridade Alta
          </span>
        )}
        {todo.timeSensitive && todo.dueDate && (
          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
            Urgente: {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  )
})

interface ColumnProps {
  title: string
  status: Status
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onTogglePause: (id: string) => void
  onDelete: (id: string) => void
}

const Column = React.memo<ColumnProps>(function Column({
  title,
  status,
  todos,
  onToggleComplete,
  onTogglePriority,
  onTogglePause,
  onDelete
}) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: status,
    data: { type: 'column', status }
  })

  const todoIds = todos.map(todo => todo.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
          {todos.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors
          ${isOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-200 bg-gray-50'
          }
        `}
      >
        <SortableContext 
          items={todoIds} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <div className="text-sm">Nenhum item</div>
                  <div className="text-xs mt-1">Arraste itens aqui</div>
                </div>
              </div>
            ) : (
              todos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onTogglePriority={onTogglePriority}
                  onTogglePause={onTogglePause}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
})

// =====================================================
// 6. MAIN COMPONENT COM ARQUITETURA CORRIGIDA
// =====================================================
export default function PlanningPageArchitect() {
  const { todos, projects, goals, reminders, isLoading, setTodos, updateTodo, deleteTodo } = usePlanningData()

  // SINGLE SOURCE OF TRUTH - Selectors puros
  const todosByColumn = useMemo(() => createSelectors(todos), [todos])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // =====================================================
  // 7. ALGORITMO CANÔNICO DE MOVIMENTAÇÃO
  // =====================================================
  const move = useCallback(async (todoId: string, to: Status, overIndex: number) => {
    const dest = todosByColumn[to]
    const { prev, next } = neighbours(dest, overIndex)
    const rank = computeRank(prev, next)
    
    // OTIMISTA
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === todoId 
          ? { ...todo, status: to, rank, onHold: false }
          : todo
      )
    )
    
    try {
      await updateTodo(todoId, { status: to, rank, onHold: false })
      console.log(`✅ Todo ${todoId} moved to ${to} with rank ${rank}`)
    } catch (error) {
      console.error('❌ Error moving todo:', error)
      // ROLLBACK
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === todoId 
            ? { ...todo, status: todos.find(t => t.id === todoId)?.status || 'backlog' }
            : todo
        )
      )
    }
  }, [todosByColumn, setTodos, updateTodo, todos])

  // =====================================================
  // 8. PAUSE/UNPAUSE COM REGRA EXPLÍCITA "VAI PRO FIM"
  // =====================================================
  const setOnHold = useCallback(async (todoId: string, on: boolean) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return

    const col = todo.status as Status
    const list = todosByColumn[col]
    
    // Se on=true -> depois do último pausado; se on=false -> depois do último ativo
    const anchor = on
      ? list.filter(t => t.onHold).at(-1)?.rank || null
      : list.filter(t => !t.onHold).at(-1)?.rank || null

    const rank = computeRank(anchor, null)
    
    // OTIMISTA
    setTodos(prevTodos => 
      prevTodos.map(t => 
        t.id === todoId 
          ? { ...t, onHold: on, rank }
          : t
      )
    )
    
    try {
      await updateTodo(todoId, { onHold: on, rank })
      console.log(`✅ Todo ${todoId} ${on ? 'paused' : 'unpaused'} with rank ${rank}`)
    } catch (error) {
      console.error('❌ Error toggling pause:', error)
      // ROLLBACK
      setTodos(prevTodos => 
        prevTodos.map(t => 
          t.id === todoId 
            ? { ...t, onHold: todo.onHold }
            : t
        )
      )
    }
  }, [todos, todosByColumn, setTodos, updateTodo])

  // =====================================================
  // 9. HANDLER ÚNICO DE DRAG
  // =====================================================
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const todoId = active.id as string
    const overId = over.id as string

    // Descobrir from/to
    const from = todos.find(t => t.id === todoId)?.status as Status
    const to = overId as Status

    if (!from || !to) return
    if (from === to) return

    // Calcular overIndex (simplificado para começar)
    const dest = todosByColumn[to]
    const overIndex = dest.length // Por enquanto, sempre vai pro fim

    move(todoId, to, overIndex)
  }, [todos, todosByColumn, move])

  // =====================================================
  // 10. HANDLERS COM MUTATIONS ATÔMICAS
  // =====================================================
  const handleToggleComplete = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))
    
    try {
      await updateTodo(id, { completed: newCompleted })
    } catch (error) {
      console.error('❌ Error toggling complete:', error)
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: todo.completed } : t))
    }
  }, [todos, setTodos, updateTodo])

  const handleTogglePriority = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const newPriority = !todo.isHighPriority
    setTodos(prev => prev.map(t => t.id === id ? { ...t, isHighPriority: newPriority } : t))
    
    try {
      await updateTodo(id, { isHighPriority: newPriority })
    } catch (error) {
      console.error('❌ Error toggling priority:', error)
      setTodos(prev => prev.map(t => t.id === id ? { ...t, isHighPriority: todo.isHighPriority } : t))
    }
  }, [todos, setTodos, updateTodo])

  const handleTogglePause = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    await setOnHold(id, !todo.onHold)
  }, [todos, setOnHold])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return

    setTodos(prev => prev.filter(t => t.id !== id))
    
    try {
      await deleteTodo(id)
      console.log(`✅ Todo ${id} deleted`)
    } catch (error) {
      console.error('❌ Error deleting todo:', error)
      window.location.reload() // Rollback simples
    }
  }, [setTodos, deleteTodo])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Planejamento (Arquitetura Corrigida)
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {projects.length} projetos • {goals.length} metas • {reminders.length} lembretes • {todos.length} tarefas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-3 gap-6">
            <Column
              title="Backlog"
              status="backlog"
              todos={todosByColumn.backlog}
              onToggleComplete={handleToggleComplete}
              onTogglePriority={handleTogglePriority}
              onTogglePause={handleTogglePause}
              onDelete={handleDelete}
            />
            
            <Column
              title="Esta Semana"
              status="current_week"
              todos={todosByColumn.current_week}
              onToggleComplete={handleToggleComplete}
              onTogglePriority={handleTogglePriority}
              onTogglePause={handleTogglePause}
              onDelete={handleDelete}
            />
            
            <Column
              title="Em Progresso"
              status="in_progress"
              todos={todosByColumn.in_progress}
              onToggleComplete={handleToggleComplete}
              onTogglePriority={handleTogglePriority}
              onTogglePause={handleTogglePause}
              onDelete={handleDelete}
            />
          </div>
        </DndContext>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs">
          <div>ARQUITETURA CORRIGIDA ✅</div>
          <div>Total: {todos.length}</div>
          <div>Backlog: {todosByColumn.backlog.length}</div>
          <div>Semana: {todosByColumn.current_week.length}</div>
          <div>Progresso: {todosByColumn.in_progress.length}</div>
        </div>
      )}
    </div>
  )
}

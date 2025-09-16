'use client'

import { usePlanningData } from '@/hooks/usePlanningData'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Todo } from '@/lib/planning'

// COMPONENTE TODO ITEM DRAGÁVEL
function SortableTodoItem({ todo, projects, onToggleComplete, onTogglePriority, onEdit, onPutOnHold, onDeleteFromAnyBlock }: {
  todo: Todo
  projects: { id: string; name: string; color: string }[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
  onPutOnHold?: (todo: Todo) => void
  onDeleteFromAnyBlock?: (todo: Todo) => void
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
      className={`group flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        todo.onHold 
          ? 'border-2 border-yellow-400' 
          : 'border border-gray-200'
      }`}
    >
      {/* Linha principal da atividade */}
      <div className="group flex items-center gap-3 p-3 relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex gap-1 cursor-move hover:cursor-grab active:cursor-grabbing"
      >
        {/* Coluna esquerda de 3 pontos */}
        <div className="flex flex-col gap-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        {/* Coluna direita de 3 pontos */}
        <div className="flex flex-col gap-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="w-4 h-4 text-blue-600 border border-blue-300 rounded focus:ring-blue-500"
      />
      
      {/* Indicador de prioridade */}
      <div
        onClick={() => onTogglePriority(todo.id)}
        className="cursor-pointer transition-colors"
        title={todo.isHighPriority ? 'Clique para remover prioridade' : 'Clique para marcar como prioridade'}
      >
        <svg 
          className={`w-4 h-4 ${
            todo.isHighPriority ? 'text-red-500' : 'text-gray-400'
          }`}
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z"/>
        </svg>
      </div>
      
      {/* Título do to-do */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm text-gray-900">{todo.title}</span>
        
        {todo.onHold && todo.onHoldReason && (
          <span 
            className="text-sm text-yellow-600 truncate max-w-32 cursor-help"
            title={todo.onHoldReason}
          >
            - Em espera: {todo.onHoldReason.length > 20 ? `${todo.onHoldReason.substring(0, 20)}...` : todo.onHoldReason}
          </span>
        )}
      </div>

      {/* Tag do projeto */}
      {todo.projectId && projects.find(p => p.id === todo.projectId) && (
        <div className="flex-shrink-0 ml-2">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: projects.find(p => p.id === todo.projectId)?.color || '#3B82F6' }}
            >
            {projects.find(p => p.id === todo.projectId)?.name}
            </span>
        </div>
      )}

      {/* Botões de ação */}
      <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 absolute right-0 top-0 bottom-0 bg-white bg-opacity-90 px-2">
        {/* Botão de editar */}
        <button
          onClick={() => onEdit(todo)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Editar tarefa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        {/* Botão de pause/play */}
        {onPutOnHold && (
          <button
            onClick={() => onPutOnHold(todo)}
            className={`p-2 rounded-md transition-colors ${
              todo.onHold 
                ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
            }`}
            title={todo.onHold ? 'Remover da espera' : 'Colocar em espera'}
          >
            {todo.onHold ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}

        {/* Botão de deletar */}
        {onDeleteFromAnyBlock && (
          <button
            onClick={() => onDeleteFromAnyBlock(todo)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Deletar tarefa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      </div>
      
      {/* Data de vencimento */}
      {todo.timeSensitive && todo.dueDate && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="pt-2 ml-16">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-orange-500"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Vence em {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('pt-BR') : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTE COLUNA DROPÁVEL
function DroppableColumn({ title, todos, status, projects, onToggleComplete, onTogglePriority, onEdit, onPutOnHold, onDeleteFromAnyBlock }: {
  title: string
  todos: Todo[]
  status: string
  projects: { id: string; name: string; color: string }[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
  onPutOnHold?: (todo: Todo) => void
  onDeleteFromAnyBlock?: (todo: Todo) => void
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
                <SortableTodoItem 
                  key={todo.id}
                  todo={todo}
                  projects={projects}
                  onToggleComplete={onToggleComplete}
                  onTogglePriority={onTogglePriority}
                  onEdit={onEdit}
                  onPutOnHold={onPutOnHold}
                  onDeleteFromAnyBlock={onDeleteFromAnyBlock}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default function PlanningPage() {
  const {
    projects,
    todos,
    goals,
    reminders,
    isLoading,
    setTodos,
    updateTodo,
    deleteTodo
  } = usePlanningData()

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

  // DIVISÃO POR STATUS
  const todosByStatus = {
    backlog: todos.filter(t => t.status === 'backlog'),
    current_week: todos.filter(t => t.status === 'current_week'),
    in_progress: todos.filter(t => t.status === 'in_progress')
  }

  // FUNÇÃO DE DnD REAL
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const todoId = active.id as string
    const overId = over.id as string

    // Detectar destino
    let targetStatus: string

    // Verificar se está soltando em um container (área vazia)
    if (['backlog', 'current_week', 'in_progress'].includes(overId)) {
      targetStatus = overId
                } else {
      // Está soltando em um item específico
      const targetTodo = todos.find(t => t.id === overId)
      if (!targetTodo) return
      targetStatus = targetTodo.status
    }

    // Update otimista
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === todoId 
          ? { ...todo, status: targetStatus as 'backlog' | 'current_week' | 'in_progress' }
          : todo
      )
    )

    // Update no banco
    updateTodo(todoId, { status: targetStatus as 'backlog' | 'current_week' | 'in_progress' }).catch(error => {
      console.error('❌ Erro no drag & drop:', error)
    })
  }

  // Funções de manipulação
  const handleToggleComplete = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (todo) {
      const newCompleted = !todo.completed
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: newCompleted } : t))
      await updateTodo(todoId, { completed: newCompleted })
    }
  }

  const handleTogglePriority = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (todo) {
      const newPriority = !todo.isHighPriority
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, isHighPriority: newPriority } : t))
      await updateTodo(todoId, { isHighPriority: newPriority })
    }
  }

  const handleEdit = (todo: Todo) => {
    // TODO: Implementar edição
    console.log('Editar todo:', todo)
  }

  const handlePutOnHold = async (todo: Todo) => {
    const newOnHold = !todo.onHold
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, onHold: newOnHold } : t))
    await updateTodo(todo.id, { onHold: newOnHold })
  }

  const handleDeleteFromAnyBlock = async (todo: Todo) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
        setTodos(prev => prev.filter(t => t.id !== todo.id))
      await deleteTodo(todo.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Planejamento
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {projects.length} projetos • {goals.length} metas • {reminders.length} lembretes • {todos.length} todos
          </div>
        </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando...</div>
              </div>
            ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6">
              <DroppableColumn 
                title="Backlog" 
                todos={todosByStatus.backlog}
                status="backlog"
                            projects={projects}
                onToggleComplete={handleToggleComplete}
                onTogglePriority={handleTogglePriority}
                onEdit={handleEdit}
                onPutOnHold={handlePutOnHold}
                onDeleteFromAnyBlock={handleDeleteFromAnyBlock}
              />
              
              <DroppableColumn 
                title="Semana Atual" 
                todos={todosByStatus.current_week}
                status="current_week"
                          projects={projects}
                onToggleComplete={handleToggleComplete}
                              onTogglePriority={handleTogglePriority}
                onEdit={handleEdit}
                onPutOnHold={handlePutOnHold}
                onDeleteFromAnyBlock={handleDeleteFromAnyBlock}
              />
              
              <DroppableColumn 
                title="Em Progresso" 
                todos={todosByStatus.in_progress}
                status="in_progress"
                            projects={projects}
                onToggleComplete={handleToggleComplete}
                onTogglePriority={handleTogglePriority}
                onEdit={handleEdit}
                onPutOnHold={handlePutOnHold}
                onDeleteFromAnyBlock={handleDeleteFromAnyBlock}
              />
        </div>
      </DndContext>
        )}
                </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs">
          <div>DnD REAL ✅</div>
          <div>Total: {todos.length}</div>
          <div>Backlog: {todosByStatus.backlog.length}</div>
          <div>Semana: {todosByStatus.current_week.length}</div>
          <div>Progresso: {todosByStatus.in_progress.length}</div>
              </div>
            )}
    </div>
  )
}
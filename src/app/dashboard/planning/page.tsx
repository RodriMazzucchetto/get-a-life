'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { PlayIcon } from '@heroicons/react/24/outline'
import ModalOverlay from '@/components/ModalOverlay'
import { ModalPanel } from '@/components/ModalPanel'
import { GoalManagementModal } from '@/components/GoalManagementModal'
import { GoalDisplay } from '@/components/GoalDisplay'
import { RemindersModal } from '@/components/RemindersModal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import InteractiveProgressBar from '@/components/InteractiveProgressBar'
import { usePlanningData } from '@/hooks/usePlanningData'
import { useMicroCompleteToggle } from '@/hooks/useMicroCompleteToggle'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  burstOnHold,
  burstPriorityStar,
  burstProgressMove,
  burstResumeFromHold,
  burstTaskComplete,
  burstTaskDelete,
} from '@/lib/microEffects'
import PomodoroTimer from '@/components/Timer/PomodoroTimer'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DroppableColumn } from '@/components/planning/DroppableColumn'
import {
  COL_BACKLOG,
  COL_CURRENT_WEEK,
  COL_IN_PROGRESS,
  appendPosForOnHoldAtBottom,
  appendPosForStatus,
  columnStatusFromId,
  computePosAtNewIndexInVisualBucket,
  sortTodosByPriorityAndPos,
} from '@/lib/todoBoardHelpers'
import {
  DBReminder,
  cyclesService,
  fromDbTaskCycle,
  type TaskCycle,
  type Todo,
  type Goal,
} from '@/lib/planning'
import { ProjectIdsPicker } from '@/components/ProjectIdsPicker'

function cloneTodoList(list: Todo[]): Todo[] {
  return list.map((t) => ({ ...t }))
}

// Componente para grupo de tags arrastável - será definido depois das funções

// Preview do card no cursor (DragOverlay)
function TodoDragOverlayPreview({
  todo,
  projects,
}: {
  todo: Todo
  projects: { id: string; name: string; color: string }[]
}) {
  const projectChips = (todo.projectIds ?? (todo.projectId ? [todo.projectId] : []))
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean) as { id: string; name: string; color: string }[]
  return (
    <div
      className={`pointer-events-none flex flex-col bg-surface-container-lowest rounded-xl shadow-xl cursor-grabbing select-none ${
        todo.onHold
          ? 'border-2 border-amber-400 bg-amber-50/50 ring-0'
          : 'ring-1 ring-outline-variant/15'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex gap-1">
          <div className="flex flex-col gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
          </div>
        </div>
        <div
          className={`w-4 h-4 rounded border border-blue-300 shrink-0 ${
            todo.completed ? 'bg-blue-600' : 'bg-white'
          }`}
          aria-hidden
        />
        <svg
          className={`w-4 h-4 shrink-0 ${todo.isHighPriority ? 'text-red-500' : 'text-gray-400'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z" />
        </svg>
        {projectChips.map((project) => (
          <span
            key={project.id}
            className="inline-flex max-w-[min(7rem,28vw)] shrink-0 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: project.color || '#64748b' }}
            title={project.name}
          >
            <span className="truncate">{project.name.trim().toUpperCase()}</span>
          </span>
        ))}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm text-gray-900">{todo.title}</span>
          {todo.onHold && todo.onHoldReason && (
            <span className="max-w-32 truncate text-sm text-yellow-600">
              - Em espera:{' '}
              {todo.onHoldReason.length > 20 ? `${todo.onHoldReason.substring(0, 20)}...` : todo.onHoldReason}
            </span>
          )}
        </div>
      </div>
      {todo.timeSensitive && todo.dueDate && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="pt-2 ml-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-orange-500">
              Vence em {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para item de to-do arrastável
function SortableTodoItem({ todo, projects, onToggleComplete, onTogglePriority, onEdit, onPutOnHold, onMoveToProgress, onDeleteFromAnyBlock }: {
  todo: Todo
  projects: { id: string; name: string; color: string }[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
  onPutOnHold?: (todo: Todo) => void
  onMoveToProgress?: (todo: Todo) => void
  onDeleteFromAnyBlock?: (todo: Todo, anchorRect?: DOMRect) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })
  const cardRef = useRef<HTMLDivElement | null>(null)
  const setCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node)
      cardRef.current = node
    },
    [setNodeRef]
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const projectList = (todo.projectIds?.length
    ? todo.projectIds
    : todo.projectId
      ? [todo.projectId]
      : []
  )
  .map((id) => projects.find((p) => p.id === id))
  .filter(Boolean) as { id: string; name: string; color: string }[]

  const onConfirmComplete = useCallback(
    () => onToggleComplete(todo.id),
    [onToggleComplete, todo.id]
  )
  const microComplete = useMicroCompleteToggle({
    completed: todo.completed,
    onConfirm: onConfirmComplete,
  })
  const [priorityPopKey, setPriorityPopKey] = useState(0)
  const completeBurstFiredRef = useRef(false)

  useEffect(() => {
    if (!microComplete.isCompleting) {
      completeBurstFiredRef.current = false
      return
    }
    if (completeBurstFiredRef.current || !cardRef.current) return
    completeBurstFiredRef.current = true
    burstTaskComplete(cardRef.current.getBoundingClientRect())
  }, [microComplete.isCompleting])

  return (
    <div
      ref={setCardRef}
      style={style}
      className={`group flex flex-col bg-surface-container-lowest rounded-xl shadow-sm transition-all duration-200 ${
        microComplete.rowMotionClass
      } ${isDragging ? 'pointer-events-none' : ''} ${
        todo.onHold
          ? 'border-2 border-amber-400 bg-amber-50/40 ring-0 hover:shadow-md'
          : 'ring-1 ring-outline-variant/10 hover:shadow-md'
      }`}
    >
      {/* Linha principal da atividade */}
      <div className="flex items-start gap-3 p-3 relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex gap-1 cursor-move hover:cursor-grab active:cursor-grabbing shrink-0 mt-0.5"
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
      
      <div className="flex min-w-0 flex-1 items-center gap-2 pr-1">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={microComplete.displayChecked}
            onChange={microComplete.toggle}
            disabled={microComplete.isCompleting}
            aria-busy={microComplete.isCompleting}
            className={`h-4 w-4 shrink-0 rounded border border-primary/35 text-primary focus:ring-primary/35 ${
              microComplete.isCompleting ? 'motion-check-bounce' : ''
            }`}
          />

          {/* Indicador de prioridade */}
          <div
            onClick={(e) => {
              burstPriorityStar((e.currentTarget as HTMLElement).getBoundingClientRect())
              onTogglePriority(todo.id)
              setPriorityPopKey((k) => k + 1)
            }}
            className="shrink-0 cursor-pointer transition-colors motion-icon-press"
            title={todo.isHighPriority ? 'Clique para remover prioridade' : 'Clique para marcar como prioridade'}
          >
            <span
              key={priorityPopKey}
              className={`inline-flex ${priorityPopKey > 0 ? 'motion-priority-pop' : ''}`}
            >
              <svg
                className={`h-4 w-4 ${
                  todo.isHighPriority ? 'text-red-500' : 'text-gray-400'
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z" />
              </svg>
            </span>
          </div>

          {/* Projetos (só texto, cor do projeto) — antes do título, mesma linha */}
          {projectList.length > 0 && (
            <div className="flex shrink-0 items-center gap-x-2">
              {projectList.map((project) => (
                <span
                  key={project.id}
                  className="max-w-[7rem] truncate text-[11px] font-semibold uppercase tracking-wide sm:max-w-[10rem]"
                  style={{ color: project.color || '#64748b' }}
                  title={project.name}
                >
                  {project.name.trim().toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Título + espera */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm text-gray-900">{todo.title}</span>
            {todo.onHold && todo.onHoldReason && (
              <span
                className="max-w-[40%] shrink cursor-help truncate text-sm text-yellow-600"
                title={todo.onHoldReason}
              >
                - Em espera:{' '}
                {todo.onHoldReason.length > 20 ? `${todo.onHoldReason.substring(0, 20)}...` : todo.onHoldReason}
              </span>
            )}
          </div>
      </div>

      {/* Botões (hover): sem pointer-events até hover no cartão — evita área invisível a roubar cliques */}
      <div className="pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 self-start shrink-0 bg-surface-container-lowest/95 backdrop-blur-sm rounded-md px-1 py-0.5">
        {/* Botão de editar */}
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="p-2 text-gray-400 hover:text-primary hover:bg-primary-fixed/10 rounded-md transition-colors motion-icon-press"
          title="Editar tarefa"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        {/* Botão de pause/play (colocar ou remover da espera) */}
        {onPutOnHold && (
          <button
            type="button"
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              if (todo.onHold) burstResumeFromHold(r)
              else burstOnHold(r)
              onPutOnHold(todo)
            }}
            className={`p-2 rounded-md transition-colors motion-icon-press ${
              todo.onHold 
                ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
            }`}
            title={todo.onHold ? 'Remover da espera' : 'Colocar em espera'}
          >
            {todo.onHold ? (
              // Ícone de play (remover da espera)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              // Ícone de pause (colocar em espera)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}

        {/* Botão de enviar para Em Progresso ou voltar */}
        {onMoveToProgress && (
          <button
            type="button"
            onClick={(e) => {
              burstProgressMove((e.currentTarget as HTMLElement).getBoundingClientRect())
              onMoveToProgress(todo)
            }}
            className={`p-2 rounded-md transition-colors motion-icon-press ${
              todo.status === 'in_progress'
                ? 'text-primary hover:text-primary-container hover:bg-primary-fixed/10'
                : 'text-gray-400 hover:text-primary hover:bg-primary-fixed/10'
            }`}
            title={
              todo.status === 'in_progress'
                ? 'Voltar para Semana Atual'
                : 'Enviar para Em Progresso'
            }
          >
            {todo.status === 'in_progress' ? (
              // Ícone de voltar (quando está em progresso)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            ) : (
              <PlayIcon className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}

        {/* Botão de deletar */}
        {onDeleteFromAnyBlock && (
          <button
            type="button"
            onClick={(e) =>
              onDeleteFromAnyBlock(todo, (e.currentTarget as HTMLElement).getBoundingClientRect())
            }
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors motion-icon-press"
            title="Deletar tarefa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      </div>
      
      {/* Data de vencimento - aparece dentro do elemento quando timeSensitive é true */}
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

interface Task {
  id: string
  title: string
  description?: string
  status: 'in_progress' | 'current_week' | 'backlog' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  created_at: string
}

type Reminder = DBReminder

export default function PlanningPage() {
  const { user } = useAuthContext()
  // Hook para gerenciar dados de planejamento
  const {
    projects,
    todos,
    goals,
    reminders,
    isLoading,
    setGoals,
    setReminders,
    createTodo,
    updateTodo,
    deleteTodo,
    createGoal,
    updateGoal,
    deleteGoal,
    createReminder,
    updateReminder,
    completeReminder,
    deleteReminder,
    seedDefaultReminders,
    reloadData,
    setTodos,
  } = usePlanningData()

  const [boardError, setBoardError] = useState<string | null>(null)
  const [activeCycle, setActiveCycle] = useState<TaskCycle | null>(null)
  const [cycleBusy, setCycleBusy] = useState(false)

  const showError = useCallback((msg: string) => {
    setBoardError(msg)
    setTimeout(() => setBoardError(null), 5000)
  }, [])

  useEffect(() => {
    if (!user) return
    let mounted = true
    cyclesService
      .getActiveCycle(user.id)
      .then((row) => {
        if (!mounted) return
        setActiveCycle(row ? fromDbTaskCycle(row) : null)
      })
      .catch((err) => {
        console.error(err)
        if (!mounted) return
        showError('Não foi possível carregar o ciclo ativo.')
      })
    return () => {
      mounted = false
    }
  }, [user, showError])

  const handleStartCycle = useCallback(async () => {
    if (!user || cycleBusy) return
    setCycleBusy(true)
    try {
      const row = await cyclesService.startCycle(user.id)
      setActiveCycle(fromDbTaskCycle(row))
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Não foi possível iniciar o ciclo.'
      showError(msg)
    } finally {
      setCycleBusy(false)
    }
  }, [user, cycleBusy, showError])

  const handleFinishCycle = useCallback(async () => {
    if (!user || cycleBusy) return
    setCycleBusy(true)
    try {
      const row = await cyclesService.finishActiveCycle(user.id)
      setActiveCycle(null)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Não foi possível finalizar o ciclo.'
      showError(msg)
    } finally {
      setCycleBusy(false)
    }
  }, [user, cycleBusy, showError])

  const weekTodos = useMemo(
    () => todos.filter((t) => t.status === 'current_week' && !t.completed).sort(sortTodosByPriorityAndPos),
    [todos]
  )
  const backlogTodos = useMemo(
    () => todos.filter((t) => t.status === 'backlog' && !t.completed).sort(sortTodosByPriorityAndPos),
    [todos]
  )
  const inProgressTodos = useMemo(
    () => todos.filter((t) => t.status === 'in_progress' && !t.completed).sort(sortTodosByPriorityAndPos),
    [todos]
  )

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const weekInlineFormRef = useRef<HTMLDivElement>(null)
  const backlogInlineFormRef = useRef<HTMLDivElement>(null)
  const inProgressInlineFormRef = useRef<HTMLDivElement>(null)
  const weekInlineTitleInputRef = useRef<HTMLInputElement>(null)
  const backlogInlineTitleInputRef = useRef<HTMLInputElement>(null)
  const inProgressInlineTitleInputRef = useRef<HTMLInputElement>(null)
  /** Snapshot para reverter ordem/coluna se o update no Supabase falhar após DnD */
  const dragRollbackRef = useRef<Todo[] | null>(null)
  const activeDragTodo = useMemo(() => {
    if (!activeDragId || activeDragId.startsWith('group-')) return undefined
    return todos.find((t) => t.id === activeDragId)
  }, [activeDragId, todos])

  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false)
  const [showFinishCycleConfirm, setShowFinishCycleConfirm] = useState(false)
  // Estado de showNewProjectForm REMOVIDO
  // Estado de showNewTagForm REMOVIDO
  // Estado de editingProject REMOVIDO
  // Estado de editingTag REMOVIDO
  // Estado de newProject REMOVIDO
  // Estado de newTag REMOVIDO
  // Estados para metas
  const [goalsExpanded, setGoalsExpanded] = useState(false)

  const [showEditGoalModal, setShowEditGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    projectId: '',
    nextSteps: '',
    dueDate: null as Date | null
  })

  // Estados para iniciativas
  const [showAddInitiativeForm, setShowAddInitiativeForm] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<{ id: string; description: string } | null>(null)
  const [newInitiative, setNewInitiative] = useState('')

  // Estados para to-dos
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
  const [showEditTodoModal, setShowEditTodoModal] = useState(false)
  const [showOnHoldModal, setShowOnHoldModal] = useState(false)
  const [on_hold_reason, setOnHoldReason] = useState('')
  const [todoToPutOnHold, setTodoToPutOnHold] = useState<Todo | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  /** Confirmação in-app (window.confirm falha em vários ambientes / com eventos sintéticos). */
  const [todoDeleteConfirm, setTodoDeleteConfirm] = useState<{
    todo: Todo
    anchorRect?: DOMRect
  } | null>(null)
  const [showInlineCreateForm, setShowInlineCreateForm] = useState(false)
  // Estados de tags REMOVIDOS - será reimplementado do zero
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    dueDate: null as Date | null,
    timeSensitive: false,
    onHold: false,
    onHoldReason: undefined,
    tags: [] as { name: string; color: string }[],
    projectIds: [] as string[]
  })






  // Estados para itens em progresso
  const [showInProgressCreateForm, setShowInProgressCreateForm] = useState(false)
  const [newInProgressTodo, setNewInProgressTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    dueDate: null as Date | null,
    timeSensitive: false,
    onHold: false,
    onHoldReason: undefined,
    tags: [] as { name: string; color: string }[],
    projectIds: [] as string[]
  })

  // Estados para backlog
  const [showBacklogCreateForm, setShowBacklogCreateForm] = useState(false)
  const [newBacklogTodo, setNewBacklogTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    dueDate: null as Date | null,
    timeSensitive: false,
    onHold: false,
    onHoldReason: undefined,
    tags: [] as { name: string; color: string }[],
    projectIds: [] as string[]
  })

  // Funções de projetos REMOVIDAS - será reimplementado do zero

  // Funções de tags REMOVIDAS - será reimplementado do zero

  const handleCreateGoal = async () => {
    if (newGoal.title.trim()) {
      const newGoalData = await createGoal({
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        projectId: newGoal.projectId || '',
        dueDate: newGoal.dueDate ? newGoal.dueDate.toISOString() : undefined,
        progress: 0,
        nextSteps: newGoal.nextSteps || '',
        initiatives: []
      })
      if (newGoalData) {
        setNewGoal({ title: '', description: '', projectId: '', nextSteps: '', dueDate: null })
        setShowGoalModal(false)
      }
    }
  }

  const handleEditGoal = (goal: Goal) => {
    // Sincronizar o nextSteps para edição
    const goalForEditing = {
      ...goal,
      nextSteps: goal.nextSteps || ''
    }
    setEditingGoal(goalForEditing)
    setShowEditGoalModal(true)
  }

  const handleUpdateGoal = async () => {
    if (editingGoal && editingGoal.title.trim()) {
      const updatedGoal = await updateGoal(editingGoal.id, {
        title: editingGoal.title.trim(),
        description: editingGoal.description?.trim() || '',
        projectId: editingGoal.projectId || '',
        dueDate: editingGoal.dueDate || undefined,
        nextSteps: editingGoal.nextSteps || ''
      })
      if (updatedGoal) {
      setEditingGoal(null)
      setShowEditGoalModal(false)
      }
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita.')) {
      const success = await deleteGoal(goalId)
      if (success) {
      setShowEditGoalModal(false)
      setEditingGoal(null)
      }
      return success
    }
    return false
  }

  // Funções para gerenciar metas (nova implementação)
  const handleCreateGoalNew = async (goalData: Omit<Goal, 'id' | 'created_at'>) => {
    try {
      console.log('🎯 Page: Criando meta com dados:', goalData)
      const newGoal = await createGoal(goalData)
      console.log('🎯 Page: Meta retornada do hook:', newGoal)
      if (newGoal) {
        console.log('🎯 Page: Meta criada com sucesso! O hook já atualizou o estado.')
        return newGoal
      }
      return null
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      return null
    }
  }

  const handleUpdateGoalNew = async (id: string, updates: Partial<Goal>) => {
    try {
      const updatedGoal = await updateGoal(id, updates)
      if (updatedGoal) {
        console.log('🎯 Page: Meta atualizada com sucesso! O hook já atualizou o estado.')
        return updatedGoal
      }
      return null
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
      return null
    }
  }

  const handleUpdateGoalProgressNew = async (goalId: string, progress: number) => {
    try {
      await handleUpdateGoalNew(goalId, { progress })
    } catch (error) {
      console.error('Erro ao atualizar progresso da meta:', error)
    }
  }

  const handleToggleInitiativeNew = async (goalId: string, initiativeId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const updatedInitiatives = goal.initiatives.map(i => 
        i.id === initiativeId ? { ...i, completed: !i.completed } : i
      )

      await handleUpdateGoalNew(goalId, { initiatives: updatedInitiatives })
    } catch (error) {
      console.error('Erro ao alternar iniciativa:', error)
    }
  }

  const handleEditInitiativeNew = async (goalId: string, initiativeId: string, newTitle: string) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) {
        console.error('Meta não encontrada')
        return
      }

      const updatedInitiatives = goal.initiatives.map(i => 
        i.id === initiativeId ? { ...i, title: newTitle } : i
      )

      await handleUpdateGoalNew(goalId, { initiatives: updatedInitiatives })
    } catch (error) {
      console.error('Erro ao editar iniciativa:', error)
    }
  }

  const handleDeleteInitiativeNew = async (goalId: string, initiativeId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const updatedInitiatives = goal.initiatives.filter(i => i.id !== initiativeId)
      await handleUpdateGoalNew(goalId, { initiatives: updatedInitiatives })
    } catch (error) {
      console.error('Erro ao deletar iniciativa:', error)
    }
  }

  // Função para atualizar apenas o progresso de uma meta
  const handleUpdateGoalProgress = async (goalId: string, newProgress: number) => {
    await updateGoal(goalId, { progress: newProgress })
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const taskStats = {
    inProgress: inProgressTodos.length,
    currentWeek: weekTodos.length,
    backlog: backlogTodos.length,
    completed: todos.filter((t) => t.completed).length,
    reminders: reminders.length,
  }

  // Funções para iniciativas
  const handleAddInitiative = () => {
    if (newInitiative.trim() && editingGoal) {
      const newInitiativeData = {
        id: Date.now().toString(),
        title: newInitiative.trim(),
        completed: false
      }
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiatives: [...(prevGoal!.initiatives || []), newInitiativeData]
      }))
      setNewInitiative('')
      setShowAddInitiativeForm(false)
    }
  }

  const handleEditInitiative = (initiative: { id: string; title: string; completed: boolean }) => {
    setEditingInitiative({ id: initiative.id, description: initiative.title })
  }

  const handleUpdateInitiative = () => {
    if (editingInitiative && editingInitiative.description.trim() && editingGoal) {
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiatives: (prevGoal!.initiatives || []).map(i =>
          i.id === editingInitiative.id ? { ...i, title: editingInitiative.description.trim() } : i
        )
      }))
      setEditingInitiative(null)
    }
  }

  const handleDeleteInitiative = (initiativeId: string) => {
    if (confirm('Tem certeza que deseja deletar esta iniciativa? Esta ação não pode ser desfeita.')) {
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiatives: (prevGoal!.initiatives || []).filter(i => i.id !== initiativeId)
      }))
      setEditingInitiative(null)
    }
  }

  // Estado para controlar a aba ativa dos lembretes
  const [activeReminderTab, setActiveReminderTab] = useState<'compras' | 'followups' | 'lembretes'>('compras')

  // Estado para adicionar novo lembrete
  const [showAddReminderForm, setShowAddReminderForm] = useState(false)
  const [newReminder, setNewReminder] = useState('')
  
  // Estado para editar lembrete
  const [showEditReminderForm, setShowEditReminderForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)



  const handleAddReminder = async () => {
    if (newReminder.trim() && activeReminderTab) {
      const newReminderData = await createReminder({
        title: newReminder.trim(),
        description: '', // Descrição opcional
        due_date: undefined, // Data de vencimento opcional
        priority: 'medium', // Prioridade padrão
        category: activeReminderTab as 'compras' | 'followups' | 'lembretes',
        completed: false
      })
      if (newReminderData) {
        setNewReminder('')
        setShowAddReminderForm(false)
      } else {
        showError('Não foi possível salvar o lembrete. Tenta de novo.')
      }
    }
  }

  const handleShowAddReminderForm = () => {
    setShowAddReminderForm(true)
  }

  // Funções para lembretes
  const handleToggleReminderComplete = async (reminderId: string) => {
    try {
      console.log('🔄 Iniciando toggle do lembrete:', reminderId)
      
      // Marcar como concluído (persistente)
      const success = await completeReminder(reminderId)
      if (!success) {
        // Se falhou, mostrar toast de erro (implementar depois)
        console.error('❌ Falha ao marcar lembrete como concluído')
      } else {
        console.log('✅ Lembrete marcado como concluído com sucesso')
      }
    } catch (error) {
      console.error('❌ Erro ao marcar lembrete como concluído:', error)
    }
  }

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setShowEditReminderForm(true)
  }

  const handleUpdateReminder = async () => {
    if (!editingReminder?.title?.trim()) return
    const updated = await updateReminder(editingReminder.id, {
      title: editingReminder.title.trim(),
    })
    if (updated) {
      setShowEditReminderForm(false)
      setEditingReminder(null)
    } else {
      showError('Não foi possível salvar o lembrete.')
    }
  }

  const handleDeleteReminder = async (reminderId: string, anchorRect?: DOMRect) => {
    if (!confirm('Remover este lembrete?')) return
    const ok = await deleteReminder(reminderId)
    if (ok && anchorRect) burstTaskDelete(anchorRect)
    if (!ok) showError('Não foi possível excluir o lembrete.')
    if (editingReminder?.id === reminderId) {
      setShowEditReminderForm(false)
      setEditingReminder(null)
    }
  }

  const handleCancelEditReminder = () => {
    setShowEditReminderForm(false)
    setEditingReminder(null)
  }

  // Seedar lembretes padrão quando a modal for aberta
  useEffect(() => {
    if (showRemindersModal) {
      seedDefaultReminders()
    }
  }, [showRemindersModal, seedDefaultReminders])

  // Funções para to-dos
  const handleCreateTodo = async () => {
    if (newTodo.title.trim()) {
      const newTodoData = await createTodo({
        title: newTodo.title.trim(),
        description: newTodo.description.trim(),
        priority: newTodo.priority,
        category: newTodo.category.trim(),
        dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : undefined,
        completed: false,
        isHighPriority: false,
        timeSensitive: newTodo.timeSensitive,
        onHold: false,
        onHoldReason: undefined,
        status: 'current_week',
        tags: [],
        projectIds: newTodo.projectIds,
      })
      if (newTodoData) {
      setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
      setShowInlineCreateForm(false)
      setShowCreateTodoModal(false)
      }
    }
  }

  const handleCancelCreate = () => {
    setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
    setShowInlineCreateForm(false)
  }

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowEditTodoModal(true)
  }

  const handleUpdateTodo = async () => {
    if (editingTodo && editingTodo.title.trim()) {
      const updatedTodo = await updateTodo(editingTodo.id, {
        title: editingTodo.title.trim(),
        description: editingTodo.description?.trim() || '',
        priority: editingTodo.priority,
        category: editingTodo.category?.trim() || '',
        dueDate: editingTodo.dueDate || undefined,
        completed: editingTodo.completed,
        isHighPriority: editingTodo.isHighPriority,
        timeSensitive: editingTodo.timeSensitive,
        onHold: editingTodo.onHold,
        onHoldReason: editingTodo.onHoldReason,
        projectIds: editingTodo.projectIds,
      })
      if (updatedTodo) {
      setEditingTodo(null)
      setShowEditTodoModal(false)
      }
    }
  }

  // Função unificada que determina qual função de update usar baseada no bloco
  const handleUpdateTodoUnified = async () => {
    if (!editingTodo || !editingTodo.title.trim()) return

    // SEMPRE usar API para persistir no banco, independente do bloco
    await handleUpdateTodo()
  }

  const handleToggleTodoComplete = async (todoId: string) => {
    const currentTodo = todos.find((t) => t.id === todoId)
    if (!currentTodo) return
    const newCompletedStatus = !currentTodo.completed
    const result = await updateTodo(todoId, { completed: newCompletedStatus })
    if (!result) showError('Não foi possível atualizar a tarefa.')
  }

  const handleDeleteTodo = (todoId: string) => {
    const todo =
      editingTodo?.id === todoId ? editingTodo : todos.find((t) => t.id === todoId)
    if (!todo) return
    setTodoDeleteConfirm({ todo })
  }

  const handleTogglePriority = async (todoId: string) => {
    const currentTodo = todos.find((t) => t.id === todoId)
    if (!currentTodo) return
    const result = await updateTodo(todoId, { isHighPriority: !currentTodo.isHighPriority })
    if (!result) showError('Não foi possível alterar a prioridade.')
  }

  const handleDragEndBetweenBlocks = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const activeTodo = todos.find((t) => t.id === activeId)
    if (!activeTodo) return

    const applyOptimistic = (build: (prev: Todo[]) => Todo[]) => {
      setTodos((prev) => {
        dragRollbackRef.current = cloneTodoList(prev)
        return build(prev)
      })
    }

    const rollbackDrag = () => {
      if (dragRollbackRef.current) {
        setTodos(dragRollbackRef.current)
        dragRollbackRef.current = null
      }
    }

    const finishDrag = (result: Todo | null, errMsg: string) => {
      if (!result) {
        rollbackDrag()
        showError(errMsg)
      } else {
        dragRollbackRef.current = null
      }
    }

    const columnTarget = columnStatusFromId(overId)
    if (columnTarget && activeTodo.status !== columnTarget) {
      let newPos = 0
      applyOptimistic((prev) => {
        newPos = appendPosForStatus(prev, columnTarget, activeId)
        return prev.map((t) =>
          t.id === activeId ? { ...t, status: columnTarget, pos: newPos } : t
        )
      })
      const result = await updateTodo(activeId, { status: columnTarget, pos: newPos })
      finishDrag(result, 'Não foi possível mover a tarefa.')
      return
    }

    if (overId.startsWith('group-')) {
      let newPos = 0
      applyOptimistic((prev) => {
        newPos = appendPosForStatus(prev, 'current_week', activeId)
        return prev.map((t) =>
          t.id === activeId ? { ...t, status: 'current_week', pos: newPos } : t
        )
      })
      const result = await updateTodo(activeId, { status: 'current_week', pos: newPos })
      finishDrag(result, 'Não foi possível mover a tarefa.')
      return
    }

    const overTodo = todos.find((t) => t.id === overId)
    if (!overTodo) return

    if (activeTodo.status === overTodo.status) {
      const col = todos
        .filter((t) => t.status === activeTodo.status && !t.completed)
        .sort(sortTodosByPriorityAndPos)
      const oldIdx = col.findIndex((t) => t.id === activeId)
      const newIdx = col.findIndex((t) => t.id === overId)
      if (oldIdx < 0 || newIdx < 0) return
      const reordered = arrayMove(col, oldIdx, newIdx)
      const newPos = computePosAtNewIndexInVisualBucket(reordered, activeId)
      if (newPos === null) return
      applyOptimistic((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, pos: newPos } : t))
      )
      const result = await updateTodo(activeId, { pos: newPos, status: activeTodo.status })
      finishDrag(result, 'Não foi possível reordenar.')
      return
    }

    const newStatus = overTodo.status
    const targetCol = todos
      .filter((t) => t.status === newStatus && !t.completed && t.id !== activeId)
      .sort(sortTodosByPriorityAndPos)
    const overIndex = targetCol.findIndex((t) => t.id === overId)
    let newPos: number
    if (overIndex <= 0) {
      const first = targetCol[0]
      newPos = first ? first.pos - 500 : 1000
    } else {
      const prev = targetCol[overIndex - 1]
      const next = targetCol[overIndex]
      newPos = Math.round((prev.pos + next.pos) / 2)
      if (newPos <= prev.pos || newPos >= next.pos) {
        newPos = prev.pos + (next.pos - prev.pos) / 2
      }
    }
    applyOptimistic((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: newStatus, pos: newPos } : t))
    )
    const result = await updateTodo(activeId, { status: newStatus, pos: newPos })
    finishDrag(result, 'Não foi possível mover a tarefa.')
  }

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const withPointer = pointerWithin(args)
    if (withPointer.length > 0) return withPointer
    return closestCenter(args)
  }, [])

  // Funções de tags removidas - serão reimplementadas do zero

  // Funções de tags removidas - serão reimplementadas do zero

  // Funções para itens em progresso
  const handleCreateInProgressTodo = async () => {
    if (newInProgressTodo.title.trim()) {
      const newTodoData = {
        title: newInProgressTodo.title.trim(),
        description: newInProgressTodo.description.trim(),
        priority: newInProgressTodo.priority,
        category: newInProgressTodo.category.trim(),
        dueDate: newInProgressTodo.dueDate ? newInProgressTodo.dueDate.toISOString() : undefined,
        completed: false,
        isHighPriority: false,
        timeSensitive: newInProgressTodo.timeSensitive,
        onHold: false,
        onHoldReason: undefined,
        status: 'in_progress' as const,
        tags: [],
        projectIds: newInProgressTodo.projectIds,
      }
      
      // Usar API para criar no banco
      const createdTodo = await createTodo(newTodoData)
      if (createdTodo) {
        setNewInProgressTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
        setShowInProgressCreateForm(false)
      }
    }
  }

  const handleCancelInProgressCreate = () => {
    setNewInProgressTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
    setShowInProgressCreateForm(false)
  }

  const handleEditInProgressTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowEditTodoModal(true)
  }

  const handleToggleInProgressTodoComplete = async (todoId: string) => {
    const currentTodo = todos.find((t) => t.id === todoId)
    if (!currentTodo) return
    const result = await updateTodo(todoId, { completed: !currentTodo.completed })
    if (!result) showError('Não foi possível atualizar a tarefa.')
  }

  const handleToggleInProgressPriority = async (todoId: string) => {
    // Encontrar a tarefa atual
    const currentTodo = inProgressTodos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        isHighPriority: !currentTodo.isHighPriority
      })
    }
  }

  // Funções para gerenciar status "Em Espera"
  const handlePutTodoOnHold = async (todo: Todo) => {
    if (todo.onHold) {
      const pos = appendPosForStatus(todos, todo.status, todo.id)
      const result = await updateTodo(todo.id, {
        onHold: false,
        onHoldReason: undefined,
        pos,
      })
      if (!result) showError('Não foi possível atualizar a tarefa.')
    } else {
      // Se não está em espera, abrir modal para colocar em espera
      setTodoToPutOnHold(todo)
      setOnHoldReason('')
      setShowOnHoldModal(true)
    }
  }

  const handleConfirmOnHold = async () => {
    if (!todoToPutOnHold) return
    if (!on_hold_reason.trim()) {
      showError('Informe o motivo da espera.')
      return
    }
    const pos = appendPosForOnHoldAtBottom(todos, todoToPutOnHold.status, todoToPutOnHold.id)
    const result = await updateTodo(todoToPutOnHold.id, {
      onHold: true,
      onHoldReason: on_hold_reason.trim(),
      pos,
    })
    if (!result) {
      showError('Não foi possível atualizar a tarefa.')
      return
    }
    setShowOnHoldModal(false)
    setTodoToPutOnHold(null)
    setOnHoldReason('')
  }

  const handleCancelOnHold = () => {
    setShowOnHoldModal(false)
    setTodoToPutOnHold(null)
    setOnHoldReason('')
  }

  const handleMoveToProgress = async (todo: Todo) => {
    if (todo.status === 'in_progress') {
      const pos = appendPosForStatus(todos, 'current_week', todo.id)
      const result = await updateTodo(todo.id, { status: 'current_week', pos })
      if (!result) showError('Não foi possível mover a tarefa.')
    } else {
      const pos = appendPosForStatus(todos, 'in_progress', todo.id)
      const result = await updateTodo(todo.id, { status: 'in_progress', pos })
      if (!result) showError('Não foi possível mover a tarefa.')
    }
  }

  const executeConfirmedTodoDelete = async () => {
    if (!todoDeleteConfirm) return
    const { todo, anchorRect } = todoDeleteConfirm
    setTodoDeleteConfirm(null)
    const success = await deleteTodo(todo.id)
    if (success && anchorRect) burstTaskDelete(anchorRect)
    if (!success) showError('Não foi possível excluir a tarefa.')
    if (success && editingTodo?.id === todo.id) {
      setEditingTodo(null)
      setShowEditTodoModal(false)
    }
  }

  const handleDeleteTodoFromAnyBlock = (todo: Todo, anchorRect?: DOMRect) => {
    setTodoDeleteConfirm({ todo, anchorRect })
  }

  // Funções para backlog
  const handleCreateBacklogTodo = async () => {
    if (newBacklogTodo.title.trim()) {
      const newTodoData = {
        title: newBacklogTodo.title.trim(),
        description: newBacklogTodo.description.trim(),
        priority: newBacklogTodo.priority,
        category: newBacklogTodo.category.trim(),
        dueDate: newBacklogTodo.dueDate ? newBacklogTodo.dueDate.toISOString() : undefined,
        completed: false,
        isHighPriority: false,
        timeSensitive: newBacklogTodo.timeSensitive,
        onHold: false,
        onHoldReason: undefined,
        status: 'backlog' as const,
        tags: [],
        projectIds: newBacklogTodo.projectIds,
      }
      
      // Usar API para criar no banco
      const createdTodo = await createTodo(newTodoData)
      if (createdTodo) {
        setNewBacklogTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
        setShowBacklogCreateForm(false)
      }
    }
  }

  const handleCancelBacklogCreate = () => {
    setNewBacklogTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectIds: [] })
    setShowBacklogCreateForm(false)
  }

  const handleEditBacklogTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowEditTodoModal(true)
  }

  const handleUpdateBacklogTodo = async () => {
    if (editingTodo && editingTodo.title.trim()) {
      // SEMPRE usar API para persistir no banco
      await handleUpdateTodo()
    }
  }

  const handleToggleBacklogTodoComplete = async (todoId: string) => {
    // Encontrar a tarefa atual
    const currentTodo = backlogTodos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        completed: !currentTodo.completed
      })
    }
  }

  const handleToggleBacklogPriority = async (todoId: string) => {
    // Encontrar a tarefa atual
    const currentTodo = backlogTodos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        isHighPriority: !currentTodo.isHighPriority
      })
    }
  }

  const openWeekInlineCreate = () => {
    setShowBacklogCreateForm(false)
    setShowInProgressCreateForm(false)
    setShowInlineCreateForm(true)
  }

  const openBacklogInlineCreate = () => {
    setShowInlineCreateForm(false)
    setShowInProgressCreateForm(false)
    setShowBacklogCreateForm(true)
  }

  const openInProgressInlineCreate = () => {
    setShowInlineCreateForm(false)
    setShowBacklogCreateForm(false)
    setShowInProgressCreateForm(true)
  }

  const handleOpenBacklogFromQuickActions = useCallback(() => {
    setShowQuickActionsMenu(false)
    openBacklogInlineCreate()
    window.requestAnimationFrame(() => {
      document.getElementById('backlog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  useEffect(() => {
    if (!showInlineCreateForm) return
    const raf = window.requestAnimationFrame(() => {
      weekInlineTitleInputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [showInlineCreateForm])

  useEffect(() => {
    if (!showBacklogCreateForm) return
    const raf = window.requestAnimationFrame(() => {
      backlogInlineTitleInputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [showBacklogCreateForm])

  useEffect(() => {
    if (!showInProgressCreateForm) return
    const raf = window.requestAnimationFrame(() => {
      inProgressInlineTitleInputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(raf)
  }, [showInProgressCreateForm])

  useEffect(() => {
    if (!showInlineCreateForm) return
    const onDown = (e: MouseEvent) => {
      const el = weekInlineFormRef.current
      if (!el || el.contains(e.target as Node)) return
      if (!newTodo.title.trim()) handleCancelCreate()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showInlineCreateForm, newTodo.title])

  useEffect(() => {
    if (!showInlineCreateForm) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelCreate()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [showInlineCreateForm])

  useEffect(() => {
    if (!showBacklogCreateForm) return
    const onDown = (e: MouseEvent) => {
      const el = backlogInlineFormRef.current
      if (!el || el.contains(e.target as Node)) return
      if (!newBacklogTodo.title.trim()) handleCancelBacklogCreate()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showBacklogCreateForm, newBacklogTodo.title])

  useEffect(() => {
    if (!showBacklogCreateForm) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelBacklogCreate()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [showBacklogCreateForm])

  useEffect(() => {
    if (!showInProgressCreateForm) return
    const onDown = (e: MouseEvent) => {
      const el = inProgressInlineFormRef.current
      if (!el || el.contains(e.target as Node)) return
      if (!newInProgressTodo.title.trim()) handleCancelInProgressCreate()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showInProgressCreateForm, newInProgressTodo.title])

  useEffect(() => {
    if (!showInProgressCreateForm) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelInProgressCreate()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [showInProgressCreateForm])

  // Configuração dos sensores para drag and drop (distância evita arrastar ao clicar em botões)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-background/95 backdrop-blur-md border-b border-outline-variant/10">
        <div>
          <h1 className="font-headline text-xl font-bold tracking-tighter text-primary md:text-2xl">
            Planejamento Semanal
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1 max-w-md">
            Organize suas tarefas entre backlog e semana atual
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-primary">sync</span>
            {activeCycle ? `Ciclo ${activeCycle.cycleNumber} ativo` : 'Sem ciclo ativo'}
          </div>
          {!activeCycle ? (
            <button
              type="button"
              onClick={() => void handleStartCycle()}
              disabled={cycleBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Iniciar Novo Ciclo
            </button>
          ) : null}
          <div className="hidden sm:block h-6 w-px bg-outline-variant/40" aria-hidden />
          <button
            type="button"
            onClick={() => setShowRemindersModal(true)}
            className="inline-flex items-center gap-2 p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title="Lembretes"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="text-xs font-bold text-on-surface-variant sm:hidden">{taskStats.reminders}</span>
          </button>
        </div>
      </header>

      {boardError && (
        <div
          className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container ring-1 ring-outline-variant/10"
          role="alert"
        >
          {boardError}
        </div>
      )}

      {/* Resumo — cartões */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
        <div className="bg-primary/5 p-4 rounded-xl shadow-sm border-2 border-primary/20">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Em Progresso
          </p>
          <p className="text-2xl font-bold font-headline text-primary">{taskStats.inProgress}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-2 border-primary/10 ring-1 ring-outline-variant/5">
          <p className="text-xs font-semibold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">
            Semana Atual
          </p>
          <p className="text-2xl font-bold font-headline text-on-surface">{taskStats.currentWeek}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-2 border-primary/30 ring-1 ring-outline-variant/5">
          <p className="text-xs font-semibold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">
            Backlog
          </p>
          <p className="text-2xl font-bold font-headline text-primary">{taskStats.backlog}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-2 border-primary/10 ring-1 ring-outline-variant/5">
          <p className="text-xs font-semibold text-on-secondary-fixed-variant uppercase tracking-wider mb-1">
            Concluídas
          </p>
          <p className="text-2xl font-bold font-headline text-on-surface">{taskStats.completed}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowRemindersModal(true)}
          className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-2 border-tertiary/20 ring-1 ring-outline-variant/5 hover:bg-surface-container-high/80 transition-colors text-left col-span-2 md:col-span-1"
        >
          <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">Lembretes</p>
          <p className="text-2xl font-bold font-headline text-on-surface">{taskStats.reminders}</p>
        </button>
      </div>

      <div id="metas-section" className="mb-8">
      {/* Elemento de Metas */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden flex flex-col">
        <div 
          className="p-5 flex justify-between items-center border-b border-outline-variant/15 cursor-pointer hover:bg-surface-container-high/20 transition-colors"
          onClick={() => setGoalsExpanded(!goalsExpanded)}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="material-symbols-outlined text-primary text-2xl">ads_click</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">Metas Trimestrais</h2>
            <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {goals.length > 0 ? `${Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)}%` : '0%'} média
            </span>
          </div>
          <div className="flex items-center gap-2">
            {goals.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingGoal(null)
                  setShowGoalModal(true)
                }}
                className="inline-flex items-center justify-center w-8 h-8 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors"
                title="Nova meta"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setGoalsExpanded(!goalsExpanded)
              }}
              aria-expanded={goalsExpanded}
            >
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${goalsExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          </div>
        </div>

        {/* Conteúdo expandido */}
        {goalsExpanded && (
          <div className="px-6 pb-6 border-t border-outline-variant/15">
            {goals.length === 0 ? (
              <div className="p-8 flex flex-col md:flex-row items-center gap-8 justify-center">
                <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center relative overflow-hidden shrink-0 ring-1 ring-outline-variant/10">
                  <img
                    alt=""
                    className="w-12 h-12 object-cover z-10 rounded-md"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2voAUwzAD7ptpQvfdImRg_R6NtEtvgcNhVQL-5zJqXJI1-O4k3EPuy7loSJxsAVNKWdk1q19VCyMVVuCoX5YH75z7-gP7SUTDzjTlOxTzgkVOs2XhD-arVlvAyqxG2jiKTLPJb2LsdBOYTS0AkCOJ6nE13qIbntH8vi1rZS_WXNeBZwFe1mfIWu9lij9LRS62Mkpa02fimyAf0QljOoA5d45UxogWsGujyGyXqVdCglk4d3fKbszQA5BmRNf5pThcFnIw7J8xupJO"
                    width={48}
                    height={48}
                  />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                    Defina seus objetivos principais
                  </h3>
                  <p className="text-on-surface-variant text-sm mb-4 max-w-md">
                    Mantenha o foco no que realmente importa criando metas trimestrais ou mensais.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoal(null)
                      setShowGoalModal(true)
                    }}
                    className="px-5 py-2 border border-primary text-primary rounded-lg font-semibold text-sm hover:bg-primary/5 transition-colors"
                  >
                    Criar Primeira Meta
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Suas Metas</h4>
                </div>
                
                {/* Exibição das metas usando o componente GoalDisplay */}
                <GoalDisplay
                  goals={goals}
                  projects={projects}
                  onEditGoal={(goal) => {
                    setEditingGoal(goal)
                    setShowGoalModal(true)
                  }}
                  onUpdateGoalProgress={handleUpdateGoalProgressNew}
                  onToggleInitiative={handleToggleInitiativeNew}
                  onEditInitiative={handleEditInitiativeNew}
                  onDeleteInitiative={handleDeleteInitiativeNew}
                />
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={(e) => setActiveDragId(String(e.active.id))}
        onDragCancel={() => setActiveDragId(null)}
        onDragEnd={(e) => {
          setActiveDragId(null)
          void handleDragEndBetweenBlocks(e)
        }}
      >
        {/* Foco Agora — prioridade: tarefas em progresso; timer Pomodoro secundário */}
        <section className="mb-8 relative" id="foco-agora">
          <div className="bg-surface-container-lowest rounded-2xl shadow-lg ring-2 ring-primary/10 overflow-hidden flex flex-col relative">
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10" aria-hidden>
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
            </div>
            <div className="p-5 md:p-6 flex flex-wrap items-center gap-4 border-b border-outline-variant/15 bg-primary/5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="material-symbols-outlined text-primary text-3xl shrink-0">timer</span>
                <div className="min-w-0">
                  <h2 className="font-headline font-bold text-xl text-on-surface">Foco Agora</h2>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Tarefas em execução — arraste para cá ou retome o que já está em progresso
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 flex flex-col flex-1 gap-5">
              <DroppableColumn
                id={COL_IN_PROGRESS}
                className="space-y-4 min-h-[12rem] md:min-h-[14rem] max-h-[min(28rem,50vh)] overflow-y-auto py-0.5 pr-1 -mr-1 [scrollbar-gutter:stable]"
              >
                {inProgressTodos.length === 0 ? (
                  showInProgressCreateForm ? (
                    <>
                      <div
                        ref={inProgressInlineFormRef}
                        className="mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex gap-1 cursor-move">
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                              <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            disabled
                            className="w-4 h-4 text-blue-600 border border-blue-300 rounded focus:ring-blue-500"
                          />
                          <input
                            ref={inProgressInlineTitleInputRef}
                            type="text"
                            value={newInProgressTodo.title}
                            onChange={(e) =>
                              setNewInProgressTodo({ ...newInProgressTodo, title: e.target.value })
                            }
                            placeholder="Título da tarefa..."
                            className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleCreateInProgressTodo()
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCancelInProgressCreate}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Cancelar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="ml-16">
                          <label className="mb-1 block text-sm text-gray-600">Projetos (opcional)</label>
                          <ProjectIdsPicker
                            projects={projects}
                            value={newInProgressTodo.projectIds}
                            onChange={(ids) =>
                              setNewInProgressTodo({ ...newInProgressTodo, projectIds: ids })
                            }
                          />
                        </div>
                      </div>
                      <div
                        className="min-h-[10rem] rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/20"
                        aria-label="Área para soltar tarefas em progresso"
                      />
                    </>
                  ) : (
                    <div className="py-10 md:py-12 px-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-primary/[0.02] to-transparent rounded-xl border border-dashed border-outline-variant/40">
                      <button
                        type="button"
                        onClick={() => document.getElementById('pomodoro-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-20 h-20 md:w-24 md:h-24 mb-5 flex items-center justify-center bg-surface-container-lowest rounded-3xl shadow-md ring-1 ring-outline-variant/10 group hover:scale-105 transition-transform cursor-pointer"
                        aria-label="Ir ao timer Pomodoro"
                      >
                        <span className="material-symbols-outlined text-4xl md:text-5xl text-outline group-hover:text-primary transition-colors">
                          play_circle
                        </span>
                      </button>
                      <h3 className="font-headline font-bold text-lg text-on-surface mb-2">Nenhuma tarefa em progresso</h3>
                      <p className="text-on-surface-variant text-sm max-w-md mb-5">
                        Arraste uma tarefa da semana ou do backlog para cá, ou crie uma nova. O timer Pomodoro fica abaixo para sessões focadas.
                      </p>
                      <button
                        type="button"
                        onClick={() => openInProgressInlineCreate()}
                        className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-all shadow-md active:scale-95 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nova Tarefa
                      </button>
                    </div>
                  )
                ) : (
                  <SortableContext
                    items={inProgressTodos.map((todo) => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {inProgressTodos.map((todo) => (
                          <SortableTodoItem
                            key={todo.id}
                            todo={todo}
                            projects={projects}
                            onToggleComplete={handleToggleInProgressTodoComplete}
                            onTogglePriority={handleToggleInProgressPriority}
                            onEdit={handleEditInProgressTodo}
                            onPutOnHold={handlePutTodoOnHold}
                            onMoveToProgress={handleMoveToProgress}
                            onDeleteFromAnyBlock={handleDeleteTodoFromAnyBlock}
                          />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </DroppableColumn>

              <div
                id="pomodoro-section"
                className="border-t border-outline-variant/15 pt-4 shrink-0"
              >
                <p className="text-xs font-medium text-on-surface-variant mb-2">Timer Pomodoro (opcional)</p>
                <PomodoroTimer
                  compact
                  onCycleComplete={(cycles) => {
                    console.log(`Ciclo completado! Total de ciclos hoje: ${cycles}`)
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Seção de Semana Atual */}
          <div className="flex flex-col gap-4 h-full" id="semana-atual">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-headline font-bold text-on-surface truncate">Semana Atual</h2>
                <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-md font-bold text-on-surface-variant shrink-0">
                  {weekTodos.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openWeekInlineCreate()}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar nova tarefa
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl ring-1 ring-outline-variant/10 overflow-hidden">
            <div className="p-4 md:p-6">
              {/* Botão largo quando há tarefas — atalho extra */}
              {!showInlineCreateForm && weekTodos.length > 0 && (
                <button
                  type="button"
                  onClick={() => openWeekInlineCreate()}
                  className="w-full mb-4 px-4 py-3 bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl hover:bg-surface-container-high/80 transition-colors flex items-center justify-center gap-2 text-on-surface font-medium"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Adicionar nova tarefa
                </button>
              )}

              {/* Formulário inline para criar nova tarefa */}
              {showInlineCreateForm && (
                <div ref={weekInlineFormRef} className="mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                  {/* Primeira linha: Título e botão fechar */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Drag handle */}
                    <div className="flex gap-1 cursor-move">
                      <div className="flex flex-col gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 text-blue-600 border border-blue-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Input do título */}
                    <input
                      ref={weekInlineTitleInputRef}
                      type="text"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      placeholder="Título da tarefa..."
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTodo()
                        }
                      }}
                    />
                    
                    {/* Botão de fechar */}
                    <button
                      onClick={handleCancelCreate}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Cancelar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Segunda linha: projetos */}
                  <div className="ml-16">
                    <label className="mb-1 block text-sm text-gray-600">Projetos (opcional)</label>
                    <ProjectIdsPicker
                      projects={projects}
                      value={newTodo.projectIds}
                      onChange={(ids) => setNewTodo({ ...newTodo, projectIds: ids })}
                    />
                  </div>
                </div>
              )}

              {/* Conteúdo dos to-dos - lista direta sem agrupamento (igual ao Backlog) */}
              <DroppableColumn id={COL_CURRENT_WEEK} className="space-y-4">
                {weekTodos.length === 0 && !showInlineCreateForm ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openWeekInlineCreate()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openWeekInlineCreate()
                      }
                    }}
                    className="border-2 border-dashed border-outline-variant rounded-xl min-h-[16rem] flex flex-col items-center justify-center bg-surface-container-low/30 group cursor-pointer hover:bg-surface-container-low transition-all"
                  >
                    <div className="p-3 rounded-full bg-surface-container-lowest shadow-sm mb-3 group-hover:scale-110 transition-transform ring-1 ring-outline-variant/10">
                      <span className="material-symbols-outlined text-2xl text-outline group-hover:text-primary transition-colors">
                        auto_awesome_motion
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium px-4 text-center">
                      Nada planejado para esta semana ainda
                    </p>
                  </div>
                ) : weekTodos.length === 0 && showInlineCreateForm ? (
                  <div
                    className="min-h-[10rem] rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/20"
                    aria-label="Área para soltar tarefas na semana atual"
                  />
                ) : (
                  <SortableContext
                    items={weekTodos.map((todo) => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {weekTodos.map((todo) => (
                        <SortableTodoItem
                          key={todo.id}
                          todo={todo}
                          projects={projects}
                          onToggleComplete={handleToggleTodoComplete}
                          onTogglePriority={handleTogglePriority}
                          onEdit={handleEditTodo}
                          onPutOnHold={handlePutTodoOnHold}
                          onMoveToProgress={handleMoveToProgress}
                          onDeleteFromAnyBlock={handleDeleteTodoFromAnyBlock}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </DroppableColumn>
            </div>
          </div>
          </div>

          {/* Seção de Backlog */}
          <div id="backlog-section" className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-headline font-bold text-on-surface truncate">Backlog</h2>
                <span className="text-xs bg-primary-fixed text-primary px-2 py-0.5 rounded-md font-bold shrink-0">
                  {backlogTodos.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openBacklogInlineCreate()}
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar nova tarefa
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm ring-1 ring-outline-variant/10 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              {!showBacklogCreateForm && backlogTodos.length > 0 && (
                <button
                  type="button"
                  onClick={() => openBacklogInlineCreate()}
                  className="w-full mb-4 px-4 py-3 bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl hover:bg-surface-container-high/80 transition-colors flex items-center justify-center gap-2 text-on-surface font-medium"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Adicionar nova tarefa
                </button>
              )}

              {/* Formulário inline para criar nova tarefa */}
              {showBacklogCreateForm && (
                <div ref={backlogInlineFormRef} className="mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <div className="flex gap-1 cursor-move">
                      <div className="flex flex-col gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 text-blue-600 border border-blue-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Input do título */}
                    <input
                      ref={backlogInlineTitleInputRef}
                      type="text"
                      value={newBacklogTodo.title}
                      onChange={(e) => setNewBacklogTodo({ ...newBacklogTodo, title: e.target.value })}
                      placeholder="Título da tarefa..."
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateBacklogTodo()
                        }
                      }}
                    />
                    
                    {/* Botão de fechar */}
                    <button
                      type="button"
                      onClick={handleCancelBacklogCreate}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Cancelar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="ml-16">
                    <label className="mb-1 block text-sm text-gray-600">Projetos (opcional)</label>
                    <ProjectIdsPicker
                      projects={projects}
                      value={newBacklogTodo.projectIds}
                      onChange={(ids) => setNewBacklogTodo({ ...newBacklogTodo, projectIds: ids })}
                    />
                  </div>
                </div>
              )}

              {/* Conteúdo dos to-dos */}
              <DroppableColumn id={COL_BACKLOG} className="space-y-4">
                {backlogTodos.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa no backlog</h3>
                    <p className="text-gray-600 mb-4">Adicione tarefas para o futuro para manter tudo organizado.</p>
                    <button
                      onClick={() => openBacklogInlineCreate()}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar Tarefa
                    </button>
                  </div>
                ) : (
                  <SortableContext
                    items={backlogTodos.map((todo) => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {backlogTodos.map((todo) => (
                          <SortableTodoItem
                            key={todo.id}
                            todo={todo}
                            projects={projects}
                            onToggleComplete={handleToggleBacklogTodoComplete}
                            onTogglePriority={handleToggleBacklogPriority}
                            onEdit={handleEditBacklogTodo}
                            onPutOnHold={handlePutTodoOnHold}
                            onMoveToProgress={handleMoveToProgress}
                            onDeleteFromAnyBlock={handleDeleteTodoFromAnyBlock}
                          />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </DroppableColumn>
            </div>
          </div>
          </div>
        </div>

        {showQuickActionsMenu ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-transparent"
            aria-label="Fechar menu de ações"
            onClick={() => setShowQuickActionsMenu(false)}
          />
        ) : null}

        <div className="fixed inset-x-0 bottom-8 z-40 pointer-events-none lg:pl-64">
          <div className="mx-auto flex w-full max-w-7xl justify-end px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-auto">
              {showQuickActionsMenu ? (
                <div className="mb-3 w-64 rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-2xl ring-1 ring-outline-variant/10">
                  <button
                    type="button"
                    onClick={handleOpenBacklogFromQuickActions}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                    Adicionar nova tarefa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickActionsMenu(false)
                      setShowFinishCycleConfirm(true)
                    }}
                    disabled={!activeCycle || cycleBusy}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">flag</span>
                    Finalizar ciclo
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowQuickActionsMenu((v) => !v)}
                className="h-14 w-14 rounded-full bg-tertiary text-on-tertiary shadow-2xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                title="Ações rápidas"
                aria-label="Abrir ações rápidas"
                aria-expanded={showQuickActionsMenu}
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
              </button>
            </div>
          </div>
        </div>

        <DragOverlay adjustScale={false}>
          {activeDragTodo ? (
            <TodoDragOverlayPreview todo={activeDragTodo} projects={projects} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal de Projetos e Tags REMOVIDO - será reimplementado do zero */}

      {showFinishCycleConfirm && (
        <ModalOverlay
          isOpen={showFinishCycleConfirm}
          onClose={() => setShowFinishCycleConfirm(false)}
        >
          <ModalPanel maxWidthClass="max-w-md" padding="none">
            <div className="border-b border-outline-variant/15 px-6 py-5">
              <h2 className="text-lg font-semibold text-on-surface">Finalizar ciclo?</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Esta ação é irreversível e vai fechar o ciclo atual.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowFinishCycleConfirm(false)}
                className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowFinishCycleConfirm(false)
                  await handleFinishCycle()
                }}
                disabled={!activeCycle || cycleBusy}
                className="rounded-lg bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cycleBusy ? 'Finalizando...' : 'Confirmar finalização'}
              </button>
            </div>
          </ModalPanel>
        </ModalOverlay>
      )}

      {/* Reminders Modal */}
      <RemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        reminders={reminders}
        activeTab={activeReminderTab}
        onTabChange={setActiveReminderTab}
        onToggleComplete={handleToggleReminderComplete}
        onEditReminder={handleEditReminder}
        onUpdateReminder={handleUpdateReminder}
        onCancelEdit={handleCancelEditReminder}
        onDeleteReminder={handleDeleteReminder}
        onShowAddForm={handleShowAddReminderForm}
        onSaveReminder={handleAddReminder}
        onCancelAdd={() => {
          setShowAddReminderForm(false)
          setNewReminder('')
        }}
        newReminder={newReminder}
        onNewReminderChange={setNewReminder}
        showAddForm={showAddReminderForm}
        showEditForm={showEditReminderForm}
        editingReminder={editingReminder}
        onEditingReminderChange={setEditingReminder}
      />


      {/* Edit Goal Modal */}
      <ModalOverlay
        isOpen={showEditGoalModal}
        onClose={() => setShowEditGoalModal(false)}
        onBackdropClick={handleUpdateGoal}
      >
        <ModalPanel maxWidthClass="max-w-lg">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editar Meta</h3>
              <button
                onClick={() => setShowEditGoalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {editingGoal && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Meta *
                  </label>
                  <input
                    type="text"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Aumentar vendas em 20%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={editingGoal.description || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva os detalhes da meta"
                  />
                </div>

                {/* Seleção de projeto e sub-projeto REMOVIDA - será reimplementada do zero */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próximo Passo (opcional)
                  </label>
                  <textarea
                    value={editingGoal.nextSteps || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, nextSteps: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva o próximo passo para esta meta..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progresso
                  </label>
                  <InteractiveProgressBar
                    progress={editingGoal.progress}
                    onProgressChange={(newProgress) => setEditingGoal({ ...editingGoal, progress: newProgress })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Meta (opcional)
                  </label>
                  <DatePicker
                    selected={editingGoal.dueDate ? new Date(editingGoal.dueDate) : null}
                    onChange={(date: Date | null) => setEditingGoal({ ...editingGoal, dueDate: date ? date.toISOString() : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Selecionar data"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    locale="pt-BR"
                  />
                </div>

                {/* Seção de Iniciativas */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Iniciativas
                    </label>
                    <button
                      onClick={() => setShowAddInitiativeForm(!showAddInitiativeForm)}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 border border-gray-300"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar Iniciativa
                    </button>
                  </div>

                  {/* Formulário para adicionar nova iniciativa */}
                  {showAddInitiativeForm && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newInitiative}
                          onChange={(e) => setNewInitiative(e.target.value)}
                          placeholder="Digite a descrição da iniciativa..."
                          className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddInitiative()
                            }
                          }}
                        />
                        <button
                          onClick={handleAddInitiative}
                          disabled={!newInitiative.trim()}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de iniciativas existentes */}
                  <div className="space-y-2">
                    {editingGoal.initiatives && editingGoal.initiatives.length > 0 ? (
                      editingGoal.initiatives.map((initiative) => (
                        <div key={initiative.id} className="p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {editingInitiative?.id === initiative.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editingInitiative.description}
                                    onChange={(e) => setEditingInitiative({ ...editingInitiative, description: e.target.value })}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateInitiative()
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={handleUpdateInitiative}
                                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-900">{initiative.title}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEditInitiative(initiative)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Editar"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteInitiative(initiative.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Excluir"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-center">
                        <p className="text-sm text-gray-500">Nenhuma iniciativa criada</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between gap-3 mt-6">
                  <button
                    onClick={() => handleDeleteGoal(editingGoal.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditGoalModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdateGoal}
                      disabled={!editingGoal.title.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Atualizar Meta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalPanel>
      </ModalOverlay>

      {/* Create Todo Modal */}
      <ModalOverlay
        isOpen={showCreateTodoModal}
        onClose={() => setShowCreateTodoModal(false)}
        onBackdropClick={handleCreateTodo}
      >
        <ModalPanel maxWidthClass="max-w-lg">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Novo To-do</h3>
              <button
                onClick={() => setShowCreateTodoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do To-do *
                </label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Fazer compras do mês"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descreva os detalhes do to-do"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria (opcional)
                </label>
                <input
                  type="text"
                  value={newTodo.category}
                  onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Pessoal, Trabalho, Saúde..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Projetos (opcional)
                </label>
                <ProjectIdsPicker
                  projects={projects}
                  value={newTodo.projectIds}
                  onChange={(ids) => setNewTodo({ ...newTodo, projectIds: ids })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento (opcional)
                </label>
                <DatePicker
                  selected={newTodo.dueDate}
                  onChange={(date: Date | null) => setNewTodo({ ...newTodo, dueDate: date })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholderText="Selecionar data..."
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                  locale="pt-BR"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateTodoModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTodo}
                disabled={!newTodo.title.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar To-do
              </button>
            </div>
          </div>
        </ModalPanel>
      </ModalOverlay>

      {/* Edit Todo Modal */}
      <ModalOverlay
        isOpen={showEditTodoModal}
        onClose={() => setShowEditTodoModal(false)}
        onBackdropClick={handleUpdateTodoUnified}
      >
        <ModalPanel maxWidthClass="max-w-2xl">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Editar Tarefa</h3>
                <p className="text-sm text-gray-500">Atualize as informações da sua tarefa</p>
              </div>
              <button
                onClick={() => setShowEditTodoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {editingTodo && (
              <div className="space-y-6">
                {/* Prioridade - ícone de bandeira no topo */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setEditingTodo({ ...editingTodo, isHighPriority: !editingTodo.isHighPriority })}
                    className={`p-3 rounded-full transition-colors ${
                      editingTodo.isHighPriority
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={editingTodo.isHighPriority ? 'Remover prioridade' : 'Marcar como prioridade'}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z"/>
                    </svg>
                  </button>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={editingTodo.title}
                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título da tarefa"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={editingTodo.description || ''}
                    onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adicione uma descrição (opcional)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Projetos
                  </label>
                  <ProjectIdsPicker
                    projects={projects}
                    value={editingTodo.projectIds ?? []}
                    onChange={(ids) => setEditingTodo({ ...editingTodo, projectIds: ids })}
                  />
                </div>



                {/* Time Sensitive */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="timeSensitive"
                      checked={editingTodo.timeSensitive}
                      onChange={(e) => setEditingTodo({ ...editingTodo, timeSensitive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="timeSensitive" className="ml-2 text-sm text-gray-700">
                      Esta tarefa é time sensitive
                    </label>
                  </div>
                  
                  {/* Date Picker - aparece apenas quando timeSensitive é marcado */}
                  {editingTodo.timeSensitive && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Vencimento *
                      </label>
                      <DatePicker
                        selected={editingTodo.dueDate ? new Date(editingTodo.dueDate) : null}
                        onChange={(date: Date | null) => setEditingTodo({ ...editingTodo, dueDate: date ? date.toISOString() : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholderText="Selecionar data"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={15}
                        locale="pt-BR"
                        minDate={new Date()}
                      />
                    </div>
                  )}
                </div>



                {/* Botões de ação */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleDeleteTodo(editingTodo.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditTodoModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdateTodoUnified}
                      disabled={!editingTodo.title.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalPanel>
      </ModalOverlay>

      <ModalOverlay
        isOpen={!!todoDeleteConfirm}
        onClose={() => setTodoDeleteConfirm(null)}
      >
        <ModalPanel maxWidthClass="max-w-md">
          <div className="mt-2">
            <h3 className="text-lg font-semibold text-gray-900">Excluir tarefa?</h3>
            <p className="mt-2 text-sm text-gray-600">
              {todoDeleteConfirm
                ? `«${todoDeleteConfirm.todo.title.trim() || 'Sem título'}» será removida permanentemente.`
                : null}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTodoDeleteConfirm(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedTodoDelete()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </ModalPanel>
      </ModalOverlay>

      {/* Modal para colocar tarefa em espera */}
      {showOnHoldModal && (
        <ModalOverlay
          isOpen={showOnHoldModal}
          onClose={handleCancelOnHold}
          onBackdropClick={handleConfirmOnHold}
        >
          <ModalPanel maxWidthClass="max-w-md" padding="none">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {todoToPutOnHold?.onHold ? 'Remover tarefa da espera' : 'Colocar tarefa em espera'}
                </h2>
                <button
                  onClick={handleCancelOnHold}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="on_hold_reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da espera
                  </label>
                  <textarea
                    id="on_hold_reason"
                    value={on_hold_reason}
                    onChange={(e) => setOnHoldReason(e.target.value)}
                    placeholder="Explique por que esta tarefa está aguardando..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={handleCancelOnHold}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmOnHold}
                  disabled={!on_hold_reason.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {todoToPutOnHold?.onHold ? 'Remover da Espera' : 'Confirmar'}
                </button>
              </div>
          </ModalPanel>
        </ModalOverlay>
      )}

      {/* Modal de Gerenciamento de Metas */}
      <GoalManagementModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        goal={editingGoal}
        projects={projects}
        onCreateGoal={handleCreateGoalNew}
        onUpdateGoal={handleUpdateGoalNew}
        onDeleteGoal={handleDeleteGoal}
      />

    </div>
  )
}

// TESTE
// FORCE VERCEL UPDATE

// Componente para grupo de tags arrastável - definido DEPOIS das funções
function SortableTagGroup({ 
  tagName, 
  todos, 
  onToggleComplete, 
  onTogglePriority, 
  onEdit, 
  onPutOnHold,
  onMoveToProgress,
  onDeleteFromAnyBlock
}: {
  tagName: string
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
  onPutOnHold?: (todo: Todo) => void
  onMoveToProgress?: (todo: Todo) => void
  onDeleteFromAnyBlock?: (todo: Todo, anchorRect?: DOMRect) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${tagName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-gray-50 rounded-lg border border-gray-200 p-4"
    >
      {/* Cabeçalho do grupo com drag handle */}
      <div className="flex items-center gap-3 mb-3">
        {/* Drag handle para mover o grupo inteiro */}
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
        
        {/* Nome da tag e contador */}
        <h3 className="text-sm font-semibold text-gray-700">
          {tagName} ({todos.length})
        </h3>
      </div>
      
      {/* Itens do grupo */}
      <div className="space-y-2">
        {todos.map((todo) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            projects={[]}
            onToggleComplete={onToggleComplete}
            onTogglePriority={onTogglePriority}
            onEdit={onEdit}
            onPutOnHold={onPutOnHold}
            onMoveToProgress={onMoveToProgress}
            onDeleteFromAnyBlock={onDeleteFromAnyBlock}
          />
        ))}
      </div>
    </div>
  )
}

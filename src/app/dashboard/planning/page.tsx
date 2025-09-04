'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ModalOverlay from '@/components/ModalOverlay'
import { ProjectManagementModal } from '@/components/ProjectManagementModal'
import { GoalManagementModal } from '@/components/GoalManagementModal'
import { GoalDisplay } from '@/components/GoalDisplay'
import { RemindersModal } from '@/components/RemindersModal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import InteractiveProgressBar from '@/components/InteractiveProgressBar'
import { usePlanningData } from '@/hooks/usePlanningData'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

// Componente para grupo de tags arrastável - será definido depois das funções

// Componente para item de to-do arrastável
function SortableTodoItem({ todo, projects, onToggleComplete, onTogglePriority, onEdit, onPutOnHold, onMoveToProgress, onDeleteFromAnyBlock }: {
  todo: Todo
  projects: { id: string; name: string; color: string }[]
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
  onPutOnHold?: (todo: Todo) => void
  onMoveToProgress?: (todo: Todo) => void
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

      {/* Tag do projeto - posicionada no canto direito */}
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

      {/* Tags no canto direito - removido temporariamente */}

      {/* Botões de ação (visíveis apenas no hover da atividade específica) - sobrepostos às tags */}
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
        
        {/* Botão de pause/play (colocar ou remover da espera) */}
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
            onClick={() => onMoveToProgress(todo)}
            className={`p-2 rounded-md transition-colors ${
              // Verificar se o item está em progresso (está no array inProgressTodos)
              // Por enquanto, vamos usar uma lógica simples baseada no título ou ID
              todo.title.includes('progresso') || todo.id.includes('progress')
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={
              todo.title.includes('progresso') || todo.id.includes('progress')
                ? 'Voltar para Semana Atual'
                : 'Enviar para Em Progresso'
            }
          >
            {todo.title.includes('progresso') || todo.id.includes('progress') ? (
              // Ícone de voltar (quando está em progresso)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            ) : (
              // Ícone de play (enviar para em progresso)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l4 1L6 17H17l2-10L9 4l9-3z" />
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

import { DBReminder } from '@/lib/planning'
type Reminder = DBReminder

import { Todo, Goal } from '@/lib/planning'

export default function PlanningPage() {
  // Hook para gerenciar dados de planejamento
  const {
    projects,
    todos,
    goals,
    reminders,
    isLoading,
    setTodos,
    setGoals,
    setReminders,
    createProject,
    updateProject,
    deleteProject,
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
    reloadData
  } = usePlanningData()

  // Debug: Log do estado de metas
  console.log('🎯 Page: Estado atual de metas:', goals)
  console.log('🎯 Page: Função setGoals disponível:', !!setGoals)

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  // Estado de showProjectsModal REMOVIDO
  // Estado de showNewProjectForm REMOVIDO
  // Estado de showNewTagForm REMOVIDO
  // Estado de editingProject REMOVIDO
  // Estado de editingTag REMOVIDO
  // Estado de newProject REMOVIDO
  // Estado de newTag REMOVIDO
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  })

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
    projectId: undefined as string | undefined
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
    projectId: undefined as string | undefined
  })
  const [inProgressTodos, setInProgressTodos] = useState<Todo[]>([])

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
    projectId: undefined as string | undefined
  })
  const [backlogTodos, setBacklogTodos] = useState<Todo[]>([
    {
      id: '20',
      title: 'Criar uma ferramenta de auto orçamento',
      description: 'Desenvolver ferramenta automatizada para criação de orçamentos',
      priority: 'medium',
      category: 'KimonoLab',
      dueDate: undefined,
      completed: false,
      isHighPriority: false,
      timeSensitive: false,
      onHold: false,
      onHoldReason: undefined,
      tags: [{ name: 'KimonoLab', color: '#EF4444' }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '21',
      title: 'Fazer uma análise de posicionamento',
      description: 'Realizar análise completa de posicionamento no mercado',
      priority: 'medium',
      category: 'Zentrix BS',
      dueDate: undefined,
      completed: false,
      isHighPriority: false,
      timeSensitive: false,
      onHold: false,
      onHoldReason: undefined,
      tags: [{ name: 'Zentrix BS', color: '#8B5CF6' }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '22',
      title: 'Criar uma ferramenta de planejamento',
      description: 'A IA sugere os ingredientes e cria receitas personalizadas',
      priority: 'low',
      category: 'Miscellaneous',
      dueDate: undefined,
      completed: false,
      isHighPriority: false,
      timeSensitive: false,
      onHold: false,
      onHoldReason: undefined,
      tags: [{ name: 'Miscellaneous', color: '#10B981' }],
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    },
    {
      id: '23',
      title: 'Criar uma ferramenta de previsão',
      description: 'Ferramenta com IA que busca e analisa dados de mercado',
      priority: 'low',
      category: 'Miscellaneous',
      dueDate: undefined,
      completed: false,
      isHighPriority: false,
      timeSensitive: false,
      onHold: false,
      onHoldReason: undefined,
      tags: [{ name: 'Miscellaneous', color: '#10B981' }],
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    },
    {
      id: '24',
      title: 'Criar ferramenta para traçar melhor rota',
      description: 'Você compartilha a simulação e a IA sugere melhorias',
      priority: 'low',
      category: 'Miscellaneous',
      dueDate: undefined,
      completed: false,
      isHighPriority: false,
      timeSensitive: false,
      onHold: false,
      onHoldReason: undefined,
      tags: [{ name: 'Miscellaneous', color: '#10B981' }],
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    }
  ])

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

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      // Aqui você pode adicionar a lógica para salvar a tarefa
      console.log('Nova tarefa:', newTask)
      setNewTask({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high', dueDate: '' })
      setShowTaskModal(false)
    }
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

  // Estatísticas calculadas dinamicamente baseadas nos dados reais
  const taskStats = {
    inProgress: inProgressTodos.filter(t => !t.completed).length,
    currentWeek: todos.filter(t => !t.completed).length,
    backlog: backlogTodos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length + backlogTodos.filter(t => t.completed).length + inProgressTodos.filter(t => t.completed).length,
    reminders: reminders.length // Usar contagem real dos lembretes
  }

  const mockReminders: Reminder[] = [
    {
      id: '1',
      user_id: 'user-1',
      title: 'Reunião com equipe',
      description: 'Discussão sobre próximos sprints',
      due_date: '2024-01-15',
      priority: 'high',
      category: 'lembretes',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'user-1',
      title: 'Pagar contas',
      description: 'Verificar boletos pendentes',
      due_date: '2024-01-20',
      priority: 'medium',
      category: 'lembretes',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

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
    if (editingReminder) {
    // TODO: Implementar atualização de lembretes
      console.log('Atualizar lembrete:', editingReminder)
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
        tags: [],
        projectId: newTodo.projectId,
        /* status: 'backlog' */
      })
      if (newTodoData) {
      setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
      setShowInlineCreateForm(false)
      }
    }
  }

  const handleCancelCreate = () => {
    setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
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
        projectId: editingTodo.projectId
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
    // Encontrar a tarefa atual
    const currentTodo = todos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        completed: !currentTodo.completed
      })
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (confirm('Tem certeza que deseja deletar este to-do? Esta ação não pode ser desfeita.')) {
      console.log('🗑️ Deletando todo:', todoId)
      
      const success = await deleteTodo(todoId)
      if (success) {
        console.log('✅ Todo deletado com sucesso, removendo de todos os estados locais')
        
        // Remover de todos os estados locais para manter sincronização
        setTodos(prev => prev.filter(t => t.id !== todoId))
        setBacklogTodos(prev => prev.filter(t => t.id !== todoId))
        setInProgressTodos(prev => prev.filter(t => t.id !== todoId))
        
        // Limpar editingTodo se estiver editando o item deletado
        if (editingTodo && editingTodo.id === todoId) {
          setEditingTodo(null)
          setShowEditTodoModal(false)
        }
        
        console.log('✅ Todo removido de todos os estados locais')
      } else {
        console.log('❌ Falha ao deletar todo')
      }
    }
  }

  // Função para alternar prioridade
  const handleTogglePriority = async (todoId: string) => {
    // Encontrar a tarefa atual
    const currentTodo = todos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        isHighPriority: !currentTodo.isHighPriority
      })
    }
  }

  // Função groupTodosByFirstTag REMOVIDA - será reimplementada do zero

  // Função para drag and drop entre blocos
  const handleDragEndBetweenBlocks = (event: DragEndEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Verificar se o item está sendo movido para uma posição diferente
    if (activeId === overId) return

    // Encontrar o item ativo em todos os arrays
    const activeTodoInTodos = todos.find(t => t.id === activeId)
    const activeTodoInBacklog = backlogTodos.find(t => t.id === activeId)
    const activeTodoInProgress = inProgressTodos.find(t => t.id === activeId)

    // Se o item não foi encontrado, não fazer nada
    if (!activeTodoInTodos && !activeTodoInBacklog && !activeTodoInProgress) return

    // Verificar se o item está sendo movido para o backlog
    const overTodoInBacklog = backlogTodos.find(t => t.id === overId)
    if (overTodoInBacklog && (activeTodoInTodos || activeTodoInProgress)) {
      // Mover da Semana Atual ou Em Progresso para o Backlog
      if (activeTodoInTodos) {
        setTodos(todos.filter(t => t.id !== activeId))
        setBacklogTodos([...backlogTodos, activeTodoInTodos])
      } else if (activeTodoInProgress) {
        setInProgressTodos(inProgressTodos.filter(t => t.id !== activeId))
        setBacklogTodos([...backlogTodos, activeTodoInProgress])
      }
      return
    }

    // Verificar se o item está sendo movido para a semana atual
    const overTodoInTodos = todos.find(t => t.id === overId)
    if (overTodoInTodos && (activeTodoInBacklog || activeTodoInProgress)) {
      // Mover do Backlog ou Em Progresso para a Semana Atual
      if (activeTodoInBacklog) {
        setBacklogTodos(backlogTodos.filter(t => t.id !== activeId))
        setTodos([...todos, activeTodoInBacklog])
      } else if (activeTodoInProgress) {
        setInProgressTodos(inProgressTodos.filter(t => t.id !== activeId))
        setTodos([...todos, activeTodoInProgress])
      }
      return
    }

    // Verificar se o item está sendo movido para em progresso
    const overTodoInProgress = inProgressTodos.find(t => t.id === overId)
    if (overTodoInProgress && (activeTodoInTodos || activeTodoInBacklog)) {
      // Mover da Semana Atual ou Backlog para Em Progresso
      if (activeTodoInTodos) {
        setTodos(todos.filter(t => t.id !== activeId))
        setInProgressTodos([...inProgressTodos, activeTodoInTodos])
      } else if (activeTodoInBacklog) {
        setBacklogTodos(backlogTodos.filter(t => t.id !== activeId))
        setInProgressTodos([...inProgressTodos, activeTodoInBacklog])
      }
      return
    }

    // Verificar se o item está sendo movido para um grupo de tags na Semana Atual
    if (overId.startsWith('group-') && (activeTodoInBacklog || activeTodoInProgress)) {
      // Mover do Backlog ou Em Progresso para a Semana Atual
      if (activeTodoInBacklog) {
        setBacklogTodos(backlogTodos.filter(t => t.id !== activeId))
        setTodos([...todos, activeTodoInBacklog])
      } else if (activeTodoInProgress) {
        setInProgressTodos(inProgressTodos.filter(t => t.id !== activeId))
        setTodos([...todos, activeTodoInProgress])
      }
      return
    }

    // Se não estiver movendo entre blocos, fazer reordenação dentro do mesmo bloco
    if (activeTodoInTodos) {
      // Reordenação dentro da Semana Atual
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId)
        const newIndex = items.findIndex((item) => item.id === overId)

        return arrayMove(items, oldIndex, newIndex)
      })
    } else if (activeTodoInBacklog) {
      // Reordenação dentro do Backlog
      setBacklogTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId)
        const newIndex = items.findIndex((item) => item.id === overId)

        return arrayMove(items, oldIndex, newIndex)
      })
    } else if (activeTodoInProgress) {
      // Reordenação dentro de Em Progresso
      setInProgressTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId)
        const newIndex = items.findIndex((item) => item.id === overId)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Função para drag and drop (mantida para compatibilidade)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

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
        projectId: newInProgressTodo.projectId
      }
      
      // Usar API para criar no banco
      const createdTodo = await createTodo(newTodoData)
      if (createdTodo) {
        setNewInProgressTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
        setShowInProgressCreateForm(false)
      }
    }
  }

  const handleCancelInProgressCreate = () => {
    setNewInProgressTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
    setShowInProgressCreateForm(false)
  }

  const handleEditInProgressTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowEditTodoModal(true)
  }

  const handleToggleInProgressTodoComplete = async (todoId: string) => {
    // Encontrar a tarefa atual
    const currentTodo = inProgressTodos.find(t => t.id === todoId)
    if (currentTodo) {
      await updateTodo(todoId, {
        completed: !currentTodo.completed
      })
    }
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
      // Se já está em espera, remover da espera usando API
      await updateTodo(todo.id, {
        onHold: false,
        onHoldReason: undefined
      })
      
      // Recarregar dados para aplicar a nova ordenação do backend
      await reloadData()
    } else {
      // Se não está em espera, abrir modal para colocar em espera
      setTodoToPutOnHold(todo)
      setOnHoldReason('')
      setShowOnHoldModal(true)
    }
  }

  const handleConfirmOnHold = async () => {
    if (todoToPutOnHold && on_hold_reason.trim()) {
      // Usar API para salvar no banco
      await updateTodo(todoToPutOnHold.id, {
        onHold: true,
        onHoldReason: on_hold_reason.trim()
      })

      // Recarregar dados para aplicar a nova ordenação do backend
      await reloadData()

      setShowOnHoldModal(false)
      setTodoToPutOnHold(null)
      setOnHoldReason('')
    }
  }

  const handleCancelOnHold = () => {
    setShowOnHoldModal(false)
    setTodoToPutOnHold(null)
    setOnHoldReason('')
  }

  // Função para mover item para Em Progresso ou voltar para Semana Atual
  const handleMoveToProgress = (todo: Todo) => {
    // Verificar se o item está em progresso
    const isInProgress = inProgressTodos.some(t => t.id === todo.id)
    
    if (isInProgress) {
      // Se está em progresso, voltar para Semana Atual
      setInProgressTodos(inProgressTodos.filter(t => t.id !== todo.id))
      setTodos([...todos, todo])
    } else {
      // Se não está em progresso, mover para Em Progresso
      // Verificar de qual bloco está vindo
      const isInTodos = todos.some(t => t.id === todo.id)
      const isInBacklog = backlogTodos.some(t => t.id === todo.id)
      
      if (isInTodos) {
        setTodos(todos.filter(t => t.id !== todo.id))
        setInProgressTodos([...inProgressTodos, todo])
      } else if (isInBacklog) {
        setBacklogTodos(backlogTodos.filter(t => t.id !== todo.id))
        setInProgressTodos([...inProgressTodos, todo])
      }
    }
  }

  // Função para deletar item com confirmação de qualquer bloco
  const handleDeleteTodoFromAnyBlock = async (todo: Todo) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.')) {
      console.log('🗑️ Deletando todo de qualquer bloco:', todo.id)
      
      // SEMPRE usar API para deletar do banco
      const success = await deleteTodo(todo.id)
      if (success) {
        console.log('✅ Todo deletado com sucesso do banco, removendo de todos os estados locais')
        
        // Remover de todos os estados locais para manter sincronização
        setTodos(prev => prev.filter(t => t.id !== todo.id))
        setBacklogTodos(prev => prev.filter(t => t.id !== todo.id))
        setInProgressTodos(prev => prev.filter(t => t.id !== todo.id))
        
        console.log('✅ Todo removido de todos os estados locais')
      } else {
        console.log('❌ Falha ao deletar todo do banco')
      }
    }
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
        projectId: newBacklogTodo.projectId
      }
      
      // Usar API para criar no banco
      const createdTodo = await createTodo(newTodoData)
      if (createdTodo) {
        setNewBacklogTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
        setShowBacklogCreateForm(false)
      }
    }
  }

  const handleCancelBacklogCreate = () => {
    setNewBacklogTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, timeSensitive: false, onHold: false, onHoldReason: undefined, tags: [], projectId: undefined })
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

  const handleDeleteBacklogTodo = async (todoId: string) => {
    if (confirm('Tem certeza que deseja deletar este to-do? Esta ação não pode ser desfeita.')) {
      console.log('🗑️ Deletando todo do backlog:', todoId)
      
      // SEMPRE usar API para deletar do banco
      const success = await deleteTodo(todoId)
      if (success) {
        console.log('✅ Todo deletado com sucesso do banco, removendo de todos os estados locais')
        
        // Remover de todos os estados locais para manter sincronização
        setTodos(prev => prev.filter(t => t.id !== todoId))
        setBacklogTodos(prev => prev.filter(t => t.id !== todoId))
        setInProgressTodos(prev => prev.filter(t => t.id !== todoId))
        
        console.log('✅ Todo removido de todos os estados locais')
      } else {
        console.log('❌ Falha ao deletar todo do banco')
      }
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

  const handleDragEndBacklog = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setBacklogTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Funções de tags removidas - serão reimplementadas do zero

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Ordenar to-dos: prioridade alta primeiro, depois pela ordem manual
  const sortedTodos = todos
    .filter(todo => !todo.completed)
    .sort((a, b) => {
      if (a.isHighPriority && !b.isHighPriority) return -1
      if (!a.isHighPriority && b.isHighPriority) return 1
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Planejamento Semanal</h1>
            <p className="mt-2 text-gray-600">
              Organize suas tarefas entre backlog e semana atual
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
                            {/* Botão de Gerenciar Projetos */}
            <button
              onClick={() => setShowProjectsModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                  title="Gerenciar Projetos"
            >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>


            
            {/* Google Calendar Button */}
            <button className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-orange-500" />
              Google Calendar
            </button>
            
            {/* New Task Button */}
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Tarefa
            </button>
            
            {/* Exit Button */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Task Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Em Progresso */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Em Progresso</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
              {taskStats.inProgress}
            </div>
          </div>
        </div>

        {/* Semana Atual */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Semana Atual</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.currentWeek}
            </div>
          </div>
        </div>

        {/* Backlog */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Backlog</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.backlog}
            </div>
          </div>
        </div>

        {/* Concluídas */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Concluídas</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.completed}
            </div>
          </div>
        </div>

        {/* Lembretes - Cliqueável */}
        <button
          onClick={() => setShowRemindersModal(true)}
          className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200 hover:bg-orange-100 transition-colors duration-200"
        >
          <div className="text-center">
            <p className="text-orange-700 text-sm mb-2">Lembretes</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
              {taskStats.reminders}
            </div>
          </div>
        </button>
      </div>

      {/* Elemento de Metas */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setGoalsExpanded(!goalsExpanded)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Metas</h2>
                <p className="text-sm text-gray-600">
                  {goals.length > 0 ? `${Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)}% média` : '0% média'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {goals.length > 0 && (
                <button
                  onClick={() => {
                    setEditingGoal(null)
                    setShowGoalModal(true)
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  title="Criar Nova Meta"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                <svg className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${goalsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo expandido */}
        {goalsExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {goals.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta criada</h3>
                <p className="text-gray-600 mb-4">Você ainda não tem metas definidas. Use o botão abaixo para criar sua primeira meta.</p>
                <button
                  onClick={() => {
                    setEditingGoal(null)
                    setShowGoalModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Primeira Meta
                </button>
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

      {/* Container para os blocos com DndContext unificado */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndBetweenBlocks}
      >
        {/* Bloco Em Progresso - Full Width */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-100 rounded-lg shadow border border-blue-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Em Progresso ({inProgressTodos.filter(t => !t.completed).length})</h2>
                    <p className="text-sm text-gray-600">Tarefas que estão sendo trabalhadas</p>
                  </div>
                </div>
              </div>

              {/* Conteúdo dos to-dos */}
              <div className="space-y-4">
                {inProgressTodos.filter(t => !t.completed).length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">🚀</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa em progresso</h3>
                    <p className="text-gray-600 mb-4">Arraste tarefas da Semana Atual ou Backlog para começar a trabalhar nelas.</p>
                  </div>
                ) : (
                  <SortableContext
                    items={inProgressTodos.filter(t => !t.completed).map(todo => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {inProgressTodos
                        .filter(t => !t.completed)
                        .map((todo) => (
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
              </div>
            </div>
          </div>
        </div>

        {/* Container para os blocos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção de Semana Atual */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Semana Atual ({sortedTodos.length})</h2>
                    <p className="text-sm text-gray-600">Tarefas e lembretes pessoais</p>
                  </div>
                </div>
              </div>

              {/* Botão de adicionar nova tarefa */}
              {!showInlineCreateForm && (
                <button
                  onClick={() => setShowInlineCreateForm(true)}
                  className="w-full mb-4 px-4 py-3 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar nova tarefa
                </button>
              )}

              {/* Formulário inline para criar nova tarefa */}
              {showInlineCreateForm && (
                <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
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
                      type="text"
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      placeholder="Título da tarefa..."
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTodo()
                        }
                      }}
                      autoFocus
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

                  {/* Segunda linha: Seleção de projeto */}
                  <div className="ml-16">
                    {/* Projeto selecionado */}
                    {newTodo.projectId && projects.find(p => p.id === newTodo.projectId) && (
                      <div className="flex items-center gap-2 mb-3">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: projects.find(p => p.id === newTodo.projectId)?.color || '#3B82F6' }}
                          >
                          {projects.find(p => p.id === newTodo.projectId)?.name}
                            <button
                            onClick={() => setNewTodo({ ...newTodo, projectId: undefined })}
                              className="ml-2 text-white hover:text-gray-200"
                            >
                              ×
                            </button>
                          </span>
                      </div>
                    )}

                    {/* Seletor de projeto */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Projeto:</label>
                      <select
                        value={newTodo.projectId || ''}
                        onChange={(e) => setNewTodo({ ...newTodo, projectId: e.target.value || undefined })}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sem projeto</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                                </div>
                                  </div>
                </div>
              )}

              {/* Conteúdo dos to-dos - lista direta sem agrupamento (igual ao Backlog) */}
              <div className="space-y-4">
                {sortedTodos.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa criada</h3>
                    <p className="text-gray-600 mb-4">Crie sua primeira tarefa para começar a organizar sua semana.</p>
                    <button
                      onClick={() => setShowCreateTodoModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Criar Tarefa
                    </button>
                  </div>
                ) : (
                      <SortableContext
                    items={sortedTodos.map(todo => todo.id)}
                        strategy={verticalListSortingStrategy}
                      >
                    <div className="space-y-2">
                      {sortedTodos.map((todo) => (
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
              </div>
            </div>
          </div>

          {/* Seção de Backlog */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Backlog ({backlogTodos.filter(t => !t.completed).length})</h2>
                    <p className="text-sm text-gray-600">Tarefas para o futuro</p>
                  </div>
                </div>
              </div>

              {/* Botão de adicionar nova tarefa */}
              {!showBacklogCreateForm && (
                <button
                  onClick={() => setShowBacklogCreateForm(true)}
                  className="w-full mb-4 px-4 py-3 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar nova tarefa
                </button>
              )}

              {/* Formulário inline para criar nova tarefa */}
              {showBacklogCreateForm && (
                <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
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
                      type="text"
                      value={newBacklogTodo.title}
                      onChange={(e) => setNewBacklogTodo({ ...newBacklogTodo, title: e.target.value })}
                      placeholder="Título da tarefa..."
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateBacklogTodo()
                        }
                      }}
                      autoFocus
                    />
                    
                    {/* Botão de fechar */}
                    <button
                      onClick={handleCancelBacklogCreate}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Cancelar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Conteúdo dos to-dos */}
              <div className="space-y-4">
                {backlogTodos.filter(t => !t.completed).length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa no backlog</h3>
                    <p className="text-gray-600 mb-4">Adicione tarefas para o futuro para manter tudo organizado.</p>
                    <button
                      onClick={() => setShowBacklogCreateForm(true)}
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
                    items={backlogTodos.filter(t => !t.completed).map(todo => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {backlogTodos
                        .filter(t => !t.completed)
                        .map((todo) => (
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
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Modal de Projetos e Tags REMOVIDO - será reimplementado do zero */}

      {/* Task Creation Modal */}
      <ModalOverlay isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}>
        <div className="relative top-20 mx-auto p-5 w-96 shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Tarefa</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a descrição da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento (opcional)
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Criar Tarefa
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>

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
      <ModalOverlay isOpen={showEditGoalModal} onClose={() => setShowEditGoalModal(false)}>
        <div className="relative top-20 mx-auto p-6 w-[500px] shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
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
        </div>
      </ModalOverlay>

      {/* Create Todo Modal */}
      <ModalOverlay isOpen={showCreateTodoModal} onClose={() => setShowCreateTodoModal(false)}>
        <div className="relative top-20 mx-auto p-6 w-[500px] shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
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
        </div>
      </ModalOverlay>

      {/* Edit Todo Modal */}
      <ModalOverlay isOpen={showEditTodoModal} onClose={() => setShowEditTodoModal(false)}>
        <div className="relative top-20 mx-auto p-6 w-[600px] shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
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

                {/* Projeto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projeto
                    </label>
                  
                  {/* Projeto selecionado */}
                  {editingTodo.projectId && projects.find(p => p.id === editingTodo.projectId) && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: projects.find(p => p.id === editingTodo.projectId)?.color || '#3B82F6' }}
                      >
                        {projects.find(p => p.id === editingTodo.projectId)?.name}
                    <button
                          onClick={() => setEditingTodo({ ...editingTodo, projectId: undefined })}
                          className="ml-2 text-white hover:text-gray-200"
                        >
                          ×
                    </button>
                      </span>
                  </div>
                  )}
                  
                  {/* Seletor de projeto */}
                    <select
                    value={editingTodo.projectId || ''}
                    onChange={(e) => setEditingTodo({ ...editingTodo, projectId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    <option value="">Sem projeto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                    </select>
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
        </div>
      </ModalOverlay>

      {/* Modal para colocar tarefa em espera */}
      {showOnHoldModal && (
        <ModalOverlay isOpen={showOnHoldModal} onClose={handleCancelOnHold}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Modal de Gerenciamento de Projetos */}
      <ProjectManagementModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        projects={projects}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
      />

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
  onDeleteFromAnyBlock?: (todo: Todo) => void
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

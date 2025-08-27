'use client'

import { useState } from 'react'
import { PlusIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ModalOverlay from '@/components/ModalOverlay'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import InteractiveProgressBar from '@/components/InteractiveProgressBar'
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

// Componente para item de to-do arrastável
function SortableTodoItem({ todo, onToggleComplete, onTogglePriority, onEdit }: {
  todo: Todo
  onToggleComplete: (id: string) => void
  onTogglePriority: (id: string) => void
  onEdit: (todo: Todo) => void
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
      className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
    >
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
      <span className="flex-1 text-sm text-gray-900">{todo.title}</span>

      {/* Tags no canto direito */}
      {todo.tags.length > 0 && (
        <div className="flex items-center gap-1 mr-2">
          {todo.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Botões de ação (visíveis apenas no hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
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
      </div>
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

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface Goal {
  id: string
  title: string
  description?: string
  projectId: string
  subProject?: string
  whatIsMissing?: string
  dueDate?: string
  status: 'active' | 'completed'
  progress: number
  nextStep?: string
  initiatives: number
  totalInitiatives: number
  created_at: string
  initiativesList?: { id: string; description: string }[] // Adicionado para armazenar a lista de iniciativas
}

interface Todo {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  category?: string
  dueDate?: string
  completed: boolean
  isHighPriority: boolean
  tags: { name: string; color: string }[]
  created_at: string
}

export default function PlanningPage() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; color: string } | null>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    color: '#3B82F6'
  })
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  })

  // Estados para metas
  const [goalsExpanded, setGoalsExpanded] = useState(false)
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)
  const [showEditGoalModal, setShowEditGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    projectId: '',
    subProject: '',
    whatIsMissing: '',
    dueDate: null as Date | null
  })

  // Estados para iniciativas
  const [showAddInitiativeForm, setShowAddInitiativeForm] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<{ id: string; description: string } | null>(null)
  const [newInitiative, setNewInitiative] = useState('')

  // Estados para to-dos
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
  const [showEditTodoModal, setShowEditTodoModal] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [showInlineCreateForm, setShowInlineCreateForm] = useState(false)
  const [availableTags, setAvailableTags] = useState<{ name: string; color: string }[]>([
    { name: 'KimonoLab', color: '#EF4444' },
    { name: 'EXLG SDK', color: '#8B5CF6' },
    { name: 'EXLG CN', color: '#EC4899' },
    { name: 'Zentrix BS', color: '#8B5CF6' },
    { name: 'Miscellaneous', color: '#10B981' },
    { name: 'QuickWin', color: '#F59E0B' },
    { name: 'Pessoal', color: '#3B82F6' }
  ])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    dueDate: null as Date | null,
    tags: [] as { name: string; color: string }[]
  })

  // Mock data para projetos
  const [projects, setProjects] = useState([
    { id: '1', name: 'Pessoal', color: '#3B82F6' },
    { id: '2', name: 'ExitLag', color: '#6B7280' },
    { id: '3', name: 'KimonoLab', color: '#EF4444' },
    { id: '4', name: 'Zentrix', color: '#8B5CF6' }
  ])

  // Mock data para metas
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Get a life off work',
      description: 'Meta pessoal para equilibrar trabalho e vida pessoal',
      projectId: '1',
      subProject: '',
      whatIsMissing: 'Alocar um app dentro do nosso planejador semanal',
      dueDate: undefined,
      status: 'active',
      progress: 45,
      nextStep: 'Alocar um app dentro do nosso planejador semanal',
      initiatives: 0,
      totalInitiatives: 1,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '1', description: 'Criar um app de meditação' }]
    },
    {
      id: '2',
      title: 'SDK Comercialmente Operacional',
      description: 'Tornar o SDK operacional para vendas',
      projectId: '2',
      subProject: 'SDK',
      whatIsMissing: 'Fazer a estruturação do go to market do SDK (Quais eventos vamos, de que forma vamos, quais ferramentas vamos usar, o que precisamos aprovar, o que não precisamos aprovar, etc)',
      dueDate: '2025-09-30',
      status: 'active',
      progress: 75,
      nextStep: 'Fazer a estruturação do go to market do SDK (Quais eventos vamos, de que forma vamos, quais ferramentas vamos usar, o que precisamos aprovar, o que não precisamos aprovar, etc)',
      initiatives: 0,
      totalInitiatives: 2,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '2', description: 'Definir roadmap do SDK' }, { id: '3', description: 'Criar documentação' }]
    },
    {
      id: '3',
      title: 'CN automatizado e escalável',
      description: 'Automatizar e escalar o sistema CN',
      projectId: '2',
      subProject: 'CN',
      whatIsMissing: 'Avançar com Plugin e LP traduzida no ar',
      dueDate: '2025-09-30',
      status: 'active',
      progress: 50,
      nextStep: 'Avançar com Plugin e LP traduzida no ar',
      initiatives: 0,
      totalInitiatives: 2,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '4', description: 'Desenvolver Plugin CN' }, { id: '5', description: 'Traduzir LP' }]
    },
    {
      id: '4',
      title: 'Tornar o produto do SDK tecnicamente operacional',
      description: 'Implementar funcionalidades técnicas do SDK',
      projectId: '2',
      subProject: 'SDK',
      whatIsMissing: 'Avançar com front do Sentinel + Lançar nova season do Imperianic',
      dueDate: '2025-09-30',
      status: 'active',
      progress: 90,
      nextStep: 'Avançar com front do Sentinel + Lançar nova season do Imperianic',
      initiatives: 2,
      totalInitiatives: 6,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '6', description: 'Desenvolver front do Sentinel' }, { id: '7', description: 'Lançar nova season do Imperianic' }]
    },
    {
      id: '5',
      title: 'CRM Integrado e Automatizado com Atendimento de IA',
      description: 'Implementar CRM completo com inteligência artificial para atendimento',
      projectId: '3',
      subProject: '',
      whatIsMissing: 'Finalizar o KimonoBot na Lovable (Integrado, funcional e 24h)',
      dueDate: undefined,
      status: 'active',
      progress: 5,
      nextStep: 'Finalizar o KimonoBot na Lovable (Integrado, funcional e 24h)',
      initiatives: 0,
      totalInitiatives: 4,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '8', description: 'Integrar KimonoBot na Lovable' }, { id: '9', description: 'Desenvolver IA para atendimento' }]
    },
    {
      id: '6',
      title: 'Primeira Venda Zentrix Business Solutions',
      description: 'Conquistar a primeira venda do produto Zentrix',
      projectId: '4',
      subProject: 'Zentrix OS',
      whatIsMissing: 'Estruturar um fluxo de desenvolvimento e definir um DoD para o produto estar pronto para venda',
      dueDate: '2025-09-30',
      status: 'active',
      progress: 50,
      nextStep: 'Estruturar um fluxo de desenvolvimento e definir um DoD para o produto estar pronto para venda',
      initiatives: 0,
      totalInitiatives: 2,
      created_at: new Date().toISOString(),
      initiativesList: [{ id: '10', description: 'Definir fluxo de desenvolvimento' }, { id: '11', description: 'Definir DoD' }]
    }
  ])

  // Mock data para to-dos
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: '1',
      title: 'Fazer compras do mês',
      description: 'Comprar alimentos, produtos de limpeza e itens pessoais',
      priority: 'medium',
      category: 'Pessoal',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias
      completed: false,
      isHighPriority: false,
      tags: [
        { name: 'Pessoal', color: '#3B82F6' },
        { name: 'Compras', color: '#10B981' }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Agendar consulta médica',
      description: 'Marcar checkup anual com o cardiologista',
      priority: 'high',
      category: 'Saúde',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 semana
      completed: false,
      isHighPriority: true,
      tags: [
        { name: 'Saúde', color: '#EF4444' },
        { name: 'Médico', color: '#8B5CF6' }
      ],
      created_at: new Date().toISOString()
    }
  ])

  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      const newProjectData = {
        id: Date.now().toString(),
        name: newProject.name.trim(),
        color: newProject.color
      }
      setProjects([...projects, newProjectData])
      setNewProject({ name: '', color: '#3B82F6' })
      setShowNewProjectForm(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject()
    }
  }

  const handleEditProject = (project: { id: string; name: string; color: string }) => {
    setEditingProject(project)
    setShowNewProjectForm(false)
  }

  const handleUpdateProject = () => {
    if (editingProject && editingProject.name.trim()) {
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: editingProject.name.trim(), color: editingProject.color }
          : p
      ))
      setEditingProject(null)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.')) {
      setProjects(projects.filter(p => p.id !== projectId))
    }
  }

  const handleCreateGoal = () => {
    if (newGoal.title.trim() && newGoal.projectId) {
      const newGoalData: Goal = {
        id: Date.now().toString(),
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        projectId: newGoal.projectId,
        subProject: newGoal.subProject.trim(),
        whatIsMissing: newGoal.whatIsMissing.trim(),
        dueDate: newGoal.dueDate ? newGoal.dueDate.toISOString() : undefined,
        status: 'active',
        progress: 0,
        nextStep: newGoal.whatIsMissing.trim(), // Usar o campo "Próximo Passo" da modal
        initiatives: 0,
        totalInitiatives: 0,
        created_at: new Date().toISOString(),
        initiativesList: [] // Inicializa a lista de iniciativas para uma nova meta
      }
      setGoals([...goals, newGoalData])
      setNewGoal({ title: '', description: '', projectId: '', subProject: '', whatIsMissing: '', dueDate: null })
      setShowCreateGoalModal(false)
    }
  }

  const handleEditGoal = (goal: Goal) => {
    // Sincronizar o nextStep com whatIsMissing para edição
    const goalForEditing = {
      ...goal,
      whatIsMissing: goal.nextStep || ''
    }
    setEditingGoal(goalForEditing)
    setShowEditGoalModal(true)
  }

  const handleUpdateGoal = () => {
    if (editingGoal && editingGoal.title.trim() && editingGoal.projectId) {
      // Atualizar o campo nextStep com o valor de whatIsMissing
      const updatedGoal = {
        ...editingGoal,
        nextStep: editingGoal.whatIsMissing || ''
      }
      
      setGoals(goals.map(g => 
        g.id === editingGoal.id ? updatedGoal : g
      ))
      setEditingGoal(null)
      setShowEditGoalModal(false)
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita.')) {
      setGoals(goals.filter(g => g.id !== goalId))
      setShowEditGoalModal(false)
      setEditingGoal(null)
    }
  }

  // Função para atualizar apenas o progresso de uma meta
  const handleUpdateGoalProgress = (goalId: string, newProgress: number) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId 
          ? { ...goal, progress: newProgress }
          : goal
      )
    )
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

  // Mock data - depois será integrado com o banco
  const taskStats = {
    inProgress: 1,
    currentWeek: 21,
    backlog: 5,
    completed: 32,
    reminders: 6
  }

  const mockReminders: Reminder[] = [
    {
      id: '1',
      title: 'Reunião com equipe',
      description: 'Discussão sobre próximos sprints',
      dueDate: '2024-01-15',
      priority: 'high',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Pagar contas',
      description: 'Verificar boletos pendentes',
      dueDate: '2024-01-20',
      priority: 'medium',
      created_at: new Date().toISOString()
    }
  ]

  // Funções para iniciativas
  const handleAddInitiative = () => {
    if (newInitiative.trim() && editingGoal) {
      const newInitiativeData = {
        id: Date.now().toString(),
        description: newInitiative.trim()
      }
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiativesList: [...(prevGoal!.initiativesList || []), newInitiativeData]
      }))
      setNewInitiative('')
      setShowAddInitiativeForm(false)
    }
  }

  const handleEditInitiative = (initiative: { id: string; description: string }) => {
    setEditingInitiative(initiative)
  }

  const handleUpdateInitiative = () => {
    if (editingInitiative && editingInitiative.description.trim() && editingGoal) {
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiativesList: (prevGoal!.initiativesList || []).map(i =>
          i.id === editingInitiative.id ? { ...i, description: editingInitiative.description.trim() } : i
        )
      }))
      setEditingInitiative(null)
    }
  }

  const handleDeleteInitiative = (initiativeId: string) => {
    if (confirm('Tem certeza que deseja deletar esta iniciativa? Esta ação não pode ser desfeita.')) {
      setEditingGoal(prevGoal => ({
        ...prevGoal!,
        initiativesList: (prevGoal!.initiativesList || []).filter(i => i.id !== initiativeId)
      }))
      setEditingInitiative(null)
    }
  }

  // Estado para controlar a aba ativa dos lembretes
  const [activeReminderTab, setActiveReminderTab] = useState('compras')

  // Estado para adicionar novo lembrete
  const [showAddReminderForm, setShowAddReminderForm] = useState(false)
  const [newReminder, setNewReminder] = useState('')

  const handleAddReminder = () => {
    if (newReminder.trim() && activeReminderTab) {
      const newReminderData: Reminder = {
        id: Date.now().toString(),
        title: newReminder.trim(),
        description: '', // Descrição opcional
        dueDate: undefined, // Data de vencimento opcional
        priority: 'medium', // Prioridade padrão
        created_at: new Date().toISOString()
      }
      // Adicionar lógica para salvar o lembrete no estado mock
      console.log('Novo lembrete:', newReminderData)
      setNewReminder('')
      setShowAddReminderForm(false)
    }
  }

  // Funções para to-dos
  const handleCreateTodo = () => {
    if (newTodo.title.trim()) {
      const newTodoData: Todo = {
        id: Date.now().toString(),
        title: newTodo.title.trim(),
        description: newTodo.description.trim(),
        priority: newTodo.priority,
        category: newTodo.category.trim(),
        dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : undefined,
        completed: false,
        isHighPriority: false,
        tags: [],
        created_at: new Date().toISOString()
      }
      setTodos([...todos, newTodoData])
      setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, tags: [] })
      setShowInlineCreateForm(false)
    }
  }

  const handleCancelCreate = () => {
    setNewTodo({ title: '', description: '', priority: 'medium', category: '', dueDate: null, tags: [] })
    setShowInlineCreateForm(false)
  }

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setShowEditTodoModal(true)
  }

  const handleUpdateTodo = () => {
    if (editingTodo && editingTodo.title.trim()) {
      setTodos(todos.map(t => 
        t.id === editingTodo.id ? editingTodo : t
      ))
      setEditingTodo(null)
      setShowEditTodoModal(false)
    }
  }

  const handleToggleTodoComplete = (todoId: string) => {
    setTodos(todos.map(t => 
      t.id === todoId ? { ...t, completed: !t.completed } : t
    ))
  }

  const handleDeleteTodo = (todoId: string) => {
    if (confirm('Tem certeza que deseja deletar este to-do? Esta ação não pode ser desfeita.')) {
      setTodos(todos.filter(t => t.id !== todoId))
    }
  }

  // Função para alternar prioridade
  const handleTogglePriority = (todoId: string) => {
    setTodos(todos.map(t => 
      t.id === todoId ? { ...t, isHighPriority: !t.isHighPriority } : t
    ))
  }

  // Função para drag and drop
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

  // Funções para gerenciar tags
  const handleAddTagToTodo = (todoId: string, tagName: string) => {
    const tag = availableTags.find(t => t.name === tagName)
    if (tag) {
      setTodos(todos.map(t => 
        t.id === todoId 
          ? { ...t, tags: t.tags.some(existingTag => existingTag.name === tagName) ? t.tags : [...t.tags, tag] }
          : t
      ))
      
      // Atualizar também o editingTodo se estiver editando a mesma tarefa
      if (editingTodo && editingTodo.id === todoId) {
        setEditingTodo({
          ...editingTodo,
          tags: editingTodo.tags.some(existingTag => existingTag.name === tagName) 
            ? editingTodo.tags 
            : [...editingTodo.tags, tag]
        })
      }
    }
  }

  const handleRemoveTagFromTodo = (todoId: string, tagName: string) => {
    setTodos(todos.map(t => 
      t.id === todoId 
        ? { ...t, tags: t.tags.filter(tag => tag.name !== tagName) }
        : t
    ))
    
    // Atualizar também o editingTodo se estiver editando a mesma tarefa
    if (editingTodo && editingTodo.id === todoId) {
      setEditingTodo({
        ...editingTodo,
        tags: editingTodo.tags.filter(tag => tag.name !== tagName)
      })
    }
  }

  const handleCreateNewTag = () => {
    if (newTagName.trim() && !availableTags.some(t => t.name === newTagName.trim())) {
      const newTag = { name: newTagName.trim(), color: newTagColor }
      setAvailableTags([...availableTags, newTag])
      setNewTagName('')
    }
  }

  const handleRemoveTag = (tagName: string) => {
    // Remove a tag de todos os todos que a possuem
    setTodos(todos.map(t => ({
      ...t,
      tags: t.tags.filter(tag => tag.name !== tagName)
    })))
    // Remove a tag da lista de tags disponíveis
    setAvailableTags(availableTags.filter(t => t.name !== tagName))
  }

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
                <p className="text-sm text-gray-600">{goals.filter(g => g.status === 'active').length} ativas • {goals.filter(g => g.status === 'completed').length} concluídas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProjectsModal(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Projetos
              </button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">
                  {goals.length > 0 ? `${Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)}% média` : '0% média'}
                </span>
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
                  onClick={() => setShowCreateGoalModal(true)}
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
                  <button
                    onClick={() => setShowCreateGoalModal(true)}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Meta
                  </button>
                </div>
                
                {/* Agrupamento de metas por projeto */}
                {(() => {
                  const goalsByProject = projects.map(project => {
                    const projectGoals = goals.filter(goal => goal.projectId === project.id)
                    return { project, goals: projectGoals }
                  }).filter(item => item.goals.length > 0)

                  return goalsByProject.map(({ project, goals }) => (
                    <div key={project.id} className="space-y-3">
                      {/* Header do projeto */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: project.color }}></div>
                          <h5 className="text-sm font-medium text-gray-900">{project.name}</h5>
                          <span className="text-xs text-gray-600">{goals.length} meta{goals.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button
                          onClick={() => setShowCreateGoalModal(true)}
                          className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          + Meta
                        </button>
                      </div>
                      
                      {/* Grid de metas - adaptativo baseado na quantidade */}
                      <div className={`grid gap-4 ${
                        goals.length === 1 
                          ? 'grid-cols-1' // 1 meta = ocupa toda a largura
                          : goals.length === 2 
                            ? 'grid-cols-1 md:grid-cols-2' // 2 metas = 2 colunas em desktop
                            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3+ metas = 3 colunas em desktop
                      }`}>
                        {goals.map((goal) => (
                          <div 
                            key={goal.id} 
                            className={`p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                              goals.length === 1 ? 'max-w-none' : '' // 1 meta = sem limite de largura
                            }`}
                            onClick={() => handleEditGoal(goal)}
                          >
                            <div className="space-y-3">
                              {/* Cabeçalho da meta */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                                  <h6 className="text-sm font-medium text-gray-900">{goal.title}</h6>
                                </div>
                                <button 
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditGoal(goal)
                                  }}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm6 0a.75.75 0 011.5 0zm6 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Tag de sub-projeto */}
                              {goal.subProject && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  {goal.subProject}
                                </span>
                              )}
                              
                              {/* Barra de progresso interativa */}
                              <InteractiveProgressBar
                                progress={goal.progress}
                                onProgressChange={(newProgress) => {
                                  // Atualizar o progresso da meta
                                  handleUpdateGoalProgress(goal.id, newProgress)
                                }}
                              />
                              
                              {/* Próximo passo */}
                              {goal.nextStep && (
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <p className="text-xs text-yellow-800">
                                    <span className="font-medium">Próximo Passo:</span> {goal.nextStep}
                                  </p>
                                </div>
                              )}
                              
                              {/* Informações adicionais */}
                              <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-center gap-4">
                                  <span>Iniciativas: {goal.initiatives}/{goal.totalInitiatives}</span>
                                  {goal.dueDate && (
                                    <span className="flex items-center gap-1">
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {new Date(goal.dueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Botão para adicionar iniciativa */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowAddInitiativeForm(true)
                                    setEditingGoal(goal)
                                  }}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  + Iniciativa
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}
      </div>

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
            </div>
          )}

          {/* Conteúdo dos to-dos */}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTodos.map(todo => todo.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onToggleComplete={handleToggleTodoComplete}
                        onTogglePriority={handleTogglePriority}
                        onEdit={handleEditTodo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Projects Management Modal */}
      <ModalOverlay isOpen={showProjectsModal} onClose={() => setShowProjectsModal(false)}>
        <div className="relative top-20 mx-auto p-6 w-96 shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Gerenciar Projetos</h3>
              <button
                onClick={() => setShowProjectsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Projetos Existentes</h4>
                <button 
                  onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                  className="w-8 h-8 border-2 border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Formulário de Novo Projeto ou Edição */}
              {(showNewProjectForm || editingProject) && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Projeto
                      </label>
                      <input
                        type="text"
                        value={editingProject ? editingProject.name : newProject.name}
                        onChange={(e) => {
                          if (editingProject) {
                            setEditingProject({ ...editingProject, name: e.target.value })
                          } else {
                            setNewProject({ ...newProject, name: e.target.value })
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (editingProject) {
                              handleUpdateProject()
                            } else {
                              handleCreateProject()
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o nome do projeto"
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor do Projeto
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={editingProject ? editingProject.color : newProject.color}
                          onChange={(e) => {
                            if (editingProject) {
                              setEditingProject({ ...editingProject, color: e.target.value })
                            } else {
                              setNewProject({ ...newProject, color: e.target.value })
                            }
                          }}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editingProject ? editingProject.color : newProject.color}
                          onChange={(e) => {
                            if (editingProject) {
                              setEditingProject({ ...editingProject, color: e.target.value })
                            } else {
                              setNewProject({ ...newProject, color: e.target.value })
                            }
                          }}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          if (editingProject) {
                            setEditingProject(null)
                          } else {
                            setShowNewProjectForm(false)
                            setNewProject({ name: '', color: '#3B82F6' })
                          }
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={editingProject ? handleUpdateProject : handleCreateProject}
                        disabled={!editingProject?.name.trim() && !newProject.name.trim()}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingProject ? 'Atualizar' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="group flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <span className="text-sm text-gray-900">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalOverlay>

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
      <ModalOverlay isOpen={showRemindersModal} onClose={() => setShowRemindersModal(false)}>
        <div className="relative top-20 mx-auto p-5 w-[500px] shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
          <div className="mt-3">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Lembretes (6)</h3>
              <button
                onClick={() => setShowRemindersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveReminderTab('compras')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeReminderTab === 'compras'
                    ? 'text-blue-600 bg-green-100 border-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compras
              </button>
              <button
                onClick={() => setActiveReminderTab('followups')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeReminderTab === 'followups'
                    ? 'text-blue-600 bg-green-100 border-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Follow Ups
              </button>
              <button
                onClick={() => setActiveReminderTab('lembretes')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeReminderTab === 'lembretes'
                    ? 'text-blue-600 bg-green-100 border-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Lembretes
              </button>
            </div>

            {/* Add Reminder Section */}
            <div className="mb-4">
              {!showAddReminderForm ? (
                <button
                  onClick={() => setShowAddReminderForm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span className="text-lg text-gray-400">+</span>
                  <span>
                    {activeReminderTab === 'compras' && 'Adicionar compra'}
                    {activeReminderTab === 'followups' && 'Adicionar follow up'}
                    {activeReminderTab === 'lembretes' && 'Adicionar lembrete'}
                  </span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    placeholder={`Digite o ${activeReminderTab === 'compras' ? 'item de compra' : activeReminderTab === 'followups' ? 'follow up' : 'lembrete'}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddReminder()}
                  />
                  <button
                    onClick={handleAddReminder}
                    disabled={!newReminder.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddReminderForm(false)
                      setNewReminder('')
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Reminders List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activeReminderTab === 'compras' && (
                <>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Comprar licenças do software para equipe de desenvolvimento</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Renovar assinatura do serviço de hospedagem</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Adquirir equipamentos para novo escritório</span>
                  </div>
                </>
              )}

              {activeReminderTab === 'followups' && (
                <>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Follow up com cliente sobre proposta enviada</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Verificar status da integração com parceiro</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Acompanhar desenvolvimento do projeto piloto</span>
                  </div>
                </>
              )}

              {activeReminderTab === 'lembretes' && (
                <>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Quando a LP ficar pronta, precisamos avançar com botão no software + mensagem via bot</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Falar com Day de afiliados: Bot de servidores como afiliado... Permite colocar o bot no server... Nós fazemos as divulgações, quem fechar via bot, o servidor ganha também</span>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Quando terminarem a integração do whmcs com Sentinel, precisamos configurar e testar o pricing funcionando bem</span>
                    <button className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalOverlay>

      {/* Create Goal Modal - PLACEHOLDER */}
      <ModalOverlay isOpen={showCreateGoalModal} onClose={() => setShowCreateGoalModal(false)}>
        <div className="relative top-20 mx-auto p-6 w-[500px] shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nova Meta</h3>
              <button
                onClick={() => setShowCreateGoalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-8">
                <p className="text-gray-500">Modal de criação de meta em desenvolvimento</p>
                <p className="text-sm text-gray-400 mt-2">Funcionalidade será reintroduzida em breve</p>
              </div>
            </div>
          </div>
        </div>
      </ModalOverlay>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projeto *
                  </label>
                  <select
                    value={editingGoal.projectId}
                    onChange={(e) => setEditingGoal({ ...editingGoal, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {editingGoal.projectId && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: projects.find(p => p.id === editingGoal.projectId)?.color || '#6B7280' }}></div>
                      <span className="text-sm text-gray-700">
                        Projeto selecionado: <span className="font-medium">{projects.find(p => p.id === editingGoal.projectId)?.name}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-projeto (opcional)
                  </label>
                  <input
                    type="text"
                    value={editingGoal.subProject || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, subProject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: SDK, CN, Marketing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próximo Passo (opcional)
                  </label>
                  <textarea
                    value={editingGoal.whatIsMissing || ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, whatIsMissing: e.target.value })}
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
                    {editingGoal.initiativesList && editingGoal.initiativesList.length > 0 ? (
                      editingGoal.initiativesList.map((initiative) => (
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
                                <p className="text-sm text-gray-900">{initiative.description}</p>
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
                      disabled={!editingGoal.title.trim() || !editingGoal.projectId}
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

                {/* Prioridade e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <button
                      onClick={() => setEditingTodo({ ...editingTodo, isHighPriority: !editingTodo.isHighPriority })}
                      className={`w-full px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        editingTodo.isHighPriority
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-gray-100 border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z"/>
                        </svg>
                        Prioridade
                      </div>
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editingTodo.completed ? 'completed' : 'open'}
                      onChange={(e) => setEditingTodo({ ...editingTodo, completed: e.target.value === 'completed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Aberta</option>
                      <option value="completed">Concluída</option>
                    </select>
                  </div>
                </div>

                {/* Time Sensitive */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="timeSensitive"
                    className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="timeSensitive" className="ml-2 text-sm text-gray-700">
                    Esta tarefa é time sensitive
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tags
                  </label>
                  
                  {/* Tags existentes */}
                  {editingTodo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {editingTodo.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                          <button
                            onClick={() => handleRemoveTagFromTodo(editingTodo.id, tag.name)}
                            className="ml-2 text-white hover:text-gray-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Criar nova tag */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criar nova tag
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nome da tag"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <button
                        onClick={handleCreateNewTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tags disponíveis para adicionar */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adicionar tags existentes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags
                        .filter(tag => !editingTodo.tags.some(existingTag => existingTag.name === tag.name))
                        .map((tag, index) => (
                          <button
                            key={index}
                            onClick={() => handleAddTagToTodo(editingTodo.id, tag.name)}
                            className="px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            + {tag.name}
                          </button>
                        ))}
                    </div>
                  </div>
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
                      onClick={handleUpdateTodo}
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
    </div>
  )
}

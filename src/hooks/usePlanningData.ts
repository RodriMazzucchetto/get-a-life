import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { 
  projectsService, 
  tagsService, 
  todosService, 
  goalsService, 
  remindersService,
  initiativesService,
  type DBProject,
  type DBTag,
  type DBTodo,
  type DBGoal,
  type DBInitiative,
  type DBReminder,
  type Todo,
  type Goal,
  type Initiative,
  type Project,
  fromDbTodo,
  toDbUpdate,
  fromDbGoal,
  toDbGoal,
  fromDbInitiative,
  fromDbProject
} from '@/lib/planning'

export function usePlanningData() {
  const { user } = useAuthContext()
  
  // Estado para projetos
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  
  // Estado para tags
  const [tags, setTags] = useState<DBTag[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  
  // Estado para tarefas
  const [todos, setTodos] = useState<Todo[]>([])
  const [loadingTodos, setLoadingTodos] = useState(true)
  
  // Estado para metas
  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  
  // Estado para iniciativas
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loadingInitiatives, setLoadingInitiatives] = useState(true)
  
  // Estado para lembretes
  const [reminders, setReminders] = useState<DBReminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(true)

  // Carregar dados do banco quando usuário mudar
  useEffect(() => {
    if (user) {
      console.log('🔄 Hook: Usuário detectado, carregando dados...')
      // Verificar se já temos dados para evitar recarregamento desnecessário
      if (goals.length === 0 && projects.length === 0) {
        loadAllData()
      } else {
        console.log('🔄 Hook: Dados já carregados, pulando recarregamento')
      }
    }
  }, [user])

  // Função para carregar todos os dados
  const loadAllData = useCallback(async () => {
    if (!user) return

    try {
      console.log('🔄 Hook: Iniciando carregamento de dados...')
      
      // Carregar projetos
      const projectsData = await projectsService.getProjects(user.id)
      setProjects(projectsData.map(fromDbProject))
      setLoadingProjects(false)

      // Carregar tags
      const tagsData = await tagsService.getTags(user.id)
      setTags(tagsData)
      setLoadingTags(false)

      // Carregar tarefas (sem tags por enquanto)
      console.log('🔄 Hook: Carregando todos...')
      const todosData = await todosService.getTodos(user.id)
      console.log('📊 Hook: Todos carregados do banco:', todosData)
      
      const todosConverted = todosData.map(fromDbTodo)
      console.log('✅ Hook: Todos convertidos:', todosConverted)
      
      setTodos(todosConverted)
      setLoadingTodos(false)

      // Carregar metas
      console.log('🎯 Hook: Carregando metas...')
      const goalsData = await goalsService.getGoals(user.id)
      console.log('🎯 Hook: Metas carregadas do banco:', goalsData)
      
      const goalsWithInitiatives = await Promise.all(
        goalsData.map(async (goal) => {
          const initiatives = await initiativesService.getInitiativesByGoal(goal.id)
          return {
            ...fromDbGoal(goal),
            initiatives: initiatives.map((i: DBInitiative) => ({
              id: i.id,
              title: i.title,
              completed: i.status === 'completed'
            }))
          }
        })
      )
      console.log('🎯 Hook: Metas com iniciativas processadas:', goalsWithInitiatives)
      setGoals(goalsWithInitiatives)
      setLoadingGoals(false)

      // Carregar iniciativas
      const initiativesData = await initiativesService.getInitiativesByGoal(goalsData[0]?.id || '')
      setInitiatives(initiativesData.map(fromDbInitiative))
      setLoadingInitiatives(false)

      // Carregar lembretes
      const remindersData = await remindersService.getReminders(user.id)
      setReminders(remindersData)
      setLoadingReminders(false)

      console.log('✅ Hook: Todos os dados carregados com sucesso!')

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Em caso de erro, definir loading como false para não travar a interface
      setLoadingProjects(false)
      setLoadingTags(false)
      setLoadingTodos(false)
      setLoadingGoals(false)
      setLoadingInitiatives(false)
      setLoadingReminders(false)
    }
  }, [user])

  // Funções para projetos
  const createProject = useCallback(async (name: string, color: string) => {
    if (!user) return null
    
    try {
      const newProject = await projectsService.createProject(user.id, name, color)
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      return null
    }
  }, [user])

  const updateProject = useCallback(async (projectId: string, updates: Partial<DBProject>) => {
    try {
      const updatedProject = await projectsService.updateProject(projectId, updates)
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p))
      return updatedProject
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      return null
    }
  }, [])

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectsService.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      return true
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      return false
    }
  }, [])

  // Funções para tags
  const createTag = useCallback(async (name: string, color: string) => {
    if (!user) return null
    
    try {
      const newTag = await tagsService.createTag(user.id, name, color)
      setTags(prev => [newTag, ...prev])
      return newTag
    } catch (error) {
      console.error('Erro ao criar tag:', error)
      return null
    }
  }, [user])

  const updateTag = useCallback(async (tagId: string, updates: Partial<DBTag>) => {
    try {
      const updatedTag = await tagsService.updateTag(tagId, updates)
      setTags(prev => prev.map(t => t.id === tagId ? updatedTag : t))
      return updatedTag
    } catch (error) {
      console.error('Erro ao atualizar tag:', error)
      return null
    }
  }, [])

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      await tagsService.deleteTag(tagId)
      setTags(prev => prev.filter(t => t.id !== tagId))
      return true
    } catch (error) {
      console.error('Erro ao deletar tag:', error)
      return false
    }
  }, [])

  // Funções para tarefas
  const createTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null
    
    try {
      console.log('🔄 Hook: Criando todo com dados:', todoData)
      
      const dbTodoData = toDbUpdate(todoData)
      const newDbTodo = await todosService.createTodo(user.id, dbTodoData as Omit<DBTodo, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      const newTodo = fromDbTodo(newDbTodo)
      
      console.log('✅ Hook: Todo criado no banco:', newTodo)
      
      // Tags serão implementadas do zero
      console.log('🔄 Hook: Tags serão implementadas do zero')
      
      setTodos(prev => [newTodo, ...prev])
      return newTodo
    } catch (error) {
      console.error('❌ Hook: Erro ao criar tarefa:', error)
      return null
    }
  }, [user, tags])

  const updateTodo = useCallback(async (todoId: string, updates: Partial<Todo>) => {
    try {
      const dbUpdates = toDbUpdate(updates)
      const updatedDbTodo = await todosService.updateTodo(todoId, dbUpdates)
      const updatedTodo = fromDbTodo(updatedDbTodo)
      setTodos(prev => prev.map(t => t.id === todoId ? updatedTodo : t))
      return updatedTodo
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      return null
    }
  }, [])

  const deleteTodo = useCallback(async (todoId: string) => {
    try {
      await todosService.deleteTodo(todoId)
      setTodos(prev => prev.filter(t => t.id !== todoId))
      return true
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      return false
    }
  }, [])

  // Funções para metas
  const createGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'created_at'>) => {
    if (!user) return null
    
    try {
      console.log('🎯 Hook: Criando meta com dados:', goalData)
      const dbGoalData = toDbGoal(goalData)
      console.log('🎯 Hook: Dados convertidos para DB:', dbGoalData)
      const newDbGoal = await goalsService.createGoal(user.id, dbGoalData as Omit<DBGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      console.log('🎯 Hook: Meta criada no banco:', newDbGoal)
      const newGoal = fromDbGoal(newDbGoal)
      console.log('🎯 Hook: Meta convertida para domínio:', newGoal)
      
      // Processar iniciativas se existirem
      if (goalData.initiatives && goalData.initiatives.length > 0) {
        console.log('🎯 Hook: Processando iniciativas:', goalData.initiatives)
        for (const initiative of goalData.initiatives) {
          await initiativesService.createInitiative(user.id, {
            title: initiative.title,
            description: '',
            goal_id: newGoal.id,
            status: initiative.completed ? 'completed' : 'active',
            priority: 'medium',
            due_date: undefined
          })
        }
        console.log('🎯 Hook: Iniciativas criadas com sucesso')
      }
      
      // Recarregar as iniciativas da meta criada
      const newInitiatives = await initiativesService.getInitiativesByGoal(newGoal.id)
      const newGoalWithInitiatives = {
        ...newGoal,
        initiatives: newInitiatives.map((i: DBInitiative) => ({
          id: i.id,
          title: i.title,
          completed: i.status === 'completed'
        }))
      }
      console.log('🎯 Hook: Meta criada com iniciativas recarregadas:', newGoalWithInitiatives)
      console.log('🎯 Hook: Iniciativas recarregadas do banco (criar):', newInitiatives)
      console.log('🎯 Hook: Iniciativas processadas (criar):', newGoalWithInitiatives.initiatives)
      console.log('🎯 Hook: Número de iniciativas recarregadas (criar):', newGoalWithInitiatives.initiatives.length)
      
      setGoals(prev => {
        console.log('🎯 Hook: Estado anterior de metas:', prev)
        const newGoals = [newGoalWithInitiatives, ...prev]
        console.log('🎯 Hook: Novo estado de metas:', newGoals)
        return newGoals
      })
      return newGoalWithInitiatives
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      return null
    }
  }, [user])

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      console.log('🎯 Hook: Atualizando meta com dados:', updates)
      console.log('🎯 Hook: nextSteps recebido:', updates.nextSteps)
      const dbUpdates = toDbGoal(updates)
      console.log('🎯 Hook: Dados convertidos para DB:', dbUpdates)
      console.log('🎯 Hook: next_step no DB:', dbUpdates.next_step)
      const updatedDbGoal = await goalsService.updateGoal(goalId, dbUpdates)
      console.log('🎯 Hook: Meta atualizada no banco:', updatedDbGoal)
      const updatedGoal = fromDbGoal(updatedDbGoal)
      console.log('🎯 Hook: Meta convertida para domínio:', updatedGoal)
      console.log('🎯 Hook: nextSteps após conversão:', updatedGoal.nextSteps)
      
      // Verificar condição para processar iniciativas
      console.log('🎯 Hook: Verificando condição para iniciativas:')
      console.log('🎯 Hook: updates.initiatives existe?', !!updates.initiatives)
      console.log('🎯 Hook: updates.initiatives:', updates.initiatives)
      console.log('🎯 Hook: updates.initiatives.length:', updates.initiatives?.length)
      console.log('🎯 Hook: user existe?', !!user)
      console.log('🎯 Hook: Condição completa:', !!(updates.initiatives && updates.initiatives.length > 0 && user))
      
      // Processar iniciativas se existirem
      if (updates.initiatives && updates.initiatives.length > 0 && user) {
        console.log('🎯 Hook: Processando iniciativas na atualização:', updates.initiatives)
        
        // Primeiro, deletar todas as iniciativas existentes da meta
        const existingInitiatives = await initiativesService.getInitiativesByGoal(goalId)
        for (const existingInitiative of existingInitiatives) {
          await initiativesService.deleteInitiative(existingInitiative.id)
        }
        
        // Depois, criar as novas iniciativas
        for (const initiative of updates.initiatives) {
          await initiativesService.createInitiative(user.id, {
            title: initiative.title,
            description: '',
            goal_id: goalId,
            status: initiative.completed ? 'completed' : 'active',
            priority: 'medium',
            due_date: undefined
          })
        }
        console.log('🎯 Hook: Iniciativas atualizadas com sucesso')
      }
      
      // Recarregar as iniciativas da meta atualizada
      const updatedInitiatives = await initiativesService.getInitiativesByGoal(goalId)
      const updatedGoalWithInitiatives = {
        ...updatedGoal,
        initiatives: updatedInitiatives.map((i: DBInitiative) => ({
          id: i.id,
          title: i.title,
          completed: i.status === 'completed'
        }))
      }
      console.log('🎯 Hook: Meta atualizada com iniciativas recarregadas:', updatedGoalWithInitiatives)
      console.log('🎯 Hook: Iniciativas recarregadas do banco:', updatedInitiatives)
      console.log('🎯 Hook: Iniciativas processadas:', updatedGoalWithInitiatives.initiatives)
      console.log('🎯 Hook: Número de iniciativas recarregadas:', updatedGoalWithInitiatives.initiatives.length)
      
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoalWithInitiatives : g))
      return updatedGoalWithInitiatives
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
      return null
    }
  }, [user])

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      await goalsService.deleteGoal(goalId)
      setGoals(prev => prev.filter(g => g.id !== goalId))
      return true
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
      return false
    }
  }, [])

  // Funções para lembretes
  const createReminder = useCallback(async (reminderData: Omit<DBReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null
    
    try {
      const newReminder = await remindersService.createReminder(user.id, reminderData)
      setReminders(prev => [newReminder, ...prev])
      return newReminder
    } catch (error) {
      console.error('Erro ao criar lembrete:', error)
      return null
    }
  }, [user])

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<DBReminder>) => {
    try {
      const updatedReminder = await remindersService.updateReminder(reminderId, updates)
      setReminders(prev => prev.map(r => r.id === reminderId ? updatedReminder : r))
      return updatedReminder
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error)
      return null
    }
  }, [])

  const deleteReminder = useCallback(async (reminderId: string) => {
    try {
      await remindersService.deleteReminder(reminderId)
      setReminders(prev => prev.filter(r => r.id !== reminderId))
      return true
    } catch (error) {
      console.error('Erro ao deletar lembrete:', error)
      return false
    }
  }, [])

  // Funções de tags removidas - serão reimplementadas do zero

  // Estados de loading consolidados
  const isLoading = loadingProjects || loadingTags || loadingTodos || loadingGoals || loadingInitiatives || loadingReminders

  return {
    // Estado
    projects,
    tags,
    todos,
    goals,
    initiatives,
    reminders,
    
    // Setters para estado local
    setTodos,
    setProjects,
    setTags,
    setGoals,
    setInitiatives,
    setReminders,
    
    // Loading states
    isLoading,
    loadingProjects,
    loadingTags,
    loadingTodos,
    loadingGoals,
    loadingInitiatives,
    loadingReminders,
    
    // Funções de projetos
    createProject,
    updateProject,
    deleteProject,
    
    // Funções de tags
    createTag,
    updateTag,
    deleteTag,
    
      // Funções de tarefas
  createTodo,
  updateTodo,
  deleteTodo,
  
  // Ações específicas
  togglePriority: async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      const newPriority = !todo.isHighPriority;
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, isHighPriority: newPriority } : t));
      await updateTodo(todoId, { isHighPriority: newPriority });
    }
  },
    
    // Funções de metas
    createGoal,
    updateGoal,
    deleteGoal,
    
    // Funções de iniciativas
    createInitiative: async (goalId: string, initiativeData: Omit<Initiative, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) return null
      try {
        const newInitiative = await initiativesService.createInitiative(user.id, {
          ...initiativeData,
          goal_id: goalId
        })
        setInitiatives(prev => [fromDbInitiative(newInitiative), ...prev])
        return fromDbInitiative(newInitiative)
      } catch (error) {
        console.error('Erro ao criar iniciativa:', error)
        return null
      }
    },
    
    updateInitiative: async (initiativeId: string, updates: Partial<Initiative>) => {
      try {
        const updatedInitiative = await initiativesService.updateInitiative(initiativeId, updates)
        setInitiatives(prev => prev.map(i => i.id === initiativeId ? fromDbInitiative(updatedInitiative) : i))
        return fromDbInitiative(updatedInitiative)
      } catch (error) {
        console.error('Erro ao atualizar iniciativa:', error)
        return null
      }
    },
    
    deleteInitiative: async (initiativeId: string) => {
      try {
        await initiativesService.deleteInitiative(initiativeId)
        setInitiatives(prev => prev.filter(i => i.id !== initiativeId))
        return true
      } catch (error) {
        console.error('Erro ao deletar iniciativa:', error)
        return false
      }
    },
    
    // Funções de lembretes
    createReminder,
    updateReminder,
    deleteReminder,
    
    // Recarregar dados
    reloadData: loadAllData
  }
}

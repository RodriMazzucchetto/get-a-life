import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { 
  projectsService, 
  tagsService, 
  todosService, 
  goalsService, 
  remindersService,
  todoTagsService,
  type DBProject,
  type DBTag,
  type DBTodo,
  type DBGoal,
  type DBReminder,
  type Todo,
  type Goal,
  fromDbTodo,
  toDbUpdate,
  fromDbGoal,
  toDbGoal
} from '@/lib/planning'

export function usePlanningData() {
  const { user } = useAuthContext()
  
  // Estado para projetos
  const [projects, setProjects] = useState<DBProject[]>([])
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
  
  // Estado para lembretes
  const [reminders, setReminders] = useState<DBReminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(true)

  // Carregar dados do banco quando usuário mudar
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  // Função para carregar todos os dados
  const loadAllData = useCallback(async () => {
    if (!user) return

    try {
      // Carregar projetos
      const projectsData = await projectsService.getProjects(user.id)
      setProjects(projectsData)
      setLoadingProjects(false)

      // Carregar tags
      const tagsData = await tagsService.getTags(user.id)
      setTags(tagsData)
      setLoadingTags(false)

      // Carregar tarefas
      const todosData = await todosService.getTodos(user.id)
      setTodos(todosData.map(fromDbTodo))
      setLoadingTodos(false)

      // Carregar metas
      const goalsData = await goalsService.getGoals(user.id)
      setGoals(goalsData.map(fromDbGoal))
      setLoadingGoals(false)

      // Carregar lembretes
      const remindersData = await remindersService.getReminders(user.id)
      setReminders(remindersData)
      setLoadingReminders(false)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Em caso de erro, definir loading como false para não travar a interface
      setLoadingProjects(false)
      setLoadingTags(false)
      setLoadingTodos(false)
      setLoadingGoals(false)
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
      const dbTodoData = toDbUpdate(todoData)
      const newDbTodo = await todosService.createTodo(user.id, dbTodoData as Omit<DBTodo, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      const newTodo = fromDbTodo(newDbTodo)
      setTodos(prev => [newTodo, ...prev])
      return newTodo
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      return null
    }
  }, [user])

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
      const dbGoalData = toDbGoal(goalData)
      const newDbGoal = await goalsService.createGoal(user.id, dbGoalData as Omit<DBGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      const newGoal = fromDbGoal(newDbGoal)
      setGoals(prev => [newGoal, ...prev])
      return newGoal
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      return null
    }
  }, [user])

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      const dbUpdates = toDbGoal(updates)
      const updatedDbGoal = await goalsService.updateGoal(goalId, dbUpdates)
      const updatedGoal = fromDbGoal(updatedDbGoal)
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g))
      return updatedGoal
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
      return null
    }
  }, [])

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

  // Funções para gerenciar tags de todos
  const addTagToTodo = useCallback(async (todoId: string, tagName: string) => {
    if (!user) return false
    
    try {
      console.log('🔄 Hook: Adicionando tag ao todo:', { todoId, tagName })
      console.log('🔄 Hook: Tags disponíveis:', tags)
      
      // Encontrar a tag pelo nome
      const tag = tags.find(t => t.name === tagName)
      if (!tag) {
        console.log('❌ Hook: Tag não encontrada:', tagName)
        return false
      }
      
      console.log('✅ Hook: Tag encontrada:', tag)

      // Adicionar tag ao todo no banco
      await todoTagsService.addTagToTodo(todoId, tag.id)
      
      // Atualizar estado local
      setTodos(prev => {
        const updated = prev.map(t => 
          t.id === todoId 
            ? { ...t, tags: [...(t.tags || []), { name: tag.name, color: tag.color }] }
            : t
        )
        console.log('🔄 Hook: Estado atualizado:', updated.find(t => t.id === todoId))
        return updated
      })
      
      return true
    } catch (error) {
      console.error('❌ Hook: Erro ao adicionar tag ao todo:', error)
      return false
    }
  }, [user, tags])

  const removeTagFromTodo = useCallback(async (todoId: string, tagName: string) => {
    if (!user) return false
    
    try {
      // Encontrar a tag pelo nome
      const tag = tags.find(t => t.name === tagName)
      if (!tag) return false

      // Remover tag do todo no banco
      await todoTagsService.removeTagFromTodo(todoId, tag.id)
      
      // Atualizar estado local
      setTodos(prev => prev.map(t => 
        t.id === todoId 
          ? { ...t, tags: (t.tags || []).filter(tag => tag.name !== tagName) }
          : t
      ))
      
      return true
    } catch (error) {
      console.error('Erro ao remover tag do todo:', error)
      return false
    }
  }, [user, tags])

  // Estados de loading consolidados
  const isLoading = loadingProjects || loadingTags || loadingTodos || loadingGoals || loadingReminders

  return {
    // Estado
    projects,
    tags,
    todos,
    goals,
    reminders,
    
    // Setters para estado local
    setTodos,
    setProjects,
    setTags,
    setGoals,
    setReminders,
    
    // Loading states
    isLoading,
    loadingProjects,
    loadingTags,
    loadingTodos,
    loadingGoals,
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
    
    // Funções de lembretes
    createReminder,
    updateReminder,
    deleteReminder,
    
    // Funções para gerenciar tags de todos
    addTagToTodo,
    removeTagFromTodo,
    
    // Recarregar dados
    reloadData: loadAllData
  }
}

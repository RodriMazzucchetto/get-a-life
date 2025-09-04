
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
              title: i.title || '',
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
  const createTodo = useCallback(async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'pos'>) => {
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
      
      // Criar a meta primeiro (Fase 1 - sempre deve funcionar)
      const newGoalWithInitiatives = {
        ...newGoal,
        initiatives: []
      }
      
      // Atualizar o estado imediatamente com a meta criada
      setGoals(prev => {
        console.log('🎯 Hook: Estado anterior de metas:', prev)
        const newGoals = [newGoalWithInitiatives, ...prev]
        console.log('🎯 Hook: Novo estado de metas:', newGoals)
        return newGoals
      })
      
      // Processar iniciativas em background (Fase 2 - não deve falhar a meta)
      if (goalData.initiatives && goalData.initiatives.length > 0) {
        console.log('🎯 Hook: Processando iniciativas em background:', goalData.initiatives)
        
        // Usar try-catch separado para não afetar a meta
        try {
          for (const initiative of goalData.initiatives) {
            await initiativesService.createInitiative(user.id, {
              title: initiative.title,
              goal_id: newGoal.id
            })
          }
          console.log('🎯 Hook: Iniciativas criadas com sucesso')
          
          // Recarregar iniciativas e atualizar a meta
          const newInitiatives = await initiativesService.getInitiativesByGoal(newGoal.id)
          const updatedGoalWithInitiatives = {
            ...newGoal,
                         initiatives: newInitiatives.map((i: DBInitiative) => ({
               id: i.id,
               title: i.title || '',
               completed: i.status === 'completed'
             }))
          }
          
          // Atualizar a meta com as iniciativas
          setGoals(prev => prev.map(g => g.id === newGoal.id ? updatedGoalWithInitiatives : g))
          
        } catch (error) {
          console.error('🎯 Hook: Erro ao criar iniciativas (não afeta a meta):', error)
          // A meta já está no estado, apenas logar o erro
        }
      }
      
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
      
      // 1. ATUALIZAR META (se necessário)
      const dbUpdates = toDbGoal(updates)
      console.log('🎯 Hook: Dados convertidos para DB:', dbUpdates)
      console.log('🎯 Hook: next_step no DB:', dbUpdates.next_step)
      
      // Usar retorno minimal para evitar erro 406
      const updatedDbGoal = await goalsService.updateGoal(goalId, dbUpdates)
      console.log('🎯 Hook: Meta atualizada no banco:', updatedDbGoal)
      const updatedGoal = fromDbGoal(updatedDbGoal)
      console.log('🎯 Hook: Meta convertida para domínio:', updatedGoal)
      console.log('🎯 Hook: nextSteps após conversão:', updatedGoal.nextSteps)
      
      // 2. PROCESSAR INICIATIVAS COM CÁLCULO DE DIFFS
      if (updates.initiatives !== undefined && user) {
        console.log('🎯 Hook: Processando iniciativas com cálculo de diffs')
        
        // 2.1. Carregar estado anterior das iniciativas
        const existingInitiatives = await initiativesService.getInitiativesByGoal(goalId)
        console.log('🎯 Hook: Iniciativas existentes no banco:', existingInitiatives)
        console.log('🎯 Hook: Iniciativas novas da modal:', updates.initiatives)
        
        // 2.2. Calcular diffs
        const existingIds = new Set(existingInitiatives.map(i => i.id))
        const newIds = new Set(updates.initiatives.map(i => i.id).filter(id => !id.startsWith('temp-')))
        
        // toDelete: iniciativas que estavam no banco mas não estão na modal
        const toDelete = existingInitiatives.filter(i => !newIds.has(i.id))
        console.log('🎯 Hook: Iniciativas para deletar:', toDelete)
        
        // toCreate: iniciativas com ID temporário (temp-)
        const toCreate = updates.initiatives.filter(i => i.id.startsWith('temp-'))
        console.log('🎯 Hook: Iniciativas para criar:', toCreate)
        
        // toUpdate: iniciativas que existem e podem ter mudado
        const toUpdate = updates.initiatives.filter(i => !i.id.startsWith('temp-') && existingIds.has(i.id))
        console.log('🎯 Hook: Iniciativas para atualizar:', toUpdate)
        
        // 2.3. Executar operações em sequência
        
        // 2.3.1. DELETAR iniciativas removidas
        for (const initiative of toDelete) {
          console.log('🎯 Hook: Deletando iniciativa:', initiative.id)
          await initiativesService.deleteInitiative(initiative.id)
        }
        console.log('🎯 Hook: Iniciativas deletadas:', toDelete.length)
        
        // 2.3.2. CRIAR novas iniciativas
        for (const initiative of toCreate) {
          console.log('🎯 Hook: Criando iniciativa:', initiative.title)
          await initiativesService.createInitiative(user.id, {
            title: initiative.title,
            goal_id: goalId
          })
        }
        console.log('🎯 Hook: Iniciativas criadas:', toCreate.length)
        
        // 2.3.3. ATUALIZAR iniciativas existentes
        for (const initiative of toUpdate) {
          console.log('🎯 Hook: Atualizando iniciativa:', initiative.id)
          await initiativesService.updateInitiative(initiative.id, {
            title: initiative.title
          })
        }
        console.log('🎯 Hook: Iniciativas atualizadas:', toUpdate.length)
        
        console.log('🎯 Hook: Processamento de iniciativas concluído')
      }
      
      // 3. RECARREGAR estado final
      const finalInitiatives = await initiativesService.getInitiativesByGoal(goalId)
      const finalGoalWithInitiatives = {
        ...updatedGoal,
        initiatives: finalInitiatives.map((i: DBInitiative) => ({
          id: i.id,
          title: i.title || '',
          completed: i.status === 'completed'
        }))
      }
      console.log('🎯 Hook: Estado final da meta:', finalGoalWithInitiatives)
      console.log('🎯 Hook: Iniciativas finais:', finalInitiatives.length)
      
      setGoals(prev => prev.map(g => g.id === goalId ? finalGoalWithInitiatives : g))
      return finalGoalWithInitiatives
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

  const completeReminder = useCallback(async (reminderId: string) => {
    try {
      console.log('✅ Marcando lembrete como concluído:', reminderId)
      await remindersService.completeReminder(reminderId)
      console.log('✅ Lembrete marcado como concluído com sucesso')
      
      // Remove otimisticamente da lista (já que getReminders filtra completed_at IS NULL)
      setReminders(prev => {
        const newList = prev.filter(r => r.id !== reminderId)
        console.log('✅ Lista atualizada, removendo lembrete:', reminderId, 'Nova lista:', newList.length)
        return newList
      })
      return true
    } catch (error) {
      console.error('❌ Erro ao marcar lembrete como concluído:', error)
      return false
    }
  }, [])

  // Função para seedar lembretes padrão se o usuário não tiver nenhum
  const seedDefaultReminders = useCallback(async () => {
    if (!user) return

    try {
      console.log('🌱 Verificando se precisa seedar lembretes para usuário:', user.id)
      
      // Verificar se o usuário já tem lembretes (incluindo concluídos)
      const existingReminders = await remindersService.getAllReminders(user.id)
      console.log('🌱 Lembretes existentes:', existingReminders.length)
      
      // Se não tem nenhum lembrete, criar os padrões
      if (existingReminders.length === 0) {
        console.log('🌱 Criando lembretes padrão...')
        const defaultReminders = [
          {
            title: 'Quando a LP ficar pronta, precisamos avançar com botão no software + mensagem via bot',
            description: '',
            category: 'lembretes' as const,
            priority: 'medium' as const,
            completed: false
          },
          {
            title: 'Falar com Day de afiliados: Bot de servidores como afiliado... Permite colocar o bot no server... Nós fazemos as divulgações, quem fechar via bot, o servidor ganha também',
            description: '',
            category: 'lembretes' as const,
            priority: 'medium' as const,
            completed: false
          },
          {
            title: 'Quando terminarem a integração do whmcs com Sentinel, precisamos configurar e testar o pricing funcionando bem',
            description: '',
            category: 'lembretes' as const,
            priority: 'medium' as const,
            completed: false
          }
        ]

        // Criar todos os lembretes padrão
        for (const reminderData of defaultReminders) {
          await remindersService.createReminder(user.id, reminderData)
        }

        // Recarregar a lista de lembretes
        await loadAllData()
      }
    } catch (error) {
      console.error('Erro ao seedar lembretes padrão:', error)
    }
  }, [user, loadAllData])

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
          title: initiativeData.title,
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
        const updatedInitiative = await initiativesService.updateInitiative(initiativeId, { title: updates.title })
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
    completeReminder,
    deleteReminder,
    seedDefaultReminders,
    
    // Recarregar dados
    reloadData: loadAllData
  }
}

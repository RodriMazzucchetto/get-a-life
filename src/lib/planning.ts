import { createClient } from '@/lib/supabase'

// Tipos para o banco de dados
export interface DBProject {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface DBTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface DBTodo {
  id: string
  user_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  category?: string
  due_date?: string
  completed: boolean
  is_high_priority: boolean
  time_sensitive: boolean
  on_hold: boolean
  on_hold_reason?: string
  status: 'backlog' | 'in_progress' | 'current_week'
  created_at: string
  updated_at: string
}

export interface DBGoal {
  id: string
  user_id: string
  title: string
  description?: string
  project_id?: string
  sub_project?: string
  what_is_missing?: string
  due_date?: string
  status: 'active' | 'completed'
  progress: number
  next_step?: string
  initiatives: number
  total_initiatives: number
  created_at: string
  updated_at: string
}

export interface DBReminder {
  id: string
  user_id: string
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  category: 'compras' | 'followups' | 'lembretes'
  completed: boolean
  created_at: string
  updated_at: string
}

// Serviço de Projetos
export const projectsService = {
  // Buscar todos os projetos do usuário
  async getProjects(userId: string): Promise<DBProject[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar projetos:', error)
      throw error
    }

    return data || []
  },

  // Criar novo projeto
  async createProject(userId: string, name: string, color: string): Promise<DBProject> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        color
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar projeto:', error)
      throw error
    }

    return data
  },

  // Atualizar projeto
  async updateProject(projectId: string, updates: Partial<DBProject>): Promise<DBProject> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar projeto:', error)
      throw error
    }

    return data
  },

  // Deletar projeto
  async deleteProject(projectId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Erro ao deletar projeto:', error)
      throw error
    }
  }
}

// Serviço de Tags
export const tagsService = {
  // Buscar todas as tags do usuário
  async getTags(userId: string): Promise<DBTag[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tags:', error)
      throw error
    }

    return data || []
  },

  // Criar nova tag
  async createTag(userId: string, name: string, color: string): Promise<DBTag> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name,
        color
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tag:', error)
      throw error
    }

    return data
  },

  // Atualizar tag
  async updateTag(tagId: string, updates: Partial<DBTag>): Promise<DBTag> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tag:', error)
      throw error
    }

    return data
  },

  // Deletar tag
  async deleteTag(tagId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      console.error('Erro ao deletar tag:', error)
      throw error
    }
  }
}

// Serviço de Tarefas
export const todosService = {
  // Buscar todas as tarefas do usuário
  async getTodos(userId: string): Promise<DBTodo[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }

    return data || []
  },

  // Criar nova tarefa
  async createTodo(userId: string, todoData: Omit<DBTodo, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBTodo> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        ...todoData
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }

    return data
  },

  // Atualizar tarefa
  async updateTodo(todoId: string, updates: Partial<DBTodo>): Promise<DBTodo> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }

    return data
  },

  // Deletar tarefa
  async deleteTodo(todoId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      throw error
    }
  }
}

// Serviço de Metas
export const goalsService = {
  // Buscar todas as metas do usuário
  async getGoals(userId: string): Promise<DBGoal[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar metas:', error)
      throw error
    }

    return data || []
  },

  // Criar nova meta
  async createGoal(userId: string, goalData: Omit<DBGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBGoal> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        ...goalData
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar meta:', error)
      throw error
    }

    return data
  },

  // Atualizar meta
  async updateGoal(goalId: string, updates: Partial<DBGoal>): Promise<DBGoal> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar meta:', error)
      throw error
    }

    return data
  },

  // Deletar meta
  async deleteGoal(goalId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      console.error('Erro ao deletar meta:', error)
      throw error
    }
  }
}

// Serviço de Lembretes
export const remindersService = {
  // Buscar todos os lembretes do usuário
  async getReminders(userId: string): Promise<DBReminder[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar lembretes:', error)
      throw error
    }

    return data || []
  },

  // Criar novo lembrete
  async createReminder(userId: string, reminderData: Omit<DBReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBReminder> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        ...reminderData
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar lembrete:', error)
      throw error
    }

    return data
  },

  // Atualizar lembrete
  async updateReminder(reminderId: string, updates: Partial<DBReminder>): Promise<DBReminder> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar lembrete:', error)
      throw error
    }

    return data
  },

  // Deletar lembrete
  async deleteReminder(reminderId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
      console.error('Erro ao deletar lembrete:', error)
      throw error
    }
  }
}

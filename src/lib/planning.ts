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

export interface DBTodoTag {
  id: string
  todo_id: string
  tag_id: string
  created_at: string
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

// Serviço para gerenciar relacionamentos todo_tags
export const todoTagsService = {
  // Buscar tags de uma tarefa específica
  async getTagsForTodo(todoId: string): Promise<DBTag[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('todo_tags')
      .select(`
        tags (
          id,
          user_id,
          name,
          color,
          created_at,
          updated_at
        )
      `)
      .eq('todo_id', todoId)

    if (error) {
      console.error('Erro ao buscar tags da tarefa:', error)
      return []
    }

    // Extrair as tags do array aninhado
    const tags = data?.flatMap(item => item.tags || []).filter(Boolean) || []
    return tags
  },

  // Adicionar tag a uma tarefa
  async addTagToTodo(todoId: string, tagId: string): Promise<void> {
    const supabase = createClient()
    console.log('🔄 Adicionando tag:', { todoId, tagId })
    
    const { data, error } = await supabase
      .from('todo_tags')
      .insert({
        todo_id: todoId,
        tag_id: tagId
      })
      .select()

    if (error) {
      console.error('❌ Erro ao adicionar tag à tarefa:', error)
      throw error
    }
    
    console.log('✅ Tag adicionada com sucesso:', data)
  },

  // Remover tag de uma tarefa
  async removeTagFromTodo(todoId: string, tagId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('todo_tags')
      .delete()
      .eq('todo_id', todoId)
      .eq('tag_id', tagId)

    if (error) {
      console.error('Erro ao remover tag da tarefa:', error)
      throw error
    }
  },

  // Remover todas as tags de uma tarefa
  async removeAllTagsFromTodo(todoId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('todo_tags')
      .delete()
      .eq('todo_id', todoId)

    if (error) {
      console.error('Erro ao remover todas as tags da tarefa:', error)
      throw error
    }
  }
}

// Serviço de Tarefas
export const todosService = {
  // Buscar todas as tarefas do usuário com suas tags
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

    // Buscar tags para cada tarefa
    const todosWithTags = await Promise.all(
      (data || []).map(async (todo) => {
        const tags = await todoTagsService.getTagsForTodo(todo.id)
        return { ...todo, tags }
      })
    )

    return todosWithTags
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

// Adapters para converter entre DBTodo e Todo
export function fromDbTodo(row: DBTodo & { tags?: DBTag[] }): Todo {
  return {
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
    tags: row.tags?.map(tag => ({ name: tag.name, color: tag.color })) || [],
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function toDbUpdate(patch: Partial<Todo>): Partial<DBTodo> {
  const out: Partial<DBTodo> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.priority !== undefined) out.priority = patch.priority;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.dueDate !== undefined) out.due_date = patch.dueDate;
  if (patch.completed !== undefined) out.completed = patch.completed;
  if (patch.isHighPriority !== undefined) out.is_high_priority = patch.isHighPriority;
  if (patch.timeSensitive !== undefined) out.time_sensitive = patch.timeSensitive;
  if (patch.onHold !== undefined) out.on_hold = patch.onHold;
  if (patch.onHoldReason !== undefined) out.on_hold_reason = patch.onHoldReason;
  return out;
}

// Interface Todo para o domínio/UI (camelCase)
export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  completed: boolean;
  isHighPriority: boolean;
  timeSensitive: boolean;
  onHold: boolean;
  onHoldReason?: string;
  tags?: { name: string; color: string }[];
  created_at: string;
  updated_at: string;
}

// Interface Goal para o domínio/UI (camelCase)
export interface Goal {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  subProject?: string;
  whatIsMissing?: string;
  dueDate?: string;
  status: 'active' | 'completed';
  progress: number;
  nextStep?: string;
  initiatives: number;
  totalInitiatives: number;
  created_at: string;
  initiativesList?: { id: string; description: string }[];
}

// Adapters para Goal
export function fromDbGoal(row: DBGoal): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id || '',
    subProject: row.sub_project,
    whatIsMissing: row.what_is_missing,
    dueDate: row.due_date,
    status: row.status,
    progress: row.progress,
    nextStep: row.next_step,
    initiatives: row.initiatives,
    totalInitiatives: row.total_initiatives,
    created_at: row.created_at,
    initiativesList: []
  };
}

export function toDbGoal(goal: Partial<Goal>): Partial<DBGoal> {
  const out: Partial<DBGoal> = {};
  if (goal.title !== undefined) out.title = goal.title;
  if (goal.description !== undefined) out.description = goal.description;
  if (goal.projectId !== undefined) out.project_id = goal.projectId;
  if (goal.subProject !== undefined) out.sub_project = goal.subProject;
  if (goal.whatIsMissing !== undefined) out.what_is_missing = goal.whatIsMissing;
  if (goal.dueDate !== undefined) out.due_date = goal.dueDate;
  if (goal.status !== undefined) out.status = goal.status;
  if (goal.progress !== undefined) out.progress = goal.progress;
  if (goal.nextStep !== undefined) out.next_step = goal.nextStep;
  if (goal.initiatives !== undefined) out.initiatives = goal.initiatives;
  if (goal.totalInitiatives !== undefined) out.total_initiatives = goal.totalInitiatives;
  return out;
}

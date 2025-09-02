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

// Interface Project para o domínio/UI (camelCase)
export interface Project {
  id: string
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
  // RELACIONAMENTOS OPCIONAIS (podem ser NULL)
  project_id?: string
  goal_id?: string
  initiative_id?: string
  created_at: string
  updated_at: string
}

export interface DBGoal {
  id: string
  user_id: string
  title: string
  description?: string
  project_id: string
  progress: number
  next_step?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface DBInitiative {
  id: string
  goal_id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  user_id: string
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
  completed_at?: string
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

// Serviço de tags será reimplementado do zero

// Serviço de Iniciativas
export const initiativesService = {
  // Buscar todas as iniciativas de uma meta
  async getInitiativesByGoal(goalId: string): Promise<DBInitiative[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar iniciativas:', error)
      throw error
    }

    return data || []
  },

  // Criar nova iniciativa
  async createInitiative(userId: string, initiativeData: { goal_id: string; title: string }): Promise<DBInitiative> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('initiatives')
      .insert({
        goal_id: initiativeData.goal_id,
        title: initiativeData.title,
        user_id: userId,
        status: 'active',
        priority: 'medium'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar iniciativa:', error)
      throw error
    }

    return data
  },

  // Atualizar iniciativa
  async updateInitiative(initiativeId: string, updates: { title?: string }): Promise<DBInitiative> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('initiatives')
      .update({
        title: updates.title
      })
      .eq('id', initiativeId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar iniciativa:', error)
      throw error
    }

    return data
  },

  // Deletar iniciativa
  async deleteInitiative(initiativeId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('initiatives')
      .delete()
      .eq('id', initiativeId)

    if (error) {
      console.error('Erro ao deletar iniciativa:', error)
      throw error
    }
  }
}

// Serviço de Tarefas
export const todosService = {
    // Buscar todas as tarefas do usuário (sem tags por enquanto)
  async getTodos(userId: string): Promise<DBTodo[]> {
    const supabase = createClient()
    console.log('🔄 Serviço: Buscando todos para usuário:', userId)
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar tarefas:', error)
      throw error
    }

    console.log('✅ Todos carregados:', data?.length || 0)
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
    
    // Primeiro, fazer o update sem retorno para evitar erro 406
    const { error: updateError } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)

    if (updateError) {
      console.error('Erro ao atualizar meta:', updateError)
      throw updateError
    }

    // Depois, buscar a meta atualizada
    const { data, error: selectError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (selectError) {
      console.error('Erro ao buscar meta atualizada:', selectError)
      throw selectError
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
  // Buscar todos os lembretes do usuário (apenas não concluídos)
  async getReminders(userId: string): Promise<DBReminder[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .is('completed_at', null) // Só retorna lembretes não concluídos
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar lembretes:', error)
      throw error
    }

    return data || []
  },

  // Buscar todos os lembretes do usuário (incluindo concluídos) - para verificação de seed
  async getAllReminders(userId: string): Promise<DBReminder[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar todos os lembretes:', error)
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

  // Marcar lembrete como concluído
  async completeReminder(reminderId: string): Promise<DBReminder> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reminders')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', reminderId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao marcar lembrete como concluído:', error)
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
export function fromDbTodo(row: DBTodo): Todo {
  console.log('🔄 Adapter: Convertendo DBTodo para Todo:', { id: row.id })
  
  const todo = {
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
    tags: [], // Tags serão implementadas do zero
    // RELACIONAMENTOS OPCIONAIS
    projectId: row.project_id,
    goalId: row.goal_id,
    initiativeId: row.initiative_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
  
  console.log('✅ Adapter: Todo convertido:', { id: todo.id })
  return todo;
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
  
  // RELACIONAMENTOS OPCIONAIS
  if (patch.projectId !== undefined) out.project_id = patch.projectId;
  if (patch.goalId !== undefined) out.goal_id = patch.goalId;
  if (patch.initiativeId !== undefined) out.initiative_id = patch.initiativeId;
  
  // As tags são gerenciadas separadamente através do todoTagsService
  // Não incluímos tags aqui porque DBTodo não tem campo tags
  console.log('🔄 Adapter: Convertendo todo para DB (tags serão gerenciadas separadamente):', patch);
  
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
  // RELACIONAMENTOS OPCIONAIS
  projectId?: string;
  goalId?: string;
  initiativeId?: string;
  created_at: string;
  updated_at: string;
}

// Interface SimpleInitiative para iniciativas dentro de metas
export interface SimpleInitiative {
  id: string;
  title: string;
  completed: boolean;
}

// Interface Goal para o domínio/UI (camelCase)
export interface Goal {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  progress: number;
  nextSteps?: string;
  dueDate?: string;
  initiatives: SimpleInitiative[];
  created_at: string;
  updated_at?: string;
}

// Interface Initiative para o domínio/UI (camelCase)
export interface Initiative {
  id: string;
  title: string;
  description?: string;
  goalId: string;
  status: 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  created_at: string;
  updated_at: string;
}

// Adapters para Goal
export function fromDbGoal(row: DBGoal): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    progress: row.progress,
    nextSteps: row.next_step,
    dueDate: row.due_date,
    initiatives: [], // Será carregado separadamente
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function toDbGoal(goal: Partial<Goal>): Partial<DBGoal> {
  const out: Partial<DBGoal> = {};
  if (goal.title !== undefined) out.title = goal.title;
  if (goal.description !== undefined) out.description = goal.description;
  if (goal.projectId !== undefined) out.project_id = goal.projectId;
  if (goal.progress !== undefined) out.progress = goal.progress;
  if (goal.nextSteps !== undefined) out.next_step = goal.nextSteps;
  if (goal.dueDate !== undefined) out.due_date = goal.dueDate;
  return out;
}

// Adapters para Project
export function fromDbProject(row: DBProject): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Adapters para Initiative
export function fromDbInitiative(row: DBInitiative): Initiative {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    goalId: row.goal_id,
    status: row.status as 'active' | 'completed' | 'cancelled',
    priority: row.priority as 'low' | 'medium' | 'high',
    dueDate: row.due_date,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function toDbInitiative(initiative: Partial<Initiative>): Partial<DBInitiative> {
  const out: Partial<DBInitiative> = {};
  if (initiative.title !== undefined) out.title = initiative.title;
  if (initiative.description !== undefined) out.description = initiative.description;
  if (initiative.goalId !== undefined) out.goal_id = initiative.goalId;
  if (initiative.status !== undefined) out.status = initiative.status;
  if (initiative.priority !== undefined) out.priority = initiative.priority;
  if (initiative.dueDate !== undefined) out.due_date = initiative.dueDate;
  return out;
}

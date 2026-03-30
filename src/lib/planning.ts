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
  pos: number // Nova coluna para ordenação persistente
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

export type ProblemKind = 'market' | 'operational'

export interface DBProblem {
  id: string
  user_id: string
  project_id: string | null
  title: string
  resolved: boolean
  pos: number
  kind: ProblemKind
  is_high_priority: boolean
  created_at: string
  updated_at: string
}

export interface Problem {
  id: string
  /** Primeiro projeto (fila / ordenação por projeto). */
  projectId: string | null
  /** Todos os projetos associados. */
  projectIds: string[]
  title: string
  resolved: boolean
  pos: number
  kind: ProblemKind
  isHighPriority: boolean
  createdAt: string
  updatedAt: string
}

export type DBProblemWithLinks = DBProblem & {
  problem_projects?: { project_id: string }[]
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

const todoSelectWithProjects =
  '*, todo_projects(project_id)' as const

export type DBTodoWithLinks = DBTodo & {
  todo_projects?: { project_id: string }[]
}

// Serviço de Tarefas
export const todosService = {
  async getTodos(userId: string): Promise<DBTodoWithLinks[]> {
    const supabase = createClient()
    console.log('🔄 Serviço: Buscando todos para usuário:', userId)

    const { data, error } = await supabase
      .from('todos')
      .select(todoSelectWithProjects)
      .eq('user_id', userId)
      .order('pos', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar tarefas:', error)
      throw error
    }

    console.log('✅ Todos carregados e ordenados por pos:', data?.length)
    return (data || []) as DBTodoWithLinks[]
  },

  /** Substitui projetos ligados à tarefa; `project_id` = primeiro (legado). */
  async setTodoProjects(todoId: string, projectIds: string[]): Promise<DBTodoWithLinks> {
    const supabase = createClient()
    const uniqueIds = [...new Set(projectIds)]
    const primary = uniqueIds.length > 0 ? uniqueIds[0] : null

    await supabase.from('todo_projects').delete().eq('todo_id', todoId)

    if (uniqueIds.length > 0) {
      const { error: insErr } = await supabase.from('todo_projects').insert(
        uniqueIds.map((project_id) => ({ todo_id: todoId, project_id }))
      )
      if (insErr) {
        console.error('Erro ao inserir todo_projects:', insErr)
        throw insErr
      }
    }

    const { data, error } = await supabase
      .from('todos')
      .update({
        project_id: primary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', todoId)
      .select(todoSelectWithProjects)
      .single()

    if (error) {
      console.error('Erro ao atualizar todo (projetos):', error)
      throw error
    }
    return data as DBTodoWithLinks
  },

  async createTodo(
    userId: string,
    todoData: Omit<DBTodo, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'pos'>,
    options?: { projectIds?: string[] }
  ): Promise<DBTodoWithLinks> {
    const supabase = createClient()

    const { data: maxPosData } = await supabase
      .from('todos')
      .select('pos')
      .eq('user_id', userId)
      .order('pos', { ascending: false })
      .limit(1)
      .single()

    const nextPos = maxPosData?.pos ? maxPosData.pos + 1000 : 1000

    const linkIds = [
      ...new Set(
        options?.projectIds ??
          (todoData.project_id ? [todoData.project_id] : [])
      ),
    ]
    const primary = linkIds.length > 0 ? linkIds[0] : null

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        pos: nextPos,
        ...todoData,
        project_id: primary,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }

    return todosService.setTodoProjects(data.id, linkIds)
  },

  async updateTodo(todoId: string, updates: Partial<DBTodo>): Promise<DBTodoWithLinks> {
    const supabase = createClient()

    if (updates.pos !== undefined) {
      const { error: rpcError } = await supabase.rpc('move_todo', {
        p_id: todoId,
        p_status: updates.status || null,
        p_pos: updates.pos,
      })

      if (rpcError) {
        console.error('❌ Erro no RPC move_todo:', rpcError)
        throw rpcError
      }

      const { data, error } = await supabase
        .from('todos')
        .select(todoSelectWithProjects)
        .eq('id', todoId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar todo atualizado:', error)
        throw error
      }

      return data as DBTodoWithLinks
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select(todoSelectWithProjects)
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }

    return data as DBTodoWithLinks
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

const problemSelectWithProjects =
  '*, problem_projects(project_id)' as const

export const problemsService = {
  async getProblems(userId: string): Promise<DBProblemWithLinks[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('problems')
      .select(problemSelectWithProjects)
      .eq('user_id', userId)
      .order('pos', { ascending: true })

    if (error) {
      console.error('Erro ao buscar problemas:', error)
      throw error
    }
    return (data || []) as DBProblemWithLinks[]
  },

  async createProblem(
    userId: string,
    data: {
      title: string
      project_id: string | null
      kind: ProblemKind
      project_ids?: string[]
    }
  ): Promise<DBProblemWithLinks> {
    const supabase = createClient()

    const projectIds = [
      ...new Set(
        data.project_ids ??
          (data.project_id ? [data.project_id] : [])
      ),
    ]
    const primary = projectIds.length > 0 ? projectIds[0] : null

    let nextPos = Date.now()
    let q = supabase
      .from('problems')
      .select('pos')
      .eq('user_id', userId)
      .eq('kind', data.kind)
    if (primary === null) {
      q = q.filter('project_id', 'is', null)
    } else {
      q = q.eq('project_id', primary)
    }
    const { data: maxRow, error: maxErr } = await q
      .order('pos', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxErr) {
      console.error('Erro ao ler posição máxima (problems):', maxErr)
    } else if (maxRow?.pos != null) {
      nextPos = maxRow.pos + 1000
    }

    const { data: row, error } = await supabase
      .from('problems')
      .insert({
        user_id: userId,
        title: data.title.trim(),
        project_id: primary,
        pos: nextPos,
        resolved: false,
        kind: data.kind,
        is_high_priority: false,
      })
      .select('id')
      .single()

    if (error || !row) {
      console.error('Erro ao criar problema:', error)
      throw error
    }

    return problemsService.setProblemProjects(row.id, projectIds)
  },

  /** Move problema para o outro tipo (mercado ↔ operacional), com posição no fim da lista destino. */
  async moveProblemKind(
    problemId: string,
    newKind: ProblemKind
  ): Promise<DBProblemWithLinks> {
    const supabase = createClient()
    const { data: current, error: fetchErr } = await supabase
      .from('problems')
      .select(problemSelectWithProjects)
      .eq('id', problemId)
      .single()

    if (fetchErr || !current) {
      console.error('Erro ao carregar problema:', fetchErr)
      throw fetchErr ?? new Error('Problema não encontrado')
    }
    if (current.kind === newKind) return current as DBProblemWithLinks

    let q = supabase
      .from('problems')
      .select('pos')
      .eq('user_id', current.user_id)
      .eq('kind', newKind)
    if (current.project_id === null) {
      q = q.filter('project_id', 'is', null)
    } else {
      q = q.eq('project_id', current.project_id)
    }
    const { data: maxRow, error: maxErr } = await q
      .order('pos', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxErr) console.error('Erro ao ler pos máxima (move kind):', maxErr)
    const nextPos = maxRow?.pos != null ? maxRow.pos + 1000 : 1000

    const { data, error } = await supabase
      .from('problems')
      .update({
        kind: newKind,
        pos: nextPos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)
      .select(problemSelectWithProjects)
      .single()

    if (error) {
      console.error('Erro ao mover tipo do problema:', error)
      throw error
    }
    return data as DBProblemWithLinks
  },

  /** Substitui projetos do problema; primeiro = fila/pos; recalcula pos se a fila mudar. */
  async setProblemProjects(
    problemId: string,
    projectIds: string[]
  ): Promise<DBProblemWithLinks> {
    const supabase = createClient()
    const uniqueIds = [...new Set(projectIds)]
    const newPrimary = uniqueIds.length > 0 ? uniqueIds[0] : null

    const { data: current, error: fetchErr } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single()

    if (fetchErr || !current) {
      console.error('Erro ao carregar problema:', fetchErr)
      throw fetchErr ?? new Error('Problema não encontrado')
    }

    const oldPrimary = current.project_id
    let nextPos = current.pos
    if (newPrimary !== oldPrimary) {
      let q = supabase
        .from('problems')
        .select('pos')
        .eq('user_id', current.user_id)
        .eq('kind', current.kind)
      if (newPrimary === null) {
        q = q.filter('project_id', 'is', null)
      } else {
        q = q.eq('project_id', newPrimary)
      }
      const { data: maxRow, error: maxErr } = await q
        .order('pos', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maxErr) console.error('Erro ao ler pos máxima (set projects):', maxErr)
      nextPos = maxRow?.pos != null ? maxRow.pos + 1000 : 1000
    }

    await supabase.from('problem_projects').delete().eq('problem_id', problemId)

    if (uniqueIds.length > 0) {
      const { error: insErr } = await supabase.from('problem_projects').insert(
        uniqueIds.map((project_id) => ({
          problem_id: problemId,
          project_id,
        }))
      )
      if (insErr) {
        console.error('Erro ao inserir problem_projects:', insErr)
        throw insErr
      }
    }

    const { data, error } = await supabase
      .from('problems')
      .update({
        project_id: newPrimary,
        pos: nextPos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)
      .select(problemSelectWithProjects)
      .single()

    if (error) {
      console.error('Erro ao atualizar problema (projetos):', error)
      throw error
    }
    return data as DBProblemWithLinks
  },

  async updateProblem(
    problemId: string,
    updates: Partial<DBProblem>
  ): Promise<DBProblemWithLinks> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('problems')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', problemId)
      .select(problemSelectWithProjects)
      .single()

    if (error) {
      console.error('Erro ao atualizar problema:', error)
      throw error
    }
    return data as DBProblemWithLinks
  },

  async deleteProblem(problemId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('problems').delete().eq('id', problemId)
    if (error) {
      console.error('Erro ao deletar problema:', error)
      throw error
    }
  },
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
      .limit(5000)

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
      .limit(5000)

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
        ...reminderData,
        completed_at: null,
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
export function fromDbTodo(row: DBTodoWithLinks): Todo {
  console.log('🔄 Adapter: Convertendo DBTodo para Todo:', { id: row.id })

  const fromLinks = (row.todo_projects ?? []).map((x) => x.project_id)
  const projectIds =
    fromLinks.length > 0
      ? [...new Set(fromLinks)]
      : row.project_id
        ? [row.project_id]
        : []

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
    status: row.status,
    pos: row.pos,
    tags: [],
    projectId: projectIds[0],
    projectIds,
    goalId: row.goal_id,
    initiativeId: row.initiative_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  console.log('✅ Adapter: Todo convertido:', { id: todo.id })
  return todo
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
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.pos !== undefined) out.pos = patch.pos; // Coluna pos agora existe no banco
  // if (patch.created_at !== undefined) out.created_at = patch.created_at; // Não precisamos mais atualizar created_at
  
  // RELACIONAMENTOS OPCIONAIS (projectIds → todosService.setTodoProjects)
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
  status: 'backlog' | 'in_progress' | 'current_week';
  pos: number; // Nova coluna para ordenação persistente
  tags?: { name: string; color: string }[];
  // RELACIONAMENTOS OPCIONAIS
  projectId?: string;
  /** Todos os projetos (N:N). `projectId` = primeiro. */
  projectIds: string[];
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

export function fromDbProblem(row: DBProblemWithLinks): Problem {
  const k = row.kind === 'operational' ? 'operational' : 'market'
  const fromLinks = (row.problem_projects ?? []).map((x) => x.project_id)
  const projectIds =
    fromLinks.length > 0
      ? [...new Set(fromLinks)]
      : row.project_id
        ? [row.project_id]
        : []
  return {
    id: row.id,
    projectId: projectIds[0] ?? null,
    projectIds,
    title: row.title,
    resolved: row.resolved,
    pos: row.pos,
    kind: k,
    isHighPriority: Boolean(row.is_high_priority),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

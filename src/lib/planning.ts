import { createClient } from '@/lib/supabase'
import { computeNextPosForColumnTasks } from '@/lib/todoBoardHelpers'
import {
  canMoveTodoToStatus,
  isTodoClassificationIncomplete,
  validateTodoClassificationPayload,
  type TodoBoardStatus,
} from '@/lib/taskClassification'

// Tipos para o banco de dados
export interface DBProject {
  id: string
  user_id: string
  name: string
  color: string
  annual_objective?: string | null
  annual_objective_year?: number | null
  created_at: string
  updated_at: string
}

// Interface Project para o domínio/UI (camelCase)
export interface Project {
  id: string
  name: string
  color: string
  annualObjective?: string | null
  annualObjectiveYear?: number | null
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
  on_hold: boolean
  on_hold_reason?: string | null
  status: 'backlog' | 'in_progress' | 'current_week' | 'archived' | 'life_admin'
  pos: number
  task_type?: 'STRATEGIC' | 'LIFE_ADMIN' | null
  status_classification?:
    | 'SIGNAL_SEMANA'
    | 'SIGNAL_BACKLOG'
    | 'ADIADA_30D'
    | 'CORTADA'
    | null
  revisao_em?: string | null
  life_admin_subtype?: 'COM_DEADLINE' | 'SEM_DEADLINE' | null
  life_admin_deadline?: string | null
  needs_reclassification?: boolean
  // RELACIONAMENTOS OPCIONAIS (podem ser NULL)
  project_id?: string
  goal_id?: string
  initiative_id?: string
  created_at: string
  updated_at: string
  /** Instantâneo em que a tarefa foi marcada como concluída (migração + toDbUpdate). */
  completed_at?: string | null
}

export type GoalLifecycleStatus = 'active' | 'done' | 'partial' | 'not_done'

export interface DBGoal {
  id: string
  user_id: string
  title: string
  description?: string
  project_id: string
  progress: number
  next_step?: string
  due_date?: string
  lifecycle_status?: GoalLifecycleStatus
  closed_at?: string | null
  closure_note?: string | null
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
  category: 'compras' | 'followups' | 'lembretes' | 'escrever'
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export type CycleStatus = 'active' | 'closed'

export interface DBTaskCycle {
  id: string
  user_id: string
  cycle_number: number
  status: CycleStatus
  started_at: string
  ended_at?: string | null
  planned_count: number
  added_after_start_count: number
  delivered_count: number
  effectiveness_pct: number
  created_at: string
  updated_at: string
}

export type WeeklyPriorityDeliveryStatus =
  | 'not_delivered'
  | 'partially_delivered'
  | 'delivered'

export interface DBWeeklyPriorityItem {
  id: string
  user_id: string
  cycle_id?: string | null
  project_id?: string | null
  title: string
  notes?: string | null
  delivery_status: WeeklyPriorityDeliveryStatus
  created_at: string
  updated_at: string
}

export type ProblemKind = 'market' | 'operational'

export interface DBProblem {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description?: string | null
  resolved: boolean
  pos: number
  kind: ProblemKind
  is_high_priority: boolean
  on_hold: boolean
  on_hold_reason?: string | null
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
  description?: string
  resolved: boolean
  pos: number
  kind: ProblemKind
  isHighPriority: boolean
  onHold: boolean
  onHoldReason?: string
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

export function mapGoalsWithInitiatives(
  goalsData: DBGoal[],
  initiatives: DBInitiative[]
): Goal[] {
  const byGoalId = new Map<string, SimpleInitiative[]>()
  for (const row of initiatives) {
    const list = byGoalId.get(row.goal_id) ?? []
    list.push({
      id: row.id,
      title: row.title || '',
      completed: row.status === 'completed',
    })
    byGoalId.set(row.goal_id, list)
  }
  return goalsData.map((goal) => ({
    ...fromDbGoal(goal),
    initiatives: byGoalId.get(goal.id) ?? [],
  }))
}

// Serviço de Iniciativas
export const initiativesService = {
  /** Uma query para todas as iniciativas do utilizador (evita N+1 por meta). */
  async getInitiativesByUser(userId: string): Promise<DBInitiative[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar iniciativas do utilizador:', error)
      throw error
    }

    return data || []
  },

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
  async updateInitiative(
    initiativeId: string,
    updates: { title?: string; status?: DBInitiative['status'] }
  ): Promise<DBInitiative> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('initiatives')
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
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

    const { data, error } = await supabase
      .from('todos')
      .select(todoSelectWithProjects)
      .eq('user_id', userId)
      .order('pos', { ascending: true })

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }

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

    const { data: colRows } = await supabase
      .from('todos')
      .select('pos, on_hold')
      .eq('user_id', userId)
      .eq('status', todoData.status)
      .eq('completed', false)

    const nextPos = computeNextPosForColumnTasks(
      (colRows ?? []).map((r) => ({
        pos: r.pos,
        onHold: r.on_hold,
      }))
    )

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
        needs_reclassification:
          todoData.needs_reclassification ??
          (todoData.task_type == null ? true : false),
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }

    // Se houver ciclo ativo, este item passa a compor o planejamento do ciclo
    // e é marcado como "adicionado após início".
    const { data: activeCycle } = await supabase
      .from('task_cycles')
      .select('id, planned_count, added_after_start_count')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (activeCycle?.id && isSprintBoardStatus(todoData.status)) {
      await cyclesService.adjustActiveCyclePlannedCount(userId, {
        plannedDelta: 1,
        addedAfterDelta: 1,
      })
    }

    return todosService.setTodoProjects(data.id, linkIds)
  },

  async updateTodo(todoId: string, updates: Partial<DBTodo>): Promise<DBTodoWithLinks> {
    const supabase = createClient()

    const { data: priorRow, error: priorErr } = await supabase
      .from('todos')
      .select(
        'user_id, status, completed, task_type, status_classification, life_admin_subtype, life_admin_deadline, revisao_em, needs_reclassification'
      )
      .eq('id', todoId)
      .single()
    if (priorErr || !priorRow) {
      console.error('Erro ao carregar tarefa antes de atualizar:', priorErr)
      throw priorErr ?? new Error('Tarefa não encontrada')
    }

    const prior = priorRow as Pick<
      DBTodo,
      | 'user_id'
      | 'status'
      | 'completed'
      | 'task_type'
      | 'status_classification'
      | 'life_admin_subtype'
      | 'life_admin_deadline'
      | 'revisao_em'
      | 'needs_reclassification'
    >

    const merged = {
      taskType:
        updates.task_type !== undefined ? updates.task_type : (prior.task_type ?? null),
      statusClassification:
        updates.status_classification !== undefined
          ? updates.status_classification
          : (prior.status_classification ?? null),
      lifeAdminSubtype:
        updates.life_admin_subtype !== undefined
          ? updates.life_admin_subtype
          : (prior.life_admin_subtype ?? null),
      lifeAdminDeadline:
        updates.life_admin_deadline !== undefined
          ? updates.life_admin_deadline
          : (prior.life_admin_deadline ?? null),
      revisaoEm:
        updates.revisao_em !== undefined ? updates.revisao_em : (prior.revisao_em ?? null),
      needsReclassification:
        updates.needs_reclassification !== undefined
          ? updates.needs_reclassification
          : Boolean(prior.needs_reclassification),
      status: updates.status !== undefined ? updates.status : prior.status,
    }

    const classificationTouched =
      updates.task_type !== undefined ||
      updates.status_classification !== undefined ||
      updates.life_admin_subtype !== undefined ||
      updates.life_admin_deadline !== undefined ||
      updates.revisao_em !== undefined ||
      updates.needs_reclassification !== undefined

    if (classificationTouched && !merged.needsReclassification) {
      const classCheck = validateTodoClassificationPayload({
        taskType: merged.taskType,
        statusClassification: merged.statusClassification,
        lifeAdminSubtype: merged.lifeAdminSubtype,
        lifeAdminDeadline: merged.lifeAdminDeadline,
        revisaoEm: merged.revisaoEm,
      })
      if (!classCheck.ok) {
        throw new Error(classCheck.reason)
      }
    }

    if (updates.status !== undefined) {
      const moveCheck = canMoveTodoToStatus(
        {
          taskType: merged.taskType,
          statusClassification: merged.statusClassification,
          lifeAdminSubtype: merged.lifeAdminSubtype,
          needsReclassification: merged.needsReclassification,
          status: prior.status as TodoBoardStatus,
        },
        updates.status as TodoBoardStatus
      )
      if (!moveCheck.ok) {
        throw new Error(moveCheck.reason)
      }
    }

    const syncCycleIfNeeded = async (next: DBTodoWithLinks) => {
      await cyclesService.syncCyclePlannedAfterTodoChange(prior.user_id, prior, {
        status: next.status,
        completed: next.completed,
      })
    }

    if (updates.pos !== undefined) {
      const { error: rpcError } = await supabase.rpc('move_todo', {
        p_id: todoId,
        p_status: updates.status ?? null,
        p_pos: updates.pos,
      })

      if (rpcError) {
        console.error('❌ Erro no RPC move_todo:', rpcError)
        throw rpcError
      }

      const rest: Partial<DBTodo> = { ...updates }
      delete rest.pos
      if (updates.status !== undefined) delete rest.status

      const restEntries = Object.entries(rest).filter(([, v]) => v !== undefined)
      if (restEntries.length > 0) {
        const patch = Object.fromEntries(restEntries) as Partial<DBTodo>
        const { data, error } = await supabase
          .from('todos')
          .update(patch)
          .eq('id', todoId)
          .select(todoSelectWithProjects)
          .single()

        if (error) {
          console.error('❌ Erro ao atualizar todo após move:', error)
          throw error
        }

        const row = data as DBTodoWithLinks
        await syncCycleIfNeeded(row)
        return row
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

      const rowOnly = data as DBTodoWithLinks
      await syncCycleIfNeeded(rowOnly)
      return rowOnly
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

    const rowFinal = data as DBTodoWithLinks
    await syncCycleIfNeeded(rowFinal)
    return rowFinal
  },

  // Deletar tarefa
  async deleteTodo(todoId: string): Promise<void> {
    const supabase = createClient()
    const { data: prior } = await supabase
      .from('todos')
      .select('user_id, status, completed')
      .eq('id', todoId)
      .maybeSingle()

    const { error } = await supabase.from('todos').delete().eq('id', todoId)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      throw error
    }

    if (prior) {
      const d = plannedCountDeltaOnDelete(prior)
      if (d !== 0) {
        await cyclesService.adjustActiveCyclePlannedCount(prior.user_id, { plannedDelta: d })
      }
    }
  }
}

/** Semana atual ou Em progresso — exclui backlog das métricas de ciclo. */
export function isSprintBoardStatus(status: string): boolean {
  return status === 'current_week' || status === 'in_progress'
}

function countsTowardCyclePlanned(t: { status: string; completed: boolean }): boolean {
  return isSprintBoardStatus(t.status) && !t.completed
}

/** Variação do planned do ciclo ao mudar uma tarefa (toggle só de concluído não altera o planeado). */
function plannedCountDeltaOnTodoChange(
  prior: { status: string; completed: boolean },
  next: { status: string; completed: boolean }
): number {
  if (prior.status === next.status && prior.completed !== next.completed) {
    return 0
  }
  const p = countsTowardCyclePlanned(prior) ? 1 : 0
  const n = countsTowardCyclePlanned(next) ? 1 : 0
  return n - p
}

function plannedCountDeltaOnDelete(t: { status: string; completed: boolean }): number {
  if (!isSprintBoardStatus(t.status) || t.completed) return 0
  return -1
}

export const cyclesService = {
  /** Ajusta planned (e opcionalmente added_after) no ciclo ativo. */
  async adjustActiveCyclePlannedCount(
    userId: string,
    opts: { plannedDelta: number; addedAfterDelta?: number }
  ): Promise<void> {
    if (opts.plannedDelta === 0 && (opts.addedAfterDelta ?? 0) === 0) return
    const active = await cyclesService.getActiveCycle(userId)
    if (!active?.id) return
    const supabase = createClient()
    const now = new Date().toISOString()
    const newPlanned = Math.max(0, (active.planned_count ?? 0) + opts.plannedDelta)
    const patch: Record<string, unknown> = {
      planned_count: newPlanned,
      updated_at: now,
    }
    if (opts.addedAfterDelta !== undefined && opts.addedAfterDelta !== 0) {
      patch.added_after_start_count = Math.max(
        0,
        (active.added_after_start_count ?? 0) + opts.addedAfterDelta
      )
    }
    const { error } = await supabase
      .from('task_cycles')
      .update(patch)
      .eq('id', active.id)
      .eq('user_id', userId)
    if (error) {
      console.error('Erro ao ajustar contadores do ciclo ativo:', error)
    }
  },

  async syncCyclePlannedAfterTodoChange(
    userId: string,
    prior: { status: string; completed: boolean },
    next: { status: string; completed: boolean }
  ): Promise<void> {
    const delta = plannedCountDeltaOnTodoChange(prior, next)
    if (delta !== 0) {
      await cyclesService.adjustActiveCyclePlannedCount(userId, { plannedDelta: delta })
    }
  },

  async getActiveCycle(userId: string): Promise<DBTaskCycle | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('task_cycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar ciclo ativo:', error)
      throw error
    }
    return (data as DBTaskCycle | null) ?? null
  },

  async getCycles(userId: string, limit = 12): Promise<DBTaskCycle[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('task_cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar ciclos:', error)
      throw error
    }
    return (data || []) as DBTaskCycle[]
  },

  async startCycle(userId: string): Promise<DBTaskCycle> {
    const supabase = createClient()

    const active = await cyclesService.getActiveCycle(userId)
    if (active) {
      throw new Error(`Já existe um ciclo ativo (Ciclo ${active.cycle_number}).`)
    }

    const { data: lastCycle, error: lastErr } = await supabase
      .from('task_cycles')
      .select('cycle_number')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastErr) {
      console.error('Erro ao buscar último ciclo:', lastErr)
      throw lastErr
    }
    const nextCycleNumber = (lastCycle?.cycle_number ?? 0) + 1

    // Apenas Semana Atual e Em progresso, não concluídas — backlog fica fora do ciclo
    const { count: plannedCount, error: countErr } = await supabase
      .from('todos')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .eq('completed', false)
      .in('status', ['current_week', 'in_progress'])
    if (countErr) {
      console.error('Erro ao contar tarefas para ciclo:', countErr)
      throw countErr
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('task_cycles')
      .insert({
        user_id: userId,
        cycle_number: nextCycleNumber,
        status: 'active',
        started_at: now,
        planned_count: plannedCount ?? 0,
        added_after_start_count: 0,
        delivered_count: 0,
        effectiveness_pct: 0,
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('Erro ao iniciar ciclo:', error)
      throw error
    }
    return data as DBTaskCycle
  },

  async finishActiveCycle(userId: string): Promise<DBTaskCycle> {
    const supabase = createClient()
    const active = await cyclesService.getActiveCycle(userId)
    if (!active) throw new Error('Nenhum ciclo ativo para finalizar.')

    const endedAt = new Date().toISOString()

    // Garante que itens semanais legados (sem ciclo) fiquem registrados no ciclo fechado.
    const { error: bindWeeklyErr } = await supabase
      .from('weekly_priority_items')
      .update({
        cycle_id: active.id,
        updated_at: endedAt,
      })
      .eq('user_id', userId)
      .is('cycle_id', null)

    if (bindWeeklyErr) {
      console.error('Erro ao vincular itens prioritários sem ciclo ao ciclo ativo:', bindWeeklyErr)
    }

    const { data, error } = await supabase
      .from('task_cycles')
      .update({
        status: 'closed',
        ended_at: endedAt,
        delivered_count: 0,
        effectiveness_pct: 0,
        updated_at: endedAt,
      })
      .eq('id', active.id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('Erro ao finalizar ciclo:', error)
      throw error
    }

    const { error: snapErr } = await supabase.rpc('snapshot_task_cycle_project_stats', {
      p_cycle_id: data.id,
    })
    if (snapErr) {
      console.error('Erro ao gravar estatísticas por projeto do ciclo:', snapErr)
    }

    const { data: statRows, error: statErr } = await supabase
      .from('task_cycle_project_stats')
      .select('tasks_linked, tasks_completed_in_cycle')
      .eq('task_cycle_id', data.id)

    if (statErr) {
      console.error('Erro ao agregar snapshot do ciclo:', statErr)
    }

    let linkedSum = 0
    let deliveredSum = 0
    for (const r of statRows ?? []) {
      linkedSum += r.tasks_linked ?? 0
      deliveredSum += r.tasks_completed_in_cycle ?? 0
    }
    const effectiveness =
      linkedSum > 0 ? Number(((deliveredSum / linkedSum) * 100).toFixed(1)) : 0

    const { data: finalRow, error: patchErr } = await supabase
      .from('task_cycles')
      .update({
        delivered_count: deliveredSum,
        effectiveness_pct: effectiveness,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (patchErr || !finalRow) {
      console.error('Erro ao atualizar totais do ciclo a partir do snapshot:', patchErr)
      return data as DBTaskCycle
    }

    return finalRow as DBTaskCycle
  },

  /** Totais globais: tarefas ligadas vs concluídas por projeto. */
  async getUserProjectTodoTotals(): Promise<ProjectTodoStatRow[]> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('user_project_todo_totals')
    if (error) {
      console.error('Erro ao buscar totais por projeto:', error)
      throw error
    }
    const rows = (data || []) as {
      project_id: string
      project_name: string
      project_color: string
      tasks_linked: number
      tasks_completed: number
    }[]
    return rows.map((r) => ({
      projectId: r.project_id,
      projectName: r.project_name,
      projectColor: r.project_color,
      tasksLinked: r.tasks_linked,
      tasksCompleted: r.tasks_completed,
    }))
  },

  /**
   * Ciclo em aberto: concluídas entre o início do ciclo e `pEnd` (normalmente agora).
   * `tasksLinked` = inventário atual (igual aos totais).
   */
  async getUserProjectStatsInWindow(
    cycleStartIso: string,
    cycleEndIso: string
  ): Promise<ProjectTodoStatRow[]> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('user_project_stats_in_window', {
      p_start: cycleStartIso,
      p_end: cycleEndIso,
    })
    if (error) {
      console.error('Erro ao buscar stats por projeto na janela:', error)
      throw error
    }
    const rows = (data || []) as {
      project_id: string
      project_name: string
      project_color: string
      tasks_linked: number
      tasks_completed_in_window: number
    }[]
    return rows.map((r) => ({
      projectId: r.project_id,
      projectName: r.project_name,
      projectColor: r.project_color,
      tasksLinked: r.tasks_linked,
      tasksCompleted: r.tasks_completed_in_window,
    }))
  },

  /** Linhas persistidas ao fechar cada ciclo (histórico). */
  async getClosedCyclesProjectStats(cycleIds: string[]): Promise<CycleProjectStatRow[]> {
    if (cycleIds.length === 0) return []
    const supabase = createClient()
    const { data, error } = await supabase
      .from('task_cycle_project_stats')
      .select(
        `
        task_cycle_id,
        tasks_linked,
        tasks_completed_in_cycle,
        project_id,
        projects ( name, color )
      `
      )
      .in('task_cycle_id', cycleIds)

    if (error) {
      console.error('Erro ao buscar stats por projeto dos ciclos:', error)
      throw error
    }

    type Row = {
      task_cycle_id: string
      tasks_linked: number
      tasks_completed_in_cycle: number
      project_id: string
      projects: { name: string; color: string } | { name: string; color: string }[] | null
    }

    return ((data || []) as Row[]).map((r) => {
      const pr = r.projects
      const proj = Array.isArray(pr) ? pr[0] : pr
      return {
        cycleId: r.task_cycle_id,
        projectId: r.project_id,
        projectName: proj?.name ?? 'Projeto',
        projectColor: proj?.color ?? '#6366f1',
        tasksLinked: r.tasks_linked,
        tasksCompleted: r.tasks_completed_in_cycle,
        tasksCompletedInCycle: r.tasks_completed_in_cycle,
      }
    })
  },

  /** Recalcula linhas em `task_cycle_project_stats` para todos os ciclos fechados do utilizador (RPC). */
  async rebuildMyClosedCycleSnapshots(): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.rpc('rebuild_my_closed_cycle_snapshots')
    if (error) {
      console.error('Erro ao recalcular snapshots por projeto:', error)
      throw error
    }
  },
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
      description?: string
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
        description: data.description?.trim() || null,
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

export const weeklyPriorityItemsService = {
  async getWeeklyPriorityItems(userId: string): Promise<DBWeeklyPriorityItem[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('weekly_priority_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar itens prioritários da semana:', error)
      throw error
    }
    return (data || []) as DBWeeklyPriorityItem[]
  },

  async createWeeklyPriorityItem(
    userId: string,
    item: {
      title: string
      notes?: string
      project_id?: string | null
      cycle_id?: string | null
      delivery_status?: WeeklyPriorityDeliveryStatus
    }
  ): Promise<DBWeeklyPriorityItem> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('weekly_priority_items')
      .insert({
        user_id: userId,
        title: item.title.trim(),
        notes: item.notes?.trim() || null,
        project_id: item.project_id ?? null,
        cycle_id: item.cycle_id ?? null,
        delivery_status: item.delivery_status ?? 'not_delivered',
      })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar item prioritário da semana:', error)
      throw error
    }
    return data as DBWeeklyPriorityItem
  },

  async updateWeeklyPriorityItem(
    itemId: string,
    updates: Partial<{
      title: string
      notes: string | null
      project_id: string | null
      cycle_id: string | null
      delivery_status: WeeklyPriorityDeliveryStatus
    }>
  ): Promise<DBWeeklyPriorityItem> {
    const supabase = createClient()
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (updates.title !== undefined) patch.title = updates.title.trim()
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.project_id !== undefined) patch.project_id = updates.project_id
    if (updates.cycle_id !== undefined) patch.cycle_id = updates.cycle_id
    if (updates.delivery_status !== undefined) patch.delivery_status = updates.delivery_status

    const { data, error } = await supabase
      .from('weekly_priority_items')
      .update(patch)
      .eq('id', itemId)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao atualizar item prioritário da semana:', error)
      throw error
    }
    return data as DBWeeklyPriorityItem
  },

  async deleteWeeklyPriorityItem(itemId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('weekly_priority_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Erro ao deletar item prioritário da semana:', error)
      throw error
    }
  },
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
    onHold: row.on_hold,
    onHoldReason: row.on_hold_reason ?? undefined,
    status: row.status,
    pos: row.pos,
    taskType: row.task_type ?? null,
    statusClassification: row.status_classification ?? null,
    revisaoEm: row.revisao_em ?? null,
    lifeAdminSubtype: row.life_admin_subtype ?? null,
    lifeAdminDeadline: row.life_admin_deadline ?? null,
    needsReclassification: isTodoClassificationIncomplete(row),
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
  // completed_at é preenchido no Postgres (migração + trigger) para não falhar se a coluna ainda não existir no projeto.
  if (patch.completed !== undefined) out.completed = patch.completed;
  if (patch.isHighPriority !== undefined) out.is_high_priority = patch.isHighPriority;
  if (patch.onHold !== undefined) out.on_hold = patch.onHold;
  if (patch.onHoldReason !== undefined) out.on_hold_reason = patch.onHoldReason;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.pos !== undefined) out.pos = patch.pos;
  if (patch.taskType !== undefined) out.task_type = patch.taskType;
  if (patch.statusClassification !== undefined) {
    out.status_classification = patch.statusClassification;
  }
  if (patch.revisaoEm !== undefined) out.revisao_em = patch.revisaoEm;
  if (patch.lifeAdminSubtype !== undefined) out.life_admin_subtype = patch.lifeAdminSubtype;
  if (patch.lifeAdminDeadline !== undefined) {
    out.life_admin_deadline = patch.lifeAdminDeadline;
  }
  if (patch.needsReclassification !== undefined) {
    out.needs_reclassification = patch.needsReclassification;
  }
  
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
  onHold: boolean;
  onHoldReason?: string;
  status: TodoBoardStatus;
  pos: number;
  taskType: 'STRATEGIC' | 'LIFE_ADMIN' | null;
  statusClassification:
    | 'SIGNAL_SEMANA'
    | 'SIGNAL_BACKLOG'
    | 'ADIADA_30D'
    | 'CORTADA'
    | null;
  revisaoEm: string | null;
  lifeAdminSubtype: 'COM_DEADLINE' | 'SEM_DEADLINE' | null;
  lifeAdminDeadline: string | null;
  needsReclassification: boolean;
  tags?: { name: string; color: string }[];
  projectId?: string;
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
  lifecycleStatus: GoalLifecycleStatus;
  closedAt?: string | null;
  closureNote?: string | null;
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

export interface TaskCycle {
  id: string
  cycleNumber: number
  status: CycleStatus
  startedAt: string
  endedAt?: string
  plannedCount: number
  addedAfterStartCount: number
  deliveredCount: number
  effectivenessPct: number
  createdAt: string
  updatedAt: string
}

export interface WeeklyPriorityItem {
  id: string
  cycleId?: string
  projectId?: string
  title: string
  notes?: string
  deliveryStatus: WeeklyPriorityDeliveryStatus
  createdAt: string
  updatedAt: string
}

/** Uma linha de estatísticas de tarefas por projeto (totais ou dentro de um ciclo). */
export interface ProjectTodoStatRow {
  projectId: string
  projectName: string
  projectColor: string
  /** Tarefas distintas ligadas ao projeto (via todo_projects ou project_id). */
  tasksLinked: number
  /** Tarefas concluídas (lifetime ou na janela, conforme a query). */
  tasksCompleted: number
}

export interface CycleProjectStatRow extends ProjectTodoStatRow {
  cycleId: string
  /** Alias semântico para ciclo fechado: concluídas entre início e fim do ciclo. */
  tasksCompletedInCycle: number
}

export function fromDbWeeklyPriorityItem(row: DBWeeklyPriorityItem): WeeklyPriorityItem {
  return {
    id: row.id,
    cycleId: row.cycle_id ?? undefined,
    projectId: row.project_id ?? undefined,
    title: row.title,
    notes: row.notes ?? undefined,
    deliveryStatus: row.delivery_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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
    lifecycleStatus: row.lifecycle_status ?? 'active',
    closedAt: row.closed_at ?? null,
    closureNote: row.closure_note ?? null,
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
  if (goal.lifecycleStatus !== undefined) out.lifecycle_status = goal.lifecycleStatus;
  if (goal.closedAt !== undefined) out.closed_at = goal.closedAt;
  if (goal.closureNote !== undefined) out.closure_note = goal.closureNote;
  return out;
}

// Adapters para Project
export function fromDbProject(row: DBProject): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    annualObjective: row.annual_objective ?? null,
    annualObjectiveYear: row.annual_objective_year ?? null,
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

export function fromDbTaskCycle(row: DBTaskCycle): TaskCycle {
  return {
    id: row.id,
    cycleNumber: row.cycle_number,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    plannedCount: row.planned_count,
    addedAfterStartCount: row.added_after_start_count,
    deliveredCount: row.delivered_count,
    effectivenessPct: row.effectiveness_pct,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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
    description: row.description ?? undefined,
    resolved: row.resolved,
    pos: row.pos,
    kind: k,
    isHighPriority: Boolean(row.is_high_priority),
    onHold: Boolean(row.on_hold),
    onHoldReason: row.on_hold_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

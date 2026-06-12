import { createClient } from '@/lib/supabase'
import type {
  OsBetRow,
  OsBetStatus,
  OsBetUpdateRow,
  OsBetUpdateStatus,
  OsBlockRow,
  OsBlockType,
  OsCycleRow,
  OsGoalRow,
  OsTaskRow,
} from '@/lib/os-types'

export const OS_SELECTED_PROJECT_KEY = 'os_selected_project_id'

export const OS_BLOCK_TYPES: OsBlockType[] = ['finance', 'growth', 'ops']

export const OS_BLOCK_LABELS: Record<OsBlockType, string> = {
  finance: 'FINANCE',
  growth: 'GROWTH',
  ops: 'OPERATIONS',
}

export const OS_BLOCK_DOT_COLORS: Record<OsBlockType, string> = {
  finance: '#FFD600',
  growth: '#5BC0EB',
  ops: '#FFD600',
}

export const OS_YELLOW = '#FFD600'
export const OS_CYAN = '#5BC0EB'
export const OS_GREEN = '#34D399'
export const OS_RED = '#FF0000'

/** Percentual de preenchimento da barra do pilar conforme status do pitch ativo. */
export const PILLAR_STATUS_PCT: Record<
  'deviating' | 'on_course' | 'executed' | 'failed',
  number
> = {
  deviating: 67,
  on_course: 80,
  executed: 100,
  failed: 25,
}

export interface PillarStatusDisplay {
  pct: number
  color: string
  status: 'deviating' | 'on_course' | 'executed' | 'failed' | null
  label: string
}

export function getBetUpdateStatusColor(status: string): string {
  switch (status) {
    case 'deviating':
      return OS_YELLOW
    case 'on_course':
      return OS_GREEN
    case 'executed':
      return OS_CYAN
    case 'failed':
      return OS_RED
    default:
      return '#CCCCCC'
  }
}

export function getPillarStatusDisplay(
  priorityBet: OsBetRow | null,
  latestUpdate: OsBetUpdateRow | null
): PillarStatusDisplay {
  if (!priorityBet) {
    return { pct: 0, color: '#E5E5E5', status: null, label: '—' }
  }

  const trackable = ['on_course', 'deviating', 'executed', 'failed'] as const
  const rawStatus =
    latestUpdate?.status ??
    (trackable.includes(priorityBet.status as (typeof trackable)[number])
      ? (priorityBet.status as (typeof trackable)[number])
      : null)

  if (!rawStatus) {
    return { pct: 0, color: '#E5E5E5', status: null, label: 'SEM STATUS' }
  }

  return {
    pct: PILLAR_STATUS_PCT[rawStatus],
    color: getBetUpdateStatusColor(rawStatus),
    status: rawStatus,
    label: formatBetUpdateStatusLabel(rawStatus),
  }
}

export function currentWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return monday.toISOString().slice(0, 10)
}

export function formatBetUpdateStatusLabel(status: string): string {
  return status.replace('_', ' ').toUpperCase()
}

export function formatExecutionOwnerInitials(owner: string | null): string {
  if (!owner) return '--'
  switch (owner) {
    case 'self':
      return 'EU'
    case 'team':
      return 'EQ'
    case 'external':
      return 'EX'
    default:
      return owner.slice(0, 2).toUpperCase()
  }
}

export interface OsBetStats {
  started: number
  executed: number
  failed: number
  successRate: number
  failureRate: number
}

export function computeOsBetStats(bets: OsBetRow[]): OsBetStats {
  const started = bets.length
  const executed = bets.filter((bet) => bet.status === 'executed').length
  const failed = bets.filter((bet) => bet.status === 'failed').length
  const successRate = started > 0 ? Math.round((executed / started) * 100) : 0
  const failureRate = started > 0 ? Math.round((failed / started) * 100) : 0

  return { started, executed, failed, successRate, failureRate }
}

export interface OsProjectOption {
  id: string
  name: string
  color: string
}

export interface OsBlockView {
  block: OsBlockRow
  goal: OsGoalRow | null
  bets: OsBetRow[]
  priorityBet: OsBetRow | null
}

export interface OsProjectDashboardData {
  activeCycle: OsCycleRow | null
  blocks: OsBlockView[]
}

export function getBetStatusBadgeClass(status: OsBetStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-surface-container-high text-on-surface-variant'
    case 'banked':
      return 'bg-sky-100 text-sky-800'
    case 'rejected':
      return 'bg-red-50 text-red-400'
    case 'on_course':
      return 'bg-blue-100 text-blue-800'
    case 'deviating':
      return 'bg-amber-100 text-amber-800'
    case 'executed':
      return 'bg-emerald-100 text-emerald-800'
    case 'failed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

export function formatBetStatusLabel(status: OsBetStatus): string {
  return status.replace('_', ' ')
}

export function formatOsTaskStatusLabel(status: OsTaskRow['status']): string {
  switch (status) {
    case 'todo':
      return 'A fazer'
    case 'doing':
      return 'Em progresso'
    case 'done':
      return 'Concluída'
    default:
      return status
  }
}

function currentCycleMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export async function fetchOsProjects(userId: string): Promise<OsProjectOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar projetos OS:', error)
    throw error
  }

  return data ?? []
}

export async function ensureOsBlocksForProject(
  userId: string,
  projectId: string
): Promise<OsBlockRow[]> {
  const supabase = createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('os_blocks')
    .select('*')
    .eq('project_id', projectId)
    .order('type', { ascending: true })

  if (fetchError) {
    console.error('Erro ao buscar blocos OS:', fetchError)
    throw fetchError
  }

  const existingTypes = new Set((existing ?? []).map((block) => block.type as OsBlockType))
  const missingTypes = OS_BLOCK_TYPES.filter((type) => !existingTypes.has(type))

  if (missingTypes.length > 0) {
    const { error: insertError } = await supabase.from('os_blocks').insert(
      missingTypes.map((type) => ({
        user_id: userId,
        project_id: projectId,
        type,
      }))
    )

    if (insertError) {
      console.error('Erro ao criar blocos OS:', insertError)
      throw insertError
    }
  }

  const { data: blocks, error: reloadError } = await supabase
    .from('os_blocks')
    .select('*')
    .eq('project_id', projectId)
    .order('type', { ascending: true })

  if (reloadError) {
    console.error('Erro ao recarregar blocos OS:', reloadError)
    throw reloadError
  }

  return blocks ?? []
}

export async function fetchActiveOsGoal(blockId: string): Promise<OsGoalRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_goals')
    .select('*')
    .eq('block_id', blockId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar meta OS ativa:', error)
    throw error
  }

  return data
}

export async function fetchActiveOsCycle(projectId: string): Promise<OsCycleRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_cycles')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .order('cycle_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar ciclo OS ativo:', error)
    throw error
  }

  return data
}

export async function fetchOsBetsForGoalAndCycle(
  goalId: string,
  cycleId: string
): Promise<OsBetRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bets')
    .select('*')
    .eq('goal_id', goalId)
    .eq('cycle_id', cycleId)
    .order('priority_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar apostas OS:', error)
    throw error
  }

  return data ?? []
}

export async function createOsGoal(
  userId: string,
  blockId: string,
  title: string,
  description?: string
): Promise<OsGoalRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_goals')
    .insert({
      user_id: userId,
      block_id: blockId,
      title,
      description: description ?? null,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar meta OS:', error)
    throw error
  }

  return data
}

export async function updateOsGoal(
  goalId: string,
  updates: { title?: string; description?: string | null }
): Promise<OsGoalRow> {
  const supabase = createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) payload.title = updates.title
  if (updates.description !== undefined) payload.description = updates.description

  const { data, error } = await supabase
    .from('os_goals')
    .update(payload)
    .eq('id', goalId)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao atualizar meta OS:', error)
    throw error
  }

  return data
}

/** Cria ou atualiza a meta ativa de um bloco. */
export async function saveOsGoal(
  userId: string,
  blockId: string,
  title: string,
  description?: string
): Promise<OsGoalRow> {
  const existing = await fetchActiveOsGoal(blockId)
  if (existing) {
    return updateOsGoal(existing.id, {
      title,
      description: description?.trim() ? description.trim() : null,
    })
  }
  return createOsGoal(userId, blockId, title, description)
}

export async function createOsCycle(userId: string, projectId: string): Promise<OsCycleRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_cycles')
    .insert({
      user_id: userId,
      project_id: projectId,
      cycle_month: currentCycleMonth(),
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar ciclo OS:', error)
    throw error
  }

  return data
}

export async function fetchOsProjectDashboard(
  userId: string,
  projectId: string
): Promise<OsProjectDashboardData> {
  const blocks = await ensureOsBlocksForProject(userId, projectId)
  const activeCycle = await fetchActiveOsCycle(projectId)

  const blockViews = await Promise.all(
    blocks.map(async (block) => {
      const goal = await fetchActiveOsGoal(block.id)
      const bets =
        goal && activeCycle
          ? await fetchOsBetsForGoalAndCycle(goal.id, activeCycle.id)
          : []
      const priorityBet = goal ? await fetchPriorityBetForGoal(goal.id) : null

      return {
        block,
        goal,
        bets,
        priorityBet,
      }
    })
  )

  return {
    activeCycle,
    blocks: blockViews,
  }
}

export async function fetchAllOsTasks(userId: string): Promise<OsTaskRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('pos', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar tasks OS:', error)
    throw error
  }

  return data ?? []
}

export async function fetchOsBetsForGoal(goalId: string): Promise<OsBetRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bets')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar pitches OS:', error)
    throw error
  }

  return sortOsBetsByPosition(data ?? [])
}

function sortOsBetsByPosition(bets: OsBetRow[]): OsBetRow[] {
  return [...bets].sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1
    const posA = a.pos ?? Number.MAX_SAFE_INTEGER
    const posB = b.pos ?? Number.MAX_SAFE_INTEGER
    if (posA !== posB) return posA - posB
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export function partitionBetsByPriority(bets: OsBetRow[]): OsBetRow[] {
  const priority = bets.filter((bet) => bet.is_priority)
  const rest = bets.filter((bet) => !bet.is_priority)
  return [...priority, ...rest]
}

export async function fetchPriorityBetForGoal(goalId: string): Promise<OsBetRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bets')
    .select('*')
    .eq('goal_id', goalId)
    .eq('is_priority', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar pitch prioritário:', error)
    throw error
  }

  return data
}

export async function setOsBetPriority(
  betId: string,
  goalId: string,
  isPriority: boolean
): Promise<OsBetRow> {
  const supabase = createClient()

  if (isPriority) {
    const { error: clearError } = await supabase
      .from('os_bets')
      .update({ is_priority: false, updated_at: new Date().toISOString() })
      .eq('goal_id', goalId)
      .neq('id', betId)

    if (clearError) {
      console.error('Erro ao limpar prioridade de outros pitches:', clearError)
      throw clearError
    }
  }

  const { data, error } = await supabase
    .from('os_bets')
    .update({ is_priority: isPriority, updated_at: new Date().toISOString() })
    .eq('id', betId)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao definir prioridade do pitch:', error)
    throw error
  }

  return data
}

export function computeNextPitchPos(bets: OsBetRow[]): number {
  if (bets.length === 0) return 1000
  const maxPos = Math.max(...bets.map((bet) => bet.pos ?? 0))
  return maxPos + 1000
}

export async function fetchOsPitchBoard(userId: string, projectId: string): Promise<OsBlockView[]> {
  const blocks = await ensureOsBlocksForProject(userId, projectId)

  const blockViews = await Promise.all(
    blocks.map(async (block) => {
      const goal = await fetchActiveOsGoal(block.id)
      let bets: OsBetRow[] = []

      if (goal) {
        try {
          bets = await fetchOsBetsForGoal(goal.id)
        } catch (betError) {
          console.error(`Erro ao buscar pitches do bloco ${block.type}:`, betError)
        }
      }

      const priorityBet =
        goal && bets.length > 0
          ? (bets.find((bet) => bet.is_priority) ?? null)
          : goal
            ? await fetchPriorityBetForGoal(goal.id).catch(() => null)
            : null

      return { block, goal, bets, priorityBet }
    })
  )

  return blockViews
}

export async function createOsBet(
  userId: string,
  input: {
    goalId: string
    title: string
    pitchOutcome?: string
    pitchData?: string
    executionOwner?: string
    pos?: number
    cycleId?: string | null
  }
): Promise<OsBetRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bets')
    .insert({
      user_id: userId,
      goal_id: input.goalId,
      cycle_id: input.cycleId ?? null,
      title: input.title,
      pitch_outcome: input.pitchOutcome ?? null,
      pitch_data: input.pitchData ?? null,
      execution_owner: input.executionOwner ?? null,
      pos: input.pos ?? null,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar pitch OS:', error)
    throw error
  }

  return data
}

export async function updateOsBet(
  betId: string,
  updates: {
    title?: string
    pitchOutcome?: string | null
    pitchData?: string | null
    executionOwner?: string | null
    goalId?: string
    pos?: number | null
    isPriority?: boolean
  }
): Promise<OsBetRow> {
  const supabase = createClient()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) payload.title = updates.title
  if (updates.pitchOutcome !== undefined) payload.pitch_outcome = updates.pitchOutcome
  if (updates.pitchData !== undefined) payload.pitch_data = updates.pitchData
  if (updates.executionOwner !== undefined) payload.execution_owner = updates.executionOwner
  if (updates.goalId !== undefined) payload.goal_id = updates.goalId
  if (updates.pos !== undefined) payload.pos = updates.pos
  if (updates.isPriority !== undefined) payload.is_priority = updates.isPriority

  const { data, error } = await supabase
    .from('os_bets')
    .update(payload)
    .eq('id', betId)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao atualizar pitch OS:', error)
    throw error
  }

  return data
}

export async function deleteOsBet(betId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('os_bets').delete().eq('id', betId)

  if (error) {
    console.error('Erro ao excluir pitch OS:', error)
    throw error
  }
}

export async function reorderOsBetsInGoal(orderedIds: string[]): Promise<void> {
  const supabase = createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('os_bets')
      .update({ pos: (index + 1) * 1000, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    console.error('Erro ao reordenar pitches OS:', failed.error)
    throw failed.error
  }
}

export async function fetchOsTasksForBet(betId: string): Promise<OsTaskRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_tasks')
    .select('*')
    .eq('bet_id', betId)
    .order('pos', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar tasks do pitch:', error)
    throw error
  }

  return data ?? []
}

export async function createOsTask(
  userId: string,
  input: {
    projectId: string
    betId: string
    title: string
    description?: string
  }
): Promise<OsTaskRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_tasks')
    .insert({
      user_id: userId,
      project_id: input.projectId,
      bet_id: input.betId,
      title: input.title,
      description: input.description ?? null,
      is_maintenance: false,
      status: 'todo',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar task OS:', error)
    throw error
  }

  return data
}

export async function deleteOsTask(taskId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('os_tasks').delete().eq('id', taskId)

  if (error) {
    console.error('Erro ao excluir task OS:', error)
    throw error
  }
}

export async function fetchOsBetsByIds(betIds: string[]): Promise<OsBetRow[]> {
  if (betIds.length === 0) return []

  const supabase = createClient()
  const { data, error } = await supabase.from('os_bets').select('*').in('id', betIds)

  if (error) {
    console.error('Erro ao buscar pitches por IDs:', error)
    throw error
  }

  return data ?? []
}

export async function fetchOsBetUpdatesForBet(betId: string): Promise<OsBetUpdateRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bet_updates')
    .select('*')
    .eq('bet_id', betId)
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar weekly updates:', error)
    throw error
  }

  return data ?? []
}

export async function fetchLatestOsBetUpdatesForBets(
  betIds: string[]
): Promise<Map<string, OsBetUpdateRow>> {
  if (betIds.length === 0) return new Map()

  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bet_updates')
    .select('*')
    .in('bet_id', betIds)
    .order('week_start', { ascending: false })

  if (error) {
    console.error('Erro ao buscar latest weekly updates:', error)
    throw error
  }

  const map = new Map<string, OsBetUpdateRow>()
  for (const row of data ?? []) {
    if (!map.has(row.bet_id)) map.set(row.bet_id, row)
  }
  return map
}

export async function createOsBetUpdate(
  userId: string,
  input: {
    betId: string
    weekStart?: string
    status: OsBetUpdateStatus
    whatDone?: string
    blockers?: string
  }
): Promise<OsBetUpdateRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_bet_updates')
    .insert({
      user_id: userId,
      bet_id: input.betId,
      week_start: input.weekStart ?? currentWeekStartDate(),
      status: input.status,
      what_done: input.whatDone?.trim() || null,
      blockers: input.blockers?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar weekly update:', error)
    throw error
  }

  await supabase
    .from('os_bets')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.betId)

  return data
}

export function getBetDisplayStatus(
  bet: OsBetRow,
  latestUpdate: OsBetUpdateRow | null | undefined
): { label: string; color: string; source: 'update' | 'bet' } {
  if (latestUpdate) {
    return {
      label: formatBetUpdateStatusLabel(latestUpdate.status),
      color: getBetUpdateStatusColor(latestUpdate.status),
      source: 'update',
    }
  }
  const mappable = ['on_course', 'deviating', 'executed', 'failed'].includes(bet.status)
  if (mappable) {
    return {
      label: formatBetUpdateStatusLabel(bet.status),
      color: getBetUpdateStatusColor(bet.status),
      source: 'bet',
    }
  }
  return { label: bet.status.toUpperCase(), color: '#888888', source: 'bet' }
}

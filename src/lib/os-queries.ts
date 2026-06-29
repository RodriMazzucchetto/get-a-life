import { createClient } from '@/lib/supabase'
import { appendOsTaskPosForStatus } from '@/lib/osBoardHelpers'
import { filterOsCompanies, isQuickWinProject } from '@/lib/project-filters'
import type {
  OsBetRow,
  OsBetStatus,
  OsBetUpdateRow,
  OsBetUpdateStatus,
  OsBlockRow,
  OsBlockType,
  OsCycleRow,
  OsGoalRow,
  OsGoalStatus,
  OsPerformanceReport,
  OsPillarGoalCounts,
  OsPillarPitchCounts,
  OsTaskRow,
} from '@/lib/os-types'

const OS_TASKS_SELECT = '*, os_task_projects(project_id)' as const

type OsTaskDbRow = OsTaskRow & { os_task_projects?: { project_id: string }[] }

function normalizeOsTaskRow(row: OsTaskDbRow): OsTaskRow {
  const fromLinks = (row.os_task_projects ?? []).map((link) => link.project_id)
  const projectIds =
    fromLinks.length > 0
      ? [...new Set(fromLinks)]
      : row.project_id
        ? [row.project_id]
        : []

  const { os_task_projects: _links, ...rest } = row
  return { ...rest, projectIds }
}

function primaryOsTaskProjectId(
  projectIds: string[],
  projects: OsProjectOption[] = []
): string | null {
  if (projectIds.length === 0) return null
  const companyId = projectIds.find((id) => {
    const project = projects.find((p) => p.id === id)
    return project && !isQuickWinProject(project)
  })
  return companyId ?? projectIds[0] ?? null
}

function isMissingOsTaskProjectsTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST200' ||
    Boolean(error.message?.includes('os_task_projects'))
  )
}

export const OS_SELECTED_PROJECT_KEY = 'os_selected_project_id'

export const OS_BLOCK_TYPES: OsBlockType[] = ['finance', 'growth', 'ops']

export const OS_BLOCK_LABELS: Record<OsBlockType, string> = {
  finance: 'FINANCE',
  growth: 'GROWTH',
  ops: 'OPERATIONS',
}

/** Cores de identidade por pilar (design system v0.1). */
export const OS_BLOCK_DOT_COLORS: Record<OsBlockType, string> = {
  finance: '#ffd400',
  growth: '#1ec7eb',
  ops: '#18b46b',
}

export const OS_YELLOW = '#FFD600'
export const OS_CYAN = '#5BC0EB'
export const OS_GREEN = '#34D399'
export const OS_RED = '#FF0000'

export interface PillarStatusDisplay {
  pct: number
  color: string
  status: 'deviating' | 'on_course' | 'executed' | 'failed' | null
  label: string
}

export function getBetEffectiveTrackStatus(
  bet: OsBetRow,
  latestUpdate: OsBetUpdateRow | null | undefined
): string {
  if (latestUpdate) return latestUpdate.status
  return bet.status
}

/** Momentum = (on_course + executed) / total apostas do pilar × 100 */
export function computePillarMomentum(
  bets: OsBetRow[],
  latestUpdatesByBetId: Map<string, OsBetUpdateRow> = new Map()
): number {
  if (bets.length === 0) return 0

  const onTrack = bets.filter((bet) => {
    const status = getBetEffectiveTrackStatus(bet, latestUpdatesByBetId.get(bet.id))
    return status === 'on_course' || status === 'executed'
  }).length

  return Math.round((onTrack / bets.length) * 100)
}

/** % de execução no header do pilar = executed / pitches priorizados × 100 */
export function computePillarExecutionPct(
  bets: OsBetRow[],
  latestUpdatesByBetId: Map<string, OsBetUpdateRow> = new Map()
): number {
  const priority = bets.filter((bet) => bet.is_priority)
  if (priority.length === 0) return 0

  const executed = priority.filter(
    (bet) => getBetEffectiveTrackStatus(bet, latestUpdatesByBetId.get(bet.id)) === 'executed'
  ).length

  return Math.round((executed / priority.length) * 100)
}

/**
 * Cor da barra conforme momentum:
 * > 50% verde · = 50% amarelo (deviating) · < 50% vermelho
 */
export function getPillarMomentumColor(pct: number, hasBets = true): string {
  if (!hasBets) return '#E5E5E5'
  if (pct > 50) return OS_GREEN
  if (pct === 50) return OS_YELLOW
  return OS_RED
}

export function getPillarStatusDisplay(
  priorityBet: OsBetRow | null,
  latestUpdate: OsBetUpdateRow | null,
  pillarBets: OsBetRow[] = [],
  latestUpdatesByBetId: Map<string, OsBetUpdateRow> = new Map()
): PillarStatusDisplay {
  const hasBets = pillarBets.length > 0
  const pct = computePillarExecutionPct(pillarBets, latestUpdatesByBetId)
  const color = getPillarMomentumColor(pct, hasBets)

  if (!hasBets) {
    return { pct: 0, color: '#E5E5E5', status: null, label: '—' }
  }

  const trackable = ['on_course', 'deviating', 'executed', 'failed'] as const
  const statusBet = priorityBet ?? pillarBets.find((bet) => bet.is_priority) ?? null
  const statusUpdate = statusBet ? latestUpdatesByBetId.get(statusBet.id) ?? null : null
  const rawStatus =
    statusUpdate?.status ??
    (statusBet &&
    trackable.includes(statusBet.status as (typeof trackable)[number])
      ? (statusBet.status as (typeof trackable)[number])
      : null)

  return {
    pct,
    color,
    status: rawStatus,
    label: rawStatus ? formatBetUpdateStatusLabel(rawStatus) : `${pct}% MOMENTUM`,
  }
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

export function computeCompanyMomentum(
  orderedBlocks: { block: { type: OsBlockType }; bets: OsBetRow[] }[],
  latestUpdatesByBetId: Map<string, OsBetUpdateRow> = new Map()
): number {
  const rates = OS_BLOCK_TYPES.map((type) => {
    const view = orderedBlocks.find((v) => v.block.type === type)
    return computePillarExecutionPct(view?.bets ?? [], latestUpdatesByBetId)
  })
  return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / OS_BLOCK_TYPES.length)
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

export type OsGoalOutcome = Extract<OsGoalStatus, 'achieved' | 'abandoned'>

export function goalIsConcluded(goal: OsGoalRow): boolean {
  return goal.status === 'achieved' || goal.status === 'abandoned'
}

export function formatGoalOutcomeLabel(status: OsGoalStatus): string {
  switch (status) {
    case 'achieved':
      return 'Achieved'
    case 'abandoned':
      return 'Abandoned'
    default:
      return 'Active'
  }
}

export function getGoalOutcomeColor(status: OsGoalOutcome): string {
  return status === 'achieved' ? OS_CYAN : OS_RED
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
    case 'backlog':
      return 'Backlog'
    case 'current_week':
      return 'Semana Atual'
    case 'in_progress':
      return 'Foco Agora'
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

/** Empresas do OS — exclui Quick Win (QW), que é tag de tasks. */
export async function fetchOsCompanies(userId: string): Promise<OsProjectOption[]> {
  const projects = await fetchOsProjects(userId)
  return filterOsCompanies(projects)
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

/** Busca todas as metas de um bloco (ativas + concluídas), ordenadas por pos/created_at. */
export async function fetchGoalsForBlock(blockId: string): Promise<OsGoalRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_goals')
    .select('*')
    .eq('block_id', blockId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar metas do bloco:', error)
    throw error
  }

  // Normalizar campos que podem não existir antes da migration
  return (data ?? []).map((g) => ({
    ...g,
    is_priority: g.is_priority ?? false,
    pos: g.pos ?? null,
    closed_at: g.closed_at ?? null,
    closure_note: g.closure_note ?? null,
  }))
}

/** Define uma meta como prioritária (única por bloco).
 *  Resiliente à ausência das colunas is_priority/pos (antes da migration). */
export async function setGoalPriority(goalId: string, blockId: string): Promise<OsGoalRow> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const { data: goalRow, error: goalError } = await supabase
    .from('os_goals')
    .select('status')
    .eq('id', goalId)
    .single()

  if (goalError) {
    console.error('Erro ao validar meta para priorização:', goalError)
    throw goalError
  }
  if (goalRow.status !== 'active') {
    throw new Error('Só é possível priorizar metas ativas.')
  }

  // Tentar com is_priority; se a coluna não existir cai no fallback por updated_at
  const { error: clearError } = await supabase
    .from('os_goals')
    .update({ is_priority: false })
    .eq('block_id', blockId)
    .neq('id', goalId)

  const columnMissing =
    clearError?.message?.includes('is_priority') ||
    clearError?.message?.includes('column') ||
    clearError?.code === '42703'

  if (clearError && !columnMissing) {
    console.error('Erro ao limpar prioridades:', clearError)
    throw clearError
  }

  if (columnMissing) {
    // Fallback: só actualizar updated_at para este goal ficar primeiro no fetchOsPitchBoard
    const { data, error } = await supabase
      .from('os_goals')
      .update({ updated_at: now })
      .eq('id', goalId)
      .select('*')
      .single()
    if (error) throw error
    return { ...data, is_priority: true, pos: data.pos ?? null }
  }

  // Marcar esta como prioritária
  const { data, error } = await supabase
    .from('os_goals')
    .update({ is_priority: true, updated_at: now })
    .eq('id', goalId)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao definir meta prioritária:', error)
    throw error
  }
  return data
}

/** Remove a prioridade de uma meta (deixa sem nenhuma prioritária no bloco). */
export async function unsetGoalPriority(goalId: string): Promise<OsGoalRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_goals')
    .update({ is_priority: false })
    .eq('id', goalId)
    .select('*')
    .single()
  if (error) {
    console.error('Erro ao remover prioridade da meta:', error)
    throw error
  }
  return data
}

/** Conclui meta priorizada: achieved ou abandoned. Desprioriza automaticamente. */
export async function concludeOsGoal(
  goalId: string,
  outcome: OsGoalOutcome,
  closureNote?: string
): Promise<OsGoalRow> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = {
    status: outcome,
    is_priority: false,
    updated_at: now,
    closed_at: now,
    closure_note: closureNote?.trim() || null,
  }

  const { data, error } = await supabase
    .from('os_goals')
    .update(payload)
    .eq('id', goalId)
    .select('*')
    .single()

  if (error) {
    const columnMissing =
      error.message?.includes('closed_at') ||
      error.message?.includes('closure_note') ||
      error.code === '42703'
    if (columnMissing) {
      const { closed_at: _c, closure_note: _n, ...fallbackPayload } = payload
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('os_goals')
        .update(fallbackPayload)
        .eq('id', goalId)
        .select('*')
        .single()
      if (fallbackError) {
        console.error('Erro ao concluir meta OS:', fallbackError)
        throw fallbackError
      }
      return { ...fallbackData, closed_at: null, closure_note: null }
    }
    console.error('Erro ao concluir meta OS:', error)
    throw error
  }
  return data
}

/** Alterna status da meta: active ↔ achieved. */
export async function toggleGoalDone(goalId: string, done: boolean): Promise<OsGoalRow> {
  if (done) return concludeOsGoal(goalId, 'achieved')

  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_goals')
    .update({
      status: 'active',
      closed_at: null,
      closure_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select('*')
    .single()

  if (error) {
    const columnMissing =
      error.message?.includes('closed_at') ||
      error.message?.includes('closure_note') ||
      error.code === '42703'
    if (columnMissing) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('os_goals')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .select('*')
        .single()
      if (fallbackError) throw fallbackError
      return { ...fallbackData, closed_at: null, closure_note: null }
    }
    console.error('Erro ao alternar estado da meta:', error)
    throw error
  }
  return data
}

/** Apaga uma meta (e todos os pitches associados via cascade). */
export async function deleteOsGoal(goalId: string): Promise<void> {
  const supabase = createClient()

  // Desvincular tasks dos pitches desta meta
  const { data: bets } = await supabase.from('os_bets').select('id').eq('goal_id', goalId)
  if (bets?.length) {
    const betIds = bets.map((b) => b.id)
    await supabase.from('os_bet_updates').delete().in('bet_id', betIds)
    await supabase.from('os_tasks').update({ bet_id: null }).in('bet_id', betIds)
    await supabase.from('os_bets').delete().in('id', betIds)
  }

  const { error } = await supabase.from('os_goals').delete().eq('id', goalId)
  if (error) {
    console.error('Erro ao apagar meta:', error)
    throw error
  }
}

/** Reordena metas de um bloco. */
export async function reorderGoalsForBlock(orderedIds: string[]): Promise<void> {
  const supabase = createClient()
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('os_goals')
      .update({ pos: (index + 1) * 1000, updated_at: new Date().toISOString() })
      .eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
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
    .select(OS_TASKS_SELECT)
    .eq('user_id', userId)
    .order('pos', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingOsTaskProjectsTable(error)) {
      const fallback = await supabase
        .from('os_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('pos', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (fallback.error) {
        console.error('Erro ao buscar tasks OS:', fallback.error)
        throw fallback.error
      }
      return (fallback.data ?? []).map(normalizeOsTaskRow)
    }
    console.error('Erro ao buscar tasks OS:', error)
    throw error
  }

  return (data ?? []).map(normalizeOsTaskRow)
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

export function removeBetFromBoardViews(board: OsBlockView[], betId: string): OsBlockView[] {
  return board.map((view) => {
    const bets = view.bets.filter((bet) => bet.id !== betId)
    return {
      ...view,
      bets,
      priorityBet: bets.find((bet) => bet.is_priority) ?? null,
    }
  })
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
  isPriority: boolean
): Promise<OsBetRow> {
  const supabase = createClient()

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
  if (blocks.length === 0) return []

  const supabase = createClient()
  const blockIds = blocks.map((block) => block.id)

  const { data: goalsData, error: goalsError } = await supabase
    .from('os_goals')
    .select('*')
    .in('block_id', blockIds)
    .eq('status', 'active')
    .order('is_priority', { ascending: false })
    .order('updated_at', { ascending: false })

  if (goalsError) {
    console.error('Erro ao buscar metas OS:', goalsError)
    throw goalsError
  }

  // META ATIVA = meta priorizada do bloco. Se nenhuma estiver priorizada,
  // o bloco fica sem meta ativa (view.goal = null) — as demais vão para o backlog.
  const goalByBlockId = new Map<string, OsGoalRow>()
  for (const goal of goalsData ?? []) {
    if (goal.is_priority && !goalByBlockId.has(goal.block_id)) {
      goalByBlockId.set(goal.block_id, goal)
    }
  }

  const goalIds = [...goalByBlockId.values()].map((goal) => goal.id)
  let allBets: OsBetRow[] = []

  if (goalIds.length > 0) {
    const { data: betsData, error: betsError } = await supabase
      .from('os_bets')
      .select('*')
      .in('goal_id', goalIds)
      .order('created_at', { ascending: true })

    if (betsError) {
      console.error('Erro ao buscar pitches OS:', betsError)
      throw betsError
    }

    allBets = sortOsBetsByPosition(betsData ?? [])
  }

  const betsByGoalId = new Map<string, OsBetRow[]>()
  for (const bet of allBets) {
    const list = betsByGoalId.get(bet.goal_id) ?? []
    list.push(bet)
    betsByGoalId.set(bet.goal_id, list)
  }

  return blocks.map((block) => {
    const goal = goalByBlockId.get(block.id) ?? null
    const bets = goal ? (betsByGoalId.get(goal.id) ?? []) : []
    const priorityBet = bets.find((bet) => bet.is_priority) ?? null
    return { block, goal, bets, priorityBet }
  })
}

export async function fetchOsPitchBoardWithUpdates(
  userId: string,
  projectId: string
): Promise<{ board: OsBlockView[]; latestUpdates: Map<string, OsBetUpdateRow> }> {
  const board = await fetchOsPitchBoard(userId, projectId)
  const betIds = board.flatMap((view) => view.bets.map((bet) => bet.id))
  const latestUpdates = await fetchLatestOsBetUpdatesForBets(betIds)
  return { board, latestUpdates }
}

export async function fetchOsTasksBoard(userId: string): Promise<{
  tasks: OsTaskRow[]
  projects: OsProjectOption[]
  betsById: Map<string, OsBetRow>
}> {
  const [tasks, projects] = await Promise.all([
    fetchAllOsTasks(userId),
    fetchOsProjects(userId),
  ])

  const betIds = [
    ...new Set(tasks.map((t) => t.bet_id).filter((id): id is string => Boolean(id))),
  ]
  const bets = betIds.length > 0 ? await fetchOsBetsByIds(betIds) : []

  return {
    tasks,
    projects,
    betsById: new Map(bets.map((bet) => [bet.id, bet])),
  }
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

/** Conta to-dos (tasks) e updates por pitch, em 2 queries agregadas.
 *  Usado para o rodapé dos cards de pitch (→ N to-dos · N updates). */
export async function fetchOsBetActivityCounts(
  betIds: string[]
): Promise<Map<string, { todosOpen: number; todosTotal: number; updates: number }>> {
  const result = new Map<string, { todosOpen: number; todosTotal: number; updates: number }>()
  if (betIds.length === 0) return result
  for (const id of betIds) result.set(id, { todosOpen: 0, todosTotal: 0, updates: 0 })

  const supabase = createClient()
  const [tasksRes, updatesRes] = await Promise.all([
    supabase.from('os_tasks').select('bet_id, completed_at').in('bet_id', betIds),
    supabase.from('os_bet_updates').select('bet_id').in('bet_id', betIds),
  ])

  for (const row of tasksRes.data ?? []) {
    const task = row as { bet_id: string | null; completed_at: string | null }
    const betId = task.bet_id
    if (betId && result.has(betId)) {
      const entry = result.get(betId)!
      entry.todosTotal += 1
      if (!task.completed_at) entry.todosOpen += 1
    }
  }
  for (const row of updatesRes.data ?? []) {
    const betId = (row as { bet_id: string | null }).bet_id
    if (betId && result.has(betId)) result.get(betId)!.updates += 1
  }
  return result
}

export async function deleteOsBet(betId: string): Promise<void> {
  const supabase = createClient()

  // Apagar updates primeiro (o cascade do DB funciona, mas fazemos explícito para garantir com RLS)
  const { error: updatesError } = await supabase
    .from('os_bet_updates')
    .delete()
    .eq('bet_id', betId)
  if (updatesError) {
    console.error('[deleteOsBet] Erro ao apagar updates:', updatesError)
    throw new Error(`Erro ao apagar updates do pitch: ${updatesError.message}`)
  }

  // Desvincular tasks
  const { error: tasksError } = await supabase
    .from('os_tasks')
    .update({ bet_id: null, updated_at: new Date().toISOString() })
    .eq('bet_id', betId)
  if (tasksError) {
    console.error('[deleteOsBet] Erro ao desvincular tasks:', tasksError)
    throw new Error(`Erro ao desvincular tasks: ${tasksError.message}`)
  }

  // Apagar o pitch
  const { error } = await supabase.from('os_bets').delete().eq('id', betId)
  if (error) {
    console.error('[deleteOsBet] Erro ao apagar pitch:', error)
    throw new Error(`Erro ao apagar pitch: ${error.message}`)
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
    .select(OS_TASKS_SELECT)
    .eq('bet_id', betId)
    .order('pos', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    if (isMissingOsTaskProjectsTable(error)) {
      const fallback = await supabase
        .from('os_tasks')
        .select('*')
        .eq('bet_id', betId)
        .order('pos', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (fallback.error) {
        console.error('Erro ao buscar tasks do pitch:', fallback.error)
        throw fallback.error
      }
      return (fallback.data ?? []).map(normalizeOsTaskRow)
    }
    console.error('Erro ao buscar tasks do pitch:', error)
    throw error
  }

  return (data ?? []).map(normalizeOsTaskRow)
}

export async function createOsTask(
  userId: string,
  input: {
    projectId?: string | null
    betId?: string | null
    title: string
    description?: string
    status?: OsTaskRow['status']
  },
  existingTasks: OsTaskRow[] = []
): Promise<OsTaskRow> {
  const supabase = createClient()
  const status = input.status ?? 'backlog'
  const pos = appendOsTaskPosForStatus(existingTasks, status)

  const { data, error } = await supabase
    .from('os_tasks')
    .insert({
      user_id: userId,
      project_id: input.projectId ?? null,
      bet_id: input.betId ?? null,
      title: input.title,
      description: input.description ?? null,
      is_maintenance: false,
      status,
      on_hold: false,
      on_hold_reason: null,
      pos,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao criar task OS:', error)
    throw error
  }

  const projectId = input.projectId ?? null
  if (projectId) {
    const { error: linkError } = await supabase.from('os_task_projects').insert({
      task_id: data.id,
      project_id: projectId,
    })
    if (linkError && !isMissingOsTaskProjectsTable(linkError)) {
      console.error('Erro ao ligar projeto à task OS:', linkError)
      throw linkError
    }
  }

  return normalizeOsTaskRow({
    ...data,
    os_task_projects: projectId ? [{ project_id: projectId }] : [],
  })
}

export async function setOsTaskProjects(
  taskId: string,
  projectIds: string[],
  projects: OsProjectOption[] = []
): Promise<OsTaskRow> {
  const supabase = createClient()
  const uniqueIds = [...new Set(projectIds.filter(Boolean))]
  const primaryProjectId = primaryOsTaskProjectId(uniqueIds, projects)

  const { error: deleteError } = await supabase
    .from('os_task_projects')
    .delete()
    .eq('task_id', taskId)

  if (deleteError && !isMissingOsTaskProjectsTable(deleteError)) {
    console.error('Erro ao limpar tags de projeto da task OS:', deleteError)
    throw deleteError
  }

  if (uniqueIds.length > 0 && !deleteError) {
    const { error: insertError } = await supabase.from('os_task_projects').insert(
      uniqueIds.map((project_id) => ({ task_id: taskId, project_id }))
    )
    if (insertError && !isMissingOsTaskProjectsTable(insertError)) {
      console.error('Erro ao salvar tags de projeto da task OS:', insertError)
      throw insertError
    }
  }

  const { data, error } = await supabase
    .from('os_tasks')
    .update({
      project_id: primaryProjectId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select(OS_TASKS_SELECT)
    .single()

  if (error) {
    if (isMissingOsTaskProjectsTable(error)) {
      const fallback = await supabase
        .from('os_tasks')
        .update({
          project_id: primaryProjectId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select('*')
        .single()
      if (fallback.error) {
        console.error('Erro ao atualizar projetos da task OS:', fallback.error)
        throw fallback.error
      }
      return normalizeOsTaskRow({
        ...fallback.data,
        os_task_projects: uniqueIds.map((project_id) => ({ project_id })),
      })
    }
    console.error('Erro ao atualizar projetos da task OS:', error)
    throw error
  }

  return normalizeOsTaskRow(data)
}

export async function updateOsTask(
  taskId: string,
  updates: {
    title?: string
    description?: string | null
    status?: OsTaskRow['status']
    pos?: number
    on_hold?: boolean
    on_hold_reason?: string | null
    completed_at?: string | null
    importance?: number | null
    urgency?: number | null
    effort?: number | null
  }
): Promise<OsTaskRow> {
  const supabase = createClient()
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.title !== undefined) payload.title = updates.title
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.pos !== undefined) payload.pos = updates.pos
  if (updates.on_hold !== undefined) payload.on_hold = updates.on_hold
  if (updates.on_hold_reason !== undefined) payload.on_hold_reason = updates.on_hold_reason
  if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at
  if (updates.importance !== undefined) payload.importance = updates.importance
  if (updates.urgency !== undefined) payload.urgency = updates.urgency
  if (updates.effort !== undefined) payload.effort = updates.effort

  const { data, error } = await supabase
    .from('os_tasks')
    .update(payload)
    .eq('id', taskId)
    .select(OS_TASKS_SELECT)
    .single()

  if (error) {
    if (isMissingOsTaskProjectsTable(error)) {
      const fallback = await supabase
        .from('os_tasks')
        .update(payload)
        .eq('id', taskId)
        .select('*')
        .single()
      if (fallback.error) {
        console.error('Erro ao atualizar task OS:', fallback.error)
        throw fallback.error
      }
      return normalizeOsTaskRow(fallback.data)
    }
    console.error('Erro ao atualizar task OS:', error)
    throw error
  }

  return normalizeOsTaskRow(data)
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
    .order('created_at', { ascending: false })

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

const TERMINAL_BET_UPDATE_STATUSES = new Set<OsBetUpdateStatus>(['executed', 'failed'])

/** Sincroniza status do pitch com o update mais recente; desprioriza se executed/failed. */
async function syncBetFromLatestUpdate(betId: string): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase
    .from('os_bet_updates')
    .select('status')
    .eq('bet_id', betId)
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestStatus = data?.status as OsBetUpdateStatus | undefined
  const nextStatus: OsBetStatus = latestStatus ?? 'draft'
  const payload: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }
  if (latestStatus && TERMINAL_BET_UPDATE_STATUSES.has(latestStatus)) {
    payload.is_priority = false
  }

  await supabase.from('os_bets').update(payload).eq('id', betId)
}

function betUpdateBetPayload(status: OsBetUpdateStatus): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (TERMINAL_BET_UPDATE_STATUSES.has(status)) {
    payload.is_priority = false
  }
  return payload
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
    .update(betUpdateBetPayload(input.status))
    .eq('id', input.betId)

  return data
}

export async function updateOsBetUpdate(
  updateId: string,
  betId: string,
  updates: { status?: OsBetUpdateStatus; whatDone?: string; blockers?: string }
): Promise<OsBetUpdateRow> {
  const supabase = createClient()
  const payload: Record<string, unknown> = {}
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.whatDone !== undefined) payload.what_done = updates.whatDone.trim() || null
  if (updates.blockers !== undefined) payload.blockers = updates.blockers.trim() || null

  const { data, error } = await supabase
    .from('os_bet_updates')
    .update(payload)
    .eq('id', updateId)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao editar weekly update:', error)
    throw error
  }

  await syncBetFromLatestUpdate(betId)
  return data
}

export async function deleteOsBetUpdate(updateId: string, betId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('os_bet_updates').delete().eq('id', updateId)
  if (error) {
    console.error('Erro ao remover weekly update:', error)
    throw error
  }
  await syncBetFromLatestUpdate(betId)
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

// ─── OS Task Cycles (Reports) ───────────────────────────────────────────────

import type { OsTaskCycleRow } from '@/lib/os-types'

export async function fetchActiveOsTaskCycle(userId: string): Promise<OsTaskCycleRow | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('os_task_cycles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return data ?? null
}

export async function fetchAllOsTaskCycles(userId: string): Promise<OsTaskCycleRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('os_task_cycles')
    .select('*')
    .eq('user_id', userId)
    .order('cycle_number', { ascending: true })
  return data ?? []
}

export async function startOsTaskCycle(userId: string, plannedPoints: number): Promise<OsTaskCycleRow> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const { data: last } = await supabase
    .from('os_task_cycles')
    .select('cycle_number')
    .eq('user_id', userId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNumber = (last?.cycle_number ?? 0) + 1

  const { data, error } = await supabase
    .from('os_task_cycles')
    .insert({
      user_id: userId,
      cycle_number: nextNumber,
      status: 'active',
      started_at: now,
      planned_points: plannedPoints,
      added_after_points: 0,
      delivered_points: 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function endOsTaskCycle(cycleId: string): Promise<OsTaskCycleRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('os_task_cycles')
    .update({ status: 'closed', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', cycleId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function incrementCycleDeliveredPoints(cycleId: string, points: number): Promise<void> {
  const supabase = createClient()
  const { data: current } = await supabase
    .from('os_task_cycles')
    .select('delivered_points')
    .eq('id', cycleId)
    .single()
  if (!current) return
  await supabase
    .from('os_task_cycles')
    .update({ delivered_points: (current.delivered_points ?? 0) + points, updated_at: new Date().toISOString() })
    .eq('id', cycleId)
}

export async function incrementCycleAddedAfterPoints(cycleId: string, points: number): Promise<void> {
  const supabase = createClient()
  const { data: current } = await supabase
    .from('os_task_cycles')
    .select('added_after_points')
    .eq('id', cycleId)
    .single()
  if (!current) return
  await supabase
    .from('os_task_cycles')
    .update({ added_after_points: (current.added_after_points ?? 0) + points, updated_at: new Date().toISOString() })
    .eq('id', cycleId)
}

function isInCalendarMonth(iso: string, year: number, month: number): boolean {
  const date = new Date(iso)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

function emptyPitchCountsByPillar(): OsPillarPitchCounts[] {
  return OS_BLOCK_TYPES.map((pillar) => ({
    pillar,
    executed: 0,
    failed: 0,
    total: 0,
  }))
}

function emptyGoalCountsByPillar(): OsPillarGoalCounts[] {
  return OS_BLOCK_TYPES.map((pillar) => ({
    pillar,
    achieved: 0,
    abandoned: 0,
    total: 0,
  }))
}

function getBetConclusionEvent(
  bet: OsBetRow,
  terminalUpdates: OsBetUpdateRow[]
): { status: 'executed' | 'failed'; at: string } | null {
  const updates = terminalUpdates
    .filter((update) => update.bet_id === bet.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (updates.length > 0) {
    const first = updates[0]
    return { status: first.status as 'executed' | 'failed', at: first.created_at }
  }

  if (bet.status === 'executed' || bet.status === 'failed') {
    return { status: bet.status, at: bet.updated_at }
  }

  return null
}

/** Performance de pitches e metas concluídos num mês, por empresa e pilar. */
export async function fetchOsPerformanceReport(
  userId: string,
  projectId: string,
  year: number,
  month: number
): Promise<OsPerformanceReport> {
  const blocks = await ensureOsBlocksForProject(userId, projectId)
  const blockTypeById = new Map(blocks.map((block) => [block.id, block.type]))
  const blockIds = blocks.map((block) => block.id)

  if (blockIds.length === 0) {
    return {
      year,
      month,
      pitches: { executed: 0, failed: 0, total: 0, byPillar: emptyPitchCountsByPillar() },
      goals: { achieved: 0, abandoned: 0, total: 0, byPillar: emptyGoalCountsByPillar() },
    }
  }

  const supabase = createClient()

  const [{ data: goalsData }] = await Promise.all([
    supabase.from('os_goals').select('*').in('block_id', blockIds),
  ])

  const goals = (goalsData ?? []) as OsGoalRow[]
  const goalIds = goals.map((goal) => goal.id)

  let bets: OsBetRow[] = []
  if (goalIds.length > 0) {
    const { data: betsData, error: betsError } = await supabase
      .from('os_bets')
      .select('*')
      .in('goal_id', goalIds)

    if (betsError) {
      console.error('Erro ao buscar pitches para relatório:', betsError)
      throw betsError
    }
    bets = betsData ?? []
  }

  const betIds = bets.map((bet) => bet.id)

  let terminalUpdates: OsBetUpdateRow[] = []
  if (betIds.length > 0) {
    const { data: updatesData, error: updatesError } = await supabase
      .from('os_bet_updates')
      .select('*')
      .in('bet_id', betIds)
      .in('status', ['executed', 'failed'])
      .order('created_at', { ascending: true })

    if (updatesError) {
      console.error('Erro ao buscar updates para relatório:', updatesError)
      throw updatesError
    }
    terminalUpdates = updatesData ?? []
  }

  const pitchByPillar = new Map<OsBlockType, OsPillarPitchCounts>(
    emptyPitchCountsByPillar().map((row) => [row.pillar, { ...row }])
  )
  let pitchExecuted = 0
  let pitchFailed = 0

  for (const bet of bets) {
    const conclusion = getBetConclusionEvent(bet, terminalUpdates)
    if (!conclusion || !isInCalendarMonth(conclusion.at, year, month)) continue

    const goal = goals.find((g) => g.id === bet.goal_id)
    const pillar = goal ? blockTypeById.get(goal.block_id) : undefined
    if (!pillar) continue

    const row = pitchByPillar.get(pillar)!
    if (conclusion.status === 'executed') {
      row.executed += 1
      pitchExecuted += 1
    } else {
      row.failed += 1
      pitchFailed += 1
    }
    row.total += 1
  }

  const goalByPillar = new Map<OsBlockType, OsPillarGoalCounts>(
    emptyGoalCountsByPillar().map((row) => [row.pillar, { ...row }])
  )
  let goalAchieved = 0
  let goalAbandoned = 0

  for (const goal of goals) {
    if (goal.status !== 'achieved' && goal.status !== 'abandoned') continue
    const closedAt = goal.closed_at ?? goal.updated_at
    if (!isInCalendarMonth(closedAt, year, month)) continue

    const pillar = blockTypeById.get(goal.block_id)
    if (!pillar) continue

    const row = goalByPillar.get(pillar)!
    if (goal.status === 'achieved') {
      row.achieved += 1
      goalAchieved += 1
    } else {
      row.abandoned += 1
      goalAbandoned += 1
    }
    row.total += 1
  }

  return {
    year,
    month,
    pitches: {
      executed: pitchExecuted,
      failed: pitchFailed,
      total: pitchExecuted + pitchFailed,
      byPillar: OS_BLOCK_TYPES.map((pillar) => pitchByPillar.get(pillar)!),
    },
    goals: {
      achieved: goalAchieved,
      abandoned: goalAbandoned,
      total: goalAchieved + goalAbandoned,
      byPillar: OS_BLOCK_TYPES.map((pillar) => goalByPillar.get(pillar)!),
    },
  }
}

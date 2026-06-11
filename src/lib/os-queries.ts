import { createClient } from '@/lib/supabase'
import type {
  OsBetRow,
  OsBetStatus,
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

      return {
        block,
        goal,
        bets,
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

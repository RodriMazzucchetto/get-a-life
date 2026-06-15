import type { OsTaskBoardStatus, OsTaskRow } from '@/lib/os-types'

export const OS_COL_BACKLOG = 'os-col-backlog'
export const OS_COL_CURRENT_WEEK = 'os-col-current-week'
export const OS_COL_IN_PROGRESS = 'os-col-in-progress'

export function osColumnStatusFromId(id: string): OsTaskBoardStatus | null {
  if (id === OS_COL_BACKLOG) return 'backlog'
  if (id === OS_COL_CURRENT_WEEK) return 'current_week'
  if (id === OS_COL_IN_PROGRESS) return 'in_progress'
  return null
}

export function isOsTaskActive(task: OsTaskRow): boolean {
  return task.completed_at == null
}

/** Score = importância × urgência (1–25). */
export function computeOsTaskScore(task: Pick<OsTaskRow, 'importance' | 'urgency'>): number {
  const importance = task.importance ?? 3
  const urgency = task.urgency ?? 3
  return importance * urgency
}

/** Pausa no fim; depois maior score primeiro; empate por pos. */
export function sortOsTasksByPos(a: OsTaskRow, b: OsTaskRow): number {
  if (a.on_hold !== b.on_hold) return a.on_hold ? 1 : -1
  const scoreDiff = computeOsTaskScore(b) - computeOsTaskScore(a)
  if (scoreDiff !== 0) return scoreDiff
  return (a.pos ?? 0) - (b.pos ?? 0)
}

export function computeNextOsTaskPos(
  tasks: { pos: number | null; on_hold: boolean }[]
): number {
  if (tasks.length === 0) return 1000
  const active = tasks.filter((t) => !t.on_hold)
  const paused = tasks.filter((t) => t.on_hold)
  if (paused.length === 0) {
    return Math.max(...active.map((t) => t.pos ?? 0), 0) + 1000
  }
  if (active.length === 0) {
    return Math.min(...paused.map((t) => t.pos ?? 0)) - 1000
  }
  const maxActive = Math.max(...active.map((t) => t.pos ?? 0))
  const minPaused = Math.min(...paused.map((t) => t.pos ?? 0))
  const candidate = maxActive + 1000
  if (candidate < minPaused) return candidate
  return maxActive + (minPaused - maxActive) / 2
}

export function appendOsTaskPosForStatus(
  allTasks: OsTaskRow[],
  status: OsTaskBoardStatus,
  excludeTaskId?: string
): number {
  const col = allTasks.filter(
    (t) => t.status === status && isOsTaskActive(t) && t.id !== excludeTaskId
  )
  return computeNextOsTaskPos(col.map((t) => ({ pos: t.pos, on_hold: t.on_hold })))
}

export function appendOsTaskPosOnHoldAtBottom(
  allTasks: OsTaskRow[],
  status: OsTaskBoardStatus,
  excludeTaskId?: string
): number {
  const col = allTasks.filter(
    (t) => t.status === status && isOsTaskActive(t) && t.id !== excludeTaskId
  )
  if (col.length === 0) return 1000
  return Math.max(...col.map((t) => t.pos ?? 0)) + 1000
}

export function computeOsTaskPosAtIndex(
  ordered: OsTaskRow[],
  newIndex: number
): number {
  const before = ordered[newIndex - 1]
  const after = ordered[newIndex + 1]
  if (!before && !after) return 1000
  if (!before) return (after?.pos ?? 1000) - 1000
  if (!after) return (before.pos ?? 0) + 1000
  return ((before.pos ?? 0) + (after.pos ?? 0)) / 2
}

export function osTasksForColumn(tasks: OsTaskRow[], status: OsTaskBoardStatus): OsTaskRow[] {
  return tasks
    .filter((t) => t.status === status && isOsTaskActive(t))
    .sort(sortOsTasksByPos)
}

export function osBoardStatusLabel(status: OsTaskBoardStatus): string {
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

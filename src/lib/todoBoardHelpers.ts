import type { Todo } from '@/lib/planning'
import { compareBacklogTodos } from '@/lib/taskClassification'

export const COL_IN_PROGRESS = 'col-in-progress'
export const COL_CURRENT_WEEK = 'col-current-week'
export const COL_BACKLOG = 'col-backlog'

/**
 * Tarefas ativas (não em espera) primeiro — **todas** antes de qualquer pausada.
 * Depois prioridade alta e por fim pos.
 */
export function sortTodosByPriorityAndPos(a: Todo, b: Todo): number {
  const holdA = Boolean(a.onHold)
  const holdB = Boolean(b.onHold)
  if (holdA !== holdB) return holdA ? 1 : -1
  if (a.isHighPriority && !b.isHighPriority) return -1
  if (!a.isHighPriority && b.isHighPriority) return 1
  return a.pos - b.pos
}

export function sortBacklogTodosByClassification(a: Todo, b: Todo): number {
  const holdA = Boolean(a.onHold)
  const holdB = Boolean(b.onHold)
  if (holdA !== holdB) return holdA ? 1 : -1
  const byClass = compareBacklogTodos(a, b)
  if (byClass !== 0) return byClass
  if (a.isHighPriority && !b.isHighPriority) return -1
  if (!a.isHighPriority && b.isHighPriority) return 1
  return a.pos - b.pos
}

/**
 * Próxima pos para uma tarefa **ativa** no fim da fila “normal”, sempre acima das em espera.
 */
export function computeNextPosForColumnTasks(
  tasks: { pos: number; onHold: boolean }[]
): number {
  if (tasks.length === 0) return 1000
  const active = tasks.filter((t) => !t.onHold)
  const paused = tasks.filter((t) => Boolean(t.onHold))
  if (paused.length === 0) {
    return Math.max(...active.map((t) => t.pos), 0) + 1000
  }
  if (active.length === 0) {
    return Math.min(...paused.map((t) => t.pos)) - 1000
  }
  const maxActive = Math.max(...active.map((t) => t.pos))
  const minPaused = Math.min(...paused.map((t) => t.pos))
  const candidate = maxActive + 1000
  if (candidate < minPaused) return candidate
  return maxActive + (minPaused - maxActive) / 2
}

/** Coloca tarefa em espera no fundo absoluto da coluna (abaixo de todas as outras). */
export function appendPosForOnHoldAtBottom(
  allTodos: Todo[],
  status: Todo['status'],
  excludeTodoId?: string
): number {
  const col = allTodos.filter(
    (t) => t.status === status && !t.completed && t.id !== excludeTodoId
  )
  if (col.length === 0) return 1000
  return Math.max(...col.map((t) => t.pos)) + 1000
}

export function appendPosForStatus(
  allTodos: Todo[],
  status: Todo['status'],
  excludeTodoId?: string
): number {
  const col = allTodos.filter(
    (t) => t.status === status && !t.completed && t.id !== excludeTodoId
  )
  return computeNextPosForColumnTasks(
    col.map((t) => ({ pos: t.pos, onHold: t.onHold }))
  )
}

/** Posição após reordenar lista já filtrada pela coluna (mesmo status). */
export function computePosAtNewIndex(reordered: Todo[], activeId: string): number | null {
  const moved = reordered.find((t) => t.id === activeId)
  if (!moved) return null
  const newPosition = reordered.indexOf(moved)
  if (newPosition === 0) {
    const nextTodo = reordered[1]
    return nextTodo ? nextTodo.pos - 1000 : 1000
  }
  if (newPosition === reordered.length - 1) {
    const prevTodo = reordered[newPosition - 1]
    return prevTodo ? prevTodo.pos + 1000 : (newPosition + 1) * 1000
  }
  const prevTodo = reordered[newPosition - 1]
  const nextTodo = reordered[newPosition + 1]
  let newPos = Math.round((prevTodo.pos + nextTodo.pos) / 2)
  if (newPos === prevTodo.pos || newPos === nextTodo.pos) {
    newPos = prevTodo.pos + Math.round((nextTodo.pos - prevTodo.pos) / 2)
  }
  return newPos
}

/**
 * Calcula nova posição respeitando o bucket visual (onHold + prioridade).
 */
export function computePosAtNewIndexInVisualBucket(
  reordered: Todo[],
  activeId: string
): number | null {
  const moved = reordered.find((t) => t.id === activeId)
  if (!moved) return null
  const movedIndex = reordered.indexOf(moved)
  const sameBucket = (t: Todo) =>
    Boolean(t.onHold) === Boolean(moved.onHold) &&
    Boolean(t.isHighPriority) === Boolean(moved.isHighPriority) &&
    Boolean(t.needsReclassification) === Boolean(moved.needsReclassification)

  let prev: Todo | undefined
  for (let i = movedIndex - 1; i >= 0; i -= 1) {
    if (sameBucket(reordered[i])) {
      prev = reordered[i]
      break
    }
  }

  let next: Todo | undefined
  for (let i = movedIndex + 1; i < reordered.length; i += 1) {
    if (sameBucket(reordered[i])) {
      next = reordered[i]
      break
    }
  }

  if (!prev && !next) return moved.pos
  if (!prev) return next ? next.pos - 1000 : 1000
  if (!next) return prev.pos + 1000

  let newPos = Math.round((prev.pos + next.pos) / 2)
  if (newPos <= prev.pos || newPos >= next.pos) {
    newPos = prev.pos + (next.pos - prev.pos) / 2
  }
  return newPos
}

export function columnStatusFromId(
  id: string
): Todo['status'] | null {
  if (id === COL_BACKLOG) return 'backlog'
  if (id === COL_CURRENT_WEEK) return 'current_week'
  if (id === COL_IN_PROGRESS) return 'in_progress'
  return null
}

export function sortLifeAdminByDeadline(a: Todo, b: Todo): number {
  if (a.lifeAdminSubtype === 'COM_DEADLINE' && b.lifeAdminSubtype === 'COM_DEADLINE') {
    const da = a.lifeAdminDeadline ?? '9999-99-99'
    const db = b.lifeAdminDeadline ?? '9999-99-99'
    if (da !== db) return da.localeCompare(db)
  }
  if (a.lifeAdminSubtype === 'COM_DEADLINE' && b.lifeAdminSubtype !== 'COM_DEADLINE') {
    return -1
  }
  if (a.lifeAdminSubtype !== 'COM_DEADLINE' && b.lifeAdminSubtype === 'COM_DEADLINE') {
    return 1
  }
  return a.pos - b.pos
}

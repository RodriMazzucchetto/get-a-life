import type { Todo } from '@/lib/planning'

export const COL_IN_PROGRESS = 'col-in-progress'
export const COL_CURRENT_WEEK = 'col-current-week'
export const COL_BACKLOG = 'col-backlog'

export function sortTodosByPriorityAndPos(a: Todo, b: Todo): number {
  if (a.isHighPriority && !b.isHighPriority) return -1
  if (!a.isHighPriority && b.isHighPriority) return 1
  return a.pos - b.pos
}

export function appendPosForStatus(
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

export function columnStatusFromId(
  id: string
): Todo['status'] | null {
  if (id === COL_BACKLOG) return 'backlog'
  if (id === COL_CURRENT_WEEK) return 'current_week'
  if (id === COL_IN_PROGRESS) return 'in_progress'
  return null
}

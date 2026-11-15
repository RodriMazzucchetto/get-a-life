import {
  canMoveTodoToStatus,
  validateTodoClassificationPayload,
  type LifeAdminSubtype,
  type StatusClassification,
  type TaskType,
  type TodoBoardStatus,
} from '@/lib/taskClassification'

export const TODO_STATUSES = [
  'backlog',
  'in_progress',
  'current_week',
  'archived',
  'life_admin',
] as const

export const TASK_TYPES = ['STRATEGIC', 'LIFE_ADMIN'] as const
export const STATUS_CLASSIFICATIONS = [
  'SIGNAL_SEMANA',
  'SIGNAL_BACKLOG',
  'ADIADA_30D',
  'CORTADA',
] as const
export const LIFE_ADMIN_SUBTYPES = ['COM_DEADLINE', 'SEM_DEADLINE'] as const

export function parseTaskType(value: unknown): TaskType | null {
  return typeof value === 'string' && TASK_TYPES.includes(value as TaskType)
    ? (value as TaskType)
    : null
}

export function parseStatusClassification(value: unknown): StatusClassification | null {
  return typeof value === 'string' &&
    STATUS_CLASSIFICATIONS.includes(value as StatusClassification)
    ? (value as StatusClassification)
    : null
}

export function parseLifeAdminSubtype(value: unknown): LifeAdminSubtype | null {
  return typeof value === 'string' &&
    LIFE_ADMIN_SUBTYPES.includes(value as LifeAdminSubtype)
    ? (value as LifeAdminSubtype)
    : null
}

export function parseTodoStatus(value: unknown): TodoBoardStatus | null {
  return typeof value === 'string' &&
    TODO_STATUSES.includes(value as TodoBoardStatus)
    ? (value as TodoBoardStatus)
    : null
}

export function assertStatusMove(
  current: {
    task_type: TaskType | null
    status_classification: StatusClassification | null
    life_admin_subtype: LifeAdminSubtype | null
    needs_reclassification: boolean
    status: string
  },
  nextStatus: TodoBoardStatus
): { ok: true } | { ok: false; message: string } {
  const move = canMoveTodoToStatus(
    {
      taskType: current.task_type,
      statusClassification: current.status_classification,
      lifeAdminSubtype: current.life_admin_subtype,
      needsReclassification: current.needs_reclassification,
      status: current.status as TodoBoardStatus,
    },
    nextStatus
  )
  if (!move.ok) return { ok: false, message: move.reason }
  return { ok: true }
}

export function assertClassificationFields(row: {
  task_type: TaskType | null
  status_classification: StatusClassification | null
  life_admin_subtype: LifeAdminSubtype | null
  life_admin_deadline: string | null
  revisao_em: string | null
  needs_reclassification: boolean
}): { ok: true } | { ok: false; message: string } {
  if (row.needs_reclassification) return { ok: true }
  const check = validateTodoClassificationPayload({
    taskType: row.task_type,
    statusClassification: row.status_classification,
    lifeAdminSubtype: row.life_admin_subtype,
    lifeAdminDeadline: row.life_admin_deadline,
    revisaoEm: row.revisao_em,
  })
  if (!check.ok) return { ok: false, message: check.reason }
  return { ok: true }
}

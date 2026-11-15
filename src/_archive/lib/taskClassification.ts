export type TaskType = 'STRATEGIC' | 'LIFE_ADMIN'

export type StatusClassification =
  | 'SIGNAL_SEMANA'
  | 'SIGNAL_BACKLOG'
  | 'ADIADA_30D'
  | 'CORTADA'

export type LifeAdminSubtype = 'COM_DEADLINE' | 'SEM_DEADLINE'

export type TodoBoardStatus =
  | 'backlog'
  | 'in_progress'
  | 'current_week'
  | 'archived'
  | 'life_admin'

export type YesNo = 'yes' | 'no'

/** Classificação incompleta ou inconsistente — task deve aparecer no backlog. */
export function isTodoClassificationIncomplete(row: {
  completed?: boolean
  needs_reclassification?: boolean | null
  task_type?: TaskType | null
  status_classification?: StatusClassification | null
  life_admin_subtype?: LifeAdminSubtype | null
}): boolean {
  if (row.completed) return false
  if (row.needs_reclassification) return true
  if (row.task_type == null) return true
  if (row.task_type === 'STRATEGIC' && row.status_classification == null) return true
  if (row.task_type === 'LIFE_ADMIN' && row.life_admin_subtype == null) return true
  return false
}

export interface StrategicAnswers {
  q1MovesMetric: YesNo | null
  q2Consequence30d: YesNo | null
  q3Consequence7d: YesNo | null
}

export interface LifeAdminAnswers {
  hasDeadline: YesNo | null
  deadline: string | null
}

export interface ClassificationDraft {
  taskType: TaskType | null
  strategic: StrategicAnswers
  lifeAdmin: LifeAdminAnswers
  createdAt: string
}

export interface ClassificationResult {
  taskType: TaskType
  statusClassification: StatusClassification | null
  lifeAdminSubtype: LifeAdminSubtype | null
  lifeAdminDeadline: string | null
  revisaoEm: string | null
  status: TodoBoardStatus
}

export interface TodoRoutingFields {
  taskType: TaskType | null
  statusClassification: StatusClassification | null
  lifeAdminSubtype: LifeAdminSubtype | null
  needsReclassification: boolean
  status: TodoBoardStatus
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const base = new Date(isoDate)
  const utc = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())
  const next = new Date(utc + days * MS_PER_DAY)
  return next.toISOString().slice(0, 10)
}

export function statusFromStrategicClassification(
  classification: StatusClassification
): TodoBoardStatus {
  switch (classification) {
    case 'SIGNAL_SEMANA':
      return 'current_week'
    case 'SIGNAL_BACKLOG':
    case 'ADIADA_30D':
      return 'backlog'
    case 'CORTADA':
      return 'archived'
  }
}

export function computeStrategicClassification(
  answers: StrategicAnswers,
  createdAt: string
): ClassificationResult | null {
  if (answers.q1MovesMetric === null) return null

  if (answers.q1MovesMetric === 'no') {
    return {
      taskType: 'STRATEGIC',
      statusClassification: 'CORTADA',
      lifeAdminSubtype: null,
      lifeAdminDeadline: null,
      revisaoEm: null,
      status: 'archived',
    }
  }

  if (answers.q2Consequence30d === null) return null

  if (answers.q2Consequence30d === 'no') {
    return {
      taskType: 'STRATEGIC',
      statusClassification: 'ADIADA_30D',
      lifeAdminSubtype: null,
      lifeAdminDeadline: null,
      revisaoEm: addDaysToIsoDate(createdAt, 30),
      status: 'backlog',
    }
  }

  if (answers.q3Consequence7d === null) return null

  const statusClassification: StatusClassification =
    answers.q3Consequence7d === 'yes' ? 'SIGNAL_SEMANA' : 'SIGNAL_BACKLOG'

  return {
    taskType: 'STRATEGIC',
    statusClassification,
    lifeAdminSubtype: null,
    lifeAdminDeadline: null,
    revisaoEm: null,
    status: statusFromStrategicClassification(statusClassification),
  }
}

export function computeLifeAdminClassification(
  answers: LifeAdminAnswers
): ClassificationResult | null {
  if (answers.hasDeadline === null) return null

  if (answers.hasDeadline === 'yes') {
    if (!answers.deadline) return null
    return {
      taskType: 'LIFE_ADMIN',
      statusClassification: null,
      lifeAdminSubtype: 'COM_DEADLINE',
      lifeAdminDeadline: answers.deadline,
      revisaoEm: null,
      status: 'backlog',
    }
  }

  return {
    taskType: 'LIFE_ADMIN',
    statusClassification: null,
    lifeAdminSubtype: 'SEM_DEADLINE',
    lifeAdminDeadline: null,
    revisaoEm: null,
    status: 'backlog',
  }
}

export function computeClassificationFromDraft(
  draft: ClassificationDraft
): ClassificationResult | null {
  if (!draft.taskType) return null
  if (draft.taskType === 'STRATEGIC') {
    return computeStrategicClassification(draft.strategic, draft.createdAt)
  }
  return computeLifeAdminClassification(draft.lifeAdmin)
}

export function isClassificationComplete(draft: ClassificationDraft): boolean {
  return computeClassificationFromDraft(draft) !== null
}

export function emptyStrategicAnswers(): StrategicAnswers {
  return { q1MovesMetric: null, q2Consequence30d: null, q3Consequence7d: null }
}

export function emptyLifeAdminAnswers(): LifeAdminAnswers {
  return { hasDeadline: null, deadline: null }
}

export function emptyClassificationDraft(createdAt: string): ClassificationDraft {
  return {
    taskType: null,
    strategic: emptyStrategicAnswers(),
    lifeAdmin: emptyLifeAdminAnswers(),
    createdAt,
  }
}

export function classificationDraftFromTodo(todo: {
  taskType: TaskType | null
  statusClassification: StatusClassification | null
  lifeAdminSubtype: LifeAdminSubtype | null
  lifeAdminDeadline: string | null
  created_at: string
}): ClassificationDraft {
  const draft = emptyClassificationDraft(todo.created_at)
  draft.taskType = todo.taskType
  if (todo.taskType === 'STRATEGIC' && todo.statusClassification) {
    switch (todo.statusClassification) {
      case 'CORTADA':
        draft.strategic.q1MovesMetric = 'no'
        break
      case 'ADIADA_30D':
        draft.strategic.q1MovesMetric = 'yes'
        draft.strategic.q2Consequence30d = 'no'
        break
      case 'SIGNAL_BACKLOG':
        draft.strategic.q1MovesMetric = 'yes'
        draft.strategic.q2Consequence30d = 'yes'
        draft.strategic.q3Consequence7d = 'no'
        break
      case 'SIGNAL_SEMANA':
        draft.strategic.q1MovesMetric = 'yes'
        draft.strategic.q2Consequence30d = 'yes'
        draft.strategic.q3Consequence7d = 'yes'
        break
    }
  }
  if (todo.taskType === 'LIFE_ADMIN' && todo.lifeAdminSubtype) {
    if (todo.lifeAdminSubtype === 'COM_DEADLINE') {
      draft.lifeAdmin.hasDeadline = 'yes'
      draft.lifeAdmin.deadline = todo.lifeAdminDeadline
    } else {
      draft.lifeAdmin.hasDeadline = 'no'
    }
  }
  return draft
}

/** Cascade ao alterar respostas anteriores nas perguntas estratégicas. */
export function applyStrategicAnswerCascade(
  current: StrategicAnswers,
  question: 'q1' | 'q2' | 'q3',
  answer: YesNo
): StrategicAnswers {
  if (question === 'q1') {
    const next: StrategicAnswers = {
      q1MovesMetric: answer,
      q2Consequence30d: null,
      q3Consequence7d: null,
    }
    return next
  }
  if (question === 'q2') {
    return {
      ...current,
      q2Consequence30d: answer,
      q3Consequence7d: null,
    }
  }
  return { ...current, q3Consequence7d: answer }
}

export function applyTaskTypeChange(
  draft: ClassificationDraft,
  taskType: TaskType
): ClassificationDraft {
  return {
    ...draft,
    taskType,
    strategic: emptyStrategicAnswers(),
    lifeAdmin: emptyLifeAdminAnswers(),
  }
}

export function canMoveTodoToStatus(
  todo: TodoRoutingFields,
  targetStatus: TodoBoardStatus
): { ok: true } | { ok: false; reason: string } {
  if (todo.needsReclassification || !todo.taskType) {
    if (targetStatus === 'backlog') return { ok: true }
    return { ok: false, reason: 'Task pendente de reclassificação.' }
  }

  if (todo.taskType === 'LIFE_ADMIN') {
    if (targetStatus === 'archived') {
      return { ok: false, reason: 'Tasks de Manutenção não vão para o Arquivo.' }
    }
    if (targetStatus === 'life_admin') return { ok: true }
    if (
      targetStatus === 'backlog' ||
      targetStatus === 'current_week' ||
      targetStatus === 'in_progress'
    ) {
      return { ok: true }
    }
    return { ok: false, reason: 'Roteamento inválido para Manutenção.' }
  }

  if (todo.taskType === 'STRATEGIC') {
    if (targetStatus === 'life_admin') {
      return { ok: false, reason: 'Use backlog, semana atual ou em progresso.' }
    }
    if (todo.statusClassification === 'CORTADA') {
      if (targetStatus === 'archived') return { ok: true }
      return { ok: false, reason: 'Task cortada permanece no Arquivo.' }
    }
    if (targetStatus === 'archived') {
      return { ok: false, reason: 'Apenas tasks CORTADA vão para o Arquivo.' }
    }
    if (targetStatus === 'current_week') {
      if (todo.statusClassification !== 'SIGNAL_SEMANA') {
        return {
          ok: false,
          reason: 'Apenas SIGNAL · Semana Atual pode entrar na Semana Atual.',
        }
      }
      return { ok: true }
    }
    if (targetStatus === 'in_progress') {
      if (todo.statusClassification !== 'SIGNAL_SEMANA') {
        return {
          ok: false,
          reason: 'Em Progresso aceita apenas tasks estratégicas da Semana Atual.',
        }
      }
      return { ok: true }
    }
    if (targetStatus === 'backlog') {
      if (
        todo.statusClassification === 'SIGNAL_BACKLOG' ||
        todo.statusClassification === 'ADIADA_30D'
      ) {
        return { ok: true }
      }
      return { ok: false, reason: 'Backlog aceita SIGNAL_BACKLOG ou ADIADA_30D.' }
    }
  }

  return { ok: false, reason: 'Classificação incompleta.' }
}

export type KanbanColumn = 'in_progress' | 'current_week' | 'backlog'

/** Coluna Kanban onde a task deve aparecer — evita tasks invisíveis por estado inconsistente. */
export function getKanbanColumnForTodo(todo: TodoRoutingFields & {
  completed?: boolean
  status: TodoBoardStatus
  needsReclassification: boolean
}): KanbanColumn | null {
  if (todo.completed) return null
  if (todo.status === 'archived') return null

  const boardStatus =
    todo.status === 'life_admin' ? ('backlog' as TodoBoardStatus) : todo.status

  const incomplete = todo.needsReclassification || !todo.taskType

  if (incomplete) {
    if (boardStatus === 'in_progress') return 'in_progress'
    if (boardStatus === 'current_week') return 'current_week'
    return 'backlog'
  }

  if (todo.taskType === 'LIFE_ADMIN') {
    if (boardStatus === 'in_progress') return 'in_progress'
    if (boardStatus === 'current_week') return 'current_week'
    return 'backlog'
  }

  if (todo.taskType === 'STRATEGIC') {
    if (todo.statusClassification === 'CORTADA') return null
    if (boardStatus === 'in_progress') return 'in_progress'
    if (todo.statusClassification === 'SIGNAL_SEMANA') {
      if (boardStatus === 'current_week') return 'current_week'
      return 'backlog'
    }
    return 'backlog'
  }

  return 'backlog'
}

export function isRevisaoEmDue(revisaoEm: string | null | undefined): boolean {
  if (!revisaoEm) return false
  const today = new Date().toISOString().slice(0, 10)
  return revisaoEm <= today
}

export function backlogSortRank(todo: {
  needsReclassification: boolean
  statusClassification: StatusClassification | null
  revisaoEm: string | null
}): number {
  if (todo.needsReclassification) return 0
  if (todo.statusClassification === 'SIGNAL_BACKLOG') return 1
  if (todo.statusClassification === 'ADIADA_30D') return 2
  return 3
}

export function compareBacklogTodos<
  T extends {
    needsReclassification: boolean
    statusClassification: StatusClassification | null
    revisaoEm: string | null
    pos: number
  },
>(a: T, b: T): number {
  const rankA = backlogSortRank(a)
  const rankB = backlogSortRank(b)
  if (rankA !== rankB) return rankA - rankB
  if (rankA === 2 && a.revisaoEm && b.revisaoEm && a.revisaoEm !== b.revisaoEm) {
    return a.revisaoEm.localeCompare(b.revisaoEm)
  }
  return a.pos - b.pos
}

export function validateTodoClassificationPayload(todo: {
  taskType: TaskType | null
  statusClassification: StatusClassification | null
  lifeAdminSubtype: LifeAdminSubtype | null
  lifeAdminDeadline: string | null
  revisaoEm: string | null
}): { ok: true } | { ok: false; reason: string } {
  if (!todo.taskType) {
    return { ok: false, reason: 'task_type é obrigatório.' }
  }
  if (todo.taskType === 'STRATEGIC') {
    if (!todo.statusClassification) {
      return { ok: false, reason: 'status_classification é obrigatório para STRATEGIC.' }
    }
    if (todo.statusClassification === 'ADIADA_30D' && !todo.revisaoEm) {
      return { ok: false, reason: 'revisao_em é obrigatório para ADIADA_30D.' }
    }
    if (todo.lifeAdminSubtype || todo.lifeAdminDeadline) {
      return { ok: false, reason: 'Campos life_admin não permitidos em STRATEGIC.' }
    }
    return { ok: true }
  }
  if (!todo.lifeAdminSubtype) {
    return { ok: false, reason: 'life_admin_subtype é obrigatório para LIFE_ADMIN.' }
  }
  if (todo.statusClassification) {
    return { ok: false, reason: 'status_classification não permitido em LIFE_ADMIN.' }
  }
  if (todo.lifeAdminSubtype === 'COM_DEADLINE' && !todo.lifeAdminDeadline) {
    return { ok: false, reason: 'life_admin_deadline é obrigatório para COM_DEADLINE.' }
  }
  if (todo.lifeAdminSubtype === 'SEM_DEADLINE' && todo.lifeAdminDeadline) {
    return { ok: false, reason: 'life_admin_deadline não permitido para SEM_DEADLINE.' }
  }
  return { ok: true }
}

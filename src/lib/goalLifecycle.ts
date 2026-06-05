import type { Goal, GoalLifecycleStatus } from '@/lib/planning'

export function isGoalActive(goal: Goal): boolean {
  return !goal.lifecycleStatus || goal.lifecycleStatus === 'active'
}

export function getGoalOutcomeMeta(status: GoalLifecycleStatus): {
  label: string
  symbol: string
} {
  switch (status) {
    case 'done':
      return { label: 'Concluída', symbol: 'check' }
    case 'partial':
      return { label: 'Parcial', symbol: 'adjust' }
    case 'not_done':
      return { label: 'Não concluída', symbol: 'close' }
    default:
      return { label: 'Em andamento', symbol: 'pending' }
  }
}

export function formatGoalClosedAt(closedAt?: string | null): string {
  if (!closedAt) return '—'
  try {
    return new Date(closedAt).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return closedAt
  }
}

export type GoalCloseOutcome = Exclude<GoalLifecycleStatus, 'active'>

export const GOAL_CLOSE_OUTCOMES: {
  value: GoalCloseOutcome
  label: string
  description: string
  symbol: string
}[] = [
  {
    value: 'done',
    label: 'Concluída',
    description: 'Objetivo alcançado',
    symbol: 'check',
  },
  {
    value: 'partial',
    label: 'Parcial',
    description: 'Avançou, mas não fechou 100%',
    symbol: 'adjust',
  },
  {
    value: 'not_done',
    label: 'Não concluída',
    description: 'Não chegou ao objetivo',
    symbol: 'close',
  },
]

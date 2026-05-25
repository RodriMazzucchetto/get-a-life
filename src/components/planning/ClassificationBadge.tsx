'use client'

import type { Todo } from '@/lib/planning'
import {
  computeClassificationFromDraft,
  isRevisaoEmDue,
  type ClassificationDraft,
} from '@/lib/taskClassification'

export function getClassificationBadgeMeta(todo: Todo): {
  shortLabel: string
  longLabel: string
  badgeClass: string
  borderClass: string
  pulse?: boolean
} | null {
  if (todo.needsReclassification) {
    return {
      shortLabel: '!',
      longLabel: 'RECLASSIFICAR',
      badgeClass: 'bg-amber-100 text-amber-900 animate-pulse',
      borderClass: 'border-amber-400',
      pulse: true,
    }
  }

  if (todo.taskType === 'STRATEGIC' && todo.statusClassification) {
    switch (todo.statusClassification) {
      case 'CORTADA':
        return {
          shortLabel: 'Cut',
          longLabel: 'CORTADA · Arquivar',
          badgeClass: 'bg-red-100 text-red-800',
          borderClass: 'border-red-300',
        }
      case 'ADIADA_30D': {
        const due = isRevisaoEmDue(todo.revisaoEm)
        return {
          shortLabel: due ? '!' : '30D',
          longLabel: due
            ? 'Revisar agora'
            : `ADIADA 30D · Revisar em ${todo.revisaoEm ?? '—'}`,
          badgeClass: due
            ? 'bg-orange-100 text-orange-900 animate-pulse'
            : 'bg-gray-100 text-gray-700',
          borderClass: due ? 'border-orange-400' : 'border-gray-300',
          pulse: due,
        }
      }
      case 'SIGNAL_SEMANA':
        return {
          shortLabel: 'Sig',
          longLabel: 'SIGNAL · Semana Atual',
          badgeClass: 'bg-blue-100 text-blue-800',
          borderClass: 'border-blue-300',
        }
      case 'SIGNAL_BACKLOG':
        return {
          shortLabel: 'Bk',
          longLabel: 'SIGNAL · Backlog',
          badgeClass: 'bg-yellow-100 text-yellow-900',
          borderClass: 'border-yellow-400',
        }
    }
  }

  if (todo.taskType === 'LIFE_ADMIN' && todo.lifeAdminSubtype) {
    if (todo.lifeAdminSubtype === 'COM_DEADLINE') {
      const dl = todo.lifeAdminDeadline
      const daysLeft = dl
        ? Math.ceil(
            (new Date(dl).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
          )
        : null
      const urgent = daysLeft !== null && daysLeft < 7
      return {
        shortLabel: 'LA',
        longLabel: `LIFE-ADMIN · Com deadline ${dl ?? ''}`.trim(),
        badgeClass: urgent
          ? 'bg-orange-100 text-orange-900'
          : 'bg-green-100 text-green-800',
        borderClass: urgent ? 'border-orange-400' : 'border-green-400',
      }
    }
    return {
      shortLabel: 'LA',
      longLabel: 'LIFE-ADMIN · Sem deadline · Revisão mensal',
      badgeClass: 'bg-gray-200 text-gray-800',
      borderClass: 'border-gray-400',
    }
  }

  return null
}

export function getDraftBadgeMeta(
  draft: ClassificationDraft
): ReturnType<typeof getClassificationBadgeMeta> {
  const result = computeClassificationFromDraft(draft)
  if (!result) return null

  const pseudoTodo: Todo = {
    id: '',
    title: '',
    priority: 'medium',
    completed: false,
    isHighPriority: false,
    onHold: false,
    status: result.status,
    pos: 0,
    projectIds: [],
    created_at: draft.createdAt,
    updated_at: draft.createdAt,
    taskType: result.taskType,
    statusClassification: result.statusClassification,
    lifeAdminSubtype: result.lifeAdminSubtype,
    lifeAdminDeadline: result.lifeAdminDeadline,
    revisaoEm: result.revisaoEm,
    needsReclassification: false,
  }
  return getClassificationBadgeMeta(pseudoTodo)
}

export function ClassificationBadge({
  todo,
  className = '',
}: {
  todo: Todo
  className?: string
}) {
  const meta = getClassificationBadgeMeta(todo)
  if (!meta) return null
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass} ${meta.borderClass} ${className}`}
      title={meta.longLabel}
    >
      {meta.shortLabel}
    </span>
  )
}

export function DraftClassificationBadge({
  draft,
  className = '',
}: {
  draft: ClassificationDraft
  className?: string
}) {
  const meta = getDraftBadgeMeta(draft)
  if (!meta) return null
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${meta.badgeClass} ${meta.borderClass} ${className}`}
    >
      {meta.longLabel}
    </span>
  )
}

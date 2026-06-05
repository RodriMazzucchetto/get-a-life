import React, { useEffect, useState } from 'react'
import ModalOverlay from './ModalOverlay'
import { ModalPanel } from './ModalPanel'
import type { Goal } from '@/lib/planning'
import {
  GOAL_CLOSE_OUTCOMES,
  type GoalCloseOutcome,
} from '@/lib/goalLifecycle'

interface GoalCloseModalProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onConfirm: (
    goalId: string,
    outcome: GoalCloseOutcome,
    closureNote: string
  ) => Promise<void>
}

export function GoalCloseModal({
  isOpen,
  goal,
  onClose,
  onConfirm,
}: GoalCloseModalProps) {
  const [outcome, setOutcome] = useState<GoalCloseOutcome | null>(null)
  const [closureNote, setClosureNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setOutcome(null)
      setClosureNote('')
    }
  }, [isOpen, goal?.id])

  const handleConfirm = async () => {
    if (!goal || !outcome) return
    setIsSubmitting(true)
    try {
      await onConfirm(goal.id, outcome, closureNote.trim())
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!goal) return null

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel maxWidthClass="max-w-lg">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Encerrar meta</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              A meta sai da lista ativa e vai para o histórico.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="mb-4 rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface">
          <span className="font-semibold">{goal.title}</span>
          <span className="text-on-surface-variant"> · {goal.progress}% no encerramento</span>
        </p>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Como ficou?
        </p>
        <div className="space-y-2">
          {GOAL_CLOSE_OUTCOMES.map((option) => {
            const selected = outcome === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setOutcome(option.value)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  selected
                    ? 'border-on-surface/30 bg-surface-container-high'
                    : 'border-outline-variant/25 bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  {option.symbol}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-on-surface">{option.label}</span>
                  <span className="block text-xs text-on-surface-variant">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-semibold text-on-surface">Nota (opcional)</span>
          <textarea
            value={closureNote}
            onChange={(e) => setClosureNote(e.target.value)}
            rows={2}
            placeholder="Por que encerrou, o que ficou pendente..."
            className="w-full rounded-lg border border-outline-variant/35 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-outline-variant/35 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!outcome || isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Encerrando...' : 'Confirmar encerramento'}
          </button>
        </div>
      </ModalPanel>
    </ModalOverlay>
  )
}

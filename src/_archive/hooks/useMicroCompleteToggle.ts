import { useState, useEffect, useRef, useCallback } from 'react'

/** Pequeno atraso antes de persistir “concluído”, para a animação ser visível. */
const COMPLETE_DELAY_MS = 340

/**
 * Microinteração ao marcar como feito: estado visual imediato + animação na linha,
 * depois chama o handler (API). Desmarcar é imediato.
 */
export function useMicroCompleteToggle(opts: {
  completed: boolean
  onConfirm: () => void
}) {
  const { completed, onConfirm } = opts
  const [isCompleting, setIsCompleting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!completed) setIsCompleting(false)
  }, [completed])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const toggle = useCallback(() => {
    if (completed) {
      onConfirm()
      return
    }
    setIsCompleting(true)
    timerRef.current = setTimeout(() => {
      void Promise.resolve(onConfirm()).finally(() => {
        setIsCompleting(false)
      })
      timerRef.current = null
    }, COMPLETE_DELAY_MS)
  }, [completed, onConfirm])

  return {
    isCompleting,
    displayChecked: completed || isCompleting,
    toggle,
    /** Aplicar no container da linha/card */
    rowMotionClass: isCompleting ? 'motion-todo-complete' : '',
  }
}

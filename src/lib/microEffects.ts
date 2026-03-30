import confetti from 'canvas-confetti'

function originFromRect(rect: DOMRect): { x: number; y: number } {
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  }
}

const reduced = { disableForReducedMotion: true as const }

/** Concluir tarefa / lembrete — confete com cores do DS (primary + tertiary). */
export function burstTaskComplete(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  const palette = ['#00288e', '#00563a', '#3fd298', '#a8b8ff', '#dde1ff', '#ffffff']
  void confetti({
    origin,
    particleCount: 52,
    spread: 68,
    startVelocity: 30,
    gravity: 0.92,
    ticks: 150,
    colors: palette,
    scalar: 0.88,
    ...reduced,
  })
  void confetti({
    origin,
    particleCount: 24,
    spread: 105,
    startVelocity: 20,
    gravity: 1.05,
    ticks: 115,
    colors: ['#1e40af', '#6ffbbe', '#3fd298'],
    scalar: 0.52,
    ...reduced,
  })
}

/** Apagar — partículas discretas, tons neutros + toque de erro. */
export function burstTaskDelete(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  void confetti({
    origin,
    particleCount: 22,
    spread: 38,
    startVelocity: 22,
    gravity: 1.2,
    ticks: 85,
    colors: ['#757684', '#c4c5d5', '#e1e2e4', '#ba1a1a'],
    scalar: 0.58,
    ...reduced,
  })
}

/** Prioridade (estrela) — faíscas quentes. */
export function burstPriorityStar(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  void confetti({
    origin,
    particleCount: 16,
    spread: 58,
    startVelocity: 26,
    gravity: 1.15,
    ticks: 75,
    colors: ['#f59e0b', '#ef4444', '#fde68a', '#fcd34d'],
    scalar: 0.48,
    ...reduced,
  })
}

/** Colocar em espera — âmbar suave. */
export function burstOnHold(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  void confetti({
    origin,
    particleCount: 18,
    spread: 52,
    startVelocity: 21,
    gravity: 0.95,
    ticks: 95,
    colors: ['#fbbf24', '#fcd34d', '#f59e0b', '#fde68a'],
    scalar: 0.52,
    ...reduced,
  })
}

/** Sair da espera — micro “respirar” verde (tertiary). */
export function burstResumeFromHold(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  void confetti({
    origin,
    particleCount: 10,
    spread: 48,
    startVelocity: 18,
    gravity: 1,
    ticks: 70,
    colors: ['#3fd298', '#6ffbbe', '#00563a'],
    scalar: 0.4,
    ...reduced,
  })
}

/** Mover para “Foco” / semana — primário, pouco. */
export function burstProgressMove(rect: DOMRect): void {
  if (typeof window === 'undefined') return
  const origin = originFromRect(rect)
  void confetti({
    origin,
    particleCount: 12,
    spread: 44,
    startVelocity: 19,
    gravity: 1.05,
    ticks: 80,
    colors: ['#00288e', '#3755c3', '#a8b8ff', '#dde1ff'],
    scalar: 0.42,
    ...reduced,
  })
}

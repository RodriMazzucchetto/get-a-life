import type { Problem } from '@/lib/planning'

export function sortProblemsForDisplay(a: Problem, b: Problem): number {
  const holdA = Boolean(a.onHold)
  const holdB = Boolean(b.onHold)
  if (holdA !== holdB) return holdA ? 1 : -1
  if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
  return a.pos - b.pos
}

function computeNextPosForKindProblems(
  problems: { pos: number; onHold: boolean }[]
): number {
  if (problems.length === 0) return 1000
  const active = problems.filter((p) => !p.onHold)
  const paused = problems.filter((p) => Boolean(p.onHold))
  if (paused.length === 0) {
    return Math.max(...active.map((p) => p.pos), 0) + 1000
  }
  if (active.length === 0) {
    return Math.min(...paused.map((p) => p.pos)) - 1000
  }
  const maxActive = Math.max(...active.map((p) => p.pos))
  const minPaused = Math.min(...paused.map((p) => p.pos))
  const candidate = maxActive + 1000
  if (candidate < minPaused) return candidate
  return maxActive + (minPaused - maxActive) / 2
}

export function appendPosForOnHoldAtBottomForProblems(
  allProblems: Problem[],
  kind: Problem['kind'],
  excludeProblemId?: string
): number {
  const col = allProblems.filter(
    (p) => p.kind === kind && !p.resolved && p.id !== excludeProblemId
  )
  if (col.length === 0) return 1000
  return Math.max(...col.map((p) => p.pos)) + 1000
}

/** Posição ao fim da lista unificada (todos os tipos). */
export function appendPosOnHoldAtBottomAllProblems(
  allProblems: Problem[],
  excludeProblemId?: string
): number {
  const col = allProblems.filter((p) => !p.resolved && p.id !== excludeProblemId)
  if (col.length === 0) return 1000
  return Math.max(...col.map((p) => p.pos)) + 1000
}

export function appendPosForKindProblems(
  allProblems: Problem[],
  kind: Problem['kind'],
  excludeProblemId?: string
): number {
  const col = allProblems.filter(
    (p) => p.kind === kind && !p.resolved && p.id !== excludeProblemId
  )
  return computeNextPosForKindProblems(
    col.map((p) => ({ pos: p.pos, onHold: p.onHold }))
  )
}

/** Próxima posição na lista unificada (todos os tipos). */
export function appendPosForAllProblems(
  allProblems: Problem[],
  excludeProblemId?: string
): number {
  const col = allProblems.filter((p) => !p.resolved && p.id !== excludeProblemId)
  return computeNextPosForKindProblems(
    col.map((p) => ({ pos: p.pos, onHold: p.onHold }))
  )
}

/** Próxima posição ao fim da lista do mesmo projeto (inclui project_id null). */
export function appendPosForProject(
  problems: Problem[],
  projectId: string | null,
  excludeId?: string
): number {
  const col = problems.filter(
    (p) => p.projectId === projectId && p.id !== excludeId
  )
  if (col.length === 0) return 1000
  return Math.max(...col.map((p) => p.pos)) + 1000
}

export function computePosAtNewIndexForProblems(
  reordered: Problem[],
  activeId: string
): number | null {
  const moved = reordered.find((p) => p.id === activeId)
  if (!moved) return null
  const newPosition = reordered.indexOf(moved)
  if (newPosition === 0) {
    const next = reordered[1]
    return next ? next.pos - 1000 : 1000
  }
  if (newPosition === reordered.length - 1) {
    const prev = reordered[newPosition - 1]
    return prev ? prev.pos + 1000 : (newPosition + 1) * 1000
  }
  const prev = reordered[newPosition - 1]
  const next = reordered[newPosition + 1]
  let newPos = Math.round((prev.pos + next.pos) / 2)
  if (newPos === prev.pos || newPos === next.pos) {
    newPos = prev.pos + Math.round((next.pos - prev.pos) / 2)
  }
  return newPos
}

/** Código curto para badge (ex.: ZTX, OWN) — sem dois pontos */
export function projectShortCode(projectName: string): string {
  const w = projectName.trim().split(/\s+/).filter(Boolean)
  if (w.length >= 2) {
    const a = w[0][0] ?? ''
    const b = w[1][0] ?? ''
    return `${(a + b).toUpperCase().slice(0, 3)}`
  }
  return projectName.slice(0, 3).toUpperCase()
}

/** Prefixo estilo "ZTX:" a partir do nome do projeto */
export function projectPrefixLabel(projectName: string): string {
  return `${projectShortCode(projectName)}:`
}

export function formatRelativeDaysPt(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffDays = Math.round((then - now) / 86400000)
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round((then - now) / 3600000)
    if (Math.abs(diffHours) < 1) return 'agora'
    return rtf.format(diffHours, 'hour')
  }
  return rtf.format(diffDays, 'day')
}

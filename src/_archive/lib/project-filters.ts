/** Quick Win (QW) — tag de tasks, não é empresa no OS. */
export function isQuickWinProjectName(name: string): boolean {
  const normalized = name.trim().toLowerCase()
  return (
    normalized === 'qw' ||
    normalized.includes('quick win') ||
    normalized.includes('quickwin')
  )
}

export function isQuickWinProject(project: { name: string }): boolean {
  return isQuickWinProjectName(project.name)
}

export function filterOsCompanies<T extends { name: string }>(projects: T[]): T[] {
  return projects.filter((project) => !isQuickWinProject(project))
}

export function findQuickWinProject<T extends { id: string; name: string }>(
  projects: T[]
): T | null {
  return projects.find(isQuickWinProject) ?? null
}

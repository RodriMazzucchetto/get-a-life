import React, { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Goal, Project } from '@/lib/planning'
import { GoalManagementModal } from '@/components/GoalManagementModal'
import { GoalCloseModal } from '@/components/GoalCloseModal'
import {
  formatGoalClosedAt,
  getGoalOutcomeMeta,
  isGoalActive,
  type GoalCloseOutcome,
} from '@/lib/goalLifecycle'

type GoalGroup = {
  sectionKey: string
  project: Project | null
  goals: Goal[]
}

interface GoalDisplayProps {
  goals: Goal[]
  projects: Project[]
  userId?: string
  onCreateGoal: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<Goal | null>
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal | null>
  onDeleteGoal: (goalId: string) => Promise<boolean>
  onReorderGoals: (orderedGoalIds: string[]) => void
  onUpdateProjectAnnualObjective: (
    projectId: string,
    annualObjective: string
  ) => Promise<void>
}

const ORPHAN_SECTION_KEY = 'sem-projeto'

type GoalsViewMode = 'active' | 'history'

function sectionDndId(sectionKey: string) {
  return `section:${sectionKey}`
}

function parseSectionDndId(id: string) {
  return id.startsWith('section:') ? id.slice('section:'.length) : null
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(100, 116, 139, ${alpha})`
  }
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const r = parseInt(expanded.slice(0, 2), 16)
  const g = parseInt(expanded.slice(2, 4), 16)
  const b = parseInt(expanded.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(100, 116, 139, ${alpha})`
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getProgressColor(progress: number) {
  if (progress <= 25) return 'bg-red-500'
  if (progress <= 50) return 'bg-orange-500'
  if (progress <= 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getProgressTextColor(progress: number) {
  if (progress <= 25) return 'text-red-600'
  if (progress <= 50) return 'text-orange-600'
  if (progress <= 75) return 'text-yellow-600'
  return 'text-green-600'
}

function rebuildOrder(
  allGoalIds: string[],
  projectGoalIds: string[],
  reorderedProjectIds: string[]
): string[] {
  const projectSet = new Set(projectGoalIds)
  let projectIndex = 0
  return allGoalIds.map((id) => {
    if (!projectSet.has(id)) return id
    const next = reorderedProjectIds[projectIndex]
    projectIndex += 1
    return next
  })
}

function buildGoalGroups(
  goals: Goal[],
  projects: Project[],
  projectById: Record<string, Project>
): GoalGroup[] {
  const byProject = new Map<string, Goal[]>()
  const orphans: Goal[] = []

  for (const goal of goals) {
    const project = projectById[goal.projectId]
    if (!project) {
      orphans.push(goal)
      continue
    }
    const list = byProject.get(project.id) ?? []
    list.push(goal)
    byProject.set(project.id, list)
  }

  const groups: GoalGroup[] = []

  for (const project of projects) {
    const projectGoals = byProject.get(project.id)
    if (projectGoals?.length) {
      groups.push({ sectionKey: project.id, project, goals: projectGoals })
    }
  }

  if (orphans.length > 0) {
    groups.push({ sectionKey: ORPHAN_SECTION_KEY, project: null, goals: orphans })
  }

  return groups
}

export function GoalDisplay({
  goals,
  projects,
  userId,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onReorderGoals,
  onUpdateProjectAnnualObjective,
}: GoalDisplayProps) {
  const [viewMode, setViewMode] = useState<GoalsViewMode>('active')
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [closingGoal, setClosingGoal] = useState<Goal | null>(null)
  const [createProjectId, setCreateProjectId] = useState<string | undefined>(undefined)
  const [progressOverrides, setProgressOverrides] = useState<Record<string, number>>({})
  const [orderedSectionKeys, setOrderedSectionKeys] = useState<string[]>([])

  const activeGoals = useMemo(() => goals.filter(isGoalActive), [goals])
  const historyGoals = useMemo(() => goals.filter((goal) => !isGoalActive(goal)), [goals])
  const displayedGoals = viewMode === 'active' ? activeGoals : historyGoals

  const projectBlockStorageKey = useMemo(
    () =>
      userId
        ? `taskarchitect-goal-project-order-${userId}`
        : 'taskarchitect-goal-project-order-anon',
    [userId]
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  )

  const rawGoalGroups = useMemo(() => {
    const groups = buildGoalGroups(displayedGoals, projects, projectById)
    if (viewMode !== 'history') return groups
    return groups.map((group) => ({
      ...group,
      goals: [...group.goals].sort((a, b) =>
        (b.closedAt ?? '').localeCompare(a.closedAt ?? '')
      ),
    }))
  }, [displayedGoals, projects, projectById, viewMode])

  const availableSectionKeys = useMemo(
    () => rawGoalGroups.map((group) => group.sectionKey),
    [rawGoalGroups]
  )

  useEffect(() => {
    setOrderedSectionKeys((prev) => {
      let base = prev
      if (base.length === 0 && typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(projectBlockStorageKey)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed)) {
              base = parsed.filter((key): key is string => typeof key === 'string')
            }
          }
        } catch (error) {
          console.error('Erro ao carregar ordem de blocos de projeto:', error)
        }
      }
      const valid = base.filter((key) => availableSectionKeys.includes(key))
      const missing = availableSectionKeys.filter((key) => !valid.includes(key))
      return [...valid, ...missing]
    })
  }, [availableSectionKeys, projectBlockStorageKey])

  const goalGroups = useMemo(() => {
    const groupsByKey = new Map(rawGoalGroups.map((group) => [group.sectionKey, group]))
    const ordered = orderedSectionKeys
      .map((key) => groupsByKey.get(key))
      .filter((group): group is GoalGroup => Boolean(group))
    const leftovers = rawGoalGroups.filter((group) => !orderedSectionKeys.includes(group.sectionKey))
    return [...ordered, ...leftovers]
  }, [rawGoalGroups, orderedSectionKeys])

  const sectionDndIds = useMemo(
    () => goalGroups.map((group) => sectionDndId(group.sectionKey)),
    [goalGroups]
  )

  const allGoalIds = useMemo(() => activeGoals.map((goal) => goal.id), [activeGoals])

  const openCreateModal = (projectId?: string) => {
    setEditingGoal(null)
    setCreateProjectId(projectId)
    setShowGoalModal(true)
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setCreateProjectId(undefined)
    setShowGoalModal(true)
  }

  const closeModal = () => {
    setShowGoalModal(false)
    setEditingGoal(null)
    setCreateProjectId(undefined)
  }

  const handleRequestCloseGoal = (goal: Goal) => {
    setShowGoalModal(false)
    setEditingGoal(null)
    setClosingGoal(goal)
    setShowCloseModal(true)
  }

  const handleConfirmCloseGoal = async (
    goalId: string,
    outcome: GoalCloseOutcome,
    closureNote: string
  ) => {
    await onUpdateGoal(goalId, {
      lifecycleStatus: outcome,
      closedAt: new Date().toISOString(),
      closureNote: closureNote || null,
    })
    setShowCloseModal(false)
    setClosingGoal(null)
  }

  const handleReopenGoal = async (goalId: string) => {
    await onUpdateGoal(goalId, {
      lifecycleStatus: 'active',
      closedAt: null,
      closureNote: null,
    })
  }

  const persistSectionOrder = (nextKeys: string[]) => {
    setOrderedSectionKeys(nextKeys)
    if (typeof window !== 'undefined') {
      localStorage.setItem(projectBlockStorageKey, JSON.stringify(nextKeys))
    }
  }

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeKey = parseSectionDndId(String(active.id))
    const overKey = parseSectionDndId(String(over.id))
    if (!activeKey || !overKey) return

    const keys = goalGroups.map((group) => group.sectionKey)
    const oldIndex = keys.indexOf(activeKey)
    const newIndex = keys.indexOf(overKey)
    if (oldIndex < 0 || newIndex < 0) return

    persistSectionOrder(arrayMove(keys, oldIndex, newIndex))
  }

  const handleChangeProgress = async (goalId: string, progress: number) => {
    setProgressOverrides((prev) => ({ ...prev, [goalId]: progress }))
    await onUpdateGoal(goalId, { progress })
    setProgressOverrides((prev) => {
      const next = { ...prev }
      delete next[goalId]
      return next
    })
  }

  const handleGoalDragEnd =
    (projectGoalIds: string[]) =>
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      if (parseSectionDndId(String(active.id)) || parseSectionDndId(String(over.id))) return

      const ids = projectGoalIds
      const oldIndex = ids.indexOf(String(active.id))
      const newIndex = ids.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return

      const reordered = arrayMove(ids, oldIndex, newIndex)
      onReorderGoals(rebuildOrder(allGoalIds, projectGoalIds, reordered))
    }

  const getDisplayProgress = (goal: Goal) => progressOverrides[goal.id] ?? goal.progress

  const isHistoryView = viewMode === 'history'
  const hasAnyGoals = goals.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-outline-variant/25 bg-surface-container-low p-1">
          <button
            type="button"
            onClick={() => setViewMode('active')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              viewMode === 'active'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ativas ({activeGoals.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              viewMode === 'history'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Histórico ({historyGoals.length})
          </button>
        </div>

        {viewMode === 'active' ? (
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nova meta
          </button>
        ) : null}
      </div>

      {!hasAnyGoals ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-center">
          <p className="font-headline text-lg font-bold text-on-surface">Nenhuma meta criada ainda</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Clique em <strong>Nova meta</strong> para começar.
          </p>
        </div>
      ) : displayedGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-center">
          <p className="font-headline text-lg font-bold text-on-surface">
            {isHistoryView ? 'Nenhuma meta no histórico' : 'Nenhuma meta ativa'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isHistoryView
              ? 'Metas encerradas aparecem aqui para consulta.'
              : 'Encerre metas concluídas ou use o Histórico para rever o passado.'}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext items={sectionDndIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-5">
              {goalGroups.map((group) => {
                const project = group.project
                const projectGoalIds = group.goals.map((goal) => goal.id)
                const sectionStyle =
                  !isHistoryView && project
                    ? {
                        backgroundColor: hexToRgba(project.color, 0.1),
                        borderColor: hexToRgba(project.color, 0.22),
                      }
                    : undefined

                return (
                  <SortableProjectSection
                    key={group.sectionKey}
                    sectionDndId={sectionDndId(group.sectionKey)}
                    sectionStyle={sectionStyle}
                    project={project}
                    goalCount={group.goals.length}
                    sortable={!isHistoryView}
                    onAddGoal={
                      !isHistoryView && project ? () => openCreateModal(project.id) : undefined
                    }
                    onUpdateAnnualObjective={
                      !isHistoryView && project
                        ? (text) => onUpdateProjectAnnualObjective(project.id, text)
                        : undefined
                    }
                  >
                    {isHistoryView ? (
                      <div className="space-y-2">
                        {group.goals.map((goal) => (
                          <HistoryGoalRow
                            key={goal.id}
                            goal={goal}
                            onView={() => openEditModal(goal)}
                          />
                        ))}
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleGoalDragEnd(projectGoalIds)}
                      >
                        <SortableContext items={projectGoalIds} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {group.goals.map((goal) => (
                              <SortableGoalRow
                                key={goal.id}
                                goal={goal}
                                progress={getDisplayProgress(goal)}
                                onEdit={() => openEditModal(goal)}
                                onChangeProgress={handleChangeProgress}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </SortableProjectSection>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <GoalManagementModal
        isOpen={showGoalModal}
        onClose={closeModal}
        goal={editingGoal}
        defaultProjectId={createProjectId}
        readOnly={isHistoryView}
        projects={projects}
        onCreateGoal={onCreateGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
        onRequestCloseGoal={handleRequestCloseGoal}
        onReopenGoal={handleReopenGoal}
      />

      <GoalCloseModal
        isOpen={showCloseModal}
        goal={closingGoal}
        onClose={() => {
          setShowCloseModal(false)
          setClosingGoal(null)
        }}
        onConfirm={handleConfirmCloseGoal}
      />
    </div>
  )
}

function SortableProjectSection({
  sectionDndId,
  sectionStyle,
  project,
  goalCount,
  sortable = true,
  onAddGoal,
  onUpdateAnnualObjective,
  children,
}: {
  sectionDndId: string
  sectionStyle?: React.CSSProperties
  project: Project | null
  goalCount: number
  sortable?: boolean
  onAddGoal?: () => void
  onUpdateAnnualObjective?: (text: string) => Promise<void>
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionDndId,
    disabled: !sortable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <section
      ref={setNodeRef}
      style={{ ...style, ...sectionStyle }}
      className="group/section rounded-2xl border border-outline-variant/15 p-4 ring-1 ring-outline-variant/10"
    >
      <header className="mb-3 flex items-center gap-2">
        {sortable ? (
          <button
            type="button"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-on-surface-variant opacity-0 transition-opacity hover:bg-surface-container-high group-hover/section:opacity-100 focus:opacity-100"
            aria-label={`Reordenar bloco ${project?.name ?? 'Sem projeto'}`}
            {...attributes}
            {...listeners}
          >
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          </button>
        ) : (
          <span className="h-7 w-7 shrink-0" aria-hidden />
        )}

        {project ? (
          <span
            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/80"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
        ) : (
          <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant">
            folder_off
          </span>
        )}

        <h2 className="min-w-0 flex-1 truncate font-headline text-base font-bold text-on-surface">
          {project?.name ?? 'Sem projeto'}
        </h2>

        <span className="shrink-0 text-xs font-medium text-on-surface-variant">
          {goalCount} {goalCount === 1 ? 'meta' : 'metas'}
        </span>

        {onAddGoal ? (
          <button
            type="button"
            onClick={onAddGoal}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-primary transition-colors hover:bg-primary/10"
            title={`Nova meta em ${project?.name}`}
            aria-label={`Nova meta em ${project?.name}`}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        ) : null}
      </header>

      {project && onUpdateAnnualObjective ? (
        <ProjectAnnualObjective project={project} onSave={onUpdateAnnualObjective} />
      ) : null}

      {children}
    </section>
  )
}

function ProjectAnnualObjective({
  project,
  onSave,
}: {
  project: Project
  onSave: (text: string) => Promise<void>
}) {
  const currentYear = new Date().getFullYear()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.annualObjective ?? '')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const storedYear = project.annualObjectiveYear ?? currentYear
  const objectiveText = project.annualObjective?.trim() ?? ''
  const showStoredYear = storedYear !== currentYear && objectiveText.length > 0
  const label = showStoredYear ? `Objetivo ${storedYear}` : `Objetivo ${currentYear}`
  const isLong = objectiveText.length > 120

  const startEditing = () => {
    setDraft(project.annualObjective ?? '')
    setExpanded(false)
    setEditing(true)
  }

  const cancelEditing = () => {
    setDraft(project.annualObjective ?? '')
    setEditing(false)
  }

  const save = async () => {
    const trimmed = draft.trim()
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="mb-3 border-b border-outline-variant/15 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          placeholder="O que queremos alcançar neste projeto este ano?"
          className="mt-1.5 w-full resize-y rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:opacity-95 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="rounded-lg border border-outline-variant/35 px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-3 border-b border-outline-variant/15 pb-3">
      <button
        type="button"
        onClick={startEditing}
        className="w-full rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-surface-container-high/50"
        title={objectiveText || 'Definir objetivo do ano'}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        {objectiveText ? (
          <p
            className={`mt-1 text-sm leading-relaxed text-on-surface ${
              expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
            }`}
          >
            {objectiveText}
          </p>
        ) : (
          <p className="mt-1 text-sm italic text-on-surface-variant">
            Definir objetivo do ano
          </p>
        )}
      </button>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 px-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      ) : null}
    </div>
  )
}

function HistoryGoalRow({
  goal,
  onView,
}: {
  goal: Goal
  onView: () => void
}) {
  const outcome = getGoalOutcomeMeta(goal.lifecycleStatus)

  return (
    <button
      type="button"
      onClick={onView}
      className="flex w-full items-center gap-3 rounded-xl bg-surface-container-lowest px-3 py-2.5 text-left ring-1 ring-outline-variant/10 hover:bg-surface-container-high/40"
      title="Ver detalhes"
    >
      <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant">
        {outcome.symbol}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-on-surface">{goal.title}</span>
      <span className="shrink-0 text-xs font-medium text-on-surface-variant">{outcome.label}</span>
      <span className="shrink-0 text-xs text-on-surface-variant">
        {formatGoalClosedAt(goal.closedAt)}
      </span>
      <span className="w-9 shrink-0 text-right text-xs font-bold text-on-surface-variant">
        {goal.progress}%
      </span>
    </button>
  )
}

function SortableGoalRow({
  goal,
  progress,
  onEdit,
  onChangeProgress,
}: {
  goal: Goal
  progress: number
  onEdit: () => void
  onChangeProgress: (goalId: string, progress: number) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-xl bg-surface-container-lowest px-3 py-2.5 ring-1 ring-outline-variant/10"
    >
      <button
        type="button"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-on-surface-variant opacity-0 transition-opacity hover:bg-surface-container-high group-hover:opacity-100 focus:opacity-100"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Reordenar meta ${goal.title}`}
        {...attributes}
        {...listeners}
      >
        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-90"
        title="Editar meta"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-on-surface">{goal.title}</span>
      </button>

      <div
        className="flex w-36 shrink-0 items-center gap-2 sm:w-44"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative h-3 min-w-0 flex-1">
          <div className="absolute inset-0 top-[3px] h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className={`${getProgressColor(progress)} h-full transition-[width]`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={(e) => void onChangeProgress(goal.id, Number(e.target.value))}
            className="absolute inset-0 h-3 w-full cursor-ew-resize appearance-none bg-transparent opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-0 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/40 [&::-webkit-slider-thumb]:bg-surface-container-lowest [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/40 [&::-moz-range-thumb]:bg-surface-container-lowest"
            aria-label={`Progresso da meta ${goal.title}`}
          />
        </div>
        <span className={`w-9 shrink-0 text-right text-xs font-bold ${getProgressTextColor(progress)}`}>
          {progress}%
        </span>
      </div>
    </div>
  )
}

import React, { useMemo, useState } from 'react'
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

interface GoalDisplayProps {
  goals: Goal[]
  projects: Project[]
  onCreateGoal: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<Goal | null>
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal | null>
  onDeleteGoal: (goalId: string) => Promise<boolean>
  onReorderGoals: (orderedGoalIds: string[]) => void
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

export function GoalDisplay({
  goals,
  projects,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onReorderGoals,
}: GoalDisplayProps) {
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [progressOverrides, setProgressOverrides] = useState<Record<string, number>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  )

  const goalGroups = useMemo(() => {
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

    const groups: { project: Project | null; goals: Goal[] }[] = []

    for (const project of projects) {
      const projectGoals = byProject.get(project.id)
      if (projectGoals?.length) {
        groups.push({ project, goals: projectGoals })
      }
    }

    if (orphans.length > 0) {
      groups.push({ project: null, goals: orphans })
    }

    return groups
  }, [goals, projects, projectById])

  const allGoalIds = useMemo(() => goals.map((goal) => goal.id), [goals])

  const openCreateModal = () => {
    setEditingGoal(null)
    setShowGoalModal(true)
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowGoalModal(true)
  }

  const closeModal = () => {
    setShowGoalModal(false)
    setEditingGoal(null)
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

  const handleProjectDragEnd =
    (projectGoalIds: string[]) =>
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const ids = projectGoalIds
      const oldIndex = ids.indexOf(String(active.id))
      const newIndex = ids.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return

      const reordered = arrayMove(ids, oldIndex, newIndex)
      onReorderGoals(rebuildOrder(allGoalIds, projectGoalIds, reordered))
    }

  const getDisplayProgress = (goal: Goal) => progressOverrides[goal.id] ?? goal.progress

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-center">
          <p className="font-headline text-lg font-bold text-on-surface">Nenhuma meta criada ainda</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Clique em <strong>Nova meta</strong> para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {goalGroups.map((group) => {
            const project = group.project
            const sectionKey = project?.id ?? 'sem-projeto'
            const projectGoalIds = group.goals.map((goal) => goal.id)
            const sectionStyle = project
              ? {
                  backgroundColor: hexToRgba(project.color, 0.1),
                  borderColor: hexToRgba(project.color, 0.22),
                }
              : undefined

            return (
              <section
                key={sectionKey}
                className="rounded-2xl border border-outline-variant/15 p-4 ring-1 ring-outline-variant/10"
                style={sectionStyle}
              >
                <header className="mb-3 flex items-center gap-2.5">
                  {project ? (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/80"
                      style={{ backgroundColor: project.color }}
                      aria-hidden
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      folder_off
                    </span>
                  )}
                  <h2 className="min-w-0 flex-1 truncate font-headline text-base font-bold text-on-surface">
                    {project?.name ?? 'Sem projeto'}
                  </h2>
                  <span className="shrink-0 text-xs font-medium text-on-surface-variant">
                    {group.goals.length} {group.goals.length === 1 ? 'meta' : 'metas'}
                  </span>
                </header>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleProjectDragEnd(projectGoalIds)}
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
              </section>
            )
          })}
        </div>
      )}

      <GoalManagementModal
        isOpen={showGoalModal}
        onClose={closeModal}
        goal={editingGoal}
        projects={projects}
        onCreateGoal={onCreateGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
      />
    </div>
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

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
import { Goal, Project, SimpleInitiative } from '@/lib/planning'

interface GoalDisplayProps {
  goals: Goal[]
  projects: Project[]
  onEditGoal: (goal: Goal) => void
  onDeleteGoal: (goalId: string) => Promise<boolean>
  onUpdateGoalProgress: (goalId: string, progress: number) => Promise<void>
  onAddInitiative: (goalId: string, title: string) => Promise<void>
  onToggleInitiative: (goalId: string, initiativeId: string) => Promise<void>
  onEditInitiative: (goalId: string, initiativeId: string, newTitle: string) => Promise<void>
  onDeleteInitiative: (goalId: string, initiativeId: string) => Promise<void>
  onReorderGoals: (orderedGoalIds: string[]) => void
}

export function GoalDisplay({
  goals,
  projects,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoalProgress,
  onAddInitiative,
  onToggleInitiative,
  onEditInitiative,
  onDeleteInitiative,
  onReorderGoals,
}: GoalDisplayProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null)
  const [editingInitiativeTitle, setEditingInitiativeTitle] = useState('')
  const [newInitiativeByGoal, setNewInitiativeByGoal] = useState<Record<string, string>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  )

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  const handleStartEditInitiative = (initiative: SimpleInitiative) => {
    setEditingInitiativeId(initiative.id)
    setEditingInitiativeTitle(initiative.title)
  }

  const handleSaveInitiativeEdit = async (goalId: string, initiativeId: string) => {
    if (!editingInitiativeTitle.trim()) return
    try {
      await onEditInitiative(goalId, initiativeId, editingInitiativeTitle.trim())
      setEditingInitiativeId(null)
      setEditingInitiativeTitle('')
    } catch (error) {
      console.error('Erro ao editar iniciativa:', error)
    }
  }

  const handleCancelInitiativeEdit = () => {
    setEditingInitiativeId(null)
    setEditingInitiativeTitle('')
  }

  const handleDeleteInitiative = async (goalId: string, initiativeId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta iniciativa?')) return
    try {
      await onDeleteInitiative(goalId, initiativeId)
    } catch (error) {
      console.error('Erro ao deletar iniciativa:', error)
    }
  }

  const handleAddInitiative = async (goalId: string) => {
    const title = (newInitiativeByGoal[goalId] ?? '').trim()
    if (!title) return
    try {
      await onAddInitiative(goalId, title)
      setNewInitiativeByGoal((prev) => ({ ...prev, [goalId]: '' }))
    } catch (error) {
      console.error('Erro ao adicionar iniciativa:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = goals.map((goal) => goal.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onReorderGoals(arrayMove(ids, oldIndex, newIndex))
  }

  const getProgressColor = (progress: number) => {
    if (progress <= 25) return 'bg-red-500'
    if (progress <= 50) return 'bg-orange-500'
    if (progress <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (progress: number) => {
    if (progress <= 25) return 'text-red-600'
    if (progress <= 50) return 'text-orange-600'
    if (progress <= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={goals.map((goal) => goal.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {goals.map((goal) => {
            const project = projectById[goal.projectId]
            return (
              <SortableGoalItem
                key={goal.id}
                goal={goal}
                project={project}
                expanded={expandedGoals.has(goal.id)}
                onToggleExpand={() => toggleGoalExpansion(goal.id)}
                getProgressColor={getProgressColor}
                getProgressTextColor={getProgressTextColor}
                formatDate={formatDate}
              >
                <div className="mt-4 space-y-4 border-t border-outline-variant/15 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-on-surface-variant">Progresso</span>
                      <span className={`text-sm font-semibold ${getProgressTextColor(goal.progress)}`}>
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full ${getProgressColor(goal.progress)} transition-all`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => onUpdateGoalProgress(goal.id, Number(e.target.value))}
                        className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                        aria-label={`Progresso da meta ${goal.title}`}
                      />
                    </div>
                  </div>

                  {goal.nextSteps ? (
                    <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-800">
                        Próximo passo
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">{goal.nextSteps}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-on-surface">Projeto:</span>{' '}
                      {project?.name ?? 'Sem projeto'}
                    </p>
                    <p>
                      <span className="font-semibold text-on-surface">Prazo:</span>{' '}
                      {goal.dueDate ? formatDate(goal.dueDate) : 'Sem data'}
                    </p>
                  </div>

                  {goal.description ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Descrição
                      </p>
                      <p className="mt-1 text-sm text-on-surface">{goal.description}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Iniciativas
                      </p>
                      <span className="text-xs text-on-surface-variant">
                        {goal.initiatives.filter((i) => i.completed).length}/{goal.initiatives.length}
                      </span>
                    </div>

                    {goal.initiatives.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">Nenhuma iniciativa cadastrada.</p>
                    ) : (
                      <div className="space-y-2">
                        {goal.initiatives.map((initiative) => (
                          <div
                            key={initiative.id}
                            className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-2"
                          >
                            <input
                              type="checkbox"
                              checked={initiative.completed}
                              onChange={() => onToggleInitiative(goal.id, initiative.id)}
                              className="h-4 w-4 rounded border-outline-variant"
                            />

                            {editingInitiativeId === initiative.id ? (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="text"
                                  value={editingInitiativeTitle}
                                  onChange={(e) => setEditingInitiativeTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      void handleSaveInitiativeEdit(goal.id, initiative.id)
                                    }
                                  }}
                                  className="flex-1 rounded-md border border-outline-variant/40 px-2 py-1 text-sm"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleSaveInitiativeEdit(goal.id, initiative.id)}
                                  className="rounded p-1 text-green-700 hover:bg-green-50"
                                  title="Salvar"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInitiativeEdit}
                                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high"
                                  title="Cancelar"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-1 items-center gap-2">
                                <span
                                  className={`text-sm ${
                                    initiative.completed
                                      ? 'text-on-surface-variant line-through'
                                      : 'text-on-surface'
                                  }`}
                                >
                                  {initiative.title}
                                </span>
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditInitiative(initiative)}
                                    className="rounded p-1 text-primary hover:bg-primary/10"
                                    title="Editar iniciativa"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteInitiative(goal.id, initiative.id)}
                                    className="rounded p-1 text-error hover:bg-error/10"
                                    title="Excluir iniciativa"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newInitiativeByGoal[goal.id] ?? ''}
                        onChange={(e) =>
                          setNewInitiativeByGoal((prev) => ({ ...prev, [goal.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void handleAddInitiative(goal.id)
                          }
                        }}
                        placeholder="Adicionar iniciativa..."
                        className="flex-1 rounded-md border border-outline-variant/40 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddInitiative(goal.id)}
                        className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                    >
                      Editar detalhes
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Tem certeza que deseja deletar esta meta?')) return
                        await onDeleteGoal(goal.id)
                      }}
                      className="rounded-lg border border-error/40 px-3 py-1.5 text-sm font-semibold text-error hover:bg-error/10"
                    >
                      Excluir meta
                    </button>
                  </div>
                </div>
              </SortableGoalItem>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableGoalItem({
  goal,
  project,
  expanded,
  onToggleExpand,
  getProgressColor,
  getProgressTextColor,
  formatDate,
  children,
}: {
  goal: Goal
  project?: Project
  expanded: boolean
  onToggleExpand: () => void
  getProgressColor: (progress: number) => string
  getProgressTextColor: (progress: number) => string
  formatDate: (dateString: string) => string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleExpand()
          }
        }}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="mb-2">
          <span
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
            title={project?.name ?? 'Sem projeto'}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project?.color ?? '#64748b' }} />
            <span className="truncate">{(project?.name ?? 'Sem projeto').toUpperCase()}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
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

          <h3 className="min-w-0 flex-1 truncate font-headline text-lg font-bold text-on-surface">
            {goal.title}
          </h3>

          <span className={`text-sm font-bold ${getProgressTextColor(goal.progress)}`}>{goal.progress}%</span>
          <span className="material-symbols-outlined text-on-surface-variant">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div className={`${getProgressColor(goal.progress)} h-full`} style={{ width: `${goal.progress}%` }} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>
            {goal.initiatives.filter((i) => i.completed).length}/{goal.initiatives.length} iniciativas
          </span>
          <span>{goal.dueDate ? `Prazo ${formatDate(goal.dueDate)}` : 'Sem prazo'}</span>
        </div>
      </div>

      {expanded ? children : null}
    </article>
  )
}

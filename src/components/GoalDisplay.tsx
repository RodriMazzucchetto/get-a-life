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

type GoalDraft = {
  title: string
  description: string
  projectId: string
  progress: number
  nextSteps: string
  dueDate: string
}

interface GoalDisplayProps {
  goals: Goal[]
  projects: Project[]
  onCreateGoal: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<Goal | null>
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal | null>
  onDeleteGoal: (goalId: string) => Promise<boolean>
  onAddInitiative: (goalId: string, title: string) => Promise<void>
  onToggleInitiative: (goalId: string, initiativeId: string) => Promise<void>
  onEditInitiative: (goalId: string, initiativeId: string, newTitle: string) => Promise<void>
  onDeleteInitiative: (goalId: string, initiativeId: string) => Promise<void>
  onReorderGoals: (orderedGoalIds: string[]) => void
}

function toDateInputValue(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromGoalToDraft(goal: Goal): GoalDraft {
  return {
    title: goal.title ?? '',
    description: goal.description ?? '',
    projectId: goal.projectId ?? '',
    progress: goal.progress ?? 0,
    nextSteps: goal.nextSteps ?? '',
    dueDate: toDateInputValue(goal.dueDate),
  }
}

export function GoalDisplay({
  goals,
  projects,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddInitiative,
  onToggleInitiative,
  onEditInitiative,
  onDeleteInitiative,
  onReorderGoals,
}: GoalDisplayProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [draftByGoal, setDraftByGoal] = useState<Record<string, GoalDraft>>({})
  const [descriptionExpandedByGoal, setDescriptionExpandedByGoal] = useState<Record<string, boolean>>({})
  const [editingNextStepByGoal, setEditingNextStepByGoal] = useState<Record<string, boolean>>({})
  const [editingDescriptionByGoal, setEditingDescriptionByGoal] = useState<Record<string, boolean>>({})
  const [newInitiativeByGoal, setNewInitiativeByGoal] = useState<Record<string, string>>({})
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null)
  const [editingInitiativeTitle, setEditingInitiativeTitle] = useState('')

  const [showCreateInline, setShowCreateInline] = useState(false)
  const [createDraft, setCreateDraft] = useState<GoalDraft>({
    title: '',
    description: '',
    projectId: '',
    progress: 0,
    nextSteps: '',
    dueDate: '',
  })
  const [createDescriptionExpanded, setCreateDescriptionExpanded] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  )

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const toggleGoalExpansion = (goal: Goal) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev)
      if (next.has(goal.id)) {
        next.delete(goal.id)
      } else {
        next.add(goal.id)
        setDraftByGoal((drafts) => ({ ...drafts, [goal.id]: drafts[goal.id] ?? fromGoalToDraft(goal) }))
      }
      return next
    })
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

  const handleSaveGoal = async (goalId: string) => {
    const draft = draftByGoal[goalId]
    if (!draft) return
    if (!draft.title.trim()) return
    if (!draft.projectId) return
    await onUpdateGoal(goalId, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      projectId: draft.projectId,
      progress: draft.progress,
      nextSteps: draft.nextSteps.trim() || undefined,
      dueDate: draft.dueDate ? new Date(`${draft.dueDate}T00:00:00`).toISOString() : undefined,
    })
  }

  const handleSummaryProgressChange = async (goalId: string, progress: number) => {
    setDraftByGoal((prev) => {
      const current = prev[goalId]
      if (!current) return prev
      return { ...prev, [goalId]: { ...current, progress } }
    })
    await onUpdateGoal(goalId, { progress })
  }

  const handleSaveCreateGoal = async () => {
    if (!createDraft.title.trim()) return
    if (!createDraft.projectId) return
    const created = await onCreateGoal({
      title: createDraft.title.trim(),
      description: createDraft.description.trim(),
      projectId: createDraft.projectId,
      progress: createDraft.progress,
      nextSteps: createDraft.nextSteps.trim() || undefined,
      dueDate: createDraft.dueDate ? new Date(`${createDraft.dueDate}T00:00:00`).toISOString() : undefined,
      initiatives: [],
    })
    if (!created) return
    setShowCreateInline(false)
    setCreateDescriptionExpanded(false)
    setCreateDraft({
      title: '',
      description: '',
      projectId: '',
      progress: 0,
      nextSteps: '',
      dueDate: '',
    })
  }

  const handleAddInitiative = async (goalId: string) => {
    const title = (newInitiativeByGoal[goalId] ?? '').trim()
    if (!title) return
    await onAddInitiative(goalId, title)
    setNewInitiativeByGoal((prev) => ({ ...prev, [goalId]: '' }))
  }

  const handleStartEditInitiative = (initiative: SimpleInitiative) => {
    setEditingInitiativeId(initiative.id)
    setEditingInitiativeTitle(initiative.title)
  }

  const handleSaveInitiativeEdit = async (goalId: string, initiativeId: string) => {
    if (!editingInitiativeTitle.trim()) return
    await onEditInitiative(goalId, initiativeId, editingInitiativeTitle.trim())
    setEditingInitiativeId(null)
    setEditingInitiativeTitle('')
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateInline((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nova meta
        </button>
      </div>

      {showCreateInline ? (
        <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
          <h3 className="mb-3 font-headline text-lg font-bold text-on-surface">Criar nova meta</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Título</span>
              <input
                type="text"
                value={createDraft.title}
                onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Projeto</span>
              <select
                value={createDraft.projectId}
                onChange={(e) => setCreateDraft((d) => ({ ...d, projectId: e.target.value }))}
                className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              >
                <option value="">Selecione</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">
                Progresso ({createDraft.progress}%)
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={createDraft.progress}
                onChange={(e) =>
                  setCreateDraft((d) => ({ ...d, progress: Number(e.target.value) }))
                }
                className="w-full"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Prazo</span>
              <input
                type="date"
                value={createDraft.dueDate}
                onChange={(e) => setCreateDraft((d) => ({ ...d, dueDate: e.target.value }))}
                className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Próximo passo</span>
            <textarea
              rows={3}
              value={createDraft.nextSteps}
              onChange={(e) => setCreateDraft((d) => ({ ...d, nextSteps: e.target.value }))}
              className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-on-surface">Descrição</span>
              <button
                type="button"
                onClick={() => setCreateDescriptionExpanded((v) => !v)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {createDescriptionExpanded ? 'Ver menos' : 'Ver mais'}
              </button>
            </div>
            <textarea
              rows={createDescriptionExpanded ? 8 : 2}
              value={createDraft.description}
              onChange={(e) => setCreateDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSaveCreateGoal()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
            >
              Salvar meta
            </button>
            <button
              type="button"
              onClick={() => setShowCreateInline(false)}
              className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-center">
          <p className="font-headline text-lg font-bold text-on-surface">Nenhuma meta criada ainda</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Clique em <strong>Nova meta</strong> para começar.
          </p>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={goals.map((goal) => goal.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {goals.map((goal) => {
              const project = projectById[goal.projectId]
              const draft = draftByGoal[goal.id] ?? fromGoalToDraft(goal)
              const descExpanded = descriptionExpandedByGoal[goal.id] ?? false
              return (
                <SortableGoalItem
                  key={goal.id}
                  goal={goal}
                  summaryProgress={draft.progress}
                  project={project}
                  expanded={expandedGoals.has(goal.id)}
                  onToggleExpand={() => toggleGoalExpansion(goal)}
                  onChangeProgress={handleSummaryProgressChange}
                  getProgressColor={getProgressColor}
                  getProgressTextColor={getProgressTextColor}
                  formatDate={formatDate}
                >
                  <div className="mt-4 space-y-4 border-t border-outline-variant/15 pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold text-on-surface">Título</span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) =>
                            setDraftByGoal((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold text-on-surface">Projeto</span>
                        <select
                          value={draft.projectId}
                          onChange={(e) =>
                            setDraftByGoal((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, projectId: e.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
                        >
                          <option value="">Selecione</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold text-on-surface">Prazo</span>
                        <input
                          type="date"
                          value={draft.dueDate}
                          onChange={(e) =>
                            setDraftByGoal((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, dueDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
                        />
                      </label>
                    </div>

                    <label className="block text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Próximo passo</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNextStepByGoal((prev) => ({ ...prev, [goal.id]: !prev[goal.id] }))
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          {editingNextStepByGoal[goal.id] ? 'Concluir edição' : 'Editar'}
                        </button>
                      </div>
                      {editingNextStepByGoal[goal.id] ? (
                        <textarea
                          rows={3}
                          value={draft.nextSteps}
                          onChange={(e) =>
                            setDraftByGoal((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, nextSteps: e.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
                        />
                      ) : (
                        <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-800">
                            Próximo passo
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-yellow-700">
                            {draft.nextSteps || 'Nenhum próximo passo definido.'}
                          </p>
                        </div>
                      )}
                    </label>

                    <label className="block text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-on-surface">Descrição</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDescriptionExpandedByGoal((prev) => ({
                                ...prev,
                                [goal.id]: !descExpanded,
                              }))
                            }
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {descExpanded ? 'Ver menos' : 'Ver mais'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingDescriptionByGoal((prev) => ({
                                ...prev,
                                [goal.id]: !prev[goal.id],
                              }))
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            {editingDescriptionByGoal[goal.id] ? 'Concluir edição' : 'Editar'}
                          </button>
                        </div>
                      </div>
                      {editingDescriptionByGoal[goal.id] ? (
                        <textarea
                          rows={descExpanded ? 12 : 4}
                          value={draft.description}
                          onChange={(e) =>
                            setDraftByGoal((prev) => ({
                              ...prev,
                              [goal.id]: { ...draft, description: e.target.value },
                            }))
                          }
                          className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
                        />
                      ) : (
                        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
                          <p
                            className={`whitespace-pre-wrap text-sm text-on-surface ${
                              descExpanded ? '' : 'line-clamp-2'
                            }`}
                          >
                            {draft.description || 'Sem descrição.'}
                          </p>
                        </div>
                      )}
                    </label>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Iniciativas
                        </p>
                        <span className="text-xs text-on-surface-variant">
                          {goal.initiatives.filter((i) => i.completed).length}/{goal.initiatives.length}
                        </span>
                      </div>

                      {goal.initiatives.length > 0 ? (
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
                                  >
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingInitiativeId(null)
                                      setEditingInitiativeTitle('')
                                    }}
                                    className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high"
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
                                    >
                                      <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void onDeleteInitiative(goal.id, initiative.id)}
                                      className="rounded p-1 text-error hover:bg-error/10"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-on-surface-variant">Nenhuma iniciativa cadastrada.</p>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newInitiativeByGoal[goal.id] ?? ''}
                          onChange={(e) =>
                            setNewInitiativeByGoal((prev) => ({
                              ...prev,
                              [goal.id]: e.target.value,
                            }))
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
                        onClick={() => void handleSaveGoal(goal.id)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
                      >
                        Salvar alterações
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftByGoal((prev) => ({ ...prev, [goal.id]: fromGoalToDraft(goal) }))
                        }
                        className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja deletar esta meta?')) return
                          await onDeleteGoal(goal.id)
                        }}
                        className="rounded-lg border border-error/40 px-4 py-2 text-sm font-semibold text-error hover:bg-error/10"
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
    </div>
  )
}

function SortableGoalItem({
  goal,
  summaryProgress,
  project,
  expanded,
  onToggleExpand,
  onChangeProgress,
  getProgressColor,
  getProgressTextColor,
  formatDate,
  children,
}: {
  goal: Goal
  summaryProgress: number
  project?: Project
  expanded: boolean
  onToggleExpand: () => void
  onChangeProgress: (goalId: string, progress: number) => Promise<void>
  getProgressColor: (progress: number) => string
  getProgressTextColor: (progress: number) => string
  formatDate: (dateString?: string) => string
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

          <span className={`text-sm font-bold ${getProgressTextColor(summaryProgress)}`}>{summaryProgress}%</span>
          <span className="material-symbols-outlined text-on-surface-variant">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>

        <div
          className="relative mt-2 h-3"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 top-[3px] h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div className={`${getProgressColor(summaryProgress)} h-full`} style={{ width: `${summaryProgress}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={summaryProgress}
            onChange={(e) => void onChangeProgress(goal.id, Number(e.target.value))}
            className="absolute inset-0 h-3 w-full cursor-ew-resize appearance-none bg-transparent opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-0 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/40 [&::-webkit-slider-thumb]:bg-surface-container-lowest [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/40 [&::-moz-range-thumb]:bg-surface-container-lowest"
            aria-label={`Progresso da meta ${goal.title}`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>
            {goal.initiatives.filter((i) => i.completed).length}/{goal.initiatives.length} iniciativas
          </span>
          <span>{formatDate(goal.dueDate)}</span>
        </div>
      </div>

      {expanded ? children : null}
    </article>
  )
}

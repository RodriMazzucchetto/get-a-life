'use client'

import type { Todo } from '@/lib/planning'
import { ClassificationBadge, getClassificationBadgeMeta } from '@/components/planning/ClassificationBadge'
import { sortLifeAdminByDeadline } from '@/lib/todoBoardHelpers'
import { useMemo, useState } from 'react'

function ReadOnlyTodoRow({
  todo,
  projects,
  interactive = true,
  onEdit,
}: {
  todo: Todo
  projects: { id: string; name: string; color: string }[]
  interactive?: boolean
  onEdit?: (todo: Todo) => void
}) {
  const projectList = (todo.projectIds?.length ? todo.projectIds : todo.projectId ? [todo.projectId] : [])
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean) as { id: string; name: string; color: string }[]

  const className =
    'flex w-full items-center gap-3 rounded-xl bg-surface-container-lowest px-3 py-3 text-left ring-1 ring-outline-variant/10'

  const inner = (
    <>
      {todo.taskType === 'LIFE_ADMIN' ? (
        <span className="material-symbols-outlined shrink-0 text-lg text-on-surface-variant" aria-hidden>
          home_work
        </span>
      ) : (
        <span className="material-symbols-outlined shrink-0 text-lg text-red-400" aria-hidden>
          flag
        </span>
      )}
      {projectList.map((p) => (
        <span
          key={p.id}
          className="shrink-0 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: p.color }}
        >
          {p.name}
        </span>
      ))}
      <span className="min-w-0 flex-1 truncate text-sm text-on-surface">{todo.title}</span>
      <ClassificationBadge todo={todo} />
    </>
  )

  if (!interactive || !onEdit) {
    return <div className={className}>{inner}</div>
  }

  return (
    <button type="button" onClick={() => onEdit(todo)} className={`${className} hover:shadow-sm`}>
      {inner}
    </button>
  )
}

export function LifeAdminView({
  todos,
  projects,
  onEdit,
}: {
  todos: Todo[]
  projects: { id: string; name: string; color: string }[]
  onEdit: (todo: Todo) => void
}) {
  const withDeadline = useMemo(
    () =>
      todos
        .filter((t) => t.lifeAdminSubtype === 'COM_DEADLINE')
        .sort(sortLifeAdminByDeadline),
    [todos]
  )
  const withoutDeadline = useMemo(
    () => todos.filter((t) => t.lifeAdminSubtype === 'SEM_DEADLINE').sort((a, b) => a.pos - b.pos),
    [todos]
  )

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/15">
        <h2 className="font-headline text-lg font-bold text-on-surface">Com deadline</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Ordenado por data crescente.</p>
        <div className="mt-4 space-y-2">
          {withDeadline.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Nenhuma task com deadline.</p>
          ) : (
            withDeadline.map((todo) => {
              const meta = getClassificationBadgeMeta(todo)
              const daysLeft = todo.lifeAdminDeadline
                ? Math.ceil(
                    (new Date(todo.lifeAdminDeadline).getTime() - Date.now()) /
                      (24 * 60 * 60 * 1000)
                  )
                : null
              return (
                <div key={todo.id} className="space-y-1">
                  <ReadOnlyTodoRow todo={todo} projects={projects} onEdit={onEdit} />
                  {daysLeft !== null && daysLeft < 7 ? (
                    <p className="pl-3 text-xs font-semibold text-orange-700">
                      Menos de 7 dias ({daysLeft}d)
                    </p>
                  ) : null}
                  {meta ? (
                    <p className="pl-3 text-xs text-on-surface-variant">{meta.longLabel}</p>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/15">
        <h2 className="font-headline text-lg font-bold text-on-surface">Sem deadline</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Revisar mensalmente.</p>
        <div className="mt-4 space-y-2">
          {withoutDeadline.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Nenhuma task sem deadline.</p>
          ) : (
            withoutDeadline.map((todo) => (
              <ReadOnlyTodoRow key={todo.id} todo={todo} projects={projects} onEdit={onEdit} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export function ArchiveView({
  todos,
  projects,
}: {
  todos: Todo[]
  projects: { id: string; name: string; color: string }[]
}) {
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = [...todos].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    if (projectFilter !== 'all') {
      list = list.filter(
        (t) =>
          t.projectId === projectFilter ||
          (t.projectIds ?? []).includes(projectFilter)
      )
    }
    return list
  }, [todos, projectFilter])

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/15">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-headline text-lg font-bold text-on-surface">Arquivo</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tasks cortadas — histórico read-only.
          </p>
        </div>
        <label className="text-sm text-on-surface-variant">
          Frente
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="ml-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 py-1 text-sm"
          >
            <option value="all">Todas</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Nenhuma task arquivada.</p>
        ) : (
            filtered.map((todo) => (
              <ReadOnlyTodoRow key={todo.id} todo={todo} projects={projects} interactive={false} />
            ))
        )}
      </div>
    </div>
  )
}

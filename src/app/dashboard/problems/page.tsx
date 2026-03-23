"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  problemsService,
  projectsService,
  fromDbProblem,
  fromDbProject,
  type Problem,
  type Project,
} from "@/lib/planning";
import {
  computePosAtNewIndexForProblems,
  formatRelativeDaysPt,
  projectPrefixLabel,
} from "@/lib/problemHelpers";

const NONE = "__none__";

function matchProject(p: Problem, selected: string): boolean {
  if (selected === NONE) return p.projectId === null;
  return p.projectId === selected;
}

function SortableProblemRow({
  problem,
  projectName,
  projectColor,
  isTopPriority,
  stale,
  onToggleResolved,
  onDelete,
}: {
  problem: Problem;
  projectName: string | null;
  projectColor: string | null;
  isTopPriority: boolean;
  stale: boolean;
  onToggleResolved: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: problem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prefix =
    projectName != null ? projectPrefixLabel(projectName) : "— ";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col border-b border-outline-variant/15 last:border-b-0 ${
        isTopPriority
          ? "bg-primary-container/30 ring-1 ring-primary/35 shadow-sm"
          : "bg-surface-container-lowest/80"
      } ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3 px-3 py-3.5 sm:px-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 flex shrink-0 cursor-grab touch-none flex-col gap-0.5 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <span className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-on-surface-variant/35" />
            ))}
          </span>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={problem.resolved}
          onClick={() => onToggleResolved(problem.id)}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            problem.resolved
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant hover:border-primary/60"
          }`}
        >
          {problem.resolved && (
            <span className="material-symbols-outlined text-[14px] leading-none">check</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug sm:text-[15px] ${
              problem.resolved ? "text-on-surface-variant line-through" : "text-on-surface"
            }`}
          >
            <span
              className="font-bold tracking-wide"
              style={
                projectColor
                  ? { color: projectColor }
                  : { color: "var(--color-on-surface-variant)" }
              }
            >
              {prefix}
            </span>
            {problem.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tertiary-fixed-dim">
            <span>{formatRelativeDaysPt(problem.createdAt)}</span>
            {stale && !problem.resolved && (
              <span
                className="inline-flex items-center gap-0.5 text-error"
                title="Aberto há bastante tempo"
              >
                <span className="material-symbols-outlined text-[16px]">schedule</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(problem.id)}
          className="shrink-0 rounded-lg p-1.5 text-on-surface-variant opacity-70 transition-opacity hover:bg-surface-container-high hover:text-error sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          aria-label="Excluir problema"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(NONE);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [p, pr] = await Promise.all([
        projectsService.getProjects(user.id),
        problemsService.getProblems(user.id),
      ]);
      setProjects(p.map(fromDbProject));
      setProblems(pr.map(fromDbProblem));
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const [didInitProject, setDidInitProject] = useState(false);
  useEffect(() => {
    if (didInitProject || projects.length === 0) return;
    setSelectedProjectId(projects[0].id);
    setDidInitProject(true);
  }, [projects, didInitProject]);

  const listForProject = useMemo(() => {
    return problems
      .filter((p) => matchProject(p, selectedProjectId))
      .sort((a, b) => a.pos - b.pos);
  }, [problems, selectedProjectId]);

  const topPriorityIds = useMemo(() => {
    const unresolved = listForProject.filter((p) => !p.resolved);
    return new Set(unresolved.slice(0, 3).map((p) => p.id));
  }, [listForProject]);

  const activeProblem = useMemo(
    () => (activeId ? problems.find((p) => p.id === activeId) : undefined),
    [activeId, problems]
  );

  const projectById = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const ids = listForProject.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(listForProject, oldIndex, newIndex);
    const newPos = computePosAtNewIndexForProblems(reordered, String(active.id));
    if (newPos == null) return;

    try {
      const updated = await problemsService.updateProblem(String(active.id), { pos: newPos });
      setProblems((prev) =>
        prev.map((p) => (p.id === updated.id ? fromDbProblem(updated) : p))
      );
    } catch (e) {
      console.error(e);
      setError("Não foi possível reordenar.");
    }
  };

  const handleAdd = async () => {
    if (!user || !draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const pid = selectedProjectId === NONE ? null : selectedProjectId;
      const row = await problemsService.createProblem(user.id, {
        title: draft.trim(),
        project_id: pid,
      });
      setProblems((prev) => [...prev, fromDbProblem(row)]);
      setDraft("");
    } catch (e) {
      console.error(e);
      setError("Não foi possível criar o problema.");
    } finally {
      setSaving(false);
    }
  };

  const toggleResolved = async (id: string) => {
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    try {
      const row = await problemsService.updateProblem(id, { resolved: !p.resolved });
      setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
    } catch (e) {
      console.error(e);
      setError("Não foi possível atualizar.");
    }
  };

  const deleteProblem = async (id: string) => {
    try {
      await problemsService.deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      setError("Não foi possível excluir.");
    }
  };

  const daysSince = (iso: string) =>
    (Date.now() - new Date(iso).getTime()) / 86400000;

  if (loading && problems.length === 0 && projects.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
        <span
          className="h-10 w-10 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="font-body text-on-surface">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
            Problemas
          </h1>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
            Priorize o que importa: arraste para ordenar. Os três primeiros itens em aberto
            ficam em destaque.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label htmlFor="proj-filter" className="text-xs font-medium text-on-surface-variant">
            Projeto
          </label>
          <select
            id="proj-filter"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface shadow-sm ring-1 ring-outline-variant/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value={NONE}>Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {projects.length === 0 && (
        <div className="mb-6 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/50 p-4 text-center text-sm text-on-surface-variant">
          Sem projetos ainda.{" "}
          <Link href="/dashboard/planning" className="font-semibold text-primary underline">
            Crie em Planejamento
          </Link>{" "}
          para prefixos coloridos — ou use &quot;Sem projeto&quot; abaixo.
        </div>
      )}

      <>
          <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-outline-variant/15 bg-surface-container-low ring-1 ring-outline-variant/10">
            <div className="flex items-center gap-2 border-b border-outline-variant/15 px-3 py-2.5 sm:px-4">
              <PlusIcon className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAdd();
                  }
                }}
                placeholder="Adicionar problema de curto prazo…"
                disabled={saving}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(String(e.active.id))}
            onDragEnd={(e) => void handleDragEnd(e)}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext
              items={listForProject.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="overflow-hidden rounded-b-xl border border-outline-variant/15 bg-surface-container-low ring-1 ring-outline-variant/10">
                {listForProject.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-on-surface-variant">
                    Nenhum problema neste projeto. Use o campo acima para adicionar.
                  </p>
                ) : (
                  listForProject.map((p) => {
                    const proj = p.projectId ? projectById.get(p.projectId) : null;
                    return (
                      <div key={p.id}>
                        <SortableProblemRow
                          problem={p}
                          projectName={proj?.name ?? null}
                          projectColor={proj?.color ?? null}
                          isTopPriority={topPriorityIds.has(p.id)}
                          stale={daysSince(p.createdAt) > 14}
                          onToggleResolved={toggleResolved}
                          onDelete={deleteProblem}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeProblem ? (
                <div className="rounded-lg bg-surface-container-lowest px-4 py-3 shadow-xl ring-2 ring-primary/30">
                  <p className="text-sm font-medium text-on-surface">{activeProblem.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
      </>
    </div>
  );
}

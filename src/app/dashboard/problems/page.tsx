"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { TrashIcon } from "@heroicons/react/24/outline";
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
  projectShortCode,
} from "@/lib/problemHelpers";
import {
  friendlySchemaHint,
  getSupabaseErrorMessage,
} from "@/lib/supabaseErrors";

const NONE = "__none__";
type TabKey = "active" | "resolved" | "archived";

function matchProjectFilter(p: Problem, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === NONE) return p.projectId === null;
  return p.projectId === filter;
}

function SortableProblemRow({
  problem,
  projectName,
  projectColor,
  isTopPriority,
  stale,
  dragDisabled,
  onToggleResolved,
  onDelete,
}: {
  problem: Problem;
  projectName: string | null;
  projectColor: string | null;
  isTopPriority: boolean;
  stale: boolean;
  dragDisabled: boolean;
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
  } = useSortable({ id: problem.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const short = projectName ? projectShortCode(projectName) : "—";
  const badgeBg = projectColor ? `${projectColor}22` : undefined;
  const badgeFg = projectColor || undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-2xl border border-transparent p-5 transition-all hover:border-outline-variant/10 hover:bg-surface-container-low hover:shadow-md ${
        isTopPriority
          ? "bg-primary-container/25 ring-1 ring-primary/30 shadow-sm"
          : "bg-surface-container-lowest"
      } ${problem.resolved ? "opacity-60" : ""} ${isDragging ? "opacity-60" : ""}`}
    >
      <div
        {...(dragDisabled ? {} : attributes)}
        {...(dragDisabled ? {} : listeners)}
        className={`drag-handle shrink-0 text-outline/30 transition-colors ${
          dragDisabled ? "cursor-default opacity-30" : "cursor-grab text-outline/40 hover:text-outline active:cursor-grabbing"
        }`}
        aria-hidden={dragDisabled}
      >
        <span className="material-symbols-outlined">drag_indicator</span>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={problem.resolved}
        onClick={() => onToggleResolved(problem.id)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          problem.resolved
            ? "border-primary bg-primary text-on-primary"
            : "border-outline-variant group-hover:border-primary/60"
        }`}
      >
        {problem.resolved && (
          <span className="material-symbols-outlined text-[14px] leading-none">check</span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-black tracking-wide"
            style={{
              backgroundColor: badgeBg ?? "var(--color-surface-container-high)",
              color: badgeFg ?? "var(--color-on-surface-variant)",
            }}
          >
            {short}
          </span>
          <h3
            className={`font-headline text-sm font-medium transition-colors ${
              problem.resolved
                ? "text-on-surface-variant line-through"
                : "text-on-surface group-hover:text-primary"
            }`}
          >
            {problem.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant/80">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {problem.resolved
              ? `Resolvido ${formatRelativeDaysPt(problem.updatedAt)}`
              : formatRelativeDaysPt(problem.createdAt)}
          </span>
          {stale && !problem.resolved && (
            <span className="inline-flex items-center gap-1 text-error">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Atenção
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(problem.id)}
        className="shrink-0 rounded-lg p-2 text-outline opacity-70 transition-all hover:bg-surface-container-high hover:text-error sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Excluir problema"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ProblemsPage() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("active");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** Projeto do formulário rápido — "" = sem projeto (igual ao select de tarefas) */
  const [quickProjectId, setQuickProjectId] = useState("");
  const quickInputRef = useRef<HTMLInputElement>(null);

  const dragDisabled = filterProjectId === "all";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível carregar os dados: ${raw}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectById = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const tabFiltered = useMemo(() => {
    if (tab === "active") return problems.filter((p) => !p.resolved);
    if (tab === "resolved") return problems.filter((p) => p.resolved);
    return [];
  }, [problems, tab]);

  const projectFiltered = useMemo(() => {
    return tabFiltered.filter((p) => matchProjectFilter(p, filterProjectId));
  }, [tabFiltered, filterProjectId]);

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projectFiltered;
    return projectFiltered.filter((p) => p.title.toLowerCase().includes(q));
  }, [projectFiltered, searchQuery]);

  const sortedList = useMemo(() => {
    const copy = [...searched];
    if (filterProjectId === "all") {
      copy.sort((a, b) => {
        const pa = a.projectId ?? "";
        const pb = b.projectId ?? "";
        if (pa !== pb) return pa.localeCompare(pb);
        return a.pos - b.pos;
      });
    } else {
      copy.sort((a, b) => a.pos - b.pos);
    }
    return copy;
  }, [searched, filterProjectId]);

  const topPriorityIds = useMemo(() => {
    if (tab !== "active") return new Set<string>();
    const unresolved = sortedList.filter((p) => !p.resolved);
    return new Set(unresolved.slice(0, 3).map((p) => p.id));
  }, [sortedList, tab]);

  const activeProblem = useMemo(
    () => (activeId ? problems.find((p) => p.id === activeId) : undefined),
    [activeId, problems]
  );

  const stats = useMemo(() => {
    const open = problems.filter((p) => !p.resolved);
    const projectKeys = new Set(
      open.map((p) => p.projectId ?? "none")
    );
    return { openCount: open.length, projectWithOpenCount: projectKeys.size };
  }, [problems]);

  const focusQuickAdd = useCallback(() => {
    setTab("active");
    setError(null);
    requestAnimationFrame(() => quickInputRef.current?.focus());
  }, []);

  const submitQuickAdd = async () => {
    if (!user || !draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const row = await problemsService.createProblem(user.id, {
        title: draft.trim(),
        project_id: quickProjectId === "" ? null : quickProjectId,
      });
      setProblems((prev) => [...prev, fromDbProblem(row)]);
      setDraft("");
      setTab("active");
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível criar: ${raw}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (dragDisabled) return;
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const ids = sortedList.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedList, oldIndex, newIndex);
    const newPos = computePosAtNewIndexForProblems(reordered, String(active.id));
    if (newPos == null) return;

    try {
      const updated = await problemsService.updateProblem(String(active.id), { pos: newPos });
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? fromDbProblem(updated) : p)));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível reordenar: ${raw}`);
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
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível atualizar: ${raw}`);
    }
  };

  const deleteProblem = async (id: string) => {
    try {
      await problemsService.deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível excluir: ${raw}`);
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
      {/* Top bar — mock Velocity / Problems */}
      <header className="sticky top-0 z-30 -mx-4 mb-8 border-b border-outline-variant/15 bg-background px-4 pb-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <span className="font-headline text-xl font-bold tracking-tight text-on-surface">
              Problemas
            </span>
            <nav className="flex gap-6 border-b border-transparent text-sm">
              {(
                [
                  ["active", "Ativos"],
                  ["resolved", "Resolvidos"],
                  ["archived", "Arquivados"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`pb-2 font-semibold transition-colors ${
                    tab === key
                      ? "border-b-2 border-primary text-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca rápida…"
                className="w-full min-w-[12rem] rounded-full border-0 bg-surface-container-low py-1.5 pl-10 pr-4 text-sm text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-all focus:w-64 focus:ring-2 focus:ring-primary/20 sm:w-48"
              />
            </div>
            <Link
              href="/dashboard/settings"
              className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-low"
              aria-label="Configurações"
            >
              <span className="material-symbols-outlined">settings</span>
            </Link>
            <button
              type="button"
              onClick={focusQuickAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Novo problema
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Formulário rápido — título + projeto no mesmo bloco (como tarefas no planejamento) */}
      <section className="mb-10">
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm ring-1 ring-outline-variant/10 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-2 shrink-0 text-primary">add_circle</span>
            <div className="min-w-0 flex-1">
              <input
                ref={quickInputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    e.preventDefault();
                    void submitQuickAdd();
                  }
                }}
                placeholder="Adicionar novo problema…"
                disabled={saving}
                className="w-full border-0 bg-transparent py-2 font-headline text-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-0"
              />
              <div className="mt-4 flex flex-col gap-3 border-t border-outline-variant/15 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
                  <label htmlFor="quick-problem-project" className="shrink-0 text-sm text-on-surface-variant">
                    Projeto:
                  </label>
                  <select
                    id="quick-problem-project"
                    value={quickProjectId}
                    onChange={(e) => setQuickProjectId(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Sem projeto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={saving || !draft.trim()}
                  onClick={() => void submitQuickAdd()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-50 sm:ml-auto"
                >
                  {saving ? "A guardar…" : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project filter pills — dados reais */}
      <section className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
            Filtro por projeto
          </h2>
          <Link
            href="/dashboard/planning"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary"
          >
            <span className="material-symbols-outlined text-sm">folder</span>
            Gerir projetos
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterProjectId("all")}
            className={`rounded-full px-5 py-2 text-xs font-bold shadow-sm transition-colors ${
              filterProjectId === "all"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/15 hover:bg-surface-container-high"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterProjectId(NONE)}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
              filterProjectId === NONE
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
            }`}
          >
            Sem projeto
          </button>
          {projects.map((p) => {
            const code = projectShortCode(p.name);
            const active = filterProjectId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setFilterProjectId(p.id)}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                }`}
                style={
                  active
                    ? { backgroundColor: p.color, color: "#fff" }
                    : { borderLeft: `3px solid ${p.color}` }
                }
              >
                {code}
              </button>
            );
          })}
          <Link
            href="/dashboard/planning"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-outline ring-1 ring-outline-variant/15 transition-colors hover:bg-surface-container-high"
            title="Novo projeto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </Link>
        </div>
        {dragDisabled && tab !== "archived" && (
          <p className="text-xs text-on-surface-variant">
            Para reordenar por prioridade, escolha um projeto no filtro (ou &quot;Sem projeto&quot;).
          </p>
        )}
      </section>

      {/* List */}
      {tab === "archived" ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-16 text-center">
          <p className="font-headline text-on-surface-variant">
            Arquivamento em breve — por agora use <strong>Resolvidos</strong>.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(String(e.active.id))}
          onDragEnd={(e) => void handleDragEnd(e)}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={sortedList.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <section className="space-y-3">
              {sortedList.length === 0 ? (
                <p className="rounded-2xl bg-surface-container-low/50 px-6 py-12 text-center text-sm text-on-surface-variant">
                  Nenhum problema nesta vista. Use <strong>Novo problema</strong> ou o campo acima.
                </p>
              ) : (
                sortedList.map((p) => {
                  const proj = p.projectId ? projectById.get(p.projectId) : null;
                  return (
                    <SortableProblemRow
                      key={p.id}
                      problem={p}
                      projectName={proj?.name ?? null}
                      projectColor={proj?.color ?? null}
                      isTopPriority={topPriorityIds.has(p.id)}
                      stale={daysSince(p.createdAt) > 14}
                      dragDisabled={dragDisabled}
                      onToggleResolved={toggleResolved}
                      onDelete={deleteProblem}
                    />
                  );
                })
              )}
            </section>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeProblem ? (
              <div className="rounded-2xl bg-surface-container-lowest px-5 py-4 shadow-xl ring-2 ring-primary/30">
                <p className="font-headline text-sm font-medium text-on-surface">
                  {activeProblem.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-r from-primary to-primary-container p-8 text-on-primary shadow-xl sm:flex-row sm:items-center">
        <div>
          <h3 className="font-headline text-xl font-bold">Visão geral</h3>
          <p className="mt-1 text-sm text-white/80">
            {stats.openCount} problema{stats.openCount !== 1 ? "s" : ""} em aberto
            {stats.projectWithOpenCount > 0
              ? ` em ${stats.projectWithOpenCount} projeto${stats.projectWithOpenCount !== 1 ? "s" : ""} com itens ativos.`
              : "."}
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Em breve"
          className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg opacity-70"
        >
          Gerar relatório
        </button>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-20 lg:right-10">
        <button
          type="button"
          onClick={focusQuickAdd}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Novo problema"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </div>
  );
}

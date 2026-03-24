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
  type ProblemKind,
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

const KIND_LABELS: Record<ProblemKind, string> = {
  market: "Problemas de Mercado (Estratégico)",
  operational: "Problemas Práticos (Operacional)",
};

/** Mesmo ícone de bandeira das tasks (planning). */
function ProblemPriorityToggle({
  isHighPriority,
  disabled,
  onToggle,
}: {
  isHighPriority: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      className={`mt-0.5 shrink-0 rounded-md p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/10"
      }`}
      title={isHighPriority ? "Clique para remover prioridade" : "Clique para marcar como prioridade"}
      aria-pressed={isHighPriority}
      aria-label={isHighPriority ? "Remover prioridade alta" : "Marcar como prioridade alta"}
    >
      <svg
        className={`h-4 w-4 ${isHighPriority ? "text-red-500" : "text-gray-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z" />
      </svg>
    </button>
  );
}

function matchProjectFilter(p: Problem, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === NONE) return p.projectId === null;
  return p.projectId === filter;
}

function SortableProblemRow({
  problem,
  projectColor,
  isTopThreeSlot,
  stale,
  dragDisabled,
  projects,
  isSavingProject,
  onToggleResolved,
  onTogglePriority,
  onProjectChange,
  onMoveToOtherKind,
  onDelete,
}: {
  problem: Problem;
  projectColor: string | null;
  /** Os 3 primeiros itens ativos na lista (fila) — destaque visual, independente da prioridade. */
  isTopThreeSlot: boolean;
  stale: boolean;
  dragDisabled: boolean;
  projects: Project[];
  isSavingProject: boolean;
  onToggleResolved: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onProjectChange: (id: string, projectId: string | null) => void;
  onMoveToOtherKind: (id: string) => void;
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

  const badgeBg = projectColor ? `${projectColor}22` : undefined;
  const badgeFg = projectColor || undefined;

  /** Fila top-3: só contorno (sem fundo lavanda — alinhado ao mock branco). */
  const queueAccent =
    isTopThreeSlot && !problem.resolved
      ? "ring-2 ring-primary/25 shadow-sm"
      : "ring-1 ring-black/[0.06]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/80 ${queueAccent} ${
        problem.resolved ? "opacity-60" : ""
      } ${isDragging ? "opacity-60" : ""}`}
    >
      <div
        {...(dragDisabled ? {} : attributes)}
        {...(dragDisabled ? {} : listeners)}
        className={`drag-handle mt-0.5 shrink-0 text-outline/35 transition-colors ${
          dragDisabled ? "cursor-default opacity-30" : "cursor-grab text-outline/50 hover:text-outline active:cursor-grabbing"
        }`}
        aria-hidden={dragDisabled}
      >
        <span className="material-symbols-outlined text-[22px]">drag_indicator</span>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={problem.resolved}
        onClick={() => onToggleResolved(problem.id)}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          problem.resolved
            ? "border-primary bg-primary text-on-primary"
            : "border-[#c4c5d5] bg-white group-hover:border-primary/50 dark:border-slate-600 dark:bg-transparent"
        }`}
      >
        {problem.resolved && (
          <span className="material-symbols-outlined text-[16px] leading-none">check</span>
        )}
      </button>

      <ProblemPriorityToggle
        isHighPriority={problem.isHighPriority}
        disabled={problem.resolved}
        onToggle={() => onTogglePriority(problem.id)}
      />

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <label className="sr-only" htmlFor={`problem-project-${problem.id}`}>
            Projeto
          </label>
          <div className="relative inline-flex shrink-0 max-w-[min(100%,12rem)] sm:max-w-[14rem]">
            <select
              id={`problem-project-${problem.id}`}
              value={problem.projectId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onProjectChange(problem.id, v === "" ? null : v);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={problem.resolved || isSavingProject}
              title="Projeto deste problema"
              className="w-full cursor-pointer appearance-none rounded-md border-0 py-1 pl-2.5 pr-9 text-xs font-black uppercase tracking-wide transition-[box-shadow] focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: badgeBg ?? "#e8eaf0",
                color: badgeFg ?? "#444653",
              }}
            >
              <option value="">Sem projeto</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {projectShortCode(proj.name)} — {proj.name}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
              aria-hidden
            >
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </span>
          </div>
          <h3
            className={`min-w-0 flex-1 font-headline text-sm font-semibold leading-snug transition-colors ${
              problem.resolved
                ? "text-on-surface-variant line-through"
                : "text-on-surface"
            }`}
          >
            {problem.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] leading-normal text-on-surface-variant/70">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">
              schedule
            </span>
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

      <div className="mt-0.5 flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onMoveToOtherKind(problem.id)}
          className="rounded-lg p-2 text-outline opacity-70 transition-all hover:bg-surface-container-high hover:text-primary"
          title={
            problem.kind === "market"
              ? "Mover para operacional"
              : "Mover para mercado (estratégico)"
          }
          aria-label={
            problem.kind === "market"
              ? "Mover problema para lista operacional"
              : "Mover problema para lista de mercado"
          }
        >
          <span className="material-symbols-outlined text-lg">swap_horiz</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(problem.id)}
          className="rounded-lg p-2 text-outline opacity-70 transition-all hover:bg-surface-container-high hover:text-error"
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
  const [tab, setTab] = useState<TabKey>("active");
  const [kindTab, setKindTab] = useState<ProblemKind>("market");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);

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

  const kindFiltered = useMemo(
    () => problems.filter((p) => p.kind === kindTab),
    [problems, kindTab]
  );

  const tabFiltered = useMemo(() => {
    if (tab === "active") return kindFiltered.filter((p) => !p.resolved);
    if (tab === "resolved") return kindFiltered.filter((p) => p.resolved);
    return [];
  }, [kindFiltered, tab]);

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

  /** Três primeiros problemas em aberto nesta vista — maior destaque (fila), independente do ícone de prioridade. */
  const topThreeQueueIds = useMemo(() => {
    if (tab !== "active") return new Set<string>();
    const unresolved = sortedList.filter((p) => !p.resolved);
    return new Set(unresolved.slice(0, 3).map((p) => p.id));
  }, [sortedList, tab]);

  const activeProblem = useMemo(
    () => (activeId ? problems.find((p) => p.id === activeId) : undefined),
    [activeId, problems]
  );

  const stats = useMemo(() => {
    const open = problems.filter((p) => p.kind === kindTab && !p.resolved);
    const projectKeys = new Set(open.map((p) => p.projectId ?? "none"));
    return { openCount: open.length, projectWithOpenCount: projectKeys.size };
  }, [problems, kindTab]);

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
        kind: kindTab,
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

  const togglePriority = async (id: string) => {
    const p = problems.find((x) => x.id === id);
    if (!p || p.resolved) return;
    setError(null);
    try {
      const row = await problemsService.updateProblem(id, {
        is_high_priority: !p.isHighPriority,
      });
      setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível alterar a prioridade: ${raw}`);
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

  const assignProject = async (id: string, projectId: string | null) => {
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    const same =
      (p.projectId === null && projectId === null) || p.projectId === projectId;
    if (same) return;
    setSavingProjectId(id);
    setError(null);
    try {
      const row = await problemsService.assignProblemProject(id, projectId);
      setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível atualizar o projeto: ${raw}`);
    } finally {
      setSavingProjectId(null);
    }
  };

  const moveToOtherKind = async (id: string) => {
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    const nextKind: ProblemKind = p.kind === "market" ? "operational" : "market";
    setError(null);
    try {
      const row = await problemsService.moveProblemKind(id, nextKind);
      setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível mover o problema: ${raw}`);
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

      {/* Entrada rápida — barra cinza única (mock Velocity): título + projeto no mesmo elemento */}
      <section className="mb-10">
        <div className="group relative rounded-2xl bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/10">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="material-symbols-outlined text-primary">add_circle</span>
          </div>
          <div className="flex flex-col gap-3 py-4 pl-12 pr-4 sm:flex-row sm:items-center sm:gap-4 sm:py-3 sm:pr-3">
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
              className="min-w-0 flex-1 border-0 bg-transparent py-2 font-headline text-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-0 sm:py-3"
            />
            <div className="flex shrink-0 items-center gap-2 sm:max-w-[min(100%,14rem)]">
              <label htmlFor="quick-problem-project" className="sr-only">
                Projeto
              </label>
              <select
                id="quick-problem-project"
                value={quickProjectId}
                onChange={(e) => setQuickProjectId(e.target.value)}
                className="w-full cursor-pointer rounded-lg border-0 bg-surface-container px-3 py-2.5 text-left text-sm font-semibold text-on-surface shadow-inner ring-1 ring-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/25"
                title="Projeto deste problema"
              >
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {projectShortCode(p.name)} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex shrink-0 items-center justify-end sm:justify-start">
              <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                Enter
              </span>
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

      {/* Tipo de problema: mercado vs operacional */}
      <div className="mb-6 flex items-center gap-8 border-b border-outline-variant/20 font-headline">
        {(["market", "operational"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindTab(k)}
            className={`border-b-2 px-2 pb-4 text-sm transition-all ${
              kindTab === k
                ? "border-primary font-bold text-primary"
                : "border-transparent font-medium text-on-surface-variant/60 hover:border-outline-variant/30 hover:text-on-surface"
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

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
                      projectColor={proj?.color ?? null}
                      isTopThreeSlot={topThreeQueueIds.has(p.id)}
                      stale={daysSince(p.createdAt) > 14}
                      dragDisabled={dragDisabled}
                      projects={projects}
                      isSavingProject={savingProjectId === p.id}
                      onToggleResolved={toggleResolved}
                      onTogglePriority={togglePriority}
                      onProjectChange={assignProject}
                      onMoveToOtherKind={moveToOtherKind}
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

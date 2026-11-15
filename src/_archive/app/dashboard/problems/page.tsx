"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProblemsData } from "@/contexts/ProblemsDataContext";
import { usePlanningData } from "@/hooks/usePlanningData";
import {
  problemsService,
  fromDbProblem,
  type Problem,
  type Project,
} from "@/lib/planning";
import {
  appendPosForAllProblems,
  appendPosOnHoldAtBottomAllProblems,
  computePosAtNewIndexForProblems,
  formatRelativeDaysPt,
  projectShortCode,
  sortProblemsForDisplay,
} from "@/lib/problemHelpers";
import {
  friendlySchemaHint,
  getSupabaseErrorMessage,
} from "@/lib/supabaseErrors";
import {
  osBtnGhost,
  osBtnPrimary,
  osCard,
  osEmptyState,
  osErrorBanner,
  osIconBtn,
  osIconBtnDanger,
  osInput,
  osInputRow,
  osLabelMuted,
  osNav,
  osNavLinkActive,
  osNavLinkIdle,
  osPage,
  osTaskRow,
  osTaskRowOnHold,
} from "@/lib/os-ui";
import { ProjectIdsPicker } from "@/components/ProjectIdsPicker";

const NONE = "__none__";
type TabKey = "active" | "resolved" | "archived";

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
      className={`mt-0.5 shrink-0 p-1 transition-colors focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-ta-paper-2"
      }`}
      title={isHighPriority ? "Clique para remover prioridade" : "Clique para marcar como prioridade"}
      aria-pressed={isHighPriority}
      aria-label={isHighPriority ? "Remover prioridade alta" : "Marcar como prioridade alta"}
    >
      <svg
        className={`h-4 w-4 ${isHighPriority ? "text-ta-red" : "text-ta-muted"}`}
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
  if (filter === NONE) return p.projectIds.length === 0;
  return p.projectIds.includes(filter);
}

function SortableProblemRow({
  problem,
  isTopThreeSlot,
  stale,
  dragDisabled,
  projects,
  isSavingProject,
  onToggleResolved,
  onTogglePriority,
  onProjectsChange,
  onToggleOnHold,
  onOpenEdit,
  isTitleExpanded,
  onToggleTitleExpanded,
  onDelete,
}: {
  problem: Problem;
  isTopThreeSlot: boolean;
  stale: boolean;
  dragDisabled: boolean;
  projects: Project[];
  isSavingProject: boolean;
  onToggleResolved: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onProjectsChange: (id: string, projectIds: string[]) => void;
  onToggleOnHold: (id: string) => void;
  onOpenEdit: (problem: Problem) => void;
  isTitleExpanded: boolean;
  onToggleTitleExpanded: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sortableId = String(problem.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardSurface = problem.onHold
    ? osTaskRowOnHold
    : isTopThreeSlot && !problem.resolved
      ? "border-ta-cyan bg-ta-paper-2"
      : "border-ta-ink bg-ta-paper";
  const shouldShowExpandTitle = problem.title.length > 110;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpenEdit(problem)}
      className={`group flex items-start gap-2 p-3 transition-colors hover:bg-ta-paper-2 ${osTaskRow} ${cardSurface} ${
        problem.resolved ? "opacity-60" : ""
      } ${isDragging ? "pointer-events-none opacity-0" : ""} cursor-pointer`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        disabled={dragDisabled}
        {...(dragDisabled ? {} : attributes)}
        {...(dragDisabled ? {} : listeners)}
        onClick={(e) => e.stopPropagation()}
        className={`drag-handle relative z-10 flex min-h-9 min-w-9 shrink-0 items-center justify-center touch-none select-none text-ta-muted transition-colors focus:outline-none ${
          dragDisabled ? "cursor-default opacity-30" : "cursor-grab hover:text-ta-ink active:cursor-grabbing"
        }`}
        aria-label="Arrastar para reordenar"
        aria-hidden={dragDisabled}
      >
        <span className="pointer-events-none material-symbols-outlined text-[20px]" aria-hidden>
          drag_indicator
        </span>
      </button>

      <button
        type="button"
        role="checkbox"
        aria-checked={problem.resolved}
        onClick={(e) => {
          e.stopPropagation();
          onToggleResolved(problem.id);
        }}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-[1.5px] transition-colors ${
          problem.resolved
            ? "border-ta-ink bg-ta-ink text-ta-paper"
            : "border-ta-ink bg-ta-paper group-hover:bg-ta-paper-2"
        }`}
      >
        {problem.resolved && (
          <span className="material-symbols-outlined text-[14px] leading-none">check</span>
        )}
      </button>

      <ProblemPriorityToggle
        isHighPriority={problem.isHighPriority}
        disabled={problem.resolved}
        onToggle={() => onTogglePriority(problem.id)}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        {/* Mesma ordem que as tasks: prioridade → tags (linha) → título */}
        <div className="flex min-w-0 items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <span className="sr-only">Projetos deste problema</span>
            <ProjectIdsPicker
              projects={projects}
              value={problem.projectIds}
              onChange={(ids) => onProjectsChange(problem.id, ids)}
              disabled={problem.resolved || isSavingProject}
              variant="line"
              className="shrink-0"
            />
          </div>
          <h3
            className={`min-w-0 flex-1 break-words text-xs font-bold normal-case leading-snug transition-colors ${
              problem.resolved
                ? "text-ta-muted line-through"
                : "text-ta-ink"
            } ${isTitleExpanded ? "line-clamp-none" : "line-clamp-2"}`}
            title={problem.title}
          >
            {problem.title}
          </h3>
          {problem.onHold && problem.onHoldReason && (
            <span
              className="max-w-[40%] shrink cursor-help truncate text-[10px] font-semibold normal-case text-ta-amber"
              title={problem.onHoldReason}
            >
              — em espera:{" "}
              {problem.onHoldReason.length > 24
                ? `${problem.onHoldReason.substring(0, 24)}...`
                : problem.onHoldReason}
            </span>
          )}
        </div>
        {shouldShowExpandTitle && (
          <div className="-mt-1 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTitleExpanded(problem.id);
              }}
              className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ta-cyan transition-colors hover:bg-ta-paper-2"
            >
              {isTitleExpanded ? "Ver menos" : "Ver mais"}
            </button>
          </div>
        )}
        {problem.description && (
          <p className="line-clamp-2 text-[10px] font-semibold normal-case text-ta-muted">
            {problem.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold normal-case leading-normal text-ta-muted">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {problem.resolved
              ? `Resolvido ${formatRelativeDaysPt(problem.updatedAt)}`
              : formatRelativeDaysPt(problem.createdAt)}
          </span>
          {stale && !problem.resolved && (
            <span className="inline-flex items-center gap-1 text-ta-red">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Atenção
            </span>
          )}
        </div>
      </div>

      <div className="mt-0.5 flex shrink-0 items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleOnHold(problem.id);
          }}
          disabled={problem.resolved}
          className={`${osIconBtn} ${
            problem.onHold ? "text-ta-amber" : ""
          } ${problem.resolved ? "cursor-not-allowed opacity-40" : ""}`}
          title={problem.onHold ? "Remover da espera" : "Colocar em espera"}
          aria-label={problem.onHold ? "Remover problema da espera" : "Colocar problema em espera"}
        >
          {problem.onHold ? (
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">pause_circle</span>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(problem.id);
          }}
          className={osIconBtnDanger}
          aria-label="Excluir problema"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const { user } = useAuthContext();
  const { projects } = usePlanningData();
  const { problems, setProblems, loading } = useProblemsData();
  const [tab, setTab] = useState<TabKey>("active");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [showOnHoldModal, setShowOnHoldModal] = useState(false);
  const [problemToPutOnHold, setProblemToPutOnHold] = useState<Problem | null>(null);
  const [onHoldReason, setOnHoldReason] = useState("");
  const [showEditProblemModal, setShowEditProblemModal] = useState(false);
  const [savingEditProblem, setSavingEditProblem] = useState(false);
  const [expandedTitleIds, setExpandedTitleIds] = useState<string[]>([]);
  const [editingProblem, setEditingProblem] = useState<{
    id: string;
    title: string;
    description: string;
    projectIds: string[];
  } | null>(null);

  /** Projetos do formulário rápido (vários) */
  const [quickProjectIds, setQuickProjectIds] = useState<string[]>([]);
  const quickInputRef = useRef<HTMLInputElement>(null);

  /** Reordenar sempre que a lista for DnD (antes bloqueava em "Todos" e o utilizador não conseguia arrastar). */
  const dragDisabled = false;

  /**
   * PointerSensor falha em alguns rato/trackpads Windows (exige isPrimary + button===0).
   * MouseSensor (mousedown) + TouchSensor cobrem desktop e ecrã tátil.
   */
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    copy.sort((a, b) => {
      const byRules = sortProblemsForDisplay(a, b);
      if (byRules !== 0) return byRules;
      return a.id.localeCompare(b.id);
    });
    return copy;
  }, [searched]);

  /** Três primeiros problemas em aberto nesta vista — maior destaque (fila), independente do ícone de prioridade. */
  const topThreeQueueIds = useMemo(() => {
    if (tab !== "active") return new Set<string>();
    const unresolved = sortedList.filter((p) => !p.resolved);
    return new Set(unresolved.slice(0, 3).map((p) => p.id));
  }, [sortedList, tab]);

  const activeProblem = useMemo(
    () => (activeId ? problems.find((p) => String(p.id) === activeId) : undefined),
    [activeId, problems]
  );

  const stats = useMemo(() => {
    const open = problems.filter((p) => !p.resolved);
    const projectKeys = new Set<string>();
    open.forEach((p) => {
      if (p.projectIds.length === 0) projectKeys.add("none");
      else p.projectIds.forEach((id) => projectKeys.add(id));
    });
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
        description: "",
        project_id: quickProjectIds[0] ?? null,
        project_ids: quickProjectIds,
        kind: "operational",
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
    const ids = sortedList.map((p) => String(p.id));
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

  const handleToggleOnHold = async (id: string) => {
    const p = problems.find((x) => x.id === id);
    if (!p || p.resolved) return;
    setError(null);
    if (p.onHold) {
      try {
        const pos = appendPosForAllProblems(problems, p.id);
        const row = await problemsService.updateProblem(id, {
          on_hold: false,
          on_hold_reason: null,
          pos,
        });
        setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
      } catch (e) {
        console.error(e);
        const raw = getSupabaseErrorMessage(e);
        setError(friendlySchemaHint(raw) ?? `Não foi possível remover da espera: ${raw}`);
      }
      return;
    }
    setProblemToPutOnHold(p);
    setOnHoldReason("");
    setShowOnHoldModal(true);
  };

  const handleConfirmOnHold = async () => {
    if (!problemToPutOnHold) return;
    if (!onHoldReason.trim()) {
      setError("Informe o motivo da espera.");
      return;
    }
    try {
      const pos = appendPosOnHoldAtBottomAllProblems(
        problems,
        problemToPutOnHold.id
      );
      const row = await problemsService.updateProblem(problemToPutOnHold.id, {
        on_hold: true,
        on_hold_reason: onHoldReason.trim(),
        pos,
      });
      setProblems((prev) =>
        prev.map((x) => (x.id === problemToPutOnHold.id ? fromDbProblem(row) : x))
      );
      setShowOnHoldModal(false);
      setProblemToPutOnHold(null);
      setOnHoldReason("");
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível colocar em espera: ${raw}`);
    }
  };

  const handleCancelOnHold = () => {
    setShowOnHoldModal(false);
    setProblemToPutOnHold(null);
    setOnHoldReason("");
  };

  const handleOpenEditProblem = (problem: Problem) => {
    setEditingProblem({
      id: problem.id,
      title: problem.title,
      description: problem.description ?? "",
      projectIds: [...problem.projectIds],
    });
    setShowEditProblemModal(true);
    setError(null);
  };

  const handleCancelEditProblem = () => {
    if (savingEditProblem) return;
    setShowEditProblemModal(false);
    setEditingProblem(null);
  };

  const toggleTitleExpanded = (problemId: string) => {
    setExpandedTitleIds((prev) =>
      prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId]
    );
  };

  const handleSaveEditProblem = async () => {
    if (!editingProblem) return;
    if (!editingProblem.title.trim()) {
      setError("Informe o título do problema.");
      return;
    }
    const original = problems.find((p) => p.id === editingProblem.id);
    if (!original) return;
    setSavingEditProblem(true);
    setError(null);
    try {
      let row = await problemsService.updateProblem(editingProblem.id, {
        title: editingProblem.title.trim(),
        description: editingProblem.description.trim() || null,
      });
      const oldProjects = [...original.projectIds].sort().join(",");
      const newProjects = [...editingProblem.projectIds].sort().join(",");
      if (oldProjects !== newProjects) {
        row = await problemsService.setProblemProjects(editingProblem.id, editingProblem.projectIds);
      }
      setProblems((prev) => prev.map((p) => (p.id === editingProblem.id ? fromDbProblem(row) : p)));
      setShowEditProblemModal(false);
      setEditingProblem(null);
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível salvar o problema: ${raw}`);
    } finally {
      setSavingEditProblem(false);
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

  const assignProjects = async (id: string, projectIds: string[]) => {
    const p = problems.find((x) => x.id === id);
    if (!p) return;
    const a = [...p.projectIds].sort().join(",");
    const b = [...projectIds].sort().join(",");
    if (a === b) return;
    setSavingProjectId(id);
    setError(null);
    try {
      const row = await problemsService.setProblemProjects(id, projectIds);
      setProblems((prev) => prev.map((x) => (x.id === id ? fromDbProblem(row) : x)));
    } catch (e) {
      console.error(e);
      const raw = getSupabaseErrorMessage(e);
      setError(friendlySchemaHint(raw) ?? `Não foi possível atualizar os projetos: ${raw}`);
    } finally {
      setSavingProjectId(null);
    }
  };

  const daysSince = (iso: string) =>
    (Date.now() - new Date(iso).getTime()) / 86400000;

  if (loading && problems.length === 0 && projects.length === 0) {
    return (
      <div className={`flex min-h-[40vh] items-center justify-center ${osEmptyState} border-0`}>
        Carregando...
      </div>
    );
  }

  return (
    <div className={osPage}>
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold tracking-[0.12em]">Problemas</h1>
          <div className={osNav}>
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
                className={`flex-1 px-4 py-2.5 ${tab === key ? osNavLinkActive : osNavLinkIdle}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`relative ${osInputRow}`}>
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ta-muted">
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca rápida…"
              className="min-w-[12rem] border-0 bg-transparent py-2 pl-10 pr-4 text-xs font-semibold normal-case tracking-normal outline-none placeholder:text-ta-muted sm:w-48"
            />
          </div>
          <button
            type="button"
            onClick={focusQuickAdd}
            className={osBtnPrimary}
          >
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo problema
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className={osErrorBanner} role="alert">
          {error}
        </div>
      )}

      {/* Entrada rápida */}
      <section className="mb-8">
        <div className={osInputRow}>
          <div className="pointer-events-none flex items-center pl-3 text-ta-cyan">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 py-2 pl-2 pr-3 sm:flex-row sm:items-center sm:gap-4">
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
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm font-bold normal-case tracking-normal outline-none placeholder:text-ta-muted disabled:opacity-50"
            />
            <div className="flex min-w-0 max-w-full shrink flex-wrap items-center gap-2 sm:max-w-[min(100%,22rem)]">
              <span className="sr-only">Projetos</span>
              <ProjectIdsPicker
                projects={projects}
                value={quickProjectIds}
                onChange={setQuickProjectIds}
                variant="default"
              />
            </div>
            <span className={`shrink-0 ${osLabelMuted}`}>Enter</span>
          </div>
        </div>
      </section>

      {/* Filtro por projeto */}
      <section className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className={osLabelMuted}>Filtro por projeto</h2>
          <Link
            href="/dashboard/planning"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ta-cyan"
          >
            <span className="material-symbols-outlined text-sm">folder</span>
            Gerir projetos
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterProjectId("all")}
            className={`border-[1.5px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
              filterProjectId === "all"
                ? "border-ta-ink bg-ta-ink text-ta-paper"
                : "border-ta-ink bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterProjectId(NONE)}
            className={`border-[1.5px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
              filterProjectId === NONE
                ? "border-ta-ink bg-ta-ink text-ta-paper"
                : "border-ta-ink bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
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
                className={`border-[1.5px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-ta-ink text-ta-paper"
                    : "border-ta-ink bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
                }`}
                style={
                  active
                    ? { backgroundColor: p.color }
                    : { boxShadow: `inset 3px 0 0 0 ${p.color}` }
                }
              >
                {code}
              </button>
            );
          })}
          <Link
            href="/dashboard/planning"
            className="inline-flex h-9 w-9 items-center justify-center border-[1.5px] border-ta-ink bg-ta-paper text-ta-muted transition-colors hover:bg-ta-paper-2 hover:text-ta-ink"
            title="Novo projeto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </Link>
        </div>
        {tab !== "archived" && (
          <p className={`${osLabelMuted} normal-case`}>
            Arraste pelo ícone à esquerda para alterar a ordem.
          </p>
        )}
      </section>

      {/* Lista */}
      {tab === "archived" ? (
        <div className={osEmptyState}>
          Arquivamento em breve — por agora use <strong className="normal-case">Resolvidos</strong>.
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
            items={sortedList.map((p) => String(p.id))}
            strategy={verticalListSortingStrategy}
          >
            <section className="space-y-2">
              {sortedList.length === 0 ? (
                <p className={osEmptyState}>
                  Nenhum problema nesta vista. Use o campo acima ou <strong className="normal-case">Novo problema</strong>.
                </p>
              ) : (
                sortedList.map((p) => (
                  <SortableProblemRow
                    key={p.id}
                    problem={p}
                    isTopThreeSlot={topThreeQueueIds.has(p.id)}
                    stale={daysSince(p.createdAt) > 14}
                    dragDisabled={dragDisabled}
                    projects={projects}
                    isSavingProject={savingProjectId === p.id}
                    onToggleResolved={toggleResolved}
                    onTogglePriority={togglePriority}
                    onProjectsChange={assignProjects}
                    onToggleOnHold={handleToggleOnHold}
                    onOpenEdit={handleOpenEditProblem}
                    isTitleExpanded={expandedTitleIds.includes(p.id)}
                    onToggleTitleExpanded={toggleTitleExpanded}
                    onDelete={deleteProblem}
                  />
                ))
              )}
            </section>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeProblem ? (
              <div className={`${osCard} px-4 py-3 shadow-lg`}>
                <p className="text-xs font-bold normal-case text-ta-ink">
                  {activeProblem.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Resumo */}
      <div className={`mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${osCard}`}>
        <div>
          <h3 className="text-sm font-bold tracking-[0.12em]">Visão geral</h3>
          <p className="mt-2 text-xs font-semibold normal-case tracking-normal text-ta-muted">
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
          className={`${osBtnGhost} opacity-50`}
        >
          Gerar relatório
        </button>
      </div>

      {showOnHoldModal && (
        <ModalOverlay
          isOpen={showOnHoldModal}
          onClose={handleCancelOnHold}
          onBackdropClick={handleConfirmOnHold}
        >
          <ModalPanel maxWidthClass="max-w-md" padding="none">
            <div className="flex items-center justify-between border-b-[1.5px] border-ta-ink p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Colocar em espera</h2>
              <button
                onClick={handleCancelOnHold}
                className={osIconBtn}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <label htmlFor="problem_on_hold_reason" className={`mb-2 block ${osLabelMuted}`}>
                Motivo da espera
              </label>
              <textarea
                id="problem_on_hold_reason"
                value={onHoldReason}
                onChange={(e) => setOnHoldReason(e.target.value)}
                placeholder="Explique por que este problema está aguardando..."
                className={`w-full resize-none px-3 py-2 text-xs font-semibold normal-case tracking-normal ${osInput}`}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 border-t-[1.5px] border-ta-ink p-6">
              <button onClick={handleCancelOnHold} className={osBtnGhost}>
                Cancelar
              </button>
              <button
                onClick={handleConfirmOnHold}
                disabled={!onHoldReason.trim()}
                className={osBtnPrimary}
              >
                Confirmar
              </button>
            </div>
          </ModalPanel>
        </ModalOverlay>
      )}

      {showEditProblemModal && editingProblem && (
        <ModalOverlay
          isOpen={showEditProblemModal}
          onClose={handleCancelEditProblem}
          onBackdropClick={handleSaveEditProblem}
        >
          <ModalPanel maxWidthClass="max-w-2xl" padding="none">
            <div className="flex items-center justify-between border-b-[1.5px] border-ta-ink p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Editar problema</h2>
              <button
                onClick={handleCancelEditProblem}
                className={osIconBtn}
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label htmlFor="problem_edit_title" className={`mb-2 block ${osLabelMuted}`}>
                  Título
                </label>
                <input
                  id="problem_edit_title"
                  type="text"
                  value={editingProblem.title}
                  onChange={(e) =>
                    setEditingProblem((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  placeholder="Título do problema..."
                  className={`w-full px-3 py-2 text-xs font-semibold normal-case tracking-normal ${osInput}`}
                />
              </div>
              <div>
                <label htmlFor="problem_edit_description" className={`mb-2 block ${osLabelMuted}`}>
                  Descrição
                </label>
                <textarea
                  id="problem_edit_description"
                  value={editingProblem.description}
                  onChange={(e) =>
                    setEditingProblem((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  placeholder="Adicione detalhes, contexto, hipótese, evidências..."
                  rows={6}
                  className={`w-full resize-none px-3 py-2 text-xs font-semibold normal-case tracking-normal ${osInput}`}
                />
              </div>
              <div>
                <span className={`mb-2 block ${osLabelMuted}`}>Projetos</span>
                <ProjectIdsPicker
                  projects={projects}
                  value={editingProblem.projectIds}
                  onChange={(ids) =>
                    setEditingProblem((prev) =>
                      prev ? { ...prev, projectIds: ids } : prev
                    )
                  }
                  variant="default"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t-[1.5px] border-ta-ink p-6">
              <button onClick={handleCancelEditProblem} className={osBtnGhost}>
                Cancelar
              </button>
              <button
                onClick={handleSaveEditProblem}
                disabled={savingEditProblem || !editingProblem.title.trim()}
                className={osBtnPrimary}
              >
                {savingEditProblem ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </ModalPanel>
        </ModalOverlay>
      )}
    </div>
  );
}

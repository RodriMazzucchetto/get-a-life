"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
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
import {
  createOsGoal,
  deleteOsGoal,
  fetchGoalsForBlock,
  reorderGoalsForBlock,
  setGoalPriority,
  toggleGoalDone,
  updateOsGoal,
} from "@/lib/os-queries";
import { osCard, osDivider, osIconBtn, osInput, osLabelMuted } from "@/lib/os-ui";
import type { OsGoalRow } from "@/lib/os-types";

interface GoalBacklogPanelProps {
  blockId: string;
  userId: string;
  onGoalsChanged: () => void; // callback para refreshBoard após mutações
}

function SortableGoalRow({
  goal,
  onPrioritize,
  onToggleDone,
  onEdit,
  onDelete,
  isPrioritizing,
  isToggling,
  isDeleting,
}: {
  goal: OsGoalRow;
  onPrioritize: (id: string) => void;
  onToggleDone: (id: string, done: boolean) => void;
  onEdit: (goal: OsGoalRow) => void;
  onDelete: (id: string) => void;
  isPrioritizing: boolean;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isDone = goal.status === "achieved";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-0 border-b last:border-b-0 ${osDivider} ${isDone ? "opacity-60" : ""}`}
    >
      {/* drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Arrastar"
        className="flex h-full w-7 shrink-0 cursor-grab items-center justify-center self-stretch text-ta-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </button>

      {/* priority star */}
      <button
        type="button"
        aria-label={goal.is_priority ? "Meta prioritária" : "Definir como prioritária"}
        disabled={isPrioritizing || isDone}
        onClick={() => onPrioritize(goal.id)}
        className={`flex h-full w-7 shrink-0 items-center justify-center self-stretch transition-colors disabled:opacity-40 ${
          goal.is_priority
            ? "text-ta-amber"
            : "text-ta-muted opacity-0 hover:text-ta-amber group-hover:opacity-100"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: goal.is_priority ? '"FILL" 1' : '"FILL" 0' }}>
          star
        </span>
      </button>

      {/* checkbox done */}
      <button
        type="button"
        aria-label={isDone ? "Marcar como ativa" : "Marcar como concluída"}
        disabled={isToggling}
        onClick={() => onToggleDone(goal.id, !isDone)}
        className="flex h-full w-7 shrink-0 items-center justify-center self-stretch text-ta-muted transition-colors hover:text-ta-ink disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isDone ? '"FILL" 1' : '"FILL" 0' }}>
          {isDone ? "check_circle" : "circle"}
        </span>
      </button>

      {/* title */}
      <p
        className={`min-w-0 flex-1 py-2 pr-1 text-xs font-bold normal-case leading-relaxed ${
          isDone ? "line-through text-ta-muted" : "text-ta-ink"
        }`}
      >
        {goal.title}
      </p>

      {/* edit + delete (hover) */}
      <div className="flex shrink-0 items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="Editar meta"
          disabled={isDeleting}
          onClick={() => onEdit(goal)}
          className={`${osIconBtn} text-ta-muted`}
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button
          type="button"
          aria-label="Excluir meta"
          disabled={isDeleting}
          onClick={() => onDelete(goal.id)}
          className={`${osIconBtn} text-ta-red/70 hover:text-ta-red`}
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export function GoalBacklogPanel({ blockId, userId, onGoalsChanged }: GoalBacklogPanelProps) {
  const [goals, setGoals] = useState<OsGoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prioritizingId, setPrioritizingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editingGoal, setEditingGoal] = useState<OsGoalRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [addTitle, setAddTitle] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const addInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const data = await fetchGoalsForBlock(blockId);

      let active = data
        .filter((g) => g.status === "active")
        .sort((a, b) => {
          if (a.is_priority && !b.is_priority) return -1;
          if (!a.is_priority && b.is_priority) return 1;
          // fallback: mais recentemente actualizada primeiro
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

      // Se nenhuma tiver is_priority=true (migration ainda não aplicada),
      // marcar a primeira (mais recente) como prioritária visualmente
      const hasExplicitPriority = active.some((g) => g.is_priority);
      if (!hasExplicitPriority && active.length > 0) {
        active = active.map((g, i) => ({ ...g, is_priority: i === 0 }));
      }

      const done = data.filter((g) => g.status !== "active");
      setGoals([...active, ...done]);
    } catch {
      setError("Erro ao carregar metas.");
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  useEffect(() => { void load(); }, [load]);

  const handlePrioritize = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    setPrioritizingId(goalId);
    try {
      const updated = await setGoalPriority(goalId, blockId);
      setGoals((prev) => prev.map((g) => ({ ...g, is_priority: g.id === updated.id })));
      onGoalsChanged();
    } catch {
      setError("Erro ao definir prioridade.");
    } finally {
      setPrioritizingId(null);
    }
  };

  const handleToggleDone = async (goalId: string, done: boolean) => {
    setTogglingId(goalId);
    try {
      const updated = await toggleGoalDone(goalId, done);
      setGoals((prev) => {
        const next = prev.map((g) => (g.id === goalId ? updated : g));
        const active = next.filter((g) => g.status === "active");
        const achieved = next.filter((g) => g.status !== "active");
        return [...active, ...achieved];
      });
      onGoalsChanged();
    } catch {
      setError("Erro ao alterar estado.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (goalId: string) => {
    setDeletingId(goalId);
    setConfirmDeleteId(null);
    try {
      await deleteOsGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      onGoalsChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erro ao excluir: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingGoal || !editTitle.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateOsGoal(editingGoal.id, { title: editTitle.trim() });
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setEditingGoal(null);
      onGoalsChanged();
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddGoal = async () => {
    if (!addTitle.trim()) return;
    setAddSaving(true);
    try {
      const activeGoals = goals.filter((g) => g.status === "active");
      const maxPos = activeGoals.length > 0 ? Math.max(...activeGoals.map((g) => g.pos ?? 0)) : 0;
      const created = await createOsGoal(userId, blockId, addTitle.trim());
      setGoals((prev) => {
        const active = [...prev.filter((g) => g.status === "active"), { ...created, pos: maxPos + 1000, is_priority: false }];
        const achieved = prev.filter((g) => g.status !== "active");
        return [...active, ...achieved];
      });
      setAddTitle("");
      onGoalsChanged();
    } catch {
      setError("Erro ao criar meta.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIdx = goals.findIndex((g) => g.id === active.id);
    const overIdx = goals.findIndex((g) => g.id === over.id);
    if (activeIdx < 0 || overIdx < 0) return;

    // só reorder dentro de activas
    if (goals[activeIdx].status !== "active" || goals[overIdx].status !== "active") return;

    const reordered = arrayMove(goals, activeIdx, overIdx);
    setGoals(reordered);
    try {
      await reorderGoalsForBlock(reordered.filter((g) => g.status === "active").map((g) => g.id));
    } catch {
      setError("Erro ao reordenar.");
      void load();
    }
  };

  if (loading) {
    return (
      <div className={`mt-0 border-t ${osDivider} px-3 py-3`}>
        <p className={`text-center ${osLabelMuted} normal-case`}>carregando...</p>
      </div>
    );
  }

  return (
    <div className={`border-t ${osDivider} bg-ta-paper`}>
      {error ? (
        <p className="px-3 py-1 text-[10px] font-bold text-ta-red">{error}</p>
      ) : null}

      {/* Lista de metas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <SortableContext items={goals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {goals.length === 0 ? (
            <p className={`px-3 py-3 text-center ${osLabelMuted} normal-case`}>Sem metas. Cria uma abaixo.</p>
          ) : (
            goals.map((goal) => {
              if (editingGoal?.id === goal.id) {
                return (
                  <div key={goal.id} className={`flex items-center gap-2 border-b px-3 py-2 ${osDivider}`}>
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleEditSave();
                        if (e.key === "Escape") setEditingGoal(null);
                      }}
                      className={`flex-1 px-2 py-1 text-xs font-bold normal-case ${osInput}`}
                    />
                    <button
                      type="button"
                      onClick={() => void handleEditSave()}
                      disabled={editSaving}
                      className="text-[10px] font-bold uppercase text-ta-ink hover:underline disabled:opacity-50"
                    >
                      {editSaving ? "..." : "ok"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGoal(null)}
                      className="text-[10px] font-bold uppercase text-ta-muted hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                );
              }

              if (confirmDeleteId === goal.id) {
                return (
                  <div key={goal.id} className={`flex items-center gap-2 border-b px-3 py-2 ${osDivider}`}>
                    <p className="min-w-0 flex-1 truncate text-[10px] font-bold normal-case text-ta-red">
                      Excluir &ldquo;{goal.title}&rdquo;?
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="text-[10px] font-bold uppercase text-ta-red hover:underline disabled:opacity-50"
                    >
                      {deletingId === goal.id ? "..." : "sim"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[10px] font-bold uppercase text-ta-muted hover:underline"
                    >
                      não
                    </button>
                  </div>
                );
              }

              return (
                <SortableGoalRow
                  key={goal.id}
                  goal={goal}
                  onPrioritize={handlePrioritize}
                  onToggleDone={handleToggleDone}
                  onEdit={(g) => { setEditingGoal(g); setEditTitle(g.title); }}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  isPrioritizing={prioritizingId === goal.id}
                  isToggling={togglingId === goal.id}
                  isDeleting={deletingId === goal.id}
                />
              );
            })
          )}
        </SortableContext>
      </DndContext>

      {/* Adicionar nova meta */}
      <div className={`flex items-center gap-0 border-t ${osDivider}`}>
        <input
          ref={addInputRef}
          type="text"
          placeholder="Nova meta..."
          value={addTitle}
          onChange={(e) => setAddTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleAddGoal(); }}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs font-bold normal-case placeholder:text-ta-muted/60 outline-none"
        />
        <button
          type="button"
          onClick={() => void handleAddGoal()}
          disabled={addSaving || !addTitle.trim()}
          className="flex items-center justify-center px-3 py-2 text-ta-muted transition-colors hover:text-ta-ink disabled:opacity-40"
          aria-label="Adicionar meta"
        >
          <span className="material-symbols-outlined text-[18px]">{addSaving ? "sync" : "add"}</span>
        </button>
      </div>
    </div>
  );
}

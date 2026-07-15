"use client";

import { useCallback, useMemo, useState } from "react";
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
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { PitchModal, type PitchFormData } from "@/components/os/PitchModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  computeNextPitchPos,
  createOsBet,
  createOsTask,
  deleteOsBet,
  deleteOsTask,
  fetchOsBetUpdatesForBet,
  fetchOsTasksForBet,
  partitionBetsByPriority,
  removeBetFromBoardViews,
  reorderOsBetsInGoal,
  setOsBetPriority,
  updateOsBet,
  type OsBlockView,
} from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateRow, OsBlockType, OsTaskRow } from "@/lib/os-types";
import { osCacheKey, packBoardCache, setOsCache } from "@/lib/os-cache";
import { osEmptyState, osErrorBanner } from "@/lib/os-ui";

function SortablePitchCard({
  bet,
  onOpen,
  onDelete,
  onTogglePriority,
  deleting,
  priorityLoading,
}: {
  bet: OsBetRow;
  onOpen: (bet: OsBetRow) => void;
  onDelete: (betId: string) => void;
  onTogglePriority: (bet: OsBetRow) => void;
  deleting: boolean;
  priorityLoading: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: bet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (confirmDelete) {
    return (
      <div ref={setNodeRef} style={style} className="os-pitch-item-delete">
        <span className="msg">Excluir &ldquo;{bet.title}&rdquo;?</span>
        <button
          type="button"
          className="confirm"
          onClick={() => {
            setConfirmDelete(false);
            onDelete(bet.id);
          }}
          disabled={deleting}
        >
          {deleting ? "…" : "Sim"}
        </button>
        <button type="button" onClick={() => setConfirmDelete(false)}>
          Não
        </button>
      </div>
    );
  }

  return (
    <article ref={setNodeRef} style={style} className={`os-pitch-item ${bet.is_priority ? "on" : ""}`}>
      <button
        type="button"
        className="priority-check"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePriority(bet);
        }}
        disabled={priorityLoading}
        aria-pressed={bet.is_priority}
        aria-label={bet.is_priority ? "Remover prioridade" : "Marcar como prioritário"}
      />
      <button type="button" className="body" onClick={() => onOpen(bet)}>
        <div className="t">{bet.title}</div>
        {bet.pitch_outcome ? <div className="d">{bet.pitch_outcome}</div> : null}
      </button>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="handle"
          aria-label="Arrastar aposta"
        >
          <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(true);
          }}
          disabled={deleting}
          className="delete-btn"
          aria-label="Excluir aposta"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </article>
  );
}

function PitchColumn({
  blockView,
  onOpenPitch,
  onDeletePitch,
  onTogglePriority,
  onAddPitch,
  deletingId,
  priorityLoadingId,
}: {
  blockView: OsBlockView;
  onOpenPitch: (bet: OsBetRow, blockType: OsBlockType) => void;
  onDeletePitch: (betId: string) => void;
  onTogglePriority: (bet: OsBetRow, blockType: OsBlockType) => void;
  onAddPitch: (blockType: OsBlockType) => void;
  deletingId: string | null;
  priorityLoadingId: string | null;
}) {
  const blockType = blockView.block.type as OsBlockType;
  const blockLabel = OS_BLOCK_LABELS[blockType];
  const dotColor = OS_BLOCK_DOT_COLORS[blockType];
  const goalTitle = blockView.goal?.title ?? "Meta não definida";
  const bets = blockView.bets;

  return (
    <section className="os-pitch-col">
      <header className="os-pitch-col-head">
        <span className="dot" style={{ backgroundColor: dotColor }} aria-hidden />
        <span className="name">{blockLabel}</span>
        <span className="count">{bets.length}</span>
      </header>

      <div className="os-pitch-col-target">
        <span className="lab">Meta</span>
        {goalTitle}
      </div>

      <SortableContext items={bets.map((bet) => bet.id)} strategy={verticalListSortingStrategy}>
        <div className="os-pitch-col-list">
          {bets.length === 0 ? (
            <p className="os-pitch-col-empty">Nenhuma aposta neste pilar</p>
          ) : (
            bets.map((bet) => (
              <SortablePitchCard
                key={bet.id}
                bet={bet}
                onOpen={() => onOpenPitch(bet, blockType)}
                onDelete={onDeletePitch}
                onTogglePriority={() => onTogglePriority(bet, blockType)}
                deleting={deletingId === bet.id}
                priorityLoading={priorityLoadingId === bet.id}
              />
            ))
          )}
          <button type="button" className="os-pitch-add" onClick={() => onAddPitch(blockType)}>
            <span className="plus">+</span> Nova aposta
          </button>
        </div>
      </SortableContext>
    </section>
  );
}

function findBlockForBet(blocks: OsBlockView[], betId: string): OsBlockView | undefined {
  return blocks.find((blockView) => blockView.bets.some((bet) => bet.id === betId));
}

export default function OsPitchPage() {
  const { user } = useAuthContext();
  const {
    selectedProjectId,
    loadingProjects,
    projects,
    board,
    latestUpdates,
    boardReady,
    boardLoading,
    boardError,
    refreshBoard,
    refreshTasks,
    setBoard,
    setLatestUpdates,
  } = useOsLayout();
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<OsBetRow | null>(null);
  const [editingBlockType, setEditingBlockType] = useState<OsBlockType>("finance");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priorityLoadingId, setPriorityLoadingId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [pitchTasks, setPitchTasks] = useState<OsTaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [weeklyUpdates, setWeeklyUpdates] = useState<OsBetUpdateRow[]>([]);
  const [weeklyUpdatesLoading, setWeeklyUpdatesLoading] = useState(false);
  const [modalPriority, setModalPriority] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedBlocks = useMemo(
    () =>
      OS_BLOCK_TYPES.map((type) => board.find((blockView) => blockView.block.type === type)).filter(
        (blockView): blockView is OsBlockView => Boolean(blockView)
      ),
    [board]
  );

  const blockGoals = useMemo(() => {
    const goals: Record<OsBlockType, { id: string; title: string } | null> = {
      finance: null,
      growth: null,
      ops: null,
    };
    for (const blockView of orderedBlocks) {
      const blockType = blockView.block.type as OsBlockType;
      if (blockView.goal) {
        goals[blockType] = { id: blockView.goal.id, title: blockView.goal.title };
      }
    }
    return goals;
  }, [orderedBlocks]);

  const loadPitchTasks = useCallback(async (betId: string) => {
    setTasksLoading(true);
    try {
      const tasks = await fetchOsTasksForBet(betId);
      setPitchTasks(tasks);
    } catch (taskError) {
      console.error("Erro ao carregar tasks da aposta:", taskError);
      setPitchTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const loadAllWeeklyUpdates = useCallback(async (betId: string) => {
    setWeeklyUpdatesLoading(true);
    try {
      setWeeklyUpdates(await fetchOsBetUpdatesForBet(betId));
    } catch {
      setWeeklyUpdates([]);
    } finally {
      setWeeklyUpdatesLoading(false);
    }
  }, []);

  const openCreateModal = (blockType: OsBlockType = "finance") => {
    setEditingPitch(null);
    setEditingBlockType(blockType);
    setModalPriority(false);
    setPitchTasks([]);
    setWeeklyUpdates([]);
    setModalOpen(true);
  };

  const openEditModal = (bet: OsBetRow, blockType: OsBlockType) => {
    setEditingPitch(bet);
    setEditingBlockType(blockType);
    setModalPriority(bet.is_priority);
    setModalOpen(true);
    void loadPitchTasks(bet.id);
    if (bet.is_priority) void loadAllWeeklyUpdates(bet.id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPitch(null);
    setPitchTasks([]);
    setWeeklyUpdates([]);
    setModalPriority(false);
  };

  const resolveGoalId = (blockType: OsBlockType): string | null => {
    const blockView = orderedBlocks.find((view) => view.block.type === blockType);
    return blockView?.goal?.id ?? null;
  };

  const handleTogglePriority = async (bet: OsBetRow, blockType: OsBlockType) => {
    const goalId = resolveGoalId(blockType);
    if (!goalId) return;

    setPriorityLoadingId(bet.id);
    setError(null);
    try {
      const updated = await setOsBetPriority(bet.id, !bet.is_priority);
      if (editingPitch?.id === bet.id) {
        setEditingPitch(updated);
        setModalPriority(updated.is_priority);
        if (updated.is_priority) {
          void loadAllWeeklyUpdates(bet.id);
          void loadPitchTasks(bet.id);
        } else {
          setWeeklyUpdates([]);
          setPitchTasks([]);
        }
      }
      await refreshBoard({ background: true, force: true });
    } catch (priorityError) {
      console.error("Erro ao alterar prioridade:", priorityError);
      setError("Não foi possível alterar a prioridade da aposta.");
    } finally {
      setPriorityLoadingId(null);
    }
  };

  const handleModalTogglePriority = async () => {
    if (!editingPitch) return;
    await handleTogglePriority(editingPitch, editingBlockType);
  };

  const handleAddTask = async (title: string) => {
    if (!user || !editingPitch || !selectedProjectId) return;

    await createOsTask(user.id, {
      projectId: selectedProjectId,
      betId: editingPitch.id,
      title,
    });
    await loadPitchTasks(editingPitch.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteOsTask(taskId);
    if (editingPitch) await loadPitchTasks(editingPitch.id);
  };

  const handleSavePitch = async (data: PitchFormData) => {
    if (!user) return;

    const goalId = resolveGoalId(data.blockType);
    if (!goalId) return;

    setSaving(true);
    try {
      if (editingPitch) {
        const currentBlock = orderedBlocks.find((view) =>
          view.bets.some((bet) => bet.id === editingPitch.id)
        );
        const currentGoalId = currentBlock?.goal?.id;

        await updateOsBet(editingPitch.id, {
          title: data.title.trim(),
          pitchOutcome: data.pitchOutcome.trim() || null,
          pitchObjective: data.pitchObjective.trim() || null,
          appetiteScope: data.appetiteScope.trim() || null,
          pitchData: data.pitchData.trim() || null,
          successCriteria: data.successCriteria.trim() || null,
          failureModes: data.failureModes.trim() || null,
          executionOwner: data.executionOwner || null,
          ...(currentGoalId !== goalId ? { goalId } : {}),
        });
      } else {
        const blockView = orderedBlocks.find((view) => view.block.type === data.blockType);
        const pos = computeNextPitchPos(blockView?.bets ?? []);
        await createOsBet(user.id, {
          goalId,
          title: data.title.trim(),
          pitchOutcome: data.pitchOutcome.trim() || undefined,
          pitchObjective: data.pitchObjective.trim() || undefined,
          appetiteScope: data.appetiteScope.trim() || undefined,
          pitchData: data.pitchData.trim() || undefined,
          successCriteria: data.successCriteria.trim() || undefined,
          failureModes: data.failureModes.trim() || undefined,
          executionOwner: data.executionOwner || undefined,
          pos,
        });
      }
      closeModal();
      await refreshBoard({ background: true, force: true });
    } catch (saveError) {
      console.error("Erro ao salvar aposta:", saveError);
      setError("Não foi possível salvar a aposta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePitch = async (betId: string) => {
    setDeletingId(betId);
    setError(null);
    try {
      await deleteOsBet(betId);

      const nextBoard = removeBetFromBoardViews(board, betId);
      const nextUpdates = new Map(latestUpdates);
      nextUpdates.delete(betId);
      setBoard(nextBoard);
      setLatestUpdates(nextUpdates);

      if (user?.id && selectedProjectId) {
        setOsCache(
          osCacheKey(user.id, "board", selectedProjectId),
          packBoardCache({ board: nextBoard, latestUpdates: nextUpdates })
        );
      }

      if (editingPitch?.id === betId) closeModal();
      await refreshBoard({ background: true, force: true });
      await refreshTasks({ background: true, force: true });
    } catch (deleteError) {
      const msg = deleteError instanceof Error ? deleteError.message : String(deleteError);
      console.error("Erro ao excluir aposta:", msg);
      setError(`Erro ao excluir: ${msg}`);
      await refreshBoard({ background: true, force: true });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const column = findBlockForBet(board, activeId);

    if (!column || !column.bets.some((bet) => bet.id === overId)) return;

    const oldIndex = column.bets.findIndex((bet) => bet.id === activeId);
    const newIndex = column.bets.findIndex((bet) => bet.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = partitionBetsByPriority(arrayMove(column.bets, oldIndex, newIndex));
    const orderedIds = reordered.map((bet) => bet.id);

    setBoard((prev) =>
      prev.map((blockView) =>
        blockView.block.id === column.block.id
          ? { ...blockView, bets: reordered, priorityBet: reordered.find((bet) => bet.is_priority) ?? null }
          : blockView
      )
    );

    try {
      await reorderOsBetsInGoal(orderedIds);
    } catch (reorderError) {
      console.error("Erro ao reordenar apostas:", reorderError);
      setError("Não foi possível reordenar as apostas.");
      await refreshBoard({ background: true, force: true });
    }
  };

  const activeDragBet = activeDragId
    ? board.flatMap((view) => view.bets).find((bet) => bet.id === activeDragId)
    : null;

  return (
    <div className="pb-8">
      <OsCompanySelector />

      {error || boardError ? (
        <div className={osErrorBanner}>{error ?? boardError}</div>
      ) : null}

      <div className="os-pitch-head">
        <h2>Apostas</h2>
        <button
          type="button"
          className="os-btn-add"
          onClick={() => openCreateModal()}
          disabled={!selectedProjectId || (!boardReady && boardLoading)}
        >
          + Adicionar aposta
        </button>
      </div>

      {(loadingProjects && projects.length === 0) ||
      (!boardReady && boardLoading && board.length === 0) ? (
        <div className={osEmptyState}>Carregando apostas...</div>
      ) : !selectedProjectId ? (
        <div className={osEmptyState}>Selecione uma empresa para visualizar as apostas.</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveDragId(String(event.active.id))}
          onDragEnd={(event) => void handleDragEnd(event)}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div className="os-pitch-cols">
            {orderedBlocks.map((blockView) => (
              <PitchColumn
                key={blockView.block.id}
                blockView={blockView}
                onOpenPitch={openEditModal}
                onDeletePitch={(betId) => void handleDeletePitch(betId)}
                onTogglePriority={(bet, blockType) => void handleTogglePriority(bet, blockType)}
                onAddPitch={openCreateModal}
                deletingId={deletingId}
                priorityLoadingId={priorityLoadingId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragBet ? (
              <div className="os-drag-overlay">{activeDragBet.title}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <PitchModal
        open={modalOpen}
        onClose={closeModal}
        pitch={editingPitch}
        initialBlockType={editingBlockType}
        blockGoals={blockGoals}
        isPriority={modalPriority}
        onTogglePriority={handleModalTogglePriority}
        pitchTasks={pitchTasks}
        tasksLoading={tasksLoading}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        priorityLoading={priorityLoadingId === editingPitch?.id}
        weeklyUpdates={weeklyUpdates}
        weeklyUpdatesLoading={weeklyUpdatesLoading}
        onSave={handleSavePitch}
        onDelete={editingPitch ? handleDeletePitch : undefined}
        saving={saving}
      />
    </div>
  );
}

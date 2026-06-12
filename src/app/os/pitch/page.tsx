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
import { PitchPriorityToggle } from "@/components/os/PitchPriorityToggle";
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
      <article
        ref={setNodeRef}
        style={style}
        className="border-2 border-[#FF0000] bg-white"
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex-1 text-sm font-bold normal-case text-[#FF0000]">Excluir &ldquo;{bet.title}&rdquo;?</span>
          <button
            type="button"
            onClick={() => { setConfirmDelete(false); onDelete(bet.id); }}
            disabled={deleting}
            className="border-2 border-[#FF0000] bg-[#FF0000] px-3 py-1 text-xs font-bold uppercase text-white hover:bg-[#CC0000] disabled:opacity-50"
          >
            {deleting ? "..." : "Sim"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="border-2 border-black px-3 py-1 text-xs font-bold uppercase hover:bg-black/5"
          >
            Não
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group border-2 border-black bg-white ${bet.is_priority ? "bg-black/[0.02]" : ""}`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className={`flex shrink-0 cursor-grab items-center overflow-hidden text-black/50 transition-all duration-150 hover:bg-black/[0.03] active:cursor-grabbing ${
            isDragging
              ? "max-w-[2.5rem] border-r-2 border-black px-2 opacity-100"
              : "max-w-0 border-r-0 px-0 opacity-0 group-hover:max-w-[2.5rem] group-hover:border-r-2 group-hover:border-black group-hover:px-2 group-hover:opacity-100"
          }`}
          aria-label="Arrastar pitch"
        >
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </button>
        <div className="flex shrink-0 items-center border-r-2 border-black px-2">
          <PitchPriorityToggle
            isPriority={bet.is_priority}
            disabled={priorityLoading}
            onToggle={() => onTogglePriority(bet)}
          />
        </div>
        <button
          type="button"
          onClick={() => onOpen(bet)}
          className="flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
        >
          <span className="truncate text-sm font-bold normal-case">{bet.title}</span>
          {bet.pitch_outcome ? (
            <span className="line-clamp-2 text-xs normal-case text-black/60">
              {bet.pitch_outcome}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          disabled={deleting}
          className="flex max-w-0 shrink-0 items-center overflow-hidden border-l-0 px-0 text-[#FF0000] opacity-0 transition-all duration-150 hover:bg-[#FF0000]/5 disabled:opacity-50 group-hover:max-w-[2.5rem] group-hover:border-l-2 group-hover:border-black group-hover:px-2 group-hover:opacity-100"
          aria-label="Excluir pitch"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
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
  deletingId,
  priorityLoadingId,
}: {
  blockView: OsBlockView;
  onOpenPitch: (bet: OsBetRow, blockType: OsBlockType) => void;
  onDeletePitch: (betId: string) => void;
  onTogglePriority: (bet: OsBetRow, blockType: OsBlockType) => void;
  deletingId: string | null;
  priorityLoadingId: string | null;
}) {
  const blockType = blockView.block.type as OsBlockType;
  const blockLabel = OS_BLOCK_LABELS[blockType];
  const dotColor = OS_BLOCK_DOT_COLORS[blockType];
  const goalTitle = blockView.goal?.title ?? "Meta não definida";
  const bets = blockView.bets;

  return (
    <section className="flex flex-col">
      <header className="flex items-center justify-between bg-black px-3 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
          <h2 className="text-sm font-bold tracking-[0.12em]">{blockLabel}</h2>
        </div>
      </header>

      <div className="flex flex-1 flex-col border-x-2 border-b-2 border-black">
        <div className="border-b-2 border-black px-3 py-3">
          <p className="text-sm font-bold normal-case leading-snug">{goalTitle}</p>
        </div>

        <SortableContext items={bets.map((bet) => bet.id)} strategy={verticalListSortingStrategy}>
          <div className="flex min-h-[120px] flex-col gap-2 p-3">
            {bets.length === 0 ? (
              <p className="py-4 text-center text-xs font-bold normal-case text-black/50">
                Nenhum pitch neste pilar
              </p>
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
          </div>
        </SortableContext>
      </div>
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
      console.error("Erro ao carregar tasks do pitch:", taskError);
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

  const openCreateModal = () => {
    setEditingPitch(null);
    setEditingBlockType("finance");
    setModalPriority(false);
    setPitchTasks([]);
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
      setError("Não foi possível alterar a prioridade do pitch.");
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
          pitchData: data.pitchData.trim() || null,
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
          pitchData: data.pitchData.trim() || undefined,
          executionOwner: data.executionOwner || undefined,
          pos,
        });
      }
      closeModal();
      await refreshBoard({ background: true, force: true });
    } catch (saveError) {
      console.error("Erro ao salvar pitch:", saveError);
      setError("Não foi possível salvar o pitch.");
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
      console.error("Erro ao excluir pitch:", msg);
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
      console.error("Erro ao reordenar pitches:", reorderError);
      setError("Não foi possível reordenar os pitches.");
      await refreshBoard({ background: true, force: true });
    }
  };

  const activeDragBet = activeDragId
    ? board.flatMap((view) => view.bets).find((bet) => bet.id === activeDragId)
    : null;

  return (
    <div className="pb-8 font-mono uppercase tracking-wide text-black">
      <OsCompanySelector />

      {error || boardError ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {error ?? boardError}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[0.08em] sm:text-3xl">PITCHES</h1>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={!selectedProjectId || (!boardReady && boardLoading)}
          className="border-2 border-black bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black/85 disabled:opacity-50"
        >
          + Adicionar pitch
        </button>
      </div>

      {(loadingProjects && projects.length === 0) ||
      (!boardReady && boardLoading && board.length === 0) ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Carregando pitches...
        </div>
      ) : !selectedProjectId ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Selecione uma empresa para visualizar os pitches.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveDragId(String(event.active.id))}
          onDragEnd={(event) => void handleDragEnd(event)}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-4">
            {orderedBlocks.map((blockView) => (
              <PitchColumn
                key={blockView.block.id}
                blockView={blockView}
                onOpenPitch={openEditModal}
                onDeletePitch={(betId) => void handleDeletePitch(betId)}
                onTogglePriority={(bet, blockType) => void handleTogglePriority(bet, blockType)}
                deletingId={deletingId}
                priorityLoadingId={priorityLoadingId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragBet ? (
              <div className="border-2 border-black bg-white px-3 py-2.5 text-sm font-bold normal-case shadow-lg">
                {activeDragBet.title}
              </div>
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

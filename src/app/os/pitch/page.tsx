"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  deleteOsBet,
  fetchOsPitchBoard,
  reorderOsBetsInGoal,
  updateOsBet,
  type OsBlockView,
} from "@/lib/os-queries";
import type { OsBetRow, OsBlockType } from "@/lib/os-types";

function SortablePitchCard({
  bet,
  onOpen,
  onDelete,
  deleting,
}: {
  bet: OsBetRow;
  onOpen: (bet: OsBetRow) => void;
  onDelete: (betId: string) => void;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: bet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="border-2 border-black bg-white"
    >
      <div className="flex items-stretch">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab items-center border-r-2 border-black px-2 text-black/50 hover:bg-black/[0.03] active:cursor-grabbing"
          aria-label="Arrastar pitch"
        >
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </button>
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
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm("Excluir este pitch?")) onDelete(bet.id);
          }}
          disabled={deleting}
          className="flex shrink-0 items-center border-l-2 border-black px-2 text-[#FF0000] transition-colors hover:bg-[#FF0000]/5 disabled:opacity-50"
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
  deletingId,
}: {
  blockView: OsBlockView;
  onOpenPitch: (bet: OsBetRow, blockType: OsBlockType) => void;
  onDeletePitch: (betId: string) => void;
  deletingId: string | null;
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
                  deleting={deletingId === bet.id}
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
  const { selectedProjectId, loadingProjects } = useOsLayout();
  const [board, setBoard] = useState<OsBlockView[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<OsBetRow | null>(null);
  const [editingBlockType, setEditingBlockType] = useState<OsBlockType>("finance");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadBoard = useCallback(async () => {
    if (!user || !selectedProjectId) {
      setBoard([]);
      return;
    }

    setLoadingBoard(true);
    setError(null);

    try {
      const data = await fetchOsPitchBoard(user.id, selectedProjectId);
      setBoard(data);
    } catch (loadError) {
      console.error("Erro ao carregar pitch board:", loadError);
      setError("Não foi possível carregar os pitches.");
      setBoard([]);
    } finally {
      setLoadingBoard(false);
    }
  }, [user, selectedProjectId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

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

  const openCreateModal = () => {
    void loadBoard().finally(() => {
      setEditingPitch(null);
      setEditingBlockType("finance");
      setModalOpen(true);
    });
  };

  const openEditModal = (bet: OsBetRow, blockType: OsBlockType) => {
    setEditingPitch(bet);
    setEditingBlockType(blockType);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPitch(null);
  };

  const resolveGoalId = (blockType: OsBlockType): string | null => {
    const blockView = orderedBlocks.find((view) => view.block.type === blockType);
    return blockView?.goal?.id ?? null;
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
      await loadBoard();
    } catch (saveError) {
      console.error("Erro ao salvar pitch:", saveError);
      setError("Não foi possível salvar o pitch.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePitch = async (betId: string) => {
    setDeletingId(betId);
    try {
      await deleteOsBet(betId);
      if (editingPitch?.id === betId) closeModal();
      await loadBoard();
    } catch (deleteError) {
      console.error("Erro ao excluir pitch:", deleteError);
      setError("Não foi possível excluir o pitch.");
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

    const reordered = arrayMove(column.bets, oldIndex, newIndex);
    const orderedIds = reordered.map((bet) => bet.id);

    setBoard((prev) =>
      prev.map((blockView) =>
        blockView.block.id === column.block.id ? { ...blockView, bets: reordered } : blockView
      )
    );

    try {
      await reorderOsBetsInGoal(orderedIds);
    } catch (reorderError) {
      console.error("Erro ao reordenar pitches:", reorderError);
      setError("Não foi possível reordenar os pitches.");
      await loadBoard();
    }
  };

  const activeDragBet = activeDragId
    ? board.flatMap((view) => view.bets).find((bet) => bet.id === activeDragId)
    : null;

  return (
    <div className="pb-8 font-mono uppercase tracking-wide text-black">
      <OsCompanySelector />

      {error ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[0.08em] sm:text-3xl">PITCHES</h1>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={!selectedProjectId || loadingBoard}
          className="border-2 border-black bg-black px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black/85 disabled:opacity-50"
        >
          + Adicionar pitch
        </button>
      </div>

      {loadingProjects || loadingBoard ? (
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
                deletingId={deletingId}
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
        onSave={handleSavePitch}
        onDelete={editingPitch ? (id) => handleDeletePitch(id) : undefined}
        saving={saving}
      />
    </div>
  );
}

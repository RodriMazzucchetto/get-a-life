"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { OsPitchExecutionRow } from "@/components/os/OsPitchExecutionRow";
import { PitchModal, type PitchFormData } from "@/components/os/PitchModal";
import { WeeklyUpdateModal } from "@/components/os/WeeklyUpdateModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  OS_CYAN,
  OS_GREEN,
  OS_RED,
  OS_YELLOW,
  computeCompanyMomentum,
  computeOsBetStats,
  getPillarMomentumColor,
  createOsBetUpdate,
  createOsTask,
  deleteOsTask,
  fetchLatestOsBetUpdatesForBets,
  fetchOsBetUpdatesForBet,
  fetchOsPitchBoard,
  fetchOsTasksForBet,
  getPillarStatusDisplay,
  saveOsGoal,
  setOsBetPriority,
  updateOsBet,
  type OsBlockView,
} from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateRow, OsBlockType, OsTaskRow } from "@/lib/os-types";

function OsProgressBar({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: number;
  pct: number;
  tone: "executed" | "failed";
}) {
  const fillColor = tone === "executed" ? OS_CYAN : OS_RED;
  const fillWidth = pct > 0 ? `${pct}%` : "3.5rem";

  return (
    <div className="flex border-2 border-black bg-white">
      <div className="flex shrink-0 items-center border-r-2 border-black px-4 py-2.5 text-sm font-bold tracking-wide">
        {label}: {value}
      </div>
      <div className="relative flex min-h-[42px] flex-1 bg-white">
        <div
          className="ml-auto flex items-center justify-center text-sm font-bold text-white"
          style={{ width: fillWidth, backgroundColor: fillColor, minWidth: "3.5rem" }}
        >
          {pct}%
        </div>
      </div>
    </div>
  );
}

function PillarSelectorBar({
  label,
  pct,
  goalTitle,
  selected,
  onSelect,
  onEditGoal,
  fillColor,
  hasActivePitch,
}: {
  label: string;
  pct: number;
  goalTitle: string;
  selected: boolean;
  onSelect: () => void;
  onEditGoal: () => void;
  fillColor: string;
  hasActivePitch: boolean;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onSelect}
        className={`flex border-2 border-black transition-opacity ${selected ? "ring-2 ring-black ring-offset-2" : "opacity-80 hover:opacity-100"}`}
        aria-pressed={selected}
      >
        <div
          className="flex shrink-0 items-center bg-black px-4 py-3 text-sm font-bold text-white"
          style={hasActivePitch ? { boxShadow: `inset 4px 0 0 0 ${fillColor}` } : undefined}
        >
          {label}
        </div>
        <div className="relative flex min-h-[46px] flex-1 items-center bg-white">
          {pct > 0 ? (
            <div
              className="absolute inset-y-0 left-0 flex items-center justify-end px-3 text-sm font-bold text-white"
              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: fillColor }}
            />
          ) : null}
          <span
            className="relative ml-auto px-3 text-sm font-bold"
            style={{ color: hasActivePitch ? fillColor : "#000000" }}
          >
            {pct}%
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onEditGoal}
        className="mt-1.5 truncate text-left text-xs font-bold normal-case text-black/60 hover:text-black"
        title="Editar meta"
      >
        {goalTitle || "Definir meta"}
      </button>
    </div>
  );
}

export default function OsPage() {
  return <OsPageContent />;
}

function OsPageContent() {
  const { user } = useAuthContext();
  const { selectedProjectId, loadingProjects } = useOsLayout();
  const [board, setBoard] = useState<OsBlockView[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<OsBlockType>("finance");
  const [latestUpdates, setLatestUpdates] = useState<Map<string, OsBetUpdateRow>>(new Map());
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState({
    blockId: "",
    blockType: "" as OsBlockType | "",
    title: "",
    description: "",
  });
  const [goalError, setGoalError] = useState<string | null>(null);

  // Pitch modal
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<OsBetRow | null>(null);
  const [editingBlockType, setEditingBlockType] = useState<OsBlockType>("finance");
  const [modalPriority, setModalPriority] = useState(false);
  const [pitchTasks, setPitchTasks] = useState<OsTaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [pitchSaving, setPitchSaving] = useState(false);
  const [priorityLoadingId, setPriorityLoadingId] = useState<string | null>(null);
  const [weeklyUpdates, setWeeklyUpdates] = useState<OsBetUpdateRow[]>([]);
  const [weeklyUpdatesLoading, setWeeklyUpdatesLoading] = useState(false);

  // Weekly update modal
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weeklyModalBet, setWeeklyModalBet] = useState<OsBetRow | null>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);

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

      const allBetIds = data.flatMap((view) => view.bets.map((bet) => bet.id));
      const updates = await fetchLatestOsBetUpdatesForBets(allBetIds);
      setLatestUpdates(updates);
    } catch (loadError) {
      console.error("Erro ao carregar OS:", loadError);
      setError("Não foi possível carregar o OS.");
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
      OS_BLOCK_TYPES.map((type) => board.find((view) => view.block.type === type)).filter(
        (view): view is OsBlockView => Boolean(view)
      ),
    [board]
  );

  const blockGoals = useMemo(() => {
    const goals: Record<OsBlockType, { id: string; title: string } | null> = {
      finance: null,
      growth: null,
      ops: null,
    };
    for (const view of orderedBlocks) {
      const type = view.block.type as OsBlockType;
      if (view.goal) goals[type] = { id: view.goal.id, title: view.goal.title };
    }
    return goals;
  }, [orderedBlocks]);

  const pillarDisplays = useMemo(() => {
    const displays: Record<
      OsBlockType,
      ReturnType<typeof getPillarStatusDisplay>
    > = {
      finance: getPillarStatusDisplay(null, null),
      growth: getPillarStatusDisplay(null, null),
      ops: getPillarStatusDisplay(null, null),
    };

    for (const view of orderedBlocks) {
      const type = view.block.type as OsBlockType;
      const priorityBet = view.bets.find((bet) => bet.is_priority) ?? view.priorityBet;
      const update = priorityBet ? (latestUpdates.get(priorityBet.id) ?? null) : null;
      displays[type] = getPillarStatusDisplay(
        priorityBet,
        update,
        view.bets,
        latestUpdates
      );
    }
    return displays;
  }, [orderedBlocks, latestUpdates]);

  const companyMomentum = useMemo(
    () => computeCompanyMomentum(orderedBlocks, latestUpdates),
    [orderedBlocks, latestUpdates]
  );

  const companyMomentumColor = useMemo(() => {
    const allBets = orderedBlocks.flatMap((view) => view.bets);
    return getPillarMomentumColor(companyMomentum, allBets.length > 0);
  }, [companyMomentum, orderedBlocks]);

  const selectedBlockView = orderedBlocks.find((view) => view.block.type === selectedPillar);
  const selectedPillarStats = useMemo(
    () => computeOsBetStats(selectedBlockView?.bets ?? []),
    [selectedBlockView]
  );

  const companyStats = useMemo(() => {
    const allBets = orderedBlocks.flatMap((view) => view.bets);
    return computeOsBetStats(allBets);
  }, [orderedBlocks]);
  const executionPitches = useMemo(
    () => (selectedBlockView?.bets.filter((bet) => bet.is_priority) ?? []),
    [selectedBlockView]
  );

  const openGoalModal = (blockId: string, blockType: OsBlockType) => {
    const existingGoal = orderedBlocks.find((v) => v.block.id === blockId)?.goal;
    setGoalDraft({
      blockId,
      blockType,
      title: existingGoal?.title ?? "",
      description: existingGoal?.description ?? "",
    });
    setGoalError(null);
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!user || !goalDraft.blockId || !goalDraft.title.trim()) {
      setGoalError("Informe um título para a meta.");
      return;
    }
    setActionLoading(`goal-${goalDraft.blockId}`);
    try {
      await saveOsGoal(user.id, goalDraft.blockId, goalDraft.title.trim(), goalDraft.description.trim() || undefined);
      setGoalModalOpen(false);
      await loadBoard();
    } catch {
      setGoalError("Não foi possível salvar a meta.");
    } finally {
      setActionLoading(null);
    }
  };

  const loadPitchTasks = async (betId: string) => {
    setTasksLoading(true);
    try {
      setPitchTasks(await fetchOsTasksForBet(betId));
    } catch {
      setPitchTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadAllWeeklyUpdates = async (betId: string) => {
    setWeeklyUpdatesLoading(true);
    try {
      setWeeklyUpdates(await fetchOsBetUpdatesForBet(betId));
    } catch {
      setWeeklyUpdates([]);
    } finally {
      setWeeklyUpdatesLoading(false);
    }
  };

  const openPitchModal = (bet: OsBetRow, blockType: OsBlockType) => {
    setEditingPitch(bet);
    setEditingBlockType(blockType);
    setModalPriority(bet.is_priority);
    setPitchModalOpen(true);
    void loadPitchTasks(bet.id);
    void loadAllWeeklyUpdates(bet.id);
  };

  const closePitchModal = () => {
    setPitchModalOpen(false);
    setEditingPitch(null);
    setPitchTasks([]);
    setWeeklyUpdates([]);
  };

  const resolveGoalId = (blockType: OsBlockType) =>
    orderedBlocks.find((v) => v.block.type === blockType)?.goal?.id ?? null;

  const handleSavePitch = async (data: PitchFormData) => {
    if (!user || !editingPitch) return;
    const goalId = resolveGoalId(data.blockType);
    if (!goalId) return;

    setPitchSaving(true);
    try {
      await updateOsBet(editingPitch.id, {
        title: data.title.trim(),
        pitchOutcome: data.pitchOutcome.trim() || null,
        pitchData: data.pitchData.trim() || null,
        executionOwner: data.executionOwner || null,
      });
      closePitchModal();
      await loadBoard();
    } catch {
      setError("Não foi possível salvar o pitch.");
    } finally {
      setPitchSaving(false);
    }
  };

  const handleTogglePriority = async () => {
    if (!editingPitch) return;
    const goalId = resolveGoalId(editingBlockType);
    if (!goalId) return;

    setPriorityLoadingId(editingPitch.id);
    try {
      const updated = await setOsBetPriority(editingPitch.id, !editingPitch.is_priority);
      setEditingPitch(updated);
      setModalPriority(updated.is_priority);
      if (updated.is_priority) {
        void loadAllWeeklyUpdates(editingPitch.id);
        void loadPitchTasks(editingPitch.id);
      } else {
        setWeeklyUpdates([]);
        setPitchTasks([]);
      }
      await loadBoard();
    } catch {
      setError("Não foi possível alterar prioridade.");
    } finally {
      setPriorityLoadingId(null);
    }
  };

  const handleAddTask = async (title: string) => {
    if (!user || !editingPitch || !selectedProjectId) return;
    await createOsTask(user.id, { projectId: selectedProjectId, betId: editingPitch.id, title });
    await loadPitchTasks(editingPitch.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteOsTask(taskId);
    if (editingPitch) await loadPitchTasks(editingPitch.id);
  };

  const openWeeklyModal = (bet: OsBetRow) => {
    setWeeklyModalBet(bet);
    setWeeklyModalOpen(true);
  };

  const handleWeeklySubmit = async (data: {
    status: import("@/lib/os-types").OsBetUpdateStatus;
    whatDone: string;
    blockers: string;
  }) => {
    if (!user || !weeklyModalBet) return;
    setWeeklySaving(true);
    try {
      const update = await createOsBetUpdate(user.id, {
        betId: weeklyModalBet.id,
        status: data.status,
        whatDone: data.whatDone,
        blockers: data.blockers,
      });
      setLatestUpdates((prev) => new Map(prev).set(weeklyModalBet.id, update));
      if (editingPitch?.id === weeklyModalBet.id) {
        await loadAllWeeklyUpdates(weeklyModalBet.id);
      }
      await loadBoard();
    } finally {
      setWeeklySaving(false);
    }
  };

  return (
    <div className="pb-8 font-mono uppercase tracking-wide text-black">
      <OsCompanySelector />

      {error ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {error}
        </div>
      ) : null}

      {loadingProjects || loadingBoard ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Carregando OS...
        </div>
      ) : !selectedProjectId ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Selecione uma empresa para visualizar o OS.
        </div>
      ) : (
        <>
          {/* Company momentum */}
          <div className="mb-6 flex border-2 border-black">
            <div className="flex shrink-0 items-center border-r-2 border-black px-4 py-3 text-sm font-bold">
              Company execution momentum
            </div>
            <div className="relative flex min-h-[46px] flex-1 bg-white">
              <div
                className="ml-auto flex items-center justify-center text-sm font-bold text-white"
                style={{
                  width: `${Math.max(companyMomentum, 8)}%`,
                  backgroundColor: companyMomentumColor,
                  minWidth: "3.5rem",
                }}
              >
                {companyMomentum}%
              </div>
            </div>
          </div>

          {/* Aggregate executed / failed */}
          <div className="mb-6 space-y-3">
            <h2 className="text-center text-xl font-bold tracking-[0.08em] sm:text-2xl">
              PRIORITIES STARTED: {companyStats.started}
            </h2>
            <OsProgressBar
              label="EXECUTED"
              value={companyStats.executed}
              pct={companyStats.successRate}
              tone="executed"
            />
            <OsProgressBar
              label="FAILED"
              value={companyStats.failed}
              pct={companyStats.failureRate}
              tone="failed"
            />
          </div>

          {/* Pillar selectors */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {orderedBlocks.map((view) => {
              const blockType = view.block.type as OsBlockType;
              const display = pillarDisplays[blockType];
              return (
                <PillarSelectorBar
                  key={view.block.id}
                  label={OS_BLOCK_LABELS[blockType]}
                  pct={display.pct}
                  goalTitle={view.goal?.title ?? "Definir meta"}
                  selected={selectedPillar === blockType}
                  onSelect={() => setSelectedPillar(blockType)}
                  onEditGoal={() => openGoalModal(view.block.id, blockType)}
                  fillColor={display.color}
                  hasActivePitch={view.bets.length > 0}
                />
              );
            })}
          </div>

          {/* Selected pillar stats */}
          <div className="mb-6 border-2 border-black bg-white px-4 py-4">
            <p className="mb-3 text-center text-sm font-bold tracking-wide">
              {OS_BLOCK_LABELS[selectedPillar]} — RESUMO
            </p>
            <div className="space-y-1 text-sm font-bold tracking-wide">
              <p>STARTED: {selectedPillarStats.started}</p>
              <p style={{ color: OS_CYAN }}>EXECUTED: {selectedPillarStats.executed}</p>
              <p style={{ color: OS_CYAN }}>SUCCESS RATE: {selectedPillarStats.successRate}%</p>
              <p style={{ color: OS_RED }}>FAILED: {selectedPillarStats.failed}</p>
              <p style={{ color: OS_RED }}>FAILURE RATE: {selectedPillarStats.failureRate}%</p>
            </div>
          </div>

          {/* Selected pillar detail */}
          <div className="border-2 border-black bg-white">
            <h2 className="border-b-2 border-black py-4 text-center text-2xl font-bold tracking-[0.12em]">
              {OS_BLOCK_LABELS[selectedPillar]}
            </h2>

            <div className="flex border-b-2 border-black text-[10px] font-bold tracking-[0.14em] text-black/50">
              <div className="w-10 shrink-0 border-r-2 border-black" />
              <div className="flex-[2] border-r-2 border-black px-4 py-2">Priority</div>
              <div className="flex flex-1 items-center justify-center py-2">Status</div>
              <div className="w-12 shrink-0 border-l-2 border-black py-2 text-center">+</div>
            </div>

            {executionPitches.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm font-bold normal-case text-black/50">
                Nenhum pitch em execução neste pilar. Marque um pitch como ativo em{" "}
                <span className="font-bold uppercase">Pitch</span>.
              </div>
            ) : (
              executionPitches.map((bet) => (
                <OsPitchExecutionRow
                  key={bet.id}
                  bet={bet}
                  latestUpdate={latestUpdates.get(bet.id) ?? null}
                  expanded={expandedBetId === bet.id}
                  onToggleExpand={() =>
                    setExpandedBetId((prev) => (prev === bet.id ? null : bet.id))
                  }
                  onOpenPitch={() => openPitchModal(bet, selectedPillar)}
                  onAddWeeklyUpdate={() => openWeeklyModal(bet)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Goal modal */}
      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <ModalPanel maxWidthClass="max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-black">
                {goalDraft.title ? "Editar meta" : "Definir meta"}
              </h2>
              <button type="button" onClick={() => setGoalModalOpen(false)} aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 font-mono normal-case">
              <p className="text-sm text-black/70">
                Pilar:{" "}
                <span className="font-bold uppercase text-black">
                  {goalDraft.blockType ? OS_BLOCK_LABELS[goalDraft.blockType] : ""}
                </span>
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-black/70">
                  Meta
                </span>
                <input
                  type="text"
                  value={goalDraft.title}
                  onChange={(e) => setGoalDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold outline-none focus:bg-black/5"
                />
              </label>
              {goalError ? <p className="text-sm font-bold text-[#FF0000]">{goalError}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="border-2 border-black px-3 py-2 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveGoal()}
                  disabled={actionLoading !== null}
                  className="border-2 border-black bg-black px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </ModalPanel>
        </ModalOverlay>
      ) : null}

      <PitchModal
        open={pitchModalOpen}
        onClose={closePitchModal}
        pitch={editingPitch}
        initialBlockType={editingBlockType}
        blockGoals={blockGoals}
        isPriority={modalPriority}
        onTogglePriority={handleTogglePriority}
        pitchTasks={pitchTasks}
        tasksLoading={tasksLoading}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        priorityLoading={priorityLoadingId === editingPitch?.id}
        weeklyUpdates={weeklyUpdates}
        weeklyUpdatesLoading={weeklyUpdatesLoading}
        onSave={handleSavePitch}
        saving={pitchSaving}
      />

      {weeklyModalBet ? (
        <WeeklyUpdateModal
          open={weeklyModalOpen}
          onClose={() => {
            setWeeklyModalOpen(false);
            setWeeklyModalBet(null);
          }}
          pitch={weeklyModalBet}
          onSubmit={handleWeeklySubmit}
          saving={weeklySaving}
        />
      ) : null}
    </div>
  );
}

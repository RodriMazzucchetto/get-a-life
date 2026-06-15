"use client";

import { useCallback, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { GoalBacklogPanel } from "@/components/os/GoalBacklogPanel";
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
  OS_RED,
  computeCompanyMomentum,
  computeOsBetStats,
  getPillarMomentumColor,
  createOsBetUpdate,
  createOsTask,
  deleteOsBet,
  deleteOsTask,
  fetchOsBetUpdatesForBet,
  fetchOsTasksForBet,
  getPillarStatusDisplay,
  removeBetFromBoardViews,
  saveOsGoal,
  setOsBetPriority,
  updateOsBet,
  type OsBlockView,
} from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateRow, OsBlockType, OsTaskRow } from "@/lib/os-types";
import { osCacheKey, packBoardCache, setOsCache } from "@/lib/os-cache";
import { osBtnGhost, osBtnPrimary, osEmptyState, osErrorBanner, osInput } from "@/lib/os-ui";

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
    <div className="os-metric-row">
      <div className="label">
        {label}: {value}
      </div>
      <div className="track">
        <div className="fill" style={{ width: fillWidth, backgroundColor: fillColor }}>
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
  blockId,
  userId,
  selected,
  onSelect,
  onEditGoal,
  fillColor,
  hasActivePitch,
  onGoalsChanged,
}: {
  label: string;
  pct: number;
  goalTitle: string;
  blockId: string;
  userId: string;
  selected: boolean;
  onSelect: () => void;
  onEditGoal: () => void;
  fillColor: string;
  hasActivePitch: boolean;
  onGoalsChanged: () => void;
}) {
  const [showBacklog, setShowBacklog] = useState(false);
  const displayGoal = goalTitle || "Definir meta";

  return (
    <div className={`os-pillar-card ${selected ? "selected" : ""}`}>
      <button type="button" onClick={onSelect} className="pillar-top" aria-pressed={selected}>
        <div
          className="pillar-label"
          style={hasActivePitch ? { boxShadow: `inset 4px 0 0 0 ${fillColor}` } : undefined}
        >
          {label}
        </div>
        <div className="pillar-track">
          {pct > 0 ? (
            <div
              className="pillar-fill"
              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: fillColor }}
            />
          ) : null}
          <span className="relative z-[1]" style={{ color: hasActivePitch ? fillColor : "var(--color-ta-ink)" }}>
            {pct}%
          </span>
        </div>
      </button>

      <div className="pillar-goal-row">
        <button type="button" onClick={onEditGoal} className="pillar-goal" title={displayGoal}>
          {displayGoal}
        </button>
        <button
          type="button"
          aria-label={showBacklog ? "Fechar backlog de metas" : "Ver backlog de metas"}
          onClick={() => setShowBacklog((v) => !v)}
          className={`pillar-backlog-btn ${showBacklog ? "open" : ""}`}
        >
          <span
            className="material-symbols-outlined text-[18px] transition-transform"
            style={{ transform: showBacklog ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            format_list_bulleted
          </span>
        </button>
      </div>

      {showBacklog ? (
        <GoalBacklogPanel
          blockId={blockId}
          userId={userId}
          onGoalsChanged={() => {
            onGoalsChanged();
          }}
        />
      ) : null}
    </div>
  );
}

export default function OsPage() {
  return <OsPageContent />;
}

function OsPageContent() {
  const { user } = useAuthContext();
  const {
    selectedProjectId,
    loadingProjects,
    projects,
    board,
    latestUpdates,
    boardRefreshing,
    boardError,
    refreshBoard,
    refreshTasks,
    setBoard,
    setLatestUpdates,
  } = useOsLayout();
  const [error, setError] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<OsBlockType>("finance");
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
  const [pitchDeleting, setPitchDeleting] = useState(false);
  const [priorityLoadingId, setPriorityLoadingId] = useState<string | null>(null);
  const [weeklyUpdates, setWeeklyUpdates] = useState<OsBetUpdateRow[]>([]);
  const [weeklyUpdatesLoading, setWeeklyUpdatesLoading] = useState(false);

  // Weekly update modal
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weeklyModalBet, setWeeklyModalBet] = useState<OsBetRow | null>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);

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

  const companyStats = useMemo(() => {
    const priorityBets: OsBetRow[] = [];
    for (const type of OS_BLOCK_TYPES) {
      const view = orderedBlocks.find((v) => v.block.type === type);
      if (!view) continue;
      const priority = view.bets.find((bet) => bet.is_priority) ?? view.priorityBet;
      if (priority) priorityBets.push(priority);
    }
    return computeOsBetStats(priorityBets);
  }, [orderedBlocks]);

  const priorityExecutionRows = useMemo(() => {
    const rows: { bet: OsBetRow; blockType: OsBlockType }[] = [];
    for (const type of OS_BLOCK_TYPES) {
      const view = orderedBlocks.find((v) => v.block.type === type);
      if (!view) continue;
      const priority = view.bets.find((bet) => bet.is_priority) ?? view.priorityBet;
      if (priority) rows.push({ bet: priority, blockType: type });
    }
    return rows;
  }, [orderedBlocks]);

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
      const savedGoal = await saveOsGoal(
        user.id,
        goalDraft.blockId,
        goalDraft.title.trim(),
        goalDraft.description.trim() || undefined
      );
      setGoalModalOpen(false);
      setBoard((prev) =>
        prev.map((view) =>
          view.block.id === goalDraft.blockId ? { ...view, goal: savedGoal } : view
        )
      );
      await refreshBoard({ background: true, force: true });
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
      await refreshBoard({ background: true, force: true });
    } catch {
      setError("Não foi possível salvar o pitch.");
    } finally {
      setPitchSaving(false);
    }
  };

  const handleDeletePitch = async (betId: string) => {
    setPitchDeleting(true);
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

      if (editingPitch?.id === betId) closePitchModal();
      await refreshBoard({ background: true, force: true });
      await refreshTasks({ background: true, force: true });
    } catch {
      setError("Não foi possível excluir o pitch.");
      await refreshBoard({ background: true, force: true });
    } finally {
      setPitchDeleting(false);
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
      await refreshBoard({ background: true, force: true });
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
      await refreshBoard({ background: true, force: true });
    } finally {
      setWeeklySaving(false);
    }
  };

  return (
    <div className="pb-8">
      <OsCompanySelector />

      {error || boardError ? (
        <div className={osErrorBanner}>{error ?? boardError}</div>
      ) : null}

      {boardRefreshing && board.length > 0 ? (
        <p className="os-muted-note">Atualizando…</p>
      ) : null}

      {!selectedProjectId && loadingProjects && projects.length === 0 ? (
        <div className={osEmptyState}>Carregando OS...</div>
      ) : !selectedProjectId ? (
        <div className={osEmptyState}>Selecione uma empresa para visualizar o OS.</div>
      ) : (
        <>
          <div className="os-metric-row">
            <div className="label">Company execution momentum</div>
            <div className="track">
              <div
                className="fill"
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

          <div className="os-kpi-grid">
            <h2 className="os-kpi-head">Priorities started: {companyStats.started}</h2>
            <OsProgressBar
              label="Executed"
              value={companyStats.executed}
              pct={companyStats.successRate}
              tone="executed"
            />
            <OsProgressBar
              label="Failed"
              value={companyStats.failed}
              pct={companyStats.failureRate}
              tone="failed"
            />
          </div>

          <div className="os-pillar-grid">
            {orderedBlocks.map((view) => {
              const blockType = view.block.type as OsBlockType;
              const display = pillarDisplays[blockType];
              return (
                <PillarSelectorBar
                  key={view.block.id}
                  label={OS_BLOCK_LABELS[blockType]}
                  pct={display.pct}
                  goalTitle={view.goal?.title ?? "Definir meta"}
                  blockId={view.block.id}
                  userId={user?.id ?? ""}
                  selected={selectedPillar === blockType}
                  onSelect={() => setSelectedPillar(blockType)}
                  onEditGoal={() => openGoalModal(view.block.id, blockType)}
                  fillColor={display.color}
                  hasActivePitch={view.bets.length > 0}
                  onGoalsChanged={() => void refreshBoard({ background: true, force: true })}
                />
              );
            })}
          </div>

          <div className="os-section">
            <div className="section-head">
              <span className="title">Priority pitches</span>
            </div>
            <p className="section-sub">Pitches activos por pilar</p>

            {priorityExecutionRows.length === 0 ? (
              <div className="os-empty-inline">
                Nenhum pitch prioritário — marque um pitch como activo em Pitch
              </div>
            ) : (
              <div className="os-pitch-list">
                {priorityExecutionRows.map(({ bet, blockType }) => (
                  <OsPitchExecutionRow
                    key={bet.id}
                    bet={bet}
                    blockType={blockType}
                    latestUpdate={latestUpdates.get(bet.id) ?? null}
                    expanded={expandedBetId === bet.id}
                    onToggleExpand={() =>
                      setExpandedBetId((prev) => (prev === bet.id ? null : bet.id))
                    }
                    onOpenPitch={() => openPitchModal(bet, blockType)}
                    onAddWeeklyUpdate={() => openWeeklyModal(bet)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="os-summary">
            <p className="title">Resumo geral</p>
            <div className="lines">
              <p>Started: {companyStats.started}</p>
              <p style={{ color: OS_CYAN }}>Executed: {companyStats.executed}</p>
              <p style={{ color: OS_CYAN }}>Success rate: {companyStats.successRate}%</p>
              <p style={{ color: OS_RED }}>Failed: {companyStats.failed}</p>
              <p style={{ color: OS_RED }}>Failure rate: {companyStats.failureRate}%</p>
            </div>
          </div>
        </>
      )}

      {/* Goal modal */}
      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <ModalPanel maxWidthClass="max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-ta-ink">
                {goalDraft.title ? "Editar meta" : "Definir meta"}
              </h2>
              <button type="button" onClick={() => setGoalModalOpen(false)} aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 font-mono normal-case">
              <p className="text-sm text-ta-muted">
                Pilar:{" "}
                <span className="font-bold uppercase text-ta-ink">
                  {goalDraft.blockType ? OS_BLOCK_LABELS[goalDraft.blockType] : ""}
                </span>
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ta-muted">
                  Meta
                </span>
                <input
                  type="text"
                  value={goalDraft.title}
                  onChange={(e) => setGoalDraft((p) => ({ ...p, title: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm font-bold ${osInput}`}
                />
              </label>
              {goalError ? <p className="text-sm font-bold text-[#FF0000]">{goalError}</p> : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setGoalModalOpen(false)} className={osBtnGhost}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveGoal()}
                  disabled={actionLoading !== null}
                  className={osBtnPrimary}
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
        onDelete={editingPitch ? handleDeletePitch : undefined}
        saving={pitchSaving || pitchDeleting}
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

"use client";

import { useCallback, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import Link from "next/link";
import { GoalBacklogPanel } from "@/components/os/GoalBacklogPanel";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { OsPitchExecutionRow } from "@/components/os/OsPitchExecutionRow";
import { PitchModal, type PitchFormData } from "@/components/os/PitchModal";
import { WeeklyUpdateModal } from "@/components/os/WeeklyUpdateModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  OS_CYAN,
  OS_RED,
  computeCompanyMomentum,
  computeOsBetStats,
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

function computeMomentumSegments(
  priorityBets: OsBetRow[],
  latestUpdates: Map<string, OsBetUpdateRow>
) {
  if (priorityBets.length === 0) {
    return { executed: 0, inFlight: 0, failed: 0, notStarted: 100 };
  }

  let executed = 0;
  let inFlight = 0;
  let failed = 0;
  let notStarted = 0;

  for (const bet of priorityBets) {
    const update = latestUpdates.get(bet.id);
    const status = update?.status ?? bet.status;
    if (status === "executed") executed++;
    else if (status === "failed") failed++;
    else if (status === "on_course" || status === "deviating") inFlight++;
    else notStarted++;
  }

  const total = priorityBets.length;
  return {
    executed: (executed / total) * 100,
    inFlight: (inFlight / total) * 100,
    failed: (failed / total) * 100,
    notStarted: (notStarted / total) * 100,
  };
}

function PillarCard({
  blockType,
  label,
  pct,
  goalTitle,
  blockId,
  userId,
  onEditGoal,
  onGoalsChanged,
  stats,
}: {
  blockType: OsBlockType;
  label: string;
  pct: number;
  goalTitle: string;
  blockId: string;
  userId: string;
  onEditGoal: () => void;
  onGoalsChanged: () => void;
  stats: { started: number; executed: number; failed: number };
}) {
  const [showBacklog, setShowBacklog] = useState(false);
  const displayGoal = goalTitle || "Definir meta";
  const dotColor = OS_BLOCK_DOT_COLORS[blockType];

  return (
    <article className={`os-pillar ${pct > 0 ? "has-progress" : ""}`}>
      <div className="head">
        <span className="dot" style={{ backgroundColor: dotColor }} aria-hidden />
        <span className="name">{label}</span>
        <span className="pct">{pct}%</span>
      </div>
      <div className="body">
        <div className="target-actions">
          <button type="button" onClick={onEditGoal} className="target target-btn" title={displayGoal}>
            <span className="lab">Meta</span>
            {displayGoal}
          </button>
          <button
            type="button"
            aria-label={showBacklog ? "Fechar backlog de metas" : "Ver backlog de metas"}
            onClick={() => setShowBacklog((v) => !v)}
            className={`backlog-btn ${showBacklog ? "open" : ""}`}
          >
            <span
              className="material-symbols-outlined text-[18px] transition-transform"
              style={{ transform: showBacklog ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              format_list_bulleted
            </span>
          </button>
        </div>
        <div className="breakdown">
          <div className="item">
            <span className="l">Started</span>
            <span className="v">{stats.started}</span>
          </div>
          <div className="item cyan">
            <span className="l">Executed</span>
            <span className={`v ${stats.executed === 0 ? "zero" : ""}`}>{stats.executed}</span>
          </div>
          <div className="item red">
            <span className="l">Failed</span>
            <span className={`v ${stats.failed === 0 ? "zero" : ""}`}>{stats.failed}</span>
          </div>
        </div>
      </div>
      {showBacklog ? (
        <GoalBacklogPanel blockId={blockId} userId={userId} onGoalsChanged={onGoalsChanged} />
      ) : null}
    </article>
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

  const priorityBets = useMemo(() => priorityExecutionRows.map((row) => row.bet), [priorityExecutionRows]);

  const momentumSegments = useMemo(
    () => computeMomentumSegments(priorityBets, latestUpdates),
    [priorityBets, latestUpdates]
  );

  const pillarStatsByType = useMemo(() => {
    const stats: Record<OsBlockType, { started: number; executed: number; failed: number }> = {
      finance: { started: 0, executed: 0, failed: 0 },
      growth: { started: 0, executed: 0, failed: 0 },
      ops: { started: 0, executed: 0, failed: 0 },
    };
    for (const view of orderedBlocks) {
      const blockType = view.block.type as OsBlockType;
      const priority = view.bets.find((bet) => bet.is_priority) ?? view.priorityBet;
      if (!priority) continue;
      stats[blockType] = {
        started: 1,
        executed: priority.status === "executed" ? 1 : 0,
        failed: priority.status === "failed" ? 1 : 0,
      };
    }
    return stats;
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
          <div className="os-stats">
            <div className="os-stat">
              <span className="label">Priorities Started</span>
              <span className="value">{companyStats.started}</span>
            </div>
            <div className={`os-stat ${companyStats.executed > 0 ? "signal-cyan" : ""}`}>
              <span className="label">Executed</span>
              <span className="value">
                {companyStats.executed}
                <span className="pct">{companyStats.successRate}%</span>
              </span>
            </div>
            <div className={`os-stat ${companyStats.failed > 0 ? "signal-red" : ""}`}>
              <span className="label">Failed</span>
              <span className="value">
                {companyStats.failed}
                <span className="pct">{companyStats.failureRate}%</span>
              </span>
            </div>
            <div className="os-stat">
              <span className="label">Momentum</span>
              <span className="value">{companyMomentum}%</span>
            </div>
          </div>

          <div className="os-momentum">
            <div className="os-momentum-head">
              <span className="title">Company Execution Momentum</span>
              <span className="legend">
                <span>
                  <span className="dot" style={{ background: "var(--color-ta-cyan)" }} />
                  Executed
                </span>
                <span>
                  <span className="dot" style={{ background: "#d99a00" }} />
                  In flight
                </span>
                <span>
                  <span className="dot" style={{ background: "var(--color-ta-red)" }} />
                  Failed
                </span>
                <span>
                  <span
                    className="dot"
                    style={{
                      background: "var(--color-ta-paper-2)",
                      border: "1px solid var(--color-ta-rule-2)",
                    }}
                  />
                  Not started
                </span>
              </span>
            </div>
            <div className="os-progress">
              <div
                className="seg"
                style={{ background: "var(--color-ta-cyan)", width: `${momentumSegments.executed}%` }}
              />
              <div
                className="seg"
                style={{ background: "#d99a00", width: `${momentumSegments.inFlight}%` }}
              />
              <div
                className="seg"
                style={{ background: "var(--color-ta-red)", width: `${momentumSegments.failed}%` }}
              />
              <div
                className="seg"
                style={{
                  background: "var(--color-ta-paper-2)",
                  width: `${momentumSegments.notStarted}%`,
                }}
              />
            </div>
          </div>

          <div className="os-pillars">
            {orderedBlocks.map((view) => {
              const blockType = view.block.type as OsBlockType;
              const display = pillarDisplays[blockType];
              return (
                <PillarCard
                  key={view.block.id}
                  blockType={blockType}
                  label={OS_BLOCK_LABELS[blockType]}
                  pct={display.pct}
                  goalTitle={view.goal?.title ?? "Definir meta"}
                  blockId={view.block.id}
                  userId={user?.id ?? ""}
                  onEditGoal={() => openGoalModal(view.block.id, blockType)}
                  onGoalsChanged={() => void refreshBoard({ background: true, force: true })}
                  stats={pillarStatsByType[blockType]}
                />
              );
            })}
          </div>

          <div className="os-sec-head">
            <span className="title">Priority pitches</span>
            <span className="count">{priorityExecutionRows.length}</span>
            <Link href="/os/pitch" className="add" title="Gerir pitches">
              +
            </Link>
          </div>
          <p className="os-sec-sub">Pitches activos por pilar</p>

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

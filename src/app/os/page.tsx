"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { OsAnnualGoalBar } from "@/components/os/OsAnnualGoalBar";
import { OsGoalDescriptionEditor } from "@/components/os/OsGoalDescriptionEditor";
import { OsGoalsByQuarterPanel } from "@/components/os/OsGoalsByQuarterPanel";
import { GoalOutcomeModal } from "@/components/os/GoalOutcomeModal";
import { PitchModal, type PitchFormData } from "@/components/os/PitchModal";
import { WeeklyUpdateModal } from "@/components/os/WeeklyUpdateModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  computeCompanyMomentum,
  computeOsBetStats,
  concludeOsGoal,
  createOsBet,
  createOsBetUpdate,
  createOsGoal,
  createOsTask,
  currentCalendarQuarter,
  deleteOsBet,
  deleteOsGoal,
  deleteOsTask,
  fetchGoalsForProject,
  fetchOsBetActivityCounts,
  fetchOsBetUpdatesForBet,
  fetchOsBetsForGoal,
  fetchOsTasksForBet,
  getOsBetPipelineStage,
  formatOsBetPipelineLabel,
  getPillarStatusDisplay,
  goalIsConcluded,
  removeBetFromBoardViews,
  setGoalPriority,
  setOsBetPriority,
  getOsBetShapeStatus,
  sortBacklogBetsByShape,
  unsetGoalPriority,
  updateOsBet,
  updateOsBetUpdate,
  deleteOsBetUpdate,
  updateOsGoal,
  updateOsProjectAnnualObjective,
  type OsBlockView,
} from "@/lib/os-queries";
import type {
  OsBetRow,
  OsBetShapeStatus,
  OsBetUpdateRow,
  OsBlockType,
  OsGoalQuarter,
  OsGoalRow,
  OsTaskRow,
} from "@/lib/os-types";
import { osCacheKey, packBoardCache, setOsCache } from "@/lib/os-cache";
import { osEmptyState, osErrorBanner } from "@/lib/os-ui";

/** Cor de accent por pilar (borda esquerda dos pitches + dot do header). */
const PILLAR_ACCENT: Record<OsBlockType, string> = {
  finance: "var(--color-ta-amber-muted)",
  growth: "var(--color-ta-cyan)",
  ops: "var(--color-ta-green)",
};

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
    const status = latestUpdates.get(bet.id)?.status ?? bet.status;
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

function betIsDone(bet: OsBetRow, latestUpdates: Map<string, OsBetUpdateRow>): boolean {
  return (latestUpdates.get(bet.id)?.status ?? bet.status) === "executed";
}

function betEffectiveStatus(bet: OsBetRow, latestUpdates: Map<string, OsBetUpdateRow>): string {
  return latestUpdates.get(bet.id)?.status ?? bet.status;
}

function betIsConcluded(bet: OsBetRow, latestUpdates: Map<string, OsBetUpdateRow>): boolean {
  const status = betEffectiveStatus(bet, latestUpdates);
  return status === "executed" || status === "failed";
}

type PillarCardProps = {
  blockType: OsBlockType;
  label: string;
  accent: string;
  pct: number;
  goal: OsGoalRow | null;
  priorityPitches: OsBetRow[];
  backlogPitches: OsBetRow[];
  latestUpdates: Map<string, OsBetUpdateRow>;
  activityCounts: Map<string, { todosOpen: number; todosTotal: number; updates: number }>;
  busy: boolean;
  onEditGoal: (goal: OsGoalRow | null) => void;
  onUnprioritizeGoal: (goal: OsGoalRow) => Promise<void>;
  onConcludeGoal: (goal: OsGoalRow) => void;
  onOpenPitch: (bet: OsBetRow) => void;
  onTogglePitchDone: (bet: OsBetRow) => void;
  onAddPitch: (title: string) => Promise<void>;
  onPrioritizePitch: (bet: OsBetRow) => Promise<void>;
  onUnprioritizePitch: (bet: OsBetRow) => Promise<void>;
  onSetPitchShapeStatus: (bet: OsBetRow, shapeStatus: OsBetShapeStatus) => Promise<void>;
};

function PillarCard({
  blockType,
  label,
  accent,
  pct,
  goal,
  priorityPitches,
  backlogPitches,
  latestUpdates,
  activityCounts,
  busy,
  onEditGoal,
  onUnprioritizeGoal,
  onConcludeGoal,
  onOpenPitch,
  onTogglePitchDone,
  onAddPitch,
  onPrioritizePitch,
  onUnprioritizePitch,
  onSetPitchShapeStatus,
}: PillarCardProps) {
  const [pitchBacklogOpen, setPitchBacklogOpen] = useState(false);
  const [addingPitch, setAddingPitch] = useState(false);
  const [newPitch, setNewPitch] = useState("");

  const started = priorityPitches.length;
  const executed = priorityPitches.filter((b) => betIsDone(b, latestUpdates)).length;
  const failed = priorityPitches.filter(
    (b) => (latestUpdates.get(b.id)?.status ?? b.status) === "failed"
  ).length;

  const backlogActive = sortBacklogBetsByShape(
    backlogPitches.filter((b) => !betIsConcluded(b, latestUpdates))
  );
  const backlogConcluded = backlogPitches.filter((b) => betIsConcluded(b, latestUpdates));
  const backlogDiscovery = backlogActive.filter((b) => getOsBetShapeStatus(b) === "in_discovery");
  const backlogReady = backlogActive.filter((b) => getOsBetShapeStatus(b) === "ready_to_prioritize");

  const submitPitch = async () => {
    const t = newPitch.trim();
    if (!t) return;
    await onAddPitch(t);
    setNewPitch("");
    setAddingPitch(false);
  };

  return (
    <div
      className={`pillar ${pct > 0 ? "has-progress" : ""}`}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div className="head">
        <span className="dot" style={{ background: accent }} />
        <span className="name">{label}</span>
        <span className="pct">{pct}%</span>
      </div>

      {/* META (âncora) */}
      <div className="meta-zone">
        <div className="meta-lab">
          <span className="pin">📌</span> META ATIVA
        </div>
        <div className="meta-row">
          {goal ? (
            <>
              <button
                type="button"
                className="check meta-check"
                title="Concluir meta"
                disabled={busy}
                onClick={() => onConcludeGoal(goal)}
              />
              <button type="button" className="meta-text" onClick={() => onEditGoal(goal)} title="Editar meta">
                {goal.title}
              </button>
            </>
          ) : (
            <span className="meta-text meta-empty">
              Nenhuma meta priorizada — priorize uma nos quarters abaixo
            </span>
          )}
          {goal ? (
            <>
              <button
                type="button"
                className="unprio"
                title="Despriorizar meta"
                disabled={busy}
                onClick={() => void onUnprioritizeGoal(goal)}
              >
                ★
              </button>
              <button type="button" className="edit" onClick={() => onEditGoal(goal)} title="Editar meta">
                ✎
              </button>
            </>
          ) : null}
        </div>
        <div className="meta-stats">
          <div className="ms">
            <span className="l">Started</span>
            <span className="v">{started}</span>
          </div>
          <div className="ms cyan">
            <span className="l">Executed</span>
            <span className={`v ${executed === 0 ? "zero" : ""}`}>{executed}</span>
          </div>
          <div className="ms red">
            <span className="l">Failed</span>
            <span className={`v ${failed === 0 ? "zero" : ""}`}>{failed}</span>
          </div>
        </div>
      </div>

      {/* PITCHES */}
      <div className="pitch-zone">
        <div className="pz-head">
          <span className="l">Apostas priorizadas</span>
          <span className="n">{priorityPitches.length}</span>
        </div>

        {priorityPitches.length === 0 ? (
          <p className="pz-empty">Nenhuma aposta ativa</p>
        ) : (
          priorityPitches.map((bet) => {
            const done = betIsDone(bet, latestUpdates);
            const counts = activityCounts.get(bet.id) ?? { todosOpen: 0, todosTotal: 0, updates: 0 };
                const rawDesc = bet.pitch_outcome ?? bet.pitch_objective ?? "";
                const desc = rawDesc
                  .replace(/<[^>]+>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
            return (
              <div
                key={bet.id}
                className={`pitch-card ${done ? "done" : ""}`}
                onClick={() => onOpenPitch(bet)}
                role="button"
                tabIndex={0}
              >
                <div className="pc-top">
                  <button
                    type="button"
                    className="check"
                    title="Registrar progresso"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePitchDone(bet);
                    }}
                  />
                  <div className="pc-body">
                    <div className="t">{bet.title}</div>
                    {desc ? <div className="d">{desc}</div> : null}
                  </div>
                  <button
                    type="button"
                    className="unprio"
                    title="Despriorizar aposta (volta ao backlog)"
                    disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      void onUnprioritizePitch(bet);
                    }}
                  >
                    ★
                  </button>
                </div>
                <div className="pc-foot">
                  <span className="arrow">→</span>
                  <span className="g">
                    <span className="material-symbols-outlined">checklist</span>
                    <b>
                      {counts.todosOpen} ({counts.todosTotal})
                    </b>
                  </span>
                  <span className="g">
                    <span className="material-symbols-outlined">monitoring</span>
                    <b>{counts.updates}</b> {counts.updates === 1 ? "update" : "updates"}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Apostas no backlog */}
        <div className={`pitch-backlog ${pitchBacklogOpen ? "open" : ""}`}>
          <button
            type="button"
            className="pitch-backlog-toggle"
            onClick={() => setPitchBacklogOpen((v) => !v)}
          >
            <span className="chev">⌄</span> Apostas no backlog
            <span className="count-pill">{backlogPitches.length}</span>
          </button>
          <div className="pitch-backlog-body">
            {backlogReady.length > 0 ? (
              <div className="pb-shape-section">
                <div className="pb-shape-label">Ready to prioritize</div>
                {backlogReady.map((bet) => (
                  <div key={bet.id} className="pb-item shape-ready">
                    <span className="pb-shape-badge ready">Ready</span>
                    <span className="pb-text">{bet.title}</span>
                    <div className="bm-actions">
                      <button
                        type="button"
                        className="prio-icon"
                        disabled={busy}
                        title="Priorizar"
                        aria-label="Priorizar"
                        onClick={() => void onPrioritizePitch(bet)}
                      >
                        <span className="material-symbols-outlined">star</span>
                      </button>
                      <button
                        type="button"
                        className="shape-icon"
                        disabled={busy}
                        title="Voltar para discovery"
                        aria-label="Voltar para discovery"
                        onClick={() => void onSetPitchShapeStatus(bet, "in_discovery")}
                      >
                        <span className="material-symbols-outlined">science</span>
                      </button>
                      <button
                        type="button"
                        className="edit"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => onOpenPitch(bet)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {backlogDiscovery.length > 0 ? (
              <div className="pb-shape-section">
                <div className="pb-shape-label">In Discovery</div>
                {backlogDiscovery.map((bet) => (
                  <div key={bet.id} className="pb-item shape-discovery">
                    <span className="pb-shape-badge discovery">Discovery</span>
                    <span className="pb-text">{bet.title}</span>
                    <div className="bm-actions">
                      <button
                        type="button"
                        className="shape-icon"
                        disabled={busy}
                        title="Marcar como ready to prioritize"
                        aria-label="Marcar como ready"
                        onClick={() => void onSetPitchShapeStatus(bet, "ready_to_prioritize")}
                      >
                        <span className="material-symbols-outlined">task_alt</span>
                      </button>
                      <button
                        type="button"
                        className="edit"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => onOpenPitch(bet)}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {backlogActive.length === 0 && backlogConcluded.length === 0 ? (
              <p className="pb-empty">Nenhuma aposta no backlog</p>
            ) : null}
            {backlogConcluded.length > 0 ? (
              <div className="pb-concluded-section">
                <div className="pb-concluded-label">Já trabalhados</div>
                {backlogConcluded.map((bet) => {
                  const status = betEffectiveStatus(bet, latestUpdates);
                  const statusClass = status === "failed" ? "failed" : "executed";
                  return (
                    <div key={bet.id} className={`pb-item concluded ${statusClass}`}>
                      <span className="pb-status-dot" aria-hidden />
                      <span className="pb-text">{bet.title}</span>
                      <span className={`pb-outcome ${statusClass}`}>
                        {status === "failed" ? "Failed" : "Executed"}
                      </span>
                      <div className="bm-actions">
                        <button
                          type="button"
                          className="edit"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => onOpenPitch(bet)}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {addingPitch ? (
              <div className="add-row">
                <input
                  autoFocus
                  value={newPitch}
                  placeholder="Título da aposta…"
                  onChange={(e) => setNewPitch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitPitch();
                    if (e.key === "Escape") {
                      setAddingPitch(false);
                      setNewPitch("");
                    }
                  }}
                  onBlur={() => void submitPitch()}
                />
              </div>
            ) : (
              <button type="button" className="add-meta" onClick={() => setAddingPitch(true)} disabled={!goal}>
                <span className="plus">+</span> Nova aposta
              </button>
            )}
          </div>
        </div>
      </div>
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
    refreshProjects,
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
  const [busyPillar, setBusyPillar] = useState<string | null>(null);

  const [goals, setGoals] = useState<OsGoalRow[]>([]);
  const [goalsBusy, setGoalsBusy] = useState(false);
  const [activityCounts, setActivityCounts] = useState<
    Map<string, { todosOpen: number; todosTotal: number; updates: number }>
  >(new Map());

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState({
    goalId: "" as string,
    blockId: "",
    blockType: "" as OsBlockType | "",
    title: "",
    description: "",
  });
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalModalBets, setGoalModalBets] = useState<OsBetRow[]>([]);
  const [goalBetsLoading, setGoalBetsLoading] = useState(false);
  const [goalBetBusyId, setGoalBetBusyId] = useState<string | null>(null);

  // Pitch modal
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<OsBetRow | null>(null);
  const [editingBlockType, setEditingBlockType] = useState<OsBlockType>("finance");
  const [pitchLockedGoal, setPitchLockedGoal] = useState<{
    id: string;
    title: string;
    blockType: OsBlockType;
  } | null>(null);
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

  // Goal outcome modal
  const [goalOutcomeModalOpen, setGoalOutcomeModalOpen] = useState(false);
  const [goalOutcomeTarget, setGoalOutcomeTarget] = useState<OsGoalRow | null>(null);
  const [goalOutcomeSaving, setGoalOutcomeSaving] = useState(false);

  const orderedBlocks = useMemo(
    () =>
      OS_BLOCK_TYPES.map((type) => board.find((view) => view.block.type === type)).filter(
        (view): view is OsBlockView => Boolean(view)
      ),
    [board]
  );

  // Carrega todas as metas da empresa (quarters)
  const loadGoals = useCallback(async () => {
    if (!user || !selectedProjectId) {
      setGoals([]);
      return;
    }
    try {
      setGoals(await fetchGoalsForProject(user.id, selectedProjectId));
    } catch {
      /* silencioso */
    }
  }, [user, selectedProjectId]);

  // Carrega contagem de to-dos/updates dos pitches priorizados visíveis
  const loadActivityCounts = useCallback(async () => {
    const betIds = orderedBlocks.flatMap((v) =>
      v.bets.filter((b) => b.is_priority).map((b) => b.id)
    );
    if (betIds.length === 0) {
      setActivityCounts(new Map());
      return;
    }
    try {
      setActivityCounts(await fetchOsBetActivityCounts(betIds));
    } catch {
      /* silencioso */
    }
  }, [orderedBlocks]);

  useEffect(() => {
    void loadGoals();
    void loadActivityCounts();
  }, [loadGoals, loadActivityCounts]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const quarterBlocks = useMemo(
    () =>
      orderedBlocks.map((view) => ({
        id: view.block.id,
        type: view.block.type as OsBlockType,
      })),
    [orderedBlocks]
  );

  const currentQ = currentCalendarQuarter();

  const blockGoals = useMemo(() => {
    const map: Record<OsBlockType, { id: string; title: string } | null> = {
      finance: null,
      growth: null,
      ops: null,
    };
    for (const view of orderedBlocks) {
      const type = view.block.type as OsBlockType;
      if (view.goal) map[type] = { id: view.goal.id, title: view.goal.title };
    }
    return map;
  }, [orderedBlocks]);

  const pillarDisplays = useMemo(() => {
    const displays: Record<OsBlockType, ReturnType<typeof getPillarStatusDisplay>> = {
      finance: getPillarStatusDisplay(null, null),
      growth: getPillarStatusDisplay(null, null),
      ops: getPillarStatusDisplay(null, null),
    };
    for (const view of orderedBlocks) {
      const type = view.block.type as OsBlockType;
      const priorityBet = view.bets.find((bet) => bet.is_priority) ?? view.priorityBet;
      const update = priorityBet ? (latestUpdates.get(priorityBet.id) ?? null) : null;
      displays[type] = getPillarStatusDisplay(priorityBet, update, view.bets, latestUpdates);
    }
    return displays;
  }, [orderedBlocks, latestUpdates]);

  const companyMomentum = useMemo(
    () => computeCompanyMomentum(orderedBlocks, latestUpdates),
    [orderedBlocks, latestUpdates]
  );

  const priorityBets = useMemo(() => {
    const bets: OsBetRow[] = [];
    for (const view of orderedBlocks) {
      bets.push(...view.bets.filter((b) => b.is_priority));
    }
    return bets;
  }, [orderedBlocks]);

  const companyStats = useMemo(() => computeOsBetStats(priorityBets), [priorityBets]);

  const momentumSegments = useMemo(
    () => computeMomentumSegments(priorityBets, latestUpdates),
    [priorityBets, latestUpdates]
  );

  // ---------- Goal handlers ----------
  const loadGoalModalBets = useCallback(async (goalId: string) => {
    setGoalBetsLoading(true);
    try {
      const bets = await fetchOsBetsForGoal(goalId);
      setGoalModalBets(
        [...bets].sort((a, b) => {
          const rank = (bet: OsBetRow) => {
            if (bet.is_priority) return 0;
            if (getOsBetShapeStatus(bet) === "ready_to_prioritize") return 1;
            return 2;
          };
          const diff = rank(a) - rank(b);
          if (diff !== 0) return diff;
          return (a.pos ?? 0) - (b.pos ?? 0);
        })
      );
    } catch {
      setGoalModalBets([]);
    } finally {
      setGoalBetsLoading(false);
    }
  }, []);

  const openGoalModal = (blockId: string, blockType: OsBlockType, goal?: OsGoalRow | null) => {
    setGoalDraft({
      goalId: goal?.id ?? "",
      blockId,
      blockType,
      title: goal?.title ?? "",
      description: goal?.description ?? "",
    });
    setGoalError(null);
    setGoalModalBets([]);
    setGoalModalOpen(true);
    if (goal?.id) void loadGoalModalBets(goal.id);
  };

  const handleSaveGoal = async () => {
    if (!user || !goalDraft.blockId || !goalDraft.title.trim()) {
      setGoalError("Informe um título para a meta.");
      return;
    }
    if (goalDraft.goalId) {
      const existing = goals.find((g) => g.id === goalDraft.goalId);
      if (existing && goalIsConcluded(existing)) {
        setGoalError("Metas concluídas não podem ser editadas.");
        return;
      }
    }
    setGoalSaving(true);
    try {
      if (goalDraft.goalId) {
        await updateOsGoal(goalDraft.goalId, {
          title: goalDraft.title.trim(),
          description: goalDraft.description.trim() || null,
        });
        setGoalModalOpen(false);
      } else {
        const created = await createOsGoal(
          user.id,
          goalDraft.blockId,
          goalDraft.title.trim(),
          goalDraft.description.trim() || undefined,
          currentQ
        );
        setGoalDraft((p) => ({
          ...p,
          goalId: created.id,
          title: created.title,
          description: created.description ?? "",
        }));
        setGoalModalBets([]);
      }
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setGoalError("Não foi possível salvar a meta.");
    } finally {
      setGoalSaving(false);
    }
  };

  const handleCreateQuarterGoal = async (
    blockId: string,
    quarter: OsGoalQuarter | null,
    title: string
  ) => {
    if (!user) return;
    setGoalsBusy(true);
    try {
      await createOsGoal(user.id, blockId, title, undefined, quarter);
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível criar a meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleToggleGoalPriority = async (goal: OsGoalRow) => {
    if (goalIsConcluded(goal)) return;
    setGoalsBusy(true);
    try {
      if (goal.is_priority) await unsetGoalPriority(goal.id);
      else await setGoalPriority(goal.id, goal.block_id);
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível alterar a prioridade da meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleUnprioritizeGoal = async (goal: OsGoalRow, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await unsetGoalPriority(goal.id);
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível despriorizar a meta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleRenameGoal = async (goal: OsGoalRow, title: string) => {
    if (goalIsConcluded(goal)) return;
    setGoalsBusy(true);
    try {
      await updateOsGoal(goal.id, { title });
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível renomear a meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleChangeGoalBlock = async (goal: OsGoalRow, blockId: string) => {
    if (goalIsConcluded(goal) || goal.block_id === blockId) return;
    setGoalsBusy(true);
    try {
      // Prioridade é por pilar — ao mudar de bloco, remove a estrela
      if (goal.is_priority) await unsetGoalPriority(goal.id);
      await updateOsGoal(goal.id, { block_id: blockId });
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível alterar o pilar da meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleDeleteGoal = async (goal: OsGoalRow) => {
    if (goalIsConcluded(goal)) return;
    setGoalsBusy(true);
    try {
      await deleteOsGoal(goal.id);
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível excluir a meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleMoveGoalQuarter = async (goal: OsGoalRow, quarter: OsGoalQuarter | null) => {
    if (goalIsConcluded(goal)) return;
    setGoalsBusy(true);
    try {
      await updateOsGoal(goal.id, { quarter });
      await loadGoals();
    } catch {
      setError("Não foi possível mover a meta.");
    } finally {
      setGoalsBusy(false);
    }
  };

  const handleSaveAnnualGoal = async (text: string) => {
    if (!selectedProjectId) return;
    try {
      await updateOsProjectAnnualObjective(selectedProjectId, text);
      await refreshProjects();
    } catch {
      setError("Não foi possível salvar o Annual Goal.");
    }
  };

  const openGoalOutcomeModal = (goal: OsGoalRow) => {
    setGoalOutcomeTarget(goal);
    setGoalOutcomeModalOpen(true);
  };

  const handleGoalOutcomeSubmit = async (data: {
    outcome: "achieved" | "abandoned";
    note: string;
  }) => {
    if (!goalOutcomeTarget) return;
    const blockId = goalOutcomeTarget.block_id;
    setGoalOutcomeSaving(true);
    setBusyPillar(blockId);
    try {
      await concludeOsGoal(goalOutcomeTarget.id, data.outcome, data.note);
      setGoalOutcomeModalOpen(false);
      setGoalOutcomeTarget(null);
      await refreshBoard({ background: true, force: true });
      await loadGoals();
    } catch {
      setError("Não foi possível concluir a meta.");
      throw new Error("goal outcome failed");
    } finally {
      setGoalOutcomeSaving(false);
      setBusyPillar(null);
    }
  };

  // ---------- Pitch handlers ----------
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

  const openPitchModal = (
    bet: OsBetRow,
    blockType: OsBlockType,
    lockedGoal?: { id: string; title: string; blockType: OsBlockType } | null
  ) => {
    setPitchLockedGoal(lockedGoal ?? null);
    setEditingPitch(bet);
    setEditingBlockType(blockType);
    setModalPriority(bet.is_priority);
    setPitchModalOpen(true);
    void loadPitchTasks(bet.id);
    void loadAllWeeklyUpdates(bet.id);
  };

  const openCreatePitchForGoal = () => {
    if (!goalDraft.goalId || !goalDraft.blockType) return;
    setPitchLockedGoal({
      id: goalDraft.goalId,
      title: goalDraft.title.trim() || "Meta",
      blockType: goalDraft.blockType,
    });
    setEditingPitch(null);
    setEditingBlockType(goalDraft.blockType);
    setModalPriority(false);
    setPitchTasks([]);
    setWeeklyUpdates([]);
    setPitchModalOpen(true);
  };

  const closePitchModal = () => {
    setPitchModalOpen(false);
    setEditingPitch(null);
    setPitchLockedGoal(null);
    setPitchTasks([]);
    setWeeklyUpdates([]);
    if (goalModalOpen && goalDraft.goalId) void loadGoalModalBets(goalDraft.goalId);
  };

  const resolveGoalId = (blockType: OsBlockType) =>
    orderedBlocks.find((v) => v.block.type === blockType)?.goal?.id ?? null;

  const handleSavePitch = async (data: PitchFormData) => {
    if (!user) return;
    setPitchSaving(true);
    try {
      if (editingPitch) {
        await updateOsBet(editingPitch.id, {
          title: data.title.trim(),
          pitchOutcome: data.pitchOutcome.trim() || null,
          failureModes: data.failureModes.trim() || null,
          pitchObjective: data.pitchObjective.trim() || null,
          appetiteScope: data.appetiteScope.trim() || null,
          pitchData: data.pitchData.trim() || null,
          successCriteria: data.successCriteria.trim() || null,
          executionOwner: data.executionOwner || null,
        });
      } else {
        const goalId = pitchLockedGoal?.id ?? resolveGoalId(data.blockType);
        if (!goalId) {
          setError("Defina uma meta antes de criar apostas.");
          return;
        }
        await createOsBet(user.id, {
          goalId,
          title: data.title.trim(),
          pitchOutcome: data.pitchOutcome.trim() || undefined,
          failureModes: data.failureModes.trim() || undefined,
          pitchObjective: data.pitchObjective.trim() || undefined,
          appetiteScope: data.appetiteScope.trim() || undefined,
          pitchData: data.pitchData.trim() || undefined,
          successCriteria: data.successCriteria.trim() || undefined,
          executionOwner: data.executionOwner || undefined,
        });
      }
      closePitchModal();
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } catch {
      setError("Não foi possível salvar a aposta.");
    } finally {
      setPitchSaving(false);
    }
  };

  const handleDeleteGoalBet = async (bet: OsBetRow) => {
    if (!window.confirm(`Excluir a aposta “${bet.title}”?`)) return;
    setGoalBetBusyId(bet.id);
    try {
      await deleteOsBet(bet.id);
      if (goalDraft.goalId) await loadGoalModalBets(goalDraft.goalId);
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } catch {
      setGoalError("Não foi possível excluir a aposta.");
    } finally {
      setGoalBetBusyId(null);
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
      await loadActivityCounts();
    } catch {
      setError("Não foi possível excluir a aposta.");
      await refreshBoard({ background: true, force: true });
    } finally {
      setPitchDeleting(false);
    }
  };

  const handleTogglePriorityModal = async () => {
    if (!editingPitch) return;
    setPriorityLoadingId(editingPitch.id);
    try {
      const updated = await setOsBetPriority(editingPitch.id, !editingPitch.is_priority);
      setEditingPitch(updated);
      setModalPriority(updated.is_priority);
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
      if (goalModalOpen && goalDraft.goalId) await loadGoalModalBets(goalDraft.goalId);
    } catch {
      setError("Não foi possível alterar prioridade.");
    } finally {
      setPriorityLoadingId(null);
    }
  };

  const handlePrioritizePitchInline = async (bet: OsBetRow, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await setOsBetPriority(bet.id, true);
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } catch {
      setError("Não foi possível priorizar a aposta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleSetPitchShapeStatus = async (
    bet: OsBetRow,
    shapeStatus: OsBetShapeStatus,
    blockId: string
  ) => {
    setBusyPillar(blockId);
    try {
      await updateOsBet(bet.id, { shapeStatus });
      if (editingPitch?.id === bet.id) {
        setEditingPitch({
          ...editingPitch,
          shape_status: shapeStatus,
          is_priority: shapeStatus === "in_discovery" ? false : editingPitch.is_priority,
        });
        if (shapeStatus === "in_discovery") setModalPriority(false);
      }
      await refreshBoard({ background: true, force: true });
      if (goalModalOpen && goalDraft.goalId) await loadGoalModalBets(goalDraft.goalId);
    } catch {
      setError("Não foi possível atualizar o status da aposta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleUnprioritizePitchInline = async (bet: OsBetRow, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await setOsBetPriority(bet.id, false);
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } catch {
      setError("Não foi possível despriorizar a aposta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleAddPitch = async (blockType: OsBlockType, blockId: string, title: string) => {
    if (!user) return;
    const goalId = resolveGoalId(blockType);
    if (!goalId) {
      setError("Defina uma meta ativa antes de criar apostas.");
      return;
    }
    setBusyPillar(blockId);
    try {
      await createOsBet(user.id, { goalId, title });
      await refreshBoard({ background: true, force: true });
    } catch {
      setError("Não foi possível criar a aposta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleAddTask = async (title: string) => {
    if (!user || !editingPitch || !selectedProjectId) return;
    await createOsTask(user.id, { projectId: selectedProjectId, betId: editingPitch.id, title });
    await loadPitchTasks(editingPitch.id);
    await loadActivityCounts();
    // Invalida o cache do board de Tasks OS para a nova task aparecer lá imediatamente.
    await refreshTasks({ background: true, force: true });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteOsTask(taskId);
    if (editingPitch) await loadPitchTasks(editingPitch.id);
    await loadActivityCounts();
    await refreshTasks({ background: true, force: true });
  };

  const openWeeklyModal = (bet: OsBetRow) => {
    setWeeklyModalBet(bet);
    setWeeklyModalOpen(true);
  };

  const refreshAfterUpdateMutation = async (betId: string) => {
    if (editingPitch?.id === betId) await loadAllWeeklyUpdates(betId);
    const fresh = await fetchOsBetUpdatesForBet(betId);
    const latest = fresh[0] ?? null;
    setLatestUpdates((prev) => {
      const next = new Map(prev);
      if (latest) next.set(betId, latest);
      else next.delete(betId);
      return next;
    });
    if (editingPitch?.id === betId && latest) {
      const terminal = latest.status === "executed" || latest.status === "failed";
      setEditingPitch((p) =>
        p ? { ...p, status: latest.status, is_priority: terminal ? false : p.is_priority } : p
      );
      if (terminal) setModalPriority(false);
    }
    await refreshBoard({ background: true, force: true });
    await loadActivityCounts();
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
        const terminal = update.status === "executed" || update.status === "failed";
        setEditingPitch((p) =>
          p
            ? { ...p, status: update.status, is_priority: terminal ? false : p.is_priority }
            : p
        );
        if (terminal) setModalPriority(false);
      }
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } finally {
      setWeeklySaving(false);
    }
  };

  const handleAddPitchUpdate = async (data: {
    status: import("@/lib/os-types").OsBetUpdateStatus;
    whatDone: string;
    blockers: string;
  }) => {
    if (!user || !editingPitch) return;
    await createOsBetUpdate(user.id, {
      betId: editingPitch.id,
      status: data.status,
      whatDone: data.whatDone,
      blockers: data.blockers,
    });
    await refreshAfterUpdateMutation(editingPitch.id);
  };

  const handleEditPitchUpdate = async (
    updateId: string,
    data: {
      status: import("@/lib/os-types").OsBetUpdateStatus;
      whatDone: string;
      blockers: string;
    }
  ) => {
    if (!editingPitch) return;
    await updateOsBetUpdate(updateId, editingPitch.id, {
      status: data.status,
      whatDone: data.whatDone,
      blockers: data.blockers,
    });
    await refreshAfterUpdateMutation(editingPitch.id);
  };

  const handleDeletePitchUpdate = async (updateId: string) => {
    if (!editingPitch) return;
    await deleteOsBetUpdate(updateId, editingPitch.id);
    await refreshAfterUpdateMutation(editingPitch.id);
  };

  return (
    <div className="pb-8">
      <div className="page-head">
        <h1>OS</h1>
        <span className="os-crumb">Sistema Operacional · Ciclo Q{currentQ}</span>
      </div>

      <OsCompanySelector />

      {error || boardError ? <div className={osErrorBanner}>{error ?? boardError}</div> : null}
      {boardRefreshing && board.length > 0 ? <p className="os-muted-note">Atualizando…</p> : null}

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
              <div className="seg" style={{ background: "var(--color-ta-cyan)", width: `${momentumSegments.executed}%` }} />
              <div className="seg" style={{ background: "#d99a00", width: `${momentumSegments.inFlight}%` }} />
              <div className="seg" style={{ background: "var(--color-ta-red)", width: `${momentumSegments.failed}%` }} />
              <div className="seg" style={{ background: "var(--color-ta-paper-2)", width: `${momentumSegments.notStarted}%` }} />
            </div>
          </div>

          <div className="pillars">
            {orderedBlocks.map((view) => {
              const blockType = view.block.type as OsBlockType;
              const blockId = view.block.id;
              const priorityPitches = view.bets.filter((b) => b.is_priority);
              const backlogPitches = view.bets.filter((b) => !b.is_priority);
              return (
                <PillarCard
                  key={blockId}
                  blockType={blockType}
                  label={OS_BLOCK_LABELS[blockType]}
                  accent={PILLAR_ACCENT[blockType]}
                  pct={pillarDisplays[blockType].pct}
                  goal={view.goal}
                  priorityPitches={priorityPitches}
                  backlogPitches={backlogPitches}
                  latestUpdates={latestUpdates}
                  activityCounts={activityCounts}
                  busy={busyPillar === blockId}
                  onEditGoal={(g) => openGoalModal(blockId, blockType, g)}
                  onUnprioritizeGoal={(g) => handleUnprioritizeGoal(g, blockId)}
                  onConcludeGoal={openGoalOutcomeModal}
                  onOpenPitch={(bet) => openPitchModal(bet, blockType)}
                  onTogglePitchDone={(bet) => openWeeklyModal(bet)}
                  onAddPitch={(title) => handleAddPitch(blockType, blockId, title)}
                  onPrioritizePitch={(bet) => handlePrioritizePitchInline(bet, blockId)}
                  onUnprioritizePitch={(bet) => handleUnprioritizePitchInline(bet, blockId)}
                  onSetPitchShapeStatus={(bet, shapeStatus) =>
                    handleSetPitchShapeStatus(bet, shapeStatus, blockId)
                  }
                />
              );
            })}
          </div>

          <OsAnnualGoalBar
            year={selectedProject?.annual_objective_year ?? new Date().getFullYear()}
            value={selectedProject?.annual_objective}
            onSave={handleSaveAnnualGoal}
          />

          <OsGoalsByQuarterPanel
            goals={goals}
            blocks={quarterBlocks}
            busy={goalsBusy}
            onCreate={handleCreateQuarterGoal}
            onRename={handleRenameGoal}
            onChangeBlock={handleChangeGoalBlock}
            onDelete={handleDeleteGoal}
            onMoveQuarter={handleMoveGoalQuarter}
            onTogglePriority={handleToggleGoalPriority}
            onConclude={openGoalOutcomeModal}
            onEdit={(goal) => {
              const block = orderedBlocks.find((v) => v.block.id === goal.block_id);
              if (!block) return;
              openGoalModal(goal.block_id, block.block.type as OsBlockType, goal);
            }}
          />

          <div className="hier-note">
            <span>
              <b>HIERARQUIA</b> &nbsp; Pilar → Meta → Aposta → updates &amp; to-dos
            </span>
            <span>
              <b>META</b> &nbsp; planeada por quarter abaixo · só a priorizada aparece no pilar
            </span>
            <span>
              <b>APOSTA</b> &nbsp; gera o trabalho da semana
            </span>
          </div>
        </>
      )}

      {/* Goal modal */}
      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <div
            data-modal-content
            role="dialog"
            aria-modal="true"
            className="pointer-events-auto relative z-[1] mx-auto max-h-[min(92dvh,52rem)] w-full max-w-xl overflow-y-auto border border-ta-rule-2 bg-ta-paper font-sans shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 bg-ta-ink px-5 py-4 text-ta-paper">
              <h2 className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]">
                {goalDraft.goalId ? "Editar meta" : "Definir meta"}
              </h2>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-ta-paper/60">
                {goalDraft.blockType ? OS_BLOCK_LABELS[goalDraft.blockType] : ""}
              </span>
            </div>
            <div className="space-y-5 px-5 py-5">
              <label className="block">
                <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
                  Meta
                </span>
                <input
                  type="text"
                  autoFocus
                  value={goalDraft.title}
                  disabled={
                    Boolean(goalDraft.goalId) &&
                    Boolean(goals.find((g) => g.id === goalDraft.goalId && goalIsConcluded(g)))
                  }
                  onChange={(e) => setGoalDraft((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveGoal();
                  }}
                  className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2.5 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink disabled:opacity-70"
                />
              </label>

              <div className="block">
                <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
                  Problema / detalhes
                </span>
                <p className="mb-2 font-sans text-xs leading-relaxed text-ta-muted">
                  Explicitá o problema ou o contexto que gerou esta meta. Podes colar prints ou anexar
                  imagens.
                </p>
                <OsGoalDescriptionEditor
                  value={goalDraft.description}
                  userId={user?.id}
                  disabled={
                    Boolean(goalDraft.goalId) &&
                    Boolean(goals.find((g) => g.id === goalDraft.goalId && goalIsConcluded(g)))
                  }
                  onChange={(html) => setGoalDraft((p) => ({ ...p, description: html }))}
                />
              </div>

              {goalDraft.goalId ? (
                <div className="block border-t border-ta-rule-2 pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
                      Apostas desta meta
                    </span>
                    <span className="font-mono text-[10px] text-ta-muted-2">
                      {goalBetsLoading ? "…" : goalModalBets.length}
                    </span>
                  </div>
                  {goalBetsLoading ? (
                    <p className="font-sans text-xs text-ta-muted">A carregar apostas…</p>
                  ) : goalModalBets.length === 0 ? (
                    <p className="mb-2 font-sans text-xs text-ta-muted">
                      Ainda sem apostas. Podes shaping aqui mesmo, mesmo sem priorizar a meta.
                    </p>
                  ) : (
                    <ul className="mb-2 divide-y divide-ta-rule">
                      {goalModalBets.map((bet) => {
                        const stage = getOsBetPipelineStage(bet);
                        const badgeClass =
                          stage === "prioritized"
                            ? "border-ta-ink bg-ta-ink text-ta-paper"
                            : stage === "ready_to_prioritize"
                              ? "border-ta-ink text-ta-ink"
                              : "border-ta-rule-2 text-ta-muted";
                        return (
                          <li
                            key={bet.id}
                            className="group flex items-center gap-2 py-2.5"
                          >
                            <span
                              className={`shrink-0 border px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${badgeClass}`}
                            >
                              {formatOsBetPipelineLabel(stage)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-sans text-sm text-ta-ink">
                              {bet.title}
                            </span>
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                              <button
                                type="button"
                                title="Editar aposta"
                                aria-label="Editar aposta"
                                disabled={goalBetBusyId === bet.id}
                                onClick={() =>
                                  openPitchModal(bet, goalDraft.blockType as OsBlockType, {
                                    id: goalDraft.goalId,
                                    title: goalDraft.title.trim() || "Meta",
                                    blockType: goalDraft.blockType as OsBlockType,
                                  })
                                }
                                className="inline-flex p-1 text-ta-muted transition-colors hover:text-ta-ink disabled:opacity-40"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button
                                type="button"
                                title="Excluir aposta"
                                aria-label="Excluir aposta"
                                disabled={goalBetBusyId === bet.id}
                                onClick={() => void handleDeleteGoalBet(bet)}
                                className="inline-flex p-1 text-ta-muted transition-colors hover:text-ta-red disabled:opacity-40"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!(
                    goalDraft.goalId &&
                    goals.find((g) => g.id === goalDraft.goalId && goalIsConcluded(g))
                  ) ? (
                    <button
                      type="button"
                      onClick={openCreatePitchForGoal}
                      className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted-2 transition-colors hover:text-ta-ink"
                    >
                      <span className="text-[13px] leading-none">+</span> Nova aposta
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="border-t border-ta-rule-2 pt-4 font-sans text-xs text-ta-muted">
                  Guarda a meta para poderes adicionar e editar apostas ligadas a ela.
                </p>
              )}

              {goalError ? <p className="font-sans text-sm font-semibold text-ta-red">{goalError}</p> : null}
              <div className="flex justify-end gap-2 border-t border-ta-rule-2 pt-4">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="border border-ta-rule-2 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-ink transition-colors hover:bg-ta-paper-2"
                >
                  Cancelar
                </button>
                {!(
                  goalDraft.goalId &&
                  goals.find((g) => g.id === goalDraft.goalId && goalIsConcluded(g))
                ) ? (
                  <button
                    type="button"
                    onClick={() => void handleSaveGoal()}
                    disabled={goalSaving}
                    className="border border-ta-ink bg-ta-ink px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-paper transition-colors hover:bg-ta-ink/90 disabled:opacity-50"
                  >
                    {goalSaving ? "Salvando..." : "Salvar"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </ModalOverlay>
      ) : null}

      <PitchModal
        open={pitchModalOpen}
        onClose={closePitchModal}
        pitch={editingPitch}
        initialBlockType={editingBlockType}
        lockedGoal={pitchLockedGoal}
        blockGoals={blockGoals}
        isPriority={modalPriority}
        onTogglePriority={handleTogglePriorityModal}
        onChangeShapeStatus={async (shapeStatus) => {
          if (!editingPitch) return;
          const blockId =
            orderedBlocks.find((v) => v.block.type === editingBlockType)?.block.id ?? "";
          await handleSetPitchShapeStatus(editingPitch, shapeStatus, blockId);
        }}
        pitchTasks={pitchTasks}
        tasksLoading={tasksLoading}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        priorityLoading={priorityLoadingId === editingPitch?.id}
        weeklyUpdates={weeklyUpdates}
        weeklyUpdatesLoading={weeklyUpdatesLoading}
        onAddUpdate={handleAddPitchUpdate}
        onEditUpdate={handleEditPitchUpdate}
        onDeleteUpdate={handleDeletePitchUpdate}
        onSave={handleSavePitch}
        onDelete={editingPitch ? handleDeletePitch : undefined}
        saving={pitchSaving || pitchDeleting}
        userId={user?.id}
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

      {goalOutcomeTarget ? (
        <GoalOutcomeModal
          open={goalOutcomeModalOpen}
          onClose={() => {
            setGoalOutcomeModalOpen(false);
            setGoalOutcomeTarget(null);
          }}
          goal={goalOutcomeTarget}
          onSubmit={handleGoalOutcomeSubmit}
          saving={goalOutcomeSaving}
        />
      ) : null}
    </div>
  );
}

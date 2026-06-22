"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { PitchModal, type PitchFormData } from "@/components/os/PitchModal";
import { WeeklyUpdateModal } from "@/components/os/WeeklyUpdateModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  computeCompanyMomentum,
  computeOsBetStats,
  createOsBet,
  createOsBetUpdate,
  createOsGoal,
  createOsTask,
  deleteOsBet,
  deleteOsGoal,
  deleteOsTask,
  fetchGoalsForBlock,
  fetchOsBetActivityCounts,
  fetchOsBetUpdatesForBet,
  fetchOsTasksForBet,
  getPillarStatusDisplay,
  removeBetFromBoardViews,
  saveOsGoal,
  setGoalPriority,
  setOsBetPriority,
  updateOsBet,
  updateOsGoal,
  type OsBlockView,
} from "@/lib/os-queries";
import type {
  OsBetRow,
  OsBetUpdateRow,
  OsBlockType,
  OsGoalRow,
  OsTaskRow,
} from "@/lib/os-types";
import { osCacheKey, packBoardCache, setOsCache } from "@/lib/os-cache";
import { osBtnGhost, osBtnPrimary, osEmptyState, osErrorBanner, osInput } from "@/lib/os-ui";

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

type PillarCardProps = {
  blockType: OsBlockType;
  label: string;
  accent: string;
  pct: number;
  goal: OsGoalRow | null;
  priorityPitches: OsBetRow[];
  backlogPitches: OsBetRow[];
  backlogMetas: OsGoalRow[];
  latestUpdates: Map<string, OsBetUpdateRow>;
  activityCounts: Map<string, { todos: number; updates: number }>;
  busy: boolean;
  onEditGoal: (goal: OsGoalRow | null) => void;
  onAddGoal: (title: string) => Promise<void>;
  onPrioritizeGoal: (goal: OsGoalRow) => Promise<void>;
  onRenameGoal: (goal: OsGoalRow, title: string) => Promise<void>;
  onDeleteGoal: (goal: OsGoalRow) => Promise<void>;
  onOpenPitch: (bet: OsBetRow) => void;
  onTogglePitchDone: (bet: OsBetRow) => void;
  onAddPitch: (title: string) => Promise<void>;
  onPrioritizePitch: (bet: OsBetRow) => Promise<void>;
};

function PillarCard({
  blockType,
  label,
  accent,
  pct,
  goal,
  priorityPitches,
  backlogPitches,
  backlogMetas,
  latestUpdates,
  activityCounts,
  busy,
  onEditGoal,
  onAddGoal,
  onPrioritizeGoal,
  onRenameGoal,
  onDeleteGoal,
  onOpenPitch,
  onTogglePitchDone,
  onAddPitch,
  onPrioritizePitch,
}: PillarCardProps) {
  const [pitchBacklogOpen, setPitchBacklogOpen] = useState(false);
  const [metaBacklogOpen, setMetaBacklogOpen] = useState(false);
  const [addingPitch, setAddingPitch] = useState(false);
  const [addingMeta, setAddingMeta] = useState(false);
  const [newPitch, setNewPitch] = useState("");
  const [newMeta, setNewMeta] = useState("");
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [editMetaText, setEditMetaText] = useState("");

  const started = priorityPitches.length;
  const executed = priorityPitches.filter((b) => betIsDone(b, latestUpdates)).length;
  const failed = priorityPitches.filter(
    (b) => (latestUpdates.get(b.id)?.status ?? b.status) === "failed"
  ).length;

  const submitPitch = async () => {
    const t = newPitch.trim();
    if (!t) return;
    await onAddPitch(t);
    setNewPitch("");
    setAddingPitch(false);
  };
  const submitMeta = async () => {
    const t = newMeta.trim();
    if (!t) return;
    await onAddGoal(t);
    setNewMeta("");
    setAddingMeta(false);
  };
  const submitRename = async (g: OsGoalRow) => {
    const t = editMetaText.trim();
    if (t && t !== g.title) await onRenameGoal(g, t);
    setEditingMetaId(null);
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
            <button type="button" className="meta-text" onClick={() => onEditGoal(goal)} title="Editar meta">
              {goal.title}
            </button>
          ) : (
            <button type="button" className="meta-text" onClick={() => onEditGoal(null)}>
              Definir meta
            </button>
          )}
          <button type="button" className="edit" onClick={() => onEditGoal(goal)} title="Editar meta">
            ✎
          </button>
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
          <span className="l">Pitches priorizados</span>
          <span className="n">{priorityPitches.length}</span>
        </div>

        {priorityPitches.length === 0 ? (
          <p className="pz-empty">Nenhum pitch ativo</p>
        ) : (
          priorityPitches.map((bet) => {
            const done = betIsDone(bet, latestUpdates);
            const counts = activityCounts.get(bet.id) ?? { todos: 0, updates: 0 };
            const desc = bet.pitch_outcome ?? bet.pitch_objective ?? "";
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
                </div>
                <div className="pc-foot">
                  <span className="arrow">→</span>
                  <span className="g">
                    <span className="material-symbols-outlined">checklist</span>
                    <b>{counts.todos}</b> {counts.todos === 1 ? "to-do" : "to-dos"}
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

        {/* Pitches no backlog */}
        <div className={`pitch-backlog ${pitchBacklogOpen ? "open" : ""}`}>
          <button
            type="button"
            className="pitch-backlog-toggle"
            onClick={() => setPitchBacklogOpen((v) => !v)}
          >
            <span className="chev">⌄</span> Pitches no backlog
            <span className="count-pill">{backlogPitches.length}</span>
          </button>
          <div className="pitch-backlog-body">
            {backlogPitches.map((bet) => (
              <div key={bet.id} className="pb-item">
                <span className="pb-text">{bet.title}</span>
                <div className="bm-actions">
                  <button
                    type="button"
                    className="prioritize"
                    disabled={busy}
                    onClick={() => void onPrioritizePitch(bet)}
                  >
                    Priorizar
                  </button>
                  <button type="button" className="edit" title="Editar" onClick={() => onOpenPitch(bet)}>
                    ✎
                  </button>
                </div>
              </div>
            ))}
            {addingPitch ? (
              <div className="add-row">
                <input
                  autoFocus
                  value={newPitch}
                  placeholder="Título do pitch…"
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
                <span className="plus">+</span> Novo pitch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* META BACKLOG */}
      <div className={`backlog ${metaBacklogOpen ? "open" : ""}`}>
        <button type="button" className="backlog-toggle" onClick={() => setMetaBacklogOpen((v) => !v)}>
          <span className="chev">⌄</span> Metas no backlog
          <span className="count-pill">{backlogMetas.length}</span>
        </button>
        <div className="backlog-body">
          {backlogMetas.map((g) =>
            editingMetaId === g.id ? (
              <div key={g.id} className="add-row">
                <input
                  autoFocus
                  value={editMetaText}
                  onChange={(e) => setEditMetaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitRename(g);
                    if (e.key === "Escape") setEditingMetaId(null);
                  }}
                  onBlur={() => void submitRename(g)}
                />
              </div>
            ) : (
              <div key={g.id} className="backlog-meta">
                <span className="bm-text">{g.title}</span>
                <div className="bm-actions">
                  <button
                    type="button"
                    className="prioritize"
                    disabled={busy}
                    onClick={() => void onPrioritizeGoal(g)}
                  >
                    Priorizar
                  </button>
                  <button
                    type="button"
                    className="edit"
                    title="Editar"
                    onClick={() => {
                      setEditingMetaId(g.id);
                      setEditMetaText(g.title);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="del"
                    title="Excluir meta"
                    disabled={busy}
                    onClick={() => void onDeleteGoal(g)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          )}
          {addingMeta ? (
            <div className="add-row">
              <input
                autoFocus
                value={newMeta}
                placeholder="Nova meta…"
                onChange={(e) => setNewMeta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitMeta();
                  if (e.key === "Escape") {
                    setAddingMeta(false);
                    setNewMeta("");
                  }
                }}
                onBlur={() => void submitMeta()}
              />
            </div>
          ) : (
            <button type="button" className="add-meta" onClick={() => setAddingMeta(true)}>
              <span className="plus">+</span> Nova meta
            </button>
          )}
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

  const [goalsByBlock, setGoalsByBlock] = useState<Map<string, OsGoalRow[]>>(new Map());
  const [activityCounts, setActivityCounts] = useState<
    Map<string, { todos: number; updates: number }>
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

  // Carrega todas as metas por bloco (para o drawer "Metas no backlog")
  const loadGoalsByBlock = useCallback(async () => {
    if (orderedBlocks.length === 0) return;
    try {
      const entries = await Promise.all(
        orderedBlocks.map(async (view) => {
          const goals = await fetchGoalsForBlock(view.block.id);
          return [view.block.id, goals] as const;
        })
      );
      setGoalsByBlock(new Map(entries));
    } catch {
      /* silencioso — backlog de metas apenas não popula */
    }
  }, [orderedBlocks]);

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
    void loadGoalsByBlock();
    void loadActivityCounts();
  }, [loadGoalsByBlock, loadActivityCounts]);

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
  const openGoalModal = (blockId: string, blockType: OsBlockType, goal?: OsGoalRow | null) => {
    setGoalDraft({
      goalId: goal?.id ?? "",
      blockId,
      blockType,
      title: goal?.title ?? "",
      description: goal?.description ?? "",
    });
    setGoalError(null);
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!user || !goalDraft.blockId || !goalDraft.title.trim()) {
      setGoalError("Informe um título para a meta.");
      return;
    }
    setGoalSaving(true);
    try {
      if (goalDraft.goalId) {
        await updateOsGoal(goalDraft.goalId, {
          title: goalDraft.title.trim(),
          description: goalDraft.description.trim() || null,
        });
      } else {
        await saveOsGoal(
          user.id,
          goalDraft.blockId,
          goalDraft.title.trim(),
          goalDraft.description.trim() || undefined
        );
      }
      setGoalModalOpen(false);
      await refreshBoard({ background: true, force: true });
      await loadGoalsByBlock();
    } catch {
      setGoalError("Não foi possível salvar a meta.");
    } finally {
      setGoalSaving(false);
    }
  };

  const handleAddGoal = async (blockId: string, title: string) => {
    if (!user) return;
    setBusyPillar(blockId);
    try {
      await createOsGoal(user.id, blockId, title);
      await refreshBoard({ background: true, force: true });
      await loadGoalsByBlock();
    } catch {
      setError("Não foi possível criar a meta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handlePrioritizeGoal = async (goal: OsGoalRow, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await setGoalPriority(goal.id, blockId);
      await refreshBoard({ background: true, force: true });
      await loadGoalsByBlock();
    } catch {
      setError("Não foi possível priorizar a meta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleRenameGoal = async (goal: OsGoalRow, title: string, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await updateOsGoal(goal.id, { title });
      await refreshBoard({ background: true, force: true });
      await loadGoalsByBlock();
    } catch {
      setError("Não foi possível renomear a meta.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleDeleteGoal = async (goal: OsGoalRow, blockId: string) => {
    setBusyPillar(blockId);
    try {
      await deleteOsGoal(goal.id);
      await refreshBoard({ background: true, force: true });
      await loadGoalsByBlock();
    } catch {
      setError("Não foi possível excluir a meta.");
    } finally {
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
      await loadActivityCounts();
    } catch {
      setError("Não foi possível excluir o pitch.");
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
      setError("Não foi possível priorizar o pitch.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleAddPitch = async (blockType: OsBlockType, blockId: string, title: string) => {
    if (!user) return;
    const goalId = resolveGoalId(blockType);
    if (!goalId) {
      setError("Defina uma meta ativa antes de criar pitches.");
      return;
    }
    setBusyPillar(blockId);
    try {
      await createOsBet(user.id, { goalId, title });
      await refreshBoard({ background: true, force: true });
    } catch {
      setError("Não foi possível criar o pitch.");
    } finally {
      setBusyPillar(null);
    }
  };

  const handleAddTask = async (title: string) => {
    if (!user || !editingPitch || !selectedProjectId) return;
    await createOsTask(user.id, { projectId: selectedProjectId, betId: editingPitch.id, title });
    await loadPitchTasks(editingPitch.id);
    await loadActivityCounts();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteOsTask(taskId);
    if (editingPitch) await loadPitchTasks(editingPitch.id);
    await loadActivityCounts();
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
      if (editingPitch?.id === weeklyModalBet.id) await loadAllWeeklyUpdates(weeklyModalBet.id);
      await refreshBoard({ background: true, force: true });
      await loadActivityCounts();
    } finally {
      setWeeklySaving(false);
    }
  };

  return (
    <div className="pb-8">
      <div className="page-head">
        <h1>OS</h1>
        <span className="os-crumb">Sistema Operacional · Ciclo Q2</span>
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
              const allGoals = goalsByBlock.get(blockId) ?? [];
              const backlogMetas = allGoals.filter(
                (g) => g.status === "active" && g.id !== view.goal?.id
              );
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
                  backlogMetas={backlogMetas}
                  latestUpdates={latestUpdates}
                  activityCounts={activityCounts}
                  busy={busyPillar === blockId}
                  onEditGoal={(g) => openGoalModal(blockId, blockType, g)}
                  onAddGoal={(title) => handleAddGoal(blockId, title)}
                  onPrioritizeGoal={(g) => handlePrioritizeGoal(g, blockId)}
                  onRenameGoal={(g, title) => handleRenameGoal(g, title, blockId)}
                  onDeleteGoal={(g) => handleDeleteGoal(g, blockId)}
                  onOpenPitch={(bet) => openPitchModal(bet, blockType)}
                  onTogglePitchDone={(bet) => openWeeklyModal(bet)}
                  onAddPitch={(title) => handleAddPitch(blockType, blockId, title)}
                  onPrioritizePitch={(bet) => handlePrioritizePitchInline(bet, blockId)}
                />
              );
            })}
          </div>

          <div className="hier-note">
            <span>
              <b>HIERARQUIA</b> &nbsp; Pilar → Meta → Pitch → updates &amp; to-dos
            </span>
            <span>
              <b>META</b> &nbsp; âncora · só priorizadas à mostra · backlog no drawer
            </span>
            <span>
              <b>PITCH</b> &nbsp; gera o trabalho da semana
            </span>
          </div>
        </>
      )}

      {/* Goal modal */}
      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <ModalPanel maxWidthClass="max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-ta-ink">
                {goalDraft.goalId ? "Editar meta" : "Definir meta"}
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
                  disabled={goalSaving}
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
        onTogglePriority={handleTogglePriorityModal}
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

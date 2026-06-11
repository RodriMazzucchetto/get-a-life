"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { useAuthContext } from "@/contexts/AuthContext";
import { OsProjectProvider, useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  computeOsBetStats,
  createOsCycle,
  createOsGoal,
  fetchOsProjectDashboard,
  type OsBetStats,
  type OsBlockView,
  type OsProjectDashboardData,
} from "@/lib/os-queries";
import type { OsBlockType } from "@/lib/os-types";

const OS_CYAN = "#5BC0EB";
const OS_RED = "#FF0000";

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

function OsBlockColumn({
  blockView,
  hasActiveCycle,
  onDefineGoal,
  onStartCycle,
  actionLoading,
}: {
  blockView: OsBlockView;
  hasActiveCycle: boolean;
  onDefineGoal: (blockId: string, blockType: OsBlockType) => void;
  onStartCycle: () => void;
  actionLoading: string | null;
}) {
  const blockType = blockView.block.type as OsBlockType;
  const blockLabel = OS_BLOCK_LABELS[blockType];
  const dotColor = OS_BLOCK_DOT_COLORS[blockType];
  const stats = computeOsBetStats(blockView.bets);
  const goalTitle = blockView.goal?.title ?? "Definir meta";

  return (
    <article className="flex flex-col bg-white">
      <header className="flex items-center justify-between bg-black px-3 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
          <h2 className="text-sm font-bold tracking-[0.12em]">{blockLabel}</h2>
        </div>
        <button
          type="button"
          className="text-white/90 transition-opacity hover:opacity-70"
          aria-label={`Configurações ${blockLabel}`}
          onClick={() => {
            if (!hasActiveCycle) onStartCycle();
          }}
          disabled={actionLoading !== null}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>
      </header>

      <div className="border-x-2 border-b-2 border-black px-3 py-3">
        <div className="mb-4 flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-snug tracking-wide">{goalTitle}</p>
          <button
            type="button"
            onClick={() => onDefineGoal(blockView.block.id, blockType)}
            disabled={actionLoading !== null}
            className="shrink-0 text-black/70 transition-opacity hover:opacity-60"
            aria-label={`Editar meta ${blockLabel}`}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        <div className="space-y-1 text-sm font-bold tracking-wide">
          <p>STARTED: {stats.started}</p>
          <p style={{ color: OS_CYAN }}>EXECUTED: {stats.executed}</p>
          <p style={{ color: OS_CYAN }}>SUCCESS RATE: {stats.successRate}%</p>
          <p style={{ color: OS_RED }}>FAILED: {stats.failed}</p>
          <p style={{ color: OS_RED }}>FAILURE RATE: {stats.failureRate}%</p>
        </div>

        {!hasActiveCycle ? (
          <button
            type="button"
            onClick={onStartCycle}
            disabled={actionLoading !== null}
            className="mt-4 w-full border-2 border-black px-3 py-2 text-xs font-bold tracking-[0.14em] transition-colors hover:bg-black hover:text-white disabled:opacity-50"
          >
            INICIAR CICLO
          </button>
        ) : null}
      </div>
    </article>
  );
}

function aggregateStats(blocks: OsBlockView[]): OsBetStats {
  return blocks.reduce<OsBetStats>(
    (acc, blockView) => {
      const blockStats = computeOsBetStats(blockView.bets);
      return {
        started: acc.started + blockStats.started,
        executed: acc.executed + blockStats.executed,
        failed: acc.failed + blockStats.failed,
        successRate: 0,
        failureRate: 0,
      };
    },
    { started: 0, executed: 0, failed: 0, successRate: 0, failureRate: 0 }
  );
}

export default function OsPage() {
  return (
    <OsProjectProvider>
      <OsPageContent />
    </OsProjectProvider>
  );
}

function OsPageContent() {
  const { user } = useAuthContext();
  const { selectedProjectId, loadingProjects, setSelectedProjectId, projects, projectsError } =
    useOsLayout();
  const [dashboard, setDashboard] = useState<OsProjectDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState({
    blockId: "",
    blockType: "" as OsBlockType | "",
    title: "",
    description: "",
  });
  const [goalError, setGoalError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user || !selectedProjectId) {
      setDashboard(null);
      return;
    }

    setLoadingDashboard(true);
    setError(null);

    try {
      const data = await fetchOsProjectDashboard(user.id, selectedProjectId);
      setDashboard(data);
    } catch (loadError) {
      console.error("Erro ao carregar dashboard OS:", loadError);
      setError("Não foi possível carregar os blocos OS.");
      setDashboard(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user, selectedProjectId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleStartCycle = async () => {
    if (!user || !selectedProjectId) return;

    setActionLoading("cycle");
    setError(null);

    try {
      await createOsCycle(user.id, selectedProjectId);
      await loadDashboard();
    } catch (startError) {
      console.error("Erro ao iniciar ciclo OS:", startError);
      setError("Não foi possível iniciar o ciclo.");
    } finally {
      setActionLoading(null);
    }
  };

  const openGoalModal = (blockId: string, blockType: OsBlockType) => {
    const existingGoal = dashboard?.blocks.find((b) => b.block.id === blockId)?.goal;
    setGoalDraft({
      blockId,
      blockType,
      title: existingGoal?.title ?? "",
      description: existingGoal?.description ?? "",
    });
    setGoalError(null);
    setGoalModalOpen(true);
  };

  const handleCreateGoal = async () => {
    if (!user || !goalDraft.blockId || !goalDraft.title.trim()) {
      setGoalError("Informe um título para a meta.");
      return;
    }

    setActionLoading(`goal-${goalDraft.blockId}`);
    setGoalError(null);

    try {
      await createOsGoal(
        user.id,
        goalDraft.blockId,
        goalDraft.title.trim(),
        goalDraft.description.trim() || undefined
      );
      setGoalModalOpen(false);
      await loadDashboard();
    } catch (createError) {
      console.error("Erro ao criar meta OS:", createError);
      setGoalError("Não foi possível criar a meta.");
    } finally {
      setActionLoading(null);
    }
  };

  const orderedBlocks = OS_BLOCK_TYPES.map((type) =>
    dashboard?.blocks.find((blockView) => blockView.block.type === type)
  ).filter((blockView): blockView is OsBlockView => Boolean(blockView));

  const totals = useMemo(() => {
    const base = aggregateStats(orderedBlocks);
    return {
      ...base,
      successRate: base.started > 0 ? Math.round((base.executed / base.started) * 100) : 0,
      failureRate: base.started > 0 ? Math.round((base.failed / base.started) * 100) : 0,
    };
  }, [orderedBlocks]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="mx-auto max-w-6xl pb-8 font-mono uppercase tracking-wide text-black">
      <div className="mb-6 border-2 border-black bg-white">
        <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 items-center border-b-2 border-black px-4 py-3 text-sm font-bold sm:border-b-0 sm:border-r-2">
            EMPRESA
          </div>
          <div className="flex flex-1 items-center px-4 py-2">
            {loadingProjects ? (
              <span className="text-sm font-bold normal-case">Carregando...</span>
            ) : projects.length === 0 ? (
              <span className="text-sm font-bold normal-case">Nenhuma empresa encontrada</span>
            ) : (
              <select
                value={selectedProjectId ?? ""}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none normal-case"
                aria-label="Selecionar empresa"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedProject ? (
            <div
              className="hidden items-center border-l-2 border-black px-4 sm:flex"
              aria-hidden
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {projectsError ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {projectsError}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {error}
        </div>
      ) : null}

      {loadingProjects || loadingDashboard ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Carregando OS...
        </div>
      ) : !selectedProjectId ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Selecione uma empresa para visualizar o OS.
        </div>
      ) : (
        <>
          <h1 className="mb-4 text-center text-2xl font-bold tracking-[0.08em] sm:text-3xl">
            PRIORITIES STARTED: {totals.started}
          </h1>

          <div className="mb-8 space-y-3">
            <OsProgressBar
              label="EXECUTED"
              value={totals.executed}
              pct={totals.successRate}
              tone="executed"
            />
            <OsProgressBar
              label="FAILED"
              value={totals.failed}
              pct={totals.failureRate}
              tone="failed"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-4">
            {orderedBlocks.map((blockView) => (
              <OsBlockColumn
                key={blockView.block.id}
                blockView={blockView}
                hasActiveCycle={Boolean(dashboard?.activeCycle)}
                onDefineGoal={openGoalModal}
                onStartCycle={() => void handleStartCycle()}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </>
      )}

      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <ModalPanel maxWidthClass="max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-black">
                {goalDraft.title ? "Editar meta" : "Definir meta"}
              </h2>
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="text-black/60 transition-colors hover:text-black"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 font-mono normal-case">
              <p className="text-sm text-black/70">
                Bloco:{" "}
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
                  onChange={(event) =>
                    setGoalDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold outline-none focus:bg-black/5"
                  placeholder="Ex.: 33% Net Profit Margin"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-black/70">
                  Descrição (opcional)
                </span>
                <textarea
                  rows={3}
                  value={goalDraft.description}
                  onChange={(event) =>
                    setGoalDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-black/5"
                />
              </label>
              {goalError ? <p className="text-sm font-bold text-[#FF0000]">{goalError}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="border-2 border-black px-3 py-2 text-sm font-bold hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateGoal()}
                  disabled={actionLoading !== null}
                  className="border-2 border-black bg-black px-3 py-2 text-sm font-bold text-white hover:bg-black/85 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </ModalPanel>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  computeOsBetStats,
  saveOsGoal,
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
  onDefineGoal,
  actionLoading,
}: {
  blockView: OsBlockView;
  onDefineGoal: (blockId: string, blockType: OsBlockType) => void;
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

        {blockView.priorityBet ? (
          <div className="mt-4 border-t-2 border-black pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF0000]">
              Pitch prioritário
            </p>
            <div className="border-2 border-[#FF0000] bg-white px-3 py-2.5">
              <p className="text-sm font-bold normal-case leading-snug">{blockView.priorityBet.title}</p>
              {blockView.priorityBet.pitch_outcome ? (
                <p className="mt-1 line-clamp-2 text-xs font-bold normal-case text-black/60">
                  {blockView.priorityBet.pitch_outcome}
                </p>
              ) : null}
            </div>
          </div>
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
  return <OsPageContent />;
}

function OsPageContent() {
  const { user } = useAuthContext();
  const { selectedProjectId, loadingProjects } = useOsLayout();
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
      await saveOsGoal(
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

  return (
    <div className="pb-8 font-mono uppercase tracking-wide text-black">
      <OsCompanySelector />

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
                onDefineGoal={openGoalModal}
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

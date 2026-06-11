"use client";

import { useCallback, useEffect, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  createOsCycle,
  createOsGoal,
  fetchOsProjectDashboard,
  formatBetStatusLabel,
  getBetStatusBadgeClass,
  type OsBlockView,
  type OsProjectDashboardData,
} from "@/lib/os-queries";
import type { OsBlockType } from "@/lib/os-types";
import { useOsLayout } from "./layout";

function formatCycleMonth(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function BlockCard({
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
  const blockLabel = OS_BLOCK_LABELS[blockType] ?? blockType;

  return (
    <article className="flex h-full flex-col rounded-2xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/15">
      <header className="mb-4 border-b border-outline-variant/15 pb-3">
        <h2 className="font-headline text-xl font-bold text-on-surface">{blockLabel}</h2>
      </header>

      <div className="mb-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Meta ativa
        </p>
        {blockView.goal ? (
          <div className="rounded-xl bg-surface-container-low px-3 py-2">
            <p className="text-sm font-semibold text-on-surface">{blockView.goal.title}</p>
            {blockView.goal.description ? (
              <p className="mt-1 text-xs text-on-surface-variant">{blockView.goal.description}</p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onDefineGoal(blockView.block.id, blockType)}
            disabled={actionLoading !== null}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Definir meta
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Apostas do ciclo
        </p>

        {!hasActiveCycle ? (
          <button
            type="button"
            onClick={onStartCycle}
            disabled={actionLoading !== null}
            className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
          >
            Iniciar ciclo
          </button>
        ) : blockView.goal && blockView.bets.length > 0 ? (
          <ul className="space-y-2">
            {blockView.bets.map((bet) => (
              <li
                key={bet.id}
                className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-on-surface">{bet.title}</p>
                  {bet.priority_score != null ? (
                    <span className="shrink-0 rounded-full bg-surface-container-highest px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                      {Number(bet.priority_score).toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getBetStatusBadgeClass(bet.status)}`}
                >
                  {formatBetStatusLabel(bet.status)}
                </span>
              </li>
            ))}
          </ul>
        ) : blockView.goal ? (
          <p className="text-sm text-on-surface-variant">Nenhuma aposta neste ciclo.</p>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Defina uma meta para acompanhar apostas.
          </p>
        )}
      </div>
    </article>
  );
}

export default function OsPage() {
  const { user } = useAuthContext();
  const { selectedProjectId, loadingProjects } = useOsLayout();
  const [dashboard, setDashboard] = useState<OsProjectDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ blockId: "", blockType: "" as OsBlockType | "", title: "", description: "" });
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
    setGoalDraft({ blockId, blockType, title: "", description: "" });
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

  return (
    <>
      <section className="space-y-4">
        {dashboard?.activeCycle ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-on-surface">
            Ciclo ativo:{" "}
            <span className="font-semibold">
              {formatCycleMonth(dashboard.activeCycle.cycle_month)}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loadingProjects || loadingDashboard ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant/15">
            Carregando blocos OS...
          </div>
        ) : !selectedProjectId ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant/15">
            Selecione um projeto para visualizar os blocos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {orderedBlocks.map((blockView) => (
              <BlockCard
                key={blockView.block.id}
                blockView={blockView}
                hasActiveCycle={Boolean(dashboard?.activeCycle)}
                onDefineGoal={openGoalModal}
                onStartCycle={() => void handleStartCycle()}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </section>

      {goalModalOpen ? (
        <ModalOverlay isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
          <ModalPanel maxWidthClass="max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">Definir meta</h2>
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="text-on-surface-variant transition-colors hover:text-on-surface"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Bloco:{" "}
                <span className="font-semibold text-on-surface">
                  {goalDraft.blockType ? OS_BLOCK_LABELS[goalDraft.blockType] : ""}
                </span>
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Título
                </span>
                <input
                  type="text"
                  value={goalDraft.title}
                  onChange={(event) =>
                    setGoalDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  placeholder="Ex.: Aumentar margem operacional"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Descrição (opcional)
                </span>
                <textarea
                  rows={3}
                  value={goalDraft.description}
                  onChange={(event) =>
                    setGoalDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </label>
              {goalError ? (
                <p className="text-sm text-error">{goalError}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateGoal()}
                  disabled={actionLoading !== null}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Salvar meta
                </button>
              </div>
            </div>
          </ModalPanel>
        </ModalOverlay>
      ) : null}
    </>
  );
}

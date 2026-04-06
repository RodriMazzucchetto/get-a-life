"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { cyclesService, fromDbTaskCycle, type TaskCycle } from "@/lib/planning";

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [cycles, setCycles] = useState<TaskCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    cyclesService
      .getCycles(user.id, 12)
      .then((rows) => {
        if (!mounted) return;
        setCycles(rows.map(fromDbTaskCycle));
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError("Não foi possível carregar os dados de ciclos.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const activeCycle = useMemo(
    () => cycles.find((c) => c.status === "active") ?? null,
    [cycles]
  );
  const closedCycles = useMemo(
    () => cycles.filter((c) => c.status === "closed").sort((a, b) => a.cycleNumber - b.cycleNumber),
    [cycles]
  );

  const latestClosed = closedCycles.length > 0 ? closedCycles[closedCycles.length - 1] : null;
  const previousClosed = closedCycles.length > 1 ? closedCycles[closedCycles.length - 2] : null;

  const planned = latestClosed?.plannedCount ?? activeCycle?.plannedCount ?? 0;
  const delivered = latestClosed?.deliveredCount ?? 0;
  const pending = Math.max(planned - delivered, 0);
  const effectiveness = latestClosed?.effectivenessPct ?? 0;
  const deltaVsPrevious =
    latestClosed && previousClosed
      ? latestClosed.effectivenessPct - previousClosed.effectivenessPct
      : null;

  const chartData = closedCycles.slice(-8);
  const maxPlanned = Math.max(1, ...chartData.map((c) => c.plannedCount));

  return (
    <div className="space-y-8 pb-8">
      <section className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Dashboard de Performance
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {activeCycle
                ? `Ciclo ativo: Ciclo ${activeCycle.cycleNumber}`
                : latestClosed
                  ? `Último ciclo finalizado: Ciclo ${latestClosed.cycleNumber}`
                  : "Nenhum ciclo iniciado ainda"}
            </p>
          </div>
          <Link
            href="/dashboard/planning"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Gerenciar ciclos em Tarefas
          </Link>
        </div>
        {error && (
          <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Planejado</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{planned}</p>
        </article>
        <article className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Entregue</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{delivered}</p>
          <p className="text-xs font-semibold text-tertiary">{formatPct(effectiveness)} de eficácia</p>
        </article>
        <article className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Pendente</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{pending}</p>
          <p className="text-xs text-on-surface-variant">Planejado e não entregue no ciclo</p>
        </article>
        <article className="rounded-xl bg-primary p-5 text-on-primary shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Meta Global</p>
          <p className="mt-2 font-headline text-3xl font-extrabold">{formatPct(effectiveness)}</p>
          <p className="text-xs opacity-85">
            {deltaVsPrevious == null
              ? "Sem base comparativa ainda"
              : `${deltaVsPrevious >= 0 ? "+" : ""}${deltaVsPrevious.toFixed(1)} p.p. vs ciclo anterior`}
          </p>
        </article>
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Histórico de Performance por Ciclo
            </h2>
            <p className="text-sm text-on-surface-variant">
              Planejado vs entregue por ciclo finalizado.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">Carregando ciclos...</div>
        ) : chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            Ainda não há ciclos finalizados para exibir.
          </div>
        ) : (
          <div className="flex h-[320px] items-end gap-3 rounded-lg border-b border-outline-variant/25 px-2 pb-4">
            {chartData.map((cycle) => {
              const plannedHeight = Math.max(10, (cycle.plannedCount / maxPlanned) * 100);
              const deliveredHeight = Math.max(8, (cycle.deliveredCount / maxPlanned) * 100);
              return (
                <div key={cycle.id} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full max-w-[60px] items-end gap-1">
                    <div
                      className="w-1/2 rounded-t-md bg-primary-container/30"
                      style={{ height: `${plannedHeight}%` }}
                      title={`Planejado: ${cycle.plannedCount}`}
                    />
                    <div
                      className="w-1/2 rounded-t-md bg-primary"
                      style={{ height: `${deliveredHeight}%` }}
                      title={`Entregue: ${cycle.deliveredCount} (${formatPct(cycle.effectivenessPct)})`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant">Ciclo {cycle.cycleNumber}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

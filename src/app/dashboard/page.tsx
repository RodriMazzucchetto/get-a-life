"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  cyclesService,
  fromDbTaskCycle,
  type TaskCycle,
  type CycleProjectStatRow,
} from "@/lib/planning";

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Gráfico de linhas: planejado e entregue normalizados 0–100 pelo máximo do período; efetividade já é %. */
function CyclePerformanceLineChart({
  cycles,
  maxCount,
}: {
  cycles: TaskCycle[];
  maxCount: number;
}) {
  const vbW = 720;
  const vbH = 280;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 48;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;
  const n = cycles.length;

  const xAt = (index: number) => {
    if (n <= 1) return padL + plotW / 2;
    return padL + (index / (n - 1)) * plotW;
  };

  const yAt = (value0to100: number) =>
    padT + plotH * (1 - Math.min(100, Math.max(0, value0to100)) / 100);

  const plannedVals = cycles.map((c) =>
    maxCount > 0 ? (c.plannedCount / maxCount) * 100 : 0
  );
  const deliveredVals = cycles.map((c) =>
    maxCount > 0 ? (c.deliveredCount / maxCount) * 100 : 0
  );
  const effVals = cycles.map((c) => Math.min(100, Math.max(0, c.effectivenessPct)));

  const pointsAttr = (vals: number[]) =>
    vals.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="h-auto w-full min-w-[320px] max-h-[320px] text-on-surface-variant"
        role="img"
        aria-label="Histórico de performance por ciclo em linhas"
      >
        <title>Planejado, entregue e efetividade por ciclo</title>
        {gridLines.map((g) => {
          const y = yAt(g);
          return (
            <line
              key={g}
              x1={padL}
              x2={padL + plotW}
              y1={y}
              y2={y}
              className="stroke-outline-variant/25"
              strokeWidth={1}
            />
          );
        })}
        {gridLines.map((g) => (
          <text
            key={`yl-${g}`}
            x={padL - 8}
            y={yAt(g) + 4}
            textAnchor="end"
            className="fill-on-surface-variant text-[10px] font-medium"
          >
            {g}
          </text>
        ))}
        <text
          x={padL}
          y={14}
          className="fill-on-surface-variant text-[10px]"
        >
          0–100 (planej./entregue relativos ao máximo do gráfico; efetiv. = %)
        </text>

        {n >= 2 ? (
          <>
            <polyline
              fill="none"
              strokeWidth={2.5}
              className="stroke-primary-container"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsAttr(plannedVals)}
            />
            <polyline
              fill="none"
              strokeWidth={2.5}
              className="stroke-primary"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsAttr(deliveredVals)}
            />
            <polyline
              fill="none"
              strokeWidth={2.5}
              className="stroke-tertiary"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsAttr(effVals)}
            />
          </>
        ) : null}

        {cycles.map((c, i) => (
          <g key={c.id}>
            <circle
              cx={xAt(i)}
              cy={yAt(plannedVals[i])}
              r={5}
              className="fill-primary-container stroke-primary-container"
              strokeWidth={1}
            >
              <title>{`Planejado: ${c.plannedCount} (+${c.addedAfterStartCount} após início)`}</title>
            </circle>
            <circle
              cx={xAt(i)}
              cy={yAt(deliveredVals[i])}
              r={5}
              className="fill-primary stroke-primary"
              strokeWidth={1}
            >
              <title>{`Entregue: ${c.deliveredCount}`}</title>
            </circle>
            <circle
              cx={xAt(i)}
              cy={yAt(effVals[i])}
              r={5}
              className="fill-tertiary stroke-tertiary"
              strokeWidth={1}
            >
              <title>{`Efetividade: ${formatPct(c.effectivenessPct)}`}</title>
            </circle>
            <text
              x={xAt(i)}
              y={vbH - 12}
              textAnchor="middle"
              className="fill-on-surface-variant text-[11px] font-bold"
            >
              {`Ciclo ${c.cycleNumber}`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Efetividade = concluídas ÷ tarefas ligadas ao projeto (mesmo âmbito das duas colunas). */
function projectEffectivenessPct(linked: number, completed: number): string {
  if (linked <= 0) return "—";
  return formatPct((completed / linked) * 100);
}

type CycleProjectRow = {
  projectId: string;
  projectName: string;
  projectColor: string;
  tasksLinked: number;
  tasksCompleted: number;
};

function CycleProjectStatsTable({
  subtitle,
  rows,
  linkedColumnTitle,
  completedColumnTitle,
}: {
  subtitle?: string;
  rows: CycleProjectRow[];
  linkedColumnTitle: string;
  completedColumnTitle: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        Nenhum projeto com dados neste período.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant/20 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <th className="py-2 pr-3">Projeto</th>
            <th className="py-2 pr-3">{linkedColumnTitle}</th>
            <th className="py-2 pr-3">{completedColumnTitle}</th>
            <th className="py-2">Efetividade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.projectId}
              className="border-b border-outline-variant/10 last:border-0"
            >
              <td className="py-2 pr-3">
                <span
                  className="inline-flex items-center gap-2 font-medium text-on-surface"
                  title={r.projectName}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-outline-variant/30"
                    style={{ backgroundColor: r.projectColor }}
                  />
                  {r.projectName}
                </span>
              </td>
              <td className="py-2 pr-3 tabular-nums text-on-surface">{r.tasksLinked}</td>
              <td className="py-2 pr-3 tabular-nums text-on-surface">{r.tasksCompleted}</td>
              <td className="py-2 tabular-nums font-medium text-primary">
                {projectEffectivenessPct(r.tasksLinked, r.tasksCompleted)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subtitle ? (
        <p className="mt-3 text-xs text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [cycles, setCycles] = useState<TaskCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCycleProjectRows, setActiveCycleProjectRows] = useState<
    {
      projectId: string;
      projectName: string;
      projectColor: string;
      tasksLinked: number;
      tasksCompleted: number;
    }[]
  >([]);
  const [closedCycleProjectStats, setClosedCycleProjectStats] = useState<CycleProjectStatRow[]>([]);
  const [projStatsError, setProjStatsError] = useState<string | null>(null);

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
        setProjStatsError(null);
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

  useEffect(() => {
    if (!user || !activeCycle) {
      setActiveCycleProjectRows([]);
      return;
    }
    let mounted = true;
    const end = new Date().toISOString();
    cyclesService
      .getUserProjectStatsInWindow(activeCycle.startedAt, end)
      .then((rows) => {
        if (mounted) setActiveCycleProjectRows(rows);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setProjStatsError(
            "Estatísticas por projeto indisponíveis. Confirme se a migração SQL mais recente foi aplicada no Supabase."
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, [user, activeCycle]);

  const closedCycles = useMemo(
    () =>
      cycles
        .filter((c) => c.status === "closed")
        .sort((a, b) => a.cycleNumber - b.cycleNumber),
    [cycles]
  );

  const closedCycleIdsKey = useMemo(
    () => closedCycles.map((c) => c.id).join("|"),
    [closedCycles]
  );

  useEffect(() => {
    if (!closedCycleIdsKey) {
      setClosedCycleProjectStats([]);
      return;
    }
    let mounted = true;
    const ids = closedCycleIdsKey.split("|");
    cyclesService
      .getClosedCyclesProjectStats(ids)
      .then((rows) => {
        if (mounted) setClosedCycleProjectStats(rows);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setProjStatsError(
            "Não foi possível carregar o detalhe por projeto nos ciclos fechados."
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, [closedCycleIdsKey]);

  const statsByClosedCycle = useMemo(() => {
    const map = new Map<string, CycleProjectStatRow[]>();
    for (const row of closedCycleProjectStats) {
      const list = map.get(row.cycleId) ?? [];
      list.push(row);
      map.set(row.cycleId, list);
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          b.tasksLinked - a.tasksLinked ||
          b.tasksCompletedInCycle - a.tasksCompletedInCycle
      );
    }
    return map;
  }, [closedCycleProjectStats]);

  const latestClosed = closedCycles.length > 0 ? closedCycles[closedCycles.length - 1] : null;
  const previousClosed = closedCycles.length > 1 ? closedCycles[closedCycles.length - 2] : null;

  const planned = latestClosed?.plannedCount ?? activeCycle?.plannedCount ?? 0;
  const addedAfterStart =
    latestClosed?.addedAfterStartCount ?? activeCycle?.addedAfterStartCount ?? 0;
  const delivered = latestClosed?.deliveredCount ?? 0;
  const pending = Math.max(planned - delivered, 0);
  const effectiveness = latestClosed?.effectivenessPct ?? 0;
  const deltaVsPrevious =
    latestClosed && previousClosed
      ? latestClosed.effectivenessPct - previousClosed.effectivenessPct
      : null;

  const chartData = closedCycles.slice(-8);
  const chartMaxCount = useMemo(
    () =>
      Math.max(
        1,
        ...chartData.flatMap((c) => [c.plannedCount, c.deliveredCount])
      ),
    [chartData]
  );

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
        {projStatsError && (
          <div className="rounded-lg border border-tertiary/40 bg-tertiary/10 px-4 py-2 text-sm text-on-surface">
            {projStatsError}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Planejado
          </p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{planned}</p>
        </article>
        <article className="rounded-xl border-l-4 border-primary bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Entregue
          </p>
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
        <h2 className="font-headline text-xl font-bold text-on-surface">Projetos no ciclo</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
          Por projeto: quantas tarefas estão ligadas ao projeto no período considerado, quantas foram
          concluídas nesse mesmo âmbito, e a efetividade (concluídas ÷ ligadas). Isto é sempre por{" "}
          <strong className="font-semibold text-on-surface">ciclo</strong>, não um total histórico da
          conta.
        </p>

        {activeCycle ? (
          <div className="mt-8">
            <h3 className="font-headline text-base font-bold text-on-surface">
              Ciclo {activeCycle.cycleNumber} (em curso)
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              &quot;Ligadas&quot; = inventário atual no quadro. &quot;Concluídas&quot; = neste ciclo,
              desde o início até agora.
            </p>
            <div className="mt-4">
              <CycleProjectStatsTable
                rows={activeCycleProjectRows}
                linkedColumnTitle="Tarefas ligadas (agora)"
                completedColumnTitle="Concluídas no ciclo"
                subtitle="Ao fechar o ciclo, o quadro abaixo passa a mostrar o registo fechado de cada período."
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-on-surface-variant">
            Sem ciclo ativo. Inicia um ciclo em Tarefas para ver aqui o acompanhamento por projeto.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Itens adicionados após início
          </p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
            {addedAfterStart}
          </p>
          <p className="text-xs text-on-surface-variant">
            Estes itens entram no planejado total do ciclo e impactam a eficácia.
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
              Três linhas: planejado e entregue (escala 0–100 relativa ao maior valor do período) e
              efetividade %. Com um ciclo vês três pontos; a linha liga-se quando houver mais ciclos.
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
          <div className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 px-3 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-6 shrink-0 rounded-full bg-primary-container" />
                Planejado
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-6 shrink-0 rounded-full bg-primary" />
                Entregue
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-6 shrink-0 rounded-full bg-tertiary" />
                Efetividade %
              </span>
            </div>
            <CyclePerformanceLineChart cycles={chartData} maxCount={chartMaxCount} />
          </div>
        )}
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        <h2 className="font-headline text-xl font-bold text-on-surface">Histórico — ciclos fechados</h2>
        <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">
          Guardado ao finalizar cada ciclo: tarefas ligadas ao projeto no fecho, concluídas entre o
          início e o fim desse ciclo, e efetividade.
        </p>
        {chartData.length === 0 ? (
          <p className="mt-4 text-sm text-on-surface-variant">
            Finalize um ciclo em Tarefas para ver o detalhe por projeto aqui.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {[...chartData].reverse().map((cycle) => {
              const rows = statsByClosedCycle.get(cycle.id) ?? [];
              const asRows: CycleProjectRow[] = rows.map((r) => ({
                projectId: r.projectId,
                projectName: r.projectName,
                projectColor: r.projectColor,
                tasksLinked: r.tasksLinked,
                tasksCompleted: r.tasksCompletedInCycle,
              }));
              return (
                <div key={cycle.id}>
                  <h3 className="font-headline text-base font-bold text-on-surface">
                    Ciclo {cycle.cycleNumber}
                  </h3>
                  <div className="mt-3">
                    <CycleProjectStatsTable
                      rows={asRows}
                      linkedColumnTitle="Tarefas ligadas (no fecho)"
                      completedColumnTitle="Concluídas no ciclo"
                      subtitle={
                        rows.length === 0
                          ? "Sem dados guardados para este ciclo (ciclos antigos antes desta atualização não têm snapshot)."
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

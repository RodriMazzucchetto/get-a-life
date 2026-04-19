"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
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

/** Eficácia no dashboard: concluídas ÷ âmbito planejado, nunca acima de 100%. */
function effectivenessPctCapped(delivered: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.min(100, (delivered / planned) * 100);
}

/** Cores fixas contrastantes (independentes do token primary, que colidia com primary-container). */
const CHART_COLOR_PLANNED = "#0284c7";
const CHART_COLOR_DELIVERED = "#ea580c";
const CHART_COLOR_EFFECT = "#7c3aed";

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
              stroke={CHART_COLOR_PLANNED}
              strokeWidth={2.75}
              strokeDasharray="8 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              points={pointsAttr(plannedVals)}
            />
            <polyline
              fill="none"
              stroke={CHART_COLOR_DELIVERED}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              points={pointsAttr(deliveredVals)}
            />
            <polyline
              fill="none"
              stroke={CHART_COLOR_EFFECT}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              points={pointsAttr(effVals)}
            />
          </>
        ) : null}

        {cycles.map((c, i) => {
          const py = yAt(plannedVals[i]);
          const dy = yAt(deliveredVals[i]);
          const ey = yAt(effVals[i]);
          const top = Math.min(py, dy, ey);
          const bottom = Math.max(py, dy, ey);
          const hitPad = 12;
          return (
            <g key={c.id}>
              <text
                x={xAt(i)}
                y={vbH - 12}
                textAnchor="middle"
                className="fill-on-surface-variant text-[11px] font-bold"
                pointerEvents="none"
              >
                {`Ciclo ${c.cycleNumber}`}
              </text>
              <circle
                cx={xAt(i)}
                cy={py}
                r={5}
                fill={CHART_COLOR_PLANNED}
                stroke="#fff"
                strokeWidth={1.5}
                pointerEvents="none"
              />
              <circle
                cx={xAt(i)}
                cy={dy}
                r={5}
                fill={CHART_COLOR_DELIVERED}
                stroke="#fff"
                strokeWidth={1.5}
                pointerEvents="none"
              />
              <circle
                cx={xAt(i)}
                cy={ey}
                r={5}
                fill={CHART_COLOR_EFFECT}
                stroke="#fff"
                strokeWidth={1.5}
                pointerEvents="none"
              />
              <rect
                x={xAt(i) - 22}
                y={top - hitPad}
                width={44}
                height={Math.max(bottom - top + hitPad * 2, 28)}
                fill="transparent"
                className="cursor-default"
              >
                <title>{`Planejado: ${c.plannedCount} (+${c.addedAfterStartCount} após início) · Entregue: ${c.deliveredCount} · Efetividade: ${formatPct(c.effectivenessPct)}`}</title>
              </rect>
            </g>
          );
        })}
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

function aggregateClosedProjectSnapshots(stats: CycleProjectStatRow[]): CycleProjectRow[] {
  const map = new Map<
    string,
    { projectName: string; projectColor: string; linked: number; completed: number }
  >();
  for (const r of stats) {
    const cur = map.get(r.projectId);
    if (!cur) {
      map.set(r.projectId, {
        projectName: r.projectName,
        projectColor: r.projectColor,
        linked: r.tasksLinked,
        completed: r.tasksCompletedInCycle,
      });
    } else {
      cur.linked += r.tasksLinked;
      cur.completed += r.tasksCompletedInCycle;
    }
  }
  return Array.from(map.entries())
    .map(([projectId, v]) => ({
      projectId,
      projectName: v.projectName,
      projectColor: v.projectColor,
      tasksLinked: v.linked,
      tasksCompleted: v.completed,
    }))
    .sort(
      (a, b) =>
        b.tasksLinked - a.tasksLinked || b.tasksCompleted - a.tasksCompleted
    );
}

function mergeActiveIntoAggregate(
  base: CycleProjectRow[],
  activeRows: CycleProjectRow[]
): CycleProjectRow[] {
  const map = new Map(base.map((r) => [r.projectId, { ...r }]));
  for (const r of activeRows) {
    const cur = map.get(r.projectId);
    if (!cur) {
      map.set(r.projectId, { ...r });
    } else {
      cur.tasksLinked += r.tasksLinked;
      cur.tasksCompleted += r.tasksCompleted;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.tasksLinked - a.tasksLinked || b.tasksCompleted - a.tasksCompleted
  );
}

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
  const [analysisScope, setAnalysisScope] = useState<string>("all");
  const [statsRefreshTick, setStatsRefreshTick] = useState(0);
  const [rebuildSnapshotsLoading, setRebuildSnapshotsLoading] = useState(false);
  const [rebuildSnapshotsMessage, setRebuildSnapshotsMessage] = useState<string | null>(null);

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
  }, [closedCycleIdsKey, statsRefreshTick]);

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

  const analysisOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "Todos os ciclos" },
    ];
    if (activeCycle) {
      opts.push({
        value: activeCycle.id,
        label: `Ciclo ${activeCycle.cycleNumber} (em curso)`,
      });
    }
    for (const c of closedCycles) {
      opts.push({ value: c.id, label: `Ciclo ${c.cycleNumber}` });
    }
    return opts;
  }, [activeCycle, closedCycles]);

  useEffect(() => {
    if (analysisOptions.some((o) => o.value === analysisScope)) return;
    setAnalysisScope("all");
  }, [analysisOptions, analysisScope]);

  const sumActiveDeliveredEstimate = useMemo(
    () => activeCycleProjectRows.reduce((s, r) => s + r.tasksCompleted, 0),
    [activeCycleProjectRows]
  );

  const sumActiveLinkedEstimate = useMemo(
    () => activeCycleProjectRows.reduce((s, r) => s + r.tasksLinked, 0),
    [activeCycleProjectRows]
  );

  const analysisKpi = useMemo(() => {
    if (analysisScope === "all") {
      if (closedCycles.length === 0) {
        if (!activeCycle) {
          return {
            planned: 0,
            delivered: 0,
            addedAfterStart: 0,
            effectivenessPct: 0,
            pending: 0,
            deltaVsPrevious: null as number | null,
          };
        }
        const planned =
          sumActiveLinkedEstimate > 0 ? sumActiveLinkedEstimate : activeCycle.plannedCount;
        const delivered = sumActiveDeliveredEstimate;
        const effectivenessPct = effectivenessPctCapped(delivered, planned);
        return {
          planned,
          delivered,
          addedAfterStart: activeCycle.addedAfterStartCount,
          effectivenessPct,
          pending: Math.max(0, planned - delivered),
          deltaVsPrevious:
            latestClosed != null
              ? effectivenessPct -
                effectivenessPctCapped(
                  statsByClosedCycle.get(latestClosed.id)?.reduce(
                    (s, r) => s + r.tasksCompletedInCycle,
                    0
                  ) ?? latestClosed.deliveredCount,
                  statsByClosedCycle.get(latestClosed.id)?.reduce((s, r) => s + r.tasksLinked, 0) ??
                    latestClosed.plannedCount
                )
              : null,
        };
      }
      let planned = 0;
      let delivered = 0;
      for (const c of closedCycles) {
        const rows = statsByClosedCycle.get(c.id) ?? [];
        if (rows.length > 0) {
          planned += rows.reduce((s, r) => s + r.tasksLinked, 0);
          delivered += rows.reduce((s, r) => s + r.tasksCompletedInCycle, 0);
        } else {
          planned += c.plannedCount;
          delivered += c.deliveredCount;
        }
      }
      let addedAfterStart = closedCycles.reduce((s, c) => s + c.addedAfterStartCount, 0);
      if (activeCycle) {
        if (sumActiveLinkedEstimate > 0) {
          planned += sumActiveLinkedEstimate;
        } else {
          planned += activeCycle.plannedCount;
        }
        delivered += sumActiveDeliveredEstimate;
        addedAfterStart += activeCycle.addedAfterStartCount;
      }
      const effectivenessPct = effectivenessPctCapped(delivered, planned);
      return {
        planned,
        delivered,
        addedAfterStart,
        effectivenessPct,
        pending: Math.max(0, planned - delivered),
        deltaVsPrevious: null as number | null,
      };
    }

    const selected = cycles.find((c) => c.id === analysisScope);
    if (!selected) {
      return {
        planned: 0,
        delivered: 0,
        addedAfterStart: 0,
        effectivenessPct: 0,
        pending: 0,
        deltaVsPrevious: null as number | null,
      };
    }
    if (selected.status === "active") {
      const planned =
        sumActiveLinkedEstimate > 0 ? sumActiveLinkedEstimate : selected.plannedCount;
      const delivered = sumActiveDeliveredEstimate;
      const effectivenessPct = effectivenessPctCapped(delivered, planned);
      return {
        planned,
        delivered,
        addedAfterStart: selected.addedAfterStartCount,
        effectivenessPct,
        pending: Math.max(0, planned - delivered),
        deltaVsPrevious:
          latestClosed != null
            ? effectivenessPct -
              effectivenessPctCapped(
                statsByClosedCycle.get(latestClosed.id)?.reduce(
                  (s, r) => s + r.tasksCompletedInCycle,
                  0
                ) ?? latestClosed.deliveredCount,
                statsByClosedCycle.get(latestClosed.id)?.reduce((s, r) => s + r.tasksLinked, 0) ??
                  latestClosed.plannedCount
              )
            : null,
      };
    }

    const prev =
      closedCycles
        .filter((c) => c.cycleNumber < selected.cycleNumber)
        .sort((a, b) => b.cycleNumber - a.cycleNumber)[0] ?? null;

    const snapRows = statsByClosedCycle.get(selected.id) ?? [];
    if (snapRows.length > 0) {
      const delivered = snapRows.reduce((s, r) => s + r.tasksCompletedInCycle, 0);
      const linked = snapRows.reduce((s, r) => s + r.tasksLinked, 0);
      const effectivenessPct = effectivenessPctCapped(delivered, linked);

      const prevEff =
        prev != null
          ? (() => {
              const pr = statsByClosedCycle.get(prev.id) ?? [];
              if (pr.length > 0) {
                const d = pr.reduce((s, x) => s + x.tasksCompletedInCycle, 0);
                const l = pr.reduce((s, x) => s + x.tasksLinked, 0);
                return effectivenessPctCapped(d, l);
              }
              return prev.effectivenessPct;
            })()
          : null;

      return {
        planned: linked,
        delivered,
        addedAfterStart: selected.addedAfterStartCount,
        effectivenessPct,
        pending: Math.max(0, linked - delivered),
        deltaVsPrevious:
          prev != null ? effectivenessPct - (prevEff ?? prev.effectivenessPct) : null,
      };
    }

    return {
      planned: selected.plannedCount,
      delivered: selected.deliveredCount,
      addedAfterStart: selected.addedAfterStartCount,
      effectivenessPct: effectivenessPctCapped(selected.deliveredCount, selected.plannedCount),
      pending: Math.max(0, selected.plannedCount - selected.deliveredCount),
      deltaVsPrevious:
        prev != null ? selected.effectivenessPct - prev.effectivenessPct : null,
    };
  }, [
    analysisScope,
    activeCycle,
    closedCycles,
    cycles,
    latestClosed,
    sumActiveDeliveredEstimate,
    sumActiveLinkedEstimate,
    statsByClosedCycle,
  ]);

  const projectAnalysis = useMemo(() => {
    if (analysisScope === "all") {
      if (closedCycles.length === 0) {
        if (!activeCycle) {
          return {
            title: "Nenhum ciclo",
            description:
              "Inicia um ciclo em Tarefas para ver aqui o acompanhamento por projeto.",
            rows: [] as CycleProjectRow[],
            linkedColumnTitle: "Tarefas ligadas",
            completedColumnTitle: "Concluídas",
            tableSubtitle: undefined as string | undefined,
          };
        }
        return {
          title: "Todos os ciclos (só em curso)",
          description:
            "«Ligadas» = inventário atual no quadro. «Concluídas» = neste ciclo, desde o início até agora. Sem ciclos fechados ainda, a vista corresponde ao ciclo ativo.",
          rows: activeCycleProjectRows,
          linkedColumnTitle: "Tarefas ligadas (agora)",
          completedColumnTitle: "Concluídas no ciclo",
          tableSubtitle:
            "Ao fechar o ciclo, o quadro abaixo passa a mostrar o registo fechado de cada período.",
        };
      }
      let agg = aggregateClosedProjectSnapshots(closedCycleProjectStats);
      if (activeCycle) {
        agg = mergeActiveIntoAggregate(agg, activeCycleProjectRows);
      }
      return {
        title: "Todos os ciclos (agregado)",
        description:
          "Soma dos snapshots dos ciclos fechados (por projeto) e, se existir ciclo em curso, soma também os valores atuais desse período. Não é um total histórico da conta — apenas os ciclos considerados.",
        rows: agg,
        linkedColumnTitle: "Tarefas ligadas (soma)",
        completedColumnTitle: "Concluídas (soma)",
        tableSubtitle:
          "A efetividade por linha continua a ser concluídas ÷ ligadas no agregado mostrado.",
      };
    }

    const sel = cycles.find((c) => c.id === analysisScope);
    if (!sel) {
      return {
        title: "—",
        description: "",
        rows: [] as CycleProjectRow[],
        linkedColumnTitle: "Tarefas ligadas",
        completedColumnTitle: "Concluídas",
        tableSubtitle: undefined as string | undefined,
      };
    }
    if (sel.status === "active") {
      return {
        title: `Ciclo ${sel.cycleNumber} (em curso)`,
        description:
          "«Ligadas» = inventário atual no quadro. «Concluídas» = neste ciclo, desde o início até agora.",
        rows: activeCycleProjectRows,
        linkedColumnTitle: "Tarefas ligadas (agora)",
        completedColumnTitle: "Concluídas no ciclo",
        tableSubtitle:
          "Ao fechar o ciclo, o quadro abaixo passa a mostrar o registo fechado de cada período.",
      };
    }
    const snap = statsByClosedCycle.get(sel.id) ?? [];
    const rows: CycleProjectRow[] = snap.map((r) => ({
      projectId: r.projectId,
      projectName: r.projectName,
      projectColor: r.projectColor,
      tasksLinked: r.tasksLinked,
      tasksCompleted: r.tasksCompletedInCycle,
    }));
    return {
      title: `Ciclo ${sel.cycleNumber}`,
      description:
        "Guardado ao finalizar o ciclo: «ligadas» = tarefas na sprint (Semana atual / Em progresso) pendentes ou concluídas nesse período — não entra backlog antigo ligado ao projeto.",
      rows,
      linkedColumnTitle: "Tarefas ligadas (no fecho)",
      completedColumnTitle: "Concluídas no ciclo",
      tableSubtitle:
        snap.length === 0
          ? "Sem dados guardados para este ciclo (ciclos antigos antes desta atualização não têm snapshot)."
          : undefined,
    };
  }, [
    analysisScope,
    activeCycle,
    activeCycleProjectRows,
    closedCycleProjectStats,
    closedCycles.length,
    cycles,
    statsByClosedCycle,
  ]);

  const analysisLabel =
    analysisOptions.find((o) => o.value === analysisScope)?.label ?? "Análise";

  const {
    planned,
    delivered,
    addedAfterStart,
    effectivenessPct,
    pending,
    deltaVsPrevious,
  } = analysisKpi;

  const chartDataRaw = useMemo(() => closedCycles.slice(-8), [closedCycles]);
  /** Entregue/efetividade a partir do snapshot por projeto (mesma base que a tabela), não dos campos antigos em task_cycles. */
  const chartCycles = useMemo(() => {
    return chartDataRaw.map((c) => {
      const rows = statsByClosedCycle.get(c.id) ?? [];
      if (rows.length === 0) return c;
      const delivered = rows.reduce((s, r) => s + r.tasksCompletedInCycle, 0);
      const linked = rows.reduce((s, r) => s + r.tasksLinked, 0);
      const effectivenessPct =
        linked > 0 ? Number(((delivered / linked) * 100).toFixed(1)) : 0;
      return {
        ...c,
        deliveredCount: delivered,
        effectivenessPct,
      };
    });
  }, [chartDataRaw, statsByClosedCycle]);

  const chartMaxCount = useMemo(
    () =>
      Math.max(
        1,
        ...chartCycles.flatMap((c) => [c.plannedCount, c.deliveredCount])
      ),
    [chartCycles]
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
          <div className="relative w-full sm:w-auto sm:min-w-[min(100%,280px)]">
            <Listbox value={analysisScope} onChange={setAnalysisScope}>
              <ListboxButton className="inline-flex w-full items-center justify-between gap-2 rounded-lg bg-primary px-4 py-2.5 text-left text-sm font-semibold text-on-primary shadow-sm ring-1 ring-on-primary/15 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/40 data-[hover]:opacity-95">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="material-symbols-outlined shrink-0 text-[20px]">
                    analytics
                  </span>
                  <span className="truncate">{analysisLabel}</span>
                </span>
                <span className="material-symbols-outlined shrink-0 text-[20px] opacity-90">
                  expand_more
                </span>
              </ListboxButton>
              <ListboxOptions
                transition
                className="absolute right-0 z-50 mt-1 max-h-72 w-full min-w-[260px] overflow-auto rounded-xl border border-outline-variant/20 bg-surface-container-highest py-1 shadow-lg outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 sm:right-0 sm:w-[min(100vw-2rem,320px)]"
              >
                {analysisOptions.map((opt) => (
                  <ListboxOption
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer px-3 py-2.5 text-sm text-on-surface data-[focus]:bg-primary/10 data-[selected]:font-semibold data-[selected]:text-primary"
                  >
                    {opt.label}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Listbox>
            <p className="mt-1.5 text-[11px] leading-snug text-on-surface-variant sm:text-right">
              Afeta cartões e tabelas abaixo; o gráfico de linhas mantém sempre os ciclos
              finalizados.
            </p>
          </div>
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
          <p className="text-xs font-semibold text-tertiary">
            {formatPct(effectivenessPct)} de eficácia
          </p>
        </article>
        <article className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Pendente</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{pending}</p>
          <p className="text-xs text-on-surface-variant">Planejado e não entregue no ciclo</p>
        </article>
        <article className="rounded-xl bg-primary p-5 text-on-primary shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Meta Global</p>
          <p className="mt-2 font-headline text-3xl font-extrabold">{formatPct(effectivenessPct)}</p>
          <p className="text-xs opacity-85">
            {analysisScope === "all"
              ? "Vista agregada: sem comparação ciclo a ciclo"
              : deltaVsPrevious == null
                ? "Sem base comparativa ainda"
                : `${deltaVsPrevious >= 0 ? "+" : ""}${deltaVsPrevious.toFixed(1)} p.p. vs ciclo anterior`}
          </p>
        </article>
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        <h2 className="font-headline text-xl font-bold text-on-surface">Projetos no ciclo</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
          Por projeto: quantas tarefas estão ligadas ao projeto no período considerado, quantas foram
          concluídas nesse mesmo âmbito, e a efetividade (concluídas ÷ ligadas). O âmbito segue o menu{" "}
          <strong className="font-semibold text-on-surface">Análise</strong> no topo (agregado ou um
          ciclo).
        </p>

        <div className="mt-8">
          <h3 className="font-headline text-base font-bold text-on-surface">
            {projectAnalysis.title}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">{projectAnalysis.description}</p>
          <div className="mt-4">
            <CycleProjectStatsTable
              rows={projectAnalysis.rows}
              linkedColumnTitle={projectAnalysis.linkedColumnTitle}
              completedColumnTitle={projectAnalysis.completedColumnTitle}
              subtitle={projectAnalysis.tableSubtitle}
            />
          </div>
        </div>

        {user && closedCycles.length > 0 ? (
          <div className="mt-6 flex flex-col gap-2 border-t border-outline-variant/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs text-on-surface-variant">
              Se os números por projeto parecerem antigos (antes da correção do cálculo), recalcula os
              snapshots guardados na base. O histórico em linhas usa estes totais quando existem.
            </p>
            <button
              type="button"
              disabled={rebuildSnapshotsLoading}
              onClick={async () => {
                setRebuildSnapshotsMessage(null);
                setRebuildSnapshotsLoading(true);
                try {
                  await cyclesService.rebuildMyClosedCycleSnapshots();
                  setStatsRefreshTick((t) => t + 1);
                  setRebuildSnapshotsMessage("Snapshots atualizados. Os valores da tabela devem refletir a nova lógica.");
                } catch (e) {
                  console.error(e);
                  setRebuildSnapshotsMessage(
                    "Não foi possível recalcular. Confirma que as migrações Supabase mais recentes foram aplicadas (inclui a função rebuild_my_closed_cycle_snapshots)."
                  );
                } finally {
                  setRebuildSnapshotsLoading(false);
                }
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {rebuildSnapshotsLoading ? "hourglass_empty" : "refresh"}
              </span>
              {rebuildSnapshotsLoading ? "A recalcular…" : "Recalcular snapshots (ciclos fechados)"}
            </button>
          </div>
        ) : null}
        {rebuildSnapshotsMessage ? (
          <p className="mt-3 text-sm text-on-surface-variant">{rebuildSnapshotsMessage}</p>
        ) : null}
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
        ) : chartCycles.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            Ainda não há ciclos finalizados para exibir.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 px-3 py-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-0 w-6 shrink-0 border-t-[2.5px] border-dashed"
                  style={{ borderColor: CHART_COLOR_PLANNED }}
                />
                Planejado
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-0.5 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_COLOR_DELIVERED }}
                />
                Entregue
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-0.5 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_COLOR_EFFECT }}
                />
                Efetividade %
              </span>
            </div>
            <CyclePerformanceLineChart cycles={chartCycles} maxCount={chartMaxCount} />
          </div>
        )}
      </section>
    </div>
  );
}

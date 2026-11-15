"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { OsPerformanceReportSection } from "@/components/os/OsPerformanceReportSection";
import { useAuthContext } from "@/contexts/AuthContext";
import { computeOsTaskCycleStats } from "@/lib/osBoardHelpers";
import { fetchAllOsTaskCycles, fetchAllOsTasks } from "@/lib/os-queries";
import type { OsTaskCycleRow, OsTaskRow } from "@/lib/os-types";
import { osLabelMuted } from "@/lib/os-ui";

function kpiCard(label: string, value: string, sub?: string) {
  return (
    <div className="border-[1.5px] border-ta-ink p-6">
      <div className={`mb-2 ${osLabelMuted}`}>{label}</div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[10px] text-ta-muted normal-case font-normal">{sub}</div>}
    </div>
  );
}

function effTone(pct: number) {
  return pct >= 70 ? "text-ta-green" : pct >= 40 ? "text-ta-amber-muted" : "text-ta-red";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const CHART_COLORS = {
  planned:    "#0a0a0a",
  delivered:  "#1ec7eb",
  effectiveness: "#18b46b",
  added_after: "#ffd400",
};

export default function ReportsPage() {
  const { user } = useAuthContext();
  const [cycles, setCycles] = useState<OsTaskCycleRow[]>([]);
  const [tasks, setTasks] = useState<OsTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string | "all">("all");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    if (!user) return;
    void Promise.all([fetchAllOsTaskCycles(user.id), fetchAllOsTasks(user.id)]).then(
      ([cycleData, taskData]) => {
        setCycles(cycleData);
        setTasks(taskData);
        setLoading(false);
      }
    );
  }, [user]);

  const cycleStatsById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeOsTaskCycleStats>>();
    for (const cycle of cycles) {
      map.set(cycle.id, computeOsTaskCycleStats(cycle, tasks));
    }
    return map;
  }, [cycles, tasks]);

  const closedCycles = useMemo(() => cycles.filter((c) => c.status === "closed"), [cycles]);

  const filtered = useMemo(() => {
    if (selectedCycleId === "all") return closedCycles;
    return closedCycles.filter((c) => c.id === selectedCycleId);
  }, [closedCycles, selectedCycleId]);

  const chartData = useMemo(
    () =>
      filtered.map((c) => {
        const stats = cycleStatsById.get(c.id)!;
        return {
          name: `C${c.cycle_number}`,
          label: `Ciclo #${c.cycle_number} · ${formatDate(c.started_at)}`,
          planned: Number(stats.planned.toFixed(1)),
          committed: Number(stats.committed.toFixed(1)),
          delivered: Number(stats.delivered.toFixed(1)),
          effectiveness: stats.effectiveness,
          added_after: Number(stats.addedAfter.toFixed(1)),
          remaining: Number(stats.remainingSprint.toFixed(1)),
        };
      }),
    [filtered, cycleStatsById]
  );

  const avg = useMemo(() => {
    if (filtered.length === 0) {
      return { committed: 0, delivered: 0, eff: 0, added: 0, remaining: 0 };
    }
    const stats = filtered.map((c) => cycleStatsById.get(c.id)!);
    const n = stats.length;
    return {
      committed: stats.reduce((s, x) => s + x.committed, 0) / n,
      delivered: stats.reduce((s, x) => s + x.delivered, 0) / n,
      eff: Math.round(stats.reduce((s, x) => s + x.effectiveness, 0) / n),
      added: stats.reduce((s, x) => s + x.addedAfter, 0) / n,
      remaining: stats.reduce((s, x) => s + x.remainingSprint, 0) / n,
    };
  }, [filtered, cycleStatsById]);

  const activeCycle = cycles.find((c) => c.status === "active");
  const activeStats = activeCycle ? cycleStatsById.get(activeCycle.id) : null;

  const ChartComponent = chartType === "line" ? LineChart : BarChart;

  const tooltipStyle = {
    backgroundColor: "#fafaf7",
    border: "1.5px solid #0a0a0a",
    borderRadius: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "#0a0a0a",
  };

  return (
    <div className="pb-16 font-mono">
      {/* Header — análise geral (Tasks OS) */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`mb-1 ${osLabelMuted}`}>Tasks OS</div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Ciclos de entrega</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de ciclo */}
          <div className="flex items-center gap-0 border-[1.5px] border-ta-ink">
            <span className={`border-r-[1.5px] border-ta-ink px-3 py-2 ${osLabelMuted}`}>
              Ciclo
            </span>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-ta-paper px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ta-ink focus:outline-none"
            >
              <option value="all">Todos os ciclos</option>
              {closedCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  Ciclo #{c.cycle_number} · {formatDate(c.started_at)}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle tipo de gráfico */}
          <div className="flex border-[1.5px] border-ta-ink">
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                chartType === "line" ? "bg-ta-ink text-ta-paper" : "bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
              }`}
            >
              Linha
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`border-l-[1.5px] border-ta-ink px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                chartType === "bar" ? "bg-ta-ink text-ta-paper" : "bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
              }`}
            >
              Barras
            </button>
          </div>
        </div>
      </div>

      {/* Ciclo ativo banner */}
      {activeCycle && activeStats ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-ta-cyan bg-ta-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ta-cyan">
          <span>
            Ciclo #{activeCycle.cycle_number} em andamento · {activeStats.delivered.toFixed(1)} entregue
            de {activeStats.committed.toFixed(1)} comprometido · {activeStats.effectiveness}% efetividade
          </span>
          <a
            href="/os/tasks"
            className="border border-ta-cyan px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-ta-cyan transition-colors hover:bg-ta-cyan hover:text-ta-paper"
          >
            Finalizar ciclo
          </a>
        </div>
      ) : null}

      {loading ? (
        <div className="border-[1.5px] border-ta-ink px-4 py-12 text-center text-[11px] uppercase tracking-wide text-ta-muted">
          Carregando...
        </div>
      ) : closedCycles.length === 0 ? (
        <div className="border-[1.5px] border-ta-ink px-4 py-12 text-center text-[11px] uppercase tracking-wide text-ta-muted">
          Nenhum ciclo encerrado ainda. Inicie e encerre um ciclo em Tasks OS para ver os relatórios.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-8 grid grid-cols-2 gap-0 border-[1.5px] border-ta-ink md:grid-cols-4">
            <div className="border-r-[1.5px] border-ta-ink p-6 md:border-b-0">
              <div className={`mb-2 ${osLabelMuted}`}>Comprometido (média)</div>
              <div className="text-3xl font-bold tabular-nums">{avg.committed.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço por ciclo</div>
            </div>
            <div className="border-r-0 border-ta-ink p-6 md:border-r-[1.5px]">
              <div className={`mb-2 ${osLabelMuted}`}>Entregue (média)</div>
              <div className="text-3xl font-bold tabular-nums text-ta-cyan">{avg.delivered.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço por ciclo</div>
            </div>
            <div className="border-r-[1.5px] border-t-[1.5px] border-ta-ink p-6 md:border-t-0">
              <div className={`mb-2 ${osLabelMuted}`}>Efetividade</div>
              <div className={`text-3xl font-bold tabular-nums ${effTone(avg.eff)}`}>
                {avg.eff}%
              </div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">
                entregue / comprometido (esforço)
              </div>
            </div>
            <div className="border-t-[1.5px] border-ta-ink p-6 md:border-t-0">
              <div className={`mb-2 ${osLabelMuted}`}>Em aberto no sprint (média)</div>
              <div className="text-3xl font-bold tabular-nums">{avg.remaining.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço não entregue</div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="border-[1.5px] border-ta-ink p-6">
            <div className={`mb-6 ${osLabelMuted}`}>Evolução por ciclo</div>

            {chartData.length < 2 && selectedCycleId === "all" ? (
              <p className="text-[11px] normal-case text-ta-muted">
                Complete ao menos 2 ciclos para ver a evolução no gráfico.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ChartComponent data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3dfd1" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                    axisLine={{ stroke: "#0a0a0a" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                    axisLine={{ stroke: "#0a0a0a" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                    cursor={{ stroke: "#0a0a0a", strokeWidth: 1 }}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}
                  />
                  {chartType === "line" ? (
                    <>
                      <Line type="monotone" dataKey="committed" name="Comprometido" stroke={CHART_COLORS.planned} strokeWidth={2} dot={{ fill: CHART_COLORS.planned, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="delivered" name="Entregue" stroke={CHART_COLORS.delivered} strokeWidth={2} dot={{ fill: CHART_COLORS.delivered, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="effectiveness" name="Efetividade %" stroke={CHART_COLORS.effectiveness} strokeWidth={2} dot={{ fill: CHART_COLORS.effectiveness, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="remaining" name="Em aberto (sprint)" stroke={CHART_COLORS.added_after} strokeWidth={2} dot={{ fill: CHART_COLORS.added_after, r: 3 }} activeDot={{ r: 5 }} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="committed" name="Comprometido" fill={CHART_COLORS.planned} />
                      <Bar dataKey="delivered" name="Entregue" fill={CHART_COLORS.delivered} />
                      <Bar dataKey="effectiveness" name="Efetividade %" fill={CHART_COLORS.effectiveness} />
                      <Bar dataKey="remaining" name="Em aberto (sprint)" fill={CHART_COLORS.added_after} />
                    </>
                  )}
                </ChartComponent>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela de ciclos */}
          <div className="mt-6 border-[1.5px] border-ta-ink">
            <div className="border-b-[1.5px] border-ta-ink px-6 py-3">
              <span className={osLabelMuted}>Histórico de ciclos</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b-[1.5px] border-ta-ink">
                  {["Ciclo", "Início", "Fim", "Comprometido", "Entregue", "Em aberto", "Efetividade"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((c) => {
                  const stats = cycleStatsById.get(c.id)!;
                  return (
                    <tr key={c.id} className="border-b border-ta-rule last:border-0 hover:bg-ta-paper-2 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold">#{c.cycle_number}</td>
                      <td className="px-4 py-3 text-[11px] text-ta-muted">{formatDate(c.started_at)}</td>
                      <td className="px-4 py-3 text-[11px] text-ta-muted">{c.ended_at ? formatDate(c.ended_at) : "—"}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{stats.committed.toFixed(1)}</td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-ta-cyan">{stats.delivered.toFixed(1)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{stats.remainingSprint.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-xs font-bold tabular-nums ${effTone(stats.effectiveness)}`}>
                        {stats.effectiveness}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="my-14 border-t-[1.5px] border-ta-ink pt-10" />

      <OsPerformanceReportSection />
    </div>
  );
}

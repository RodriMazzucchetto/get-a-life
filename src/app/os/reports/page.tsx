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
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchAllOsTaskCycles } from "@/lib/os-queries";
import type { OsTaskCycleRow } from "@/lib/os-types";
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
  const [loading, setLoading] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string | "all">("all");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    if (!user) return;
    void fetchAllOsTaskCycles(user.id).then((data) => {
      setCycles(data);
      setLoading(false);
    });
  }, [user]);

  const closedCycles = useMemo(() => cycles.filter((c) => c.status === "closed"), [cycles]);

  const filtered = useMemo(() => {
    if (selectedCycleId === "all") return closedCycles;
    return closedCycles.filter((c) => c.id === selectedCycleId);
  }, [closedCycles, selectedCycleId]);

  const chartData = useMemo(
    () =>
      filtered.map((c) => {
        const total = c.planned_points + c.added_after_points;
        const eff = total > 0 ? Math.round((c.delivered_points / total) * 100) : 0;
        return {
          name: `C${c.cycle_number}`,
          label: `Ciclo #${c.cycle_number} · ${formatDate(c.started_at)}`,
          planned: Number(c.planned_points.toFixed(1)),
          delivered: Number(c.delivered_points.toFixed(1)),
          effectiveness: eff,
          added_after: Number(c.added_after_points.toFixed(1)),
        };
      }),
    [filtered]
  );

  const avg = useMemo(() => {
    if (filtered.length === 0) return { planned: 0, delivered: 0, eff: 0, added: 0 };
    const planned = filtered.reduce((s, c) => s + c.planned_points, 0) / filtered.length;
    const delivered = filtered.reduce((s, c) => s + c.delivered_points, 0) / filtered.length;
    const added = filtered.reduce((s, c) => s + c.added_after_points, 0) / filtered.length;
    const total = planned + added;
    const eff = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { planned, delivered, eff, added };
  }, [filtered]);

  const activeCycle = cycles.find((c) => c.status === "active");

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
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`mb-1 ${osLabelMuted}`}>Sistema de acompanhamento</div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Relatórios</h1>
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
      {activeCycle && (
        <div className="mb-6 border-[1.5px] border-ta-cyan bg-ta-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ta-cyan">
          Ciclo #{activeCycle.cycle_number} em andamento ·{" "}
          {activeCycle.delivered_points.toFixed(1)} de esforço entregue de{" "}
          {(activeCycle.planned_points + activeCycle.added_after_points).toFixed(1)} total
        </div>
      )}

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
              <div className={`mb-2 ${osLabelMuted}`}>Planejado (média)</div>
              <div className="text-3xl font-bold tabular-nums">{avg.planned.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço por ciclo</div>
            </div>
            <div className="border-r-0 border-ta-ink p-6 md:border-r-[1.5px]">
              <div className={`mb-2 ${osLabelMuted}`}>Entregue (média)</div>
              <div className="text-3xl font-bold tabular-nums text-ta-cyan">{avg.delivered.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço por ciclo</div>
            </div>
            <div className="border-r-[1.5px] border-t-[1.5px] border-ta-ink p-6 md:border-t-0">
              <div className={`mb-2 ${osLabelMuted}`}>Efetividade</div>
              <div className={`text-3xl font-bold tabular-nums ${avg.eff >= 70 ? "text-ta-green" : avg.eff >= 40 ? "text-ta-amber-muted" : "text-ta-red"}`}>
                {avg.eff}%
              </div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">entregue / total planejado</div>
            </div>
            <div className="border-t-[1.5px] border-ta-ink p-6 md:border-t-0">
              <div className={`mb-2 ${osLabelMuted}`}>Adicionado após início</div>
              <div className="text-3xl font-bold tabular-nums">{avg.added.toFixed(1)}</div>
              <div className="mt-1 text-[10px] normal-case text-ta-muted">esforço por ciclo</div>
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
                      <Line type="monotone" dataKey="planned" name="Planejado" stroke={CHART_COLORS.planned} strokeWidth={2} dot={{ fill: CHART_COLORS.planned, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="delivered" name="Entregue" stroke={CHART_COLORS.delivered} strokeWidth={2} dot={{ fill: CHART_COLORS.delivered, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="effectiveness" name="Efetividade %" stroke={CHART_COLORS.effectiveness} strokeWidth={2} dot={{ fill: CHART_COLORS.effectiveness, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="added_after" name="Adicionado após" stroke={CHART_COLORS.added_after} strokeWidth={2} dot={{ fill: CHART_COLORS.added_after, r: 3 }} activeDot={{ r: 5 }} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="planned" name="Planejado" fill={CHART_COLORS.planned} />
                      <Bar dataKey="delivered" name="Entregue" fill={CHART_COLORS.delivered} />
                      <Bar dataKey="effectiveness" name="Efetividade %" fill={CHART_COLORS.effectiveness} />
                      <Bar dataKey="added_after" name="Adicionado após" fill={CHART_COLORS.added_after} />
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
                  {["Ciclo", "Início", "Fim", "Planejado", "Entregue", "Adicionado após", "Efetividade"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((c) => {
                  const total = c.planned_points + c.added_after_points;
                  const eff = total > 0 ? Math.round((c.delivered_points / total) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-ta-rule last:border-0 hover:bg-ta-paper-2 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold">#{c.cycle_number}</td>
                      <td className="px-4 py-3 text-[11px] text-ta-muted">{formatDate(c.started_at)}</td>
                      <td className="px-4 py-3 text-[11px] text-ta-muted">{c.ended_at ? formatDate(c.ended_at) : "—"}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{c.planned_points.toFixed(1)}</td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-ta-cyan">{c.delivered_points.toFixed(1)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums">{c.added_after_points.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-xs font-bold tabular-nums ${eff >= 70 ? "text-ta-green" : eff >= 40 ? "text-ta-amber-muted" : "text-ta-red"}`}>
                        {eff}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

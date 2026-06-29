"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OsCompanySelector } from "@/components/os/OsCompanySelector";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import { OS_BLOCK_LABELS, fetchOsPerformanceReport } from "@/lib/os-queries";
import type { OsPerformanceReport } from "@/lib/os-types";
import { osLabelMuted } from "@/lib/os-ui";

const CHART_EXECUTED = "#1ec7eb";
const CHART_FAILED = "#ff0000";
const CHART_ACHIEVED = "#1ec7eb";
const CHART_ABANDONED = "#ff0000";

const tooltipStyle = {
  backgroundColor: "#fafaf7",
  border: "1.5px solid #0a0a0a",
  borderRadius: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "#0a0a0a",
};

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string): { year: number; month: number } {
  const [yearRaw, monthRaw] = key.split("-");
  return { year: Number(yearRaw), month: Number(monthRaw) };
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function successPct(success: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((success / total) * 100);
}

function kpiCard(label: string, value: string, tone?: "cyan" | "red" | "neutral") {
  const toneClass =
    tone === "cyan" ? "text-ta-cyan" : tone === "red" ? "text-ta-red" : "text-ta-ink";
  return (
    <div className="border-r border-ta-ink p-5 last:border-r-0">
      <div className={`mb-2 ${osLabelMuted}`}>{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

export function OsPerformanceReportSection() {
  const { user } = useAuthContext();
  const { selectedProjectId, projects } = useOsLayout();
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [report, setReport] = useState<OsPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { year, month } = useMemo(() => parseMonthKey(monthKey), [monthKey]);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  useEffect(() => {
    if (!user || !selectedProjectId) {
      setReport(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchOsPerformanceReport(user.id, selectedProjectId, year, month)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar o relatório de pitches e metas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, selectedProjectId, year, month]);

  const pitchChartData = useMemo(
    () =>
      (report?.pitches.byPillar ?? []).map((row) => ({
        pillar: OS_BLOCK_LABELS[row.pillar],
        executed: row.executed,
        failed: row.failed,
        total: row.total,
      })),
    [report]
  );

  const goalChartData = useMemo(
    () =>
      (report?.goals.byPillar ?? []).map((row) => ({
        pillar: OS_BLOCK_LABELS[row.pillar],
        achieved: row.achieved,
        abandoned: row.abandoned,
        total: row.total,
      })),
    [report]
  );

  const pitchSuccess = successPct(report?.pitches.executed ?? 0, report?.pitches.total ?? 0);
  const goalSuccess = successPct(report?.goals.achieved ?? 0, report?.goals.total ?? 0);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`mb-1 ${osLabelMuted}`}>OS · Pitches &amp; metas</div>
          <h2 className="text-xl font-bold uppercase tracking-tight">Performance por empresa</h2>
          <p className="mt-1 max-w-2xl font-sans text-xs normal-case text-ta-muted">
            Conta pitches e metas <strong>concluídos no mês</strong> (primeiro Executed/Failed do pitch
            ou data de fechamento da meta).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-0 border-[1.5px] border-ta-ink">
            <span className={`border-r-[1.5px] border-ta-ink px-3 py-2 ${osLabelMuted}`}>Mês</span>
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="bg-ta-paper px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-ta-ink focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <OsCompanySelector />
      </div>

      {selectedProject ? (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted">
          {selectedProject.name} · {formatMonthLabel(year, month)}
        </p>
      ) : null}

      {loading ? (
        <div className="border-[1.5px] border-ta-ink px-4 py-10 text-center text-[11px] uppercase tracking-wide text-ta-muted">
          Carregando performance...
        </div>
      ) : error ? (
        <div className="border-[1.5px] border-ta-red px-4 py-10 text-center text-[11px] uppercase tracking-wide text-ta-red">
          {error}
        </div>
      ) : !report ? (
        <div className="border-[1.5px] border-ta-ink px-4 py-10 text-center text-[11px] uppercase tracking-wide text-ta-muted">
          Selecione uma empresa para ver o relatório.
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pitches */}
          <div>
            <div className={`mb-3 ${osLabelMuted}`}>Pitches · Executed / Failed</div>
            <div className="mb-6 grid grid-cols-2 border-[1.5px] border-ta-ink md:grid-cols-4">
              {kpiCard("Concluídos", String(report.pitches.total))}
              {kpiCard("Executed", String(report.pitches.executed), "cyan")}
              {kpiCard("Failed", String(report.pitches.failed), "red")}
              {kpiCard("Taxa executed", `${pitchSuccess}%`, pitchSuccess >= 50 ? "cyan" : "red")}
            </div>

            <div className="border-[1.5px] border-ta-ink p-6">
              <div className={`mb-4 ${osLabelMuted}`}>Por pilar</div>
              {report.pitches.total === 0 ? (
                <p className="font-sans text-xs text-ta-muted">
                  Nenhum pitch concluído neste mês para esta empresa.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={pitchChartData} barGap={4} barCategoryGap="24%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3dfd1" />
                    <XAxis
                      dataKey="pillar"
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                      axisLine={{ stroke: "#0a0a0a" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                      axisLine={{ stroke: "#0a0a0a" }}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend
                      wrapperStyle={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    />
                    <Bar dataKey="executed" name="Executed" fill={CHART_EXECUTED} />
                    <Bar dataKey="failed" name="Failed" fill={CHART_FAILED} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Metas */}
          <div>
            <div className={`mb-3 ${osLabelMuted}`}>Metas · Achieved / Abandoned</div>
            <div className="mb-6 grid grid-cols-2 border-[1.5px] border-ta-ink md:grid-cols-4">
              {kpiCard("Concluídas", String(report.goals.total))}
              {kpiCard("Achieved", String(report.goals.achieved), "cyan")}
              {kpiCard("Abandoned", String(report.goals.abandoned), "red")}
              {kpiCard("Taxa achieved", `${goalSuccess}%`, goalSuccess >= 50 ? "cyan" : "red")}
            </div>

            <div className="border-[1.5px] border-ta-ink p-6">
              <div className={`mb-4 ${osLabelMuted}`}>Por pilar</div>
              {report.goals.total === 0 ? (
                <p className="font-sans text-xs text-ta-muted">
                  Nenhuma meta concluída neste mês para esta empresa.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={goalChartData} barGap={4} barCategoryGap="24%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3dfd1" />
                    <XAxis
                      dataKey="pillar"
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                      axisLine={{ stroke: "#0a0a0a" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "#8a857a" }}
                      axisLine={{ stroke: "#0a0a0a" }}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Legend
                      wrapperStyle={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                      }}
                    />
                    <Bar dataKey="achieved" name="Achieved" fill={CHART_ACHIEVED} />
                    <Bar dataKey="abandoned" name="Abandoned" fill={CHART_ABANDONED} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineEditable } from "@/components/rootmap/InlineEditable";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { useRootmapModal } from "@/hooks/useRootmapModal";
import {
  createAssumption,
  createTask,
  fetchSolutionAssumptions,
  setSolutionFocus,
  toggleTaskDone,
  updateSolution,
  updateSolutionStatus,
} from "@/lib/rootmap/queries";
import type {
  RmAssumption,
  RmSolution,
  RmTask,
  SolutionStatus,
} from "@/lib/rootmap/types";

const STATUSES: SolutionStatus[] = [
  "agora",
  "proximo",
  "depois",
  "validada",
  "descartada",
];

export function SolutionPanel({ id }: { id: string }) {
  const { tree, reload, patchSolution, patchTask } = useRootmapTree();
  const { open } = useRootmapModal();

  const fromTree = useMemo(() => {
    for (const ob of tree) {
      for (const opp of ob.opportunities) {
        const sol = opp.solutions.find((s) => s.id === id);
        if (sol) {
          return {
            objective: ob,
            opportunity: opp,
            solution: sol as RmSolution,
            tasks: sol.tasks as RmTask[],
          };
        }
      }
    }
    return null;
  }, [tree, id]);

  const [solution, setSolution] = useState<RmSolution | null>(
    fromTree?.solution ?? null
  );
  const [tasks, setTasks] = useState<RmTask[]>(fromTree?.tasks ?? []);
  const [assumptions, setAssumptions] = useState<RmAssumption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromTree) return;
    setSolution(fromTree.solution);
    setTasks(fromTree.tasks);
  }, [fromTree]);

  useEffect(() => {
    let cancelled = false;
    void fetchSolutionAssumptions(id)
      .then((list) => {
        if (!cancelled) setAssumptions(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveField(patch: {
    title?: string;
    description?: string | null;
  }) {
    if (!solution) return;
    try {
      const updated = await updateSolution(id, patch);
      setSolution(updated);
      patchSolution(id, updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  const objective = fromTree?.objective;
  const opportunity = fromTree?.opportunity;

  if (error && !solution) return <p className="text-red-700">{error}</p>;
  if (!solution || !objective || !opportunity) {
    return <p className="rm-muted">A carregar…</p>;
  }

  const color = objective.color;
  const validated = assumptions.filter((a) => a.status === "validada").length;
  const bar = assumptions.map((a) => {
    if (a.status === "validada") return "oklch(0.5 0.13 150)";
    if (a.status === "invalidada") return "oklch(0.55 0.18 25)";
    if (a.status === "em_teste") return "oklch(0.78 0.12 85)";
    return "#e2dbcf";
  });
  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-[14px] text-red-700">{error}</p>}
      <div
        className="rounded-[22px] p-6"
        style={{ background: objective.soft_color }}
      >
        <div className="rm-card flex flex-col">
          <div className="flex gap-6 p-6 pb-2">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--rm-ink)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--rm-paper)]">
                  S
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                  style={{ background: color }}
                >
                  {objective.tag}
                </span>
                <button
                  type="button"
                  onClick={() => open("opp", opportunity.id)}
                  className="text-[12px] font-bold hover:underline"
                  style={{ color }}
                >
                  ▲ {opportunity.title.slice(0, 42)}
                  {opportunity.title.length > 42 ? "…" : ""}
                </button>
              </div>
              <InlineEditable
                as="h1"
                value={solution.title}
                className="rm-display text-[32px] font-extrabold leading-tight"
                placeholder="Título da solução"
                onCommit={async (next) => {
                  if (!next || next === solution.title) return;
                  await saveField({ title: next });
                }}
              />
              <InlineEditable
                as="p"
                multiline
                value={solution.description ?? ""}
                className="text-[16px] leading-relaxed"
                placeholder="Descrição (opcional) — clique para editar"
                onCommit={async (next) => {
                  const prev = solution.description ?? "";
                  if (next === prev) return;
                  await saveField({ description: next || null });
                }}
              />
            </div>
            <div className="flex w-[118px] shrink-0 flex-col gap-0.5 pt-8">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className="rounded-[7px] px-2.5 py-1 text-left text-[12px] font-bold uppercase tracking-wide"
                  style={
                    solution.status === st
                      ? { background: color, color: "#fff" }
                      : { color }
                  }
                  onClick={async () => {
                    await updateSolutionStatus(id, st);
                    setSolution((s) => (s ? { ...s, status: st } : s));
                    patchSolution(id, { status: st });
                  }}
                >
                  {st}
                </button>
              ))}
              <button
                type="button"
                className="mt-2 rounded-[7px] border px-2.5 py-1 text-[12px] font-bold"
                style={{ borderColor: color, color }}
                onClick={async () => {
                  await setSolutionFocus(
                    id,
                    solution.opportunity_id,
                    !solution.is_focus
                  );
                  await reload();
                }}
              >
                {solution.is_focus ? "★ Em foco" : "Marcar ★"}
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-4">
            <section className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                  Premissas
                </div>
                <div className="flex gap-[3px]">
                  {(bar.length ? bar : ["#e2dbcf"]).map((c, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-[26px] rounded-[3px]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="ml-auto text-[12px] text-[var(--rm-muted)]">
                  {validated} de {assumptions.length || 0} validadas
                </div>
              </div>
              <p className="text-[13px] text-[var(--rm-muted)]">
                O que precisa ser verdade para esta solução funcionar.
              </p>
              <div>
                {assumptions.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 border-b border-[var(--rm-line-soft)] py-2.5"
                  >
                    <span className="w-6 pt-0.5 text-[12px] font-extrabold text-[var(--rm-muted-2)]">
                      P{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold leading-snug">
                        {a.title}
                      </div>
                      {a.status_note && (
                        <div className="text-[12px] text-[var(--rm-muted)]">
                          {a.status_note}
                        </div>
                      )}
                    </div>
                    <AssumptionPill status={a.status} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="text-[13px] font-bold text-[var(--rm-muted-2)]"
                onClick={async () => {
                  const title = window.prompt("Nova premissa");
                  if (!title) return;
                  await createAssumption({ solution_id: id, title });
                  setAssumptions(await fetchSolutionAssumptions(id));
                }}
              >
                + premissa
              </button>
            </section>

            <section className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                Tasks
              </div>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 text-[14px]"
                >
                  <button
                    type="button"
                    className="h-[15px] w-[15px] shrink-0 rounded-[4px] border-2 border-[var(--rm-ink)]"
                    style={{
                      background: t.completed ? "var(--rm-ink)" : "transparent",
                    }}
                    onClick={async () => {
                      const next = !t.completed;
                      await toggleTaskDone(t, next);
                      setTasks((list) =>
                        list.map((x) =>
                          x.id === t.id ? { ...x, completed: next } : x
                        )
                      );
                      patchTask(t.id, { completed: next });
                    }}
                  />
                  {t.kind === "teste" && (
                    <span className="rm-test-badge">TESTE</span>
                  )}
                  <button
                    type="button"
                    onClick={() => open("task", t.id)}
                    className="text-left hover:underline"
                    style={{
                      textDecoration: t.completed ? "line-through" : undefined,
                      color: t.completed ? "var(--rm-muted-2)" : undefined,
                    }}
                  >
                    {t.title}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="pl-6 text-[13px] font-bold text-[var(--rm-muted-2)]"
                onClick={async () => {
                  const title = window.prompt("Nova task");
                  if (!title) return;
                  const asTest = window.confirm(
                    "É um Teste (valida premissa)?"
                  );
                  let assumptionId: string | undefined;
                  if (asTest && assumptions.length) {
                    const pick = window.prompt(
                      `Index da premissa 1-${assumptions.length}`,
                      "1"
                    );
                    const idx = Math.max(0, Number(pick || "1") - 1);
                    assumptionId = assumptions[idx]?.id;
                  }
                  await createTask({
                    title,
                    solution_id: id,
                    objective_id: objective.id,
                    kind: asTest ? "teste" : "entrega",
                    assumption_id: assumptionId,
                    hypothesis: asTest
                      ? window.prompt('Hipótese ("Se X, espero Y")') ||
                        undefined
                      : undefined,
                  });
                  await reload();
                }}
              >
                + task
              </button>
            </section>
          </div>

          <div
            className="mt-2 flex gap-5 border-t border-dashed border-[var(--rm-line)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ color }}
          >
            <span>
              Criada
              <br />
              <span className="text-[var(--rm-muted-2)]">
                {new Date(solution.created_at).toLocaleDateString("pt-BR")}
              </span>
            </span>
            <span>
              {done} de {tasks.length} tasks feitas
              <br />
              <span className="text-[var(--rm-muted-2)]">nesta solução</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rm-btn"
          onClick={async () => {
            await updateSolutionStatus(id, "validada");
            setSolution((s) => (s ? { ...s, status: "validada" } : s));
            patchSolution(id, { status: "validada" });
          }}
        >
          Marcar como validada
        </button>
        <button
          type="button"
          className="rm-btn rm-btn-ghost"
          onClick={async () => {
            await updateSolutionStatus(id, "descartada");
            setSolution((s) => (s ? { ...s, status: "descartada" } : s));
            patchSolution(id, { status: "descartada" });
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

function AssumptionPill({ status }: { status: RmAssumption["status"] }) {
  const map = {
    nao_testada: {
      label: "Não testada",
      style: {
        background: "transparent",
        color: "#6f675c",
        border: "1.5px dashed #b9b0a2",
      },
    },
    em_teste: {
      label: "Em teste",
      style: {
        background: "oklch(0.93 0.06 85)",
        color: "oklch(0.42 0.1 70)",
        border: "1.5px solid oklch(0.93 0.06 85)",
      },
    },
    validada: {
      label: "Validada",
      style: {
        background: "oklch(0.5 0.13 150)",
        color: "#fff",
        border: "1.5px solid oklch(0.5 0.13 150)",
      },
    },
    invalidada: {
      label: "Invalidada",
      style: {
        background: "oklch(0.55 0.18 25)",
        color: "#fff",
        border: "1.5px solid oklch(0.55 0.18 25)",
      },
    },
  } as const;
  const m = map[status];
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={m.style}
    >
      {m.label}
    </span>
  );
}

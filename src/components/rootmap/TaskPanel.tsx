"use client";

import { useEffect, useState } from "react";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { useRootmapModal } from "@/hooks/useRootmapModal";
import {
  addTaskStep,
  applyTestResult,
  deleteTask,
  fetchTaskBundle,
  setTaskWait,
  toggleStep,
  toggleTaskDone,
  updateTaskStatus,
} from "@/lib/rootmap/queries";
import type {
  HorizonStatus,
  RmAssumption,
  RmTask,
  RmTaskStep,
  TestResult,
} from "@/lib/rootmap/types";

const STATUSES: Array<HorizonStatus | "feita"> = [
  "agora",
  "proximo",
  "depois",
  "feita",
];

export function TaskPanel({ id }: { id: string }) {
  const { tree, reload } = useRootmapTree();
  const { open, back } = useRootmapModal();
  const [task, setTask] = useState<RmTask | null>(null);
  const [steps, setSteps] = useState<RmTaskStep[]>([]);
  const [assumption, setAssumption] = useState<RmAssumption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const objective = tree.find(
    (o) =>
      o.id === task?.objective_id ||
      o.opportunities.some((op) =>
        op.solutions.some((s) => s.id === task?.solution_id)
      )
  );
  const solution = objective?.opportunities
    .flatMap((o) => o.solutions)
    .find((s) => s.id === task?.solution_id);

  async function load() {
    try {
      const data = await fetchTaskBundle(id);
      setTask(data.task);
      setSteps(data.steps);
      setAssumption(data.assumption);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!task) return <p className="rm-muted">A carregar…</p>;

  const color = objective?.color ?? "var(--rm-ink)";
  const soft = objective?.soft_color ?? "var(--rm-panel)";
  const currentStatus: HorizonStatus | "feita" = task.completed
    ? "feita"
    : task.status;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[22px] p-6" style={{ background: soft }}>
        <div className="rm-card flex flex-col">
          <div className="flex gap-5 p-5 pb-2">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--rm-ink)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--rm-paper)]">
                  T
                </span>
                {objective && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                    style={{ background: color }}
                  >
                    {objective.tag}
                  </span>
                )}
                {solution && (
                  <button
                    type="button"
                    onClick={() => open("sol", solution.id)}
                    className="text-[12px] font-bold hover:underline"
                    style={{ color }}
                  >
                    ★ {solution.title}
                  </button>
                )}
              </div>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-1 h-6 w-6 shrink-0 rounded-[7px] border-[2.5px] border-[var(--rm-ink)]"
                  style={{
                    background: task.completed
                      ? "var(--rm-ink)"
                      : "transparent",
                  }}
                  onClick={async () => {
                    await toggleTaskDone(task, !task.completed);
                    await load();
                    await reload();
                  }}
                />
                <h1 className="rm-display text-[28px] font-extrabold leading-tight">
                  {task.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex overflow-hidden rounded-[9px] border-2 border-[var(--rm-ink)] text-[12px] font-bold">
                  <span
                    className="px-3 py-1"
                    style={{
                      background:
                        task.kind === "entrega"
                          ? "var(--rm-ink)"
                          : "transparent",
                      color:
                        task.kind === "entrega"
                          ? "var(--rm-paper)"
                          : undefined,
                    }}
                  >
                    Entrega
                  </span>
                  <span
                    className="border-l-2 border-[var(--rm-ink)] px-3 py-1"
                    style={{
                      background:
                        task.kind === "teste" ? "var(--rm-ink)" : "transparent",
                      color:
                        task.kind === "teste" ? "var(--rm-paper)" : undefined,
                    }}
                  >
                    Teste
                  </span>
                </div>
                {task.wait_reason && (
                  <span className="rm-wait">
                    Em espera · {task.wait_reason}
                  </span>
                )}
                {task.due_date && (
                  <span className="rounded-full border border-[var(--rm-ink)] px-2.5 py-1 text-[12px] font-bold">
                    Prazo · {task.due_date}
                  </span>
                )}
                {task.recurrence && (
                  <span className="text-[12px] font-bold text-[var(--rm-muted)]">
                    ↻ {task.recurrence}
                  </span>
                )}
              </div>

              {task.kind === "teste" && (
                <div className="space-y-3 rounded-[12px] bg-[var(--rm-test-bg)] p-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-test)]">
                      Testa a premissa
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[12px] font-extrabold text-[var(--rm-muted-2)]">
                        P
                      </span>
                      <span className="text-[15px] font-semibold">
                        {assumption?.title ?? "Sem premissa ligada"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-test)]">
                      Hipótese
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed">
                      {task.hypothesis ?? "—"}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--rm-test)]">
                      Resultado
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          "validou",
                          "invalidou",
                          "inconclusivo",
                        ] as TestResult[]
                      ).map((r) => (
                        <button
                          key={r}
                          type="button"
                          className="rounded-full border border-dashed border-[#9a9184] px-3 py-1 text-[12px] font-bold capitalize text-[#4a443b]"
                          style={
                            task.test_result === r
                              ? {
                                  background: "var(--rm-ink)",
                                  color: "var(--rm-paper)",
                                  borderStyle: "solid",
                                }
                              : undefined
                          }
                          onClick={async () => {
                            await applyTestResult(id, r);
                            await load();
                            await reload();
                          }}
                        >
                          {r === "validou"
                            ? "Validou"
                            : r === "invalidou"
                              ? "Invalidou"
                              : "Inconclusivo"}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[12px] text-[#4a443b]">
                      Ao concluir, o resultado atualiza a premissa e vira
                      evidência no problema.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {steps.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 text-[14px]"
                  >
                    <button
                      type="button"
                      className="h-[15px] w-[15px] rounded-[4px] border-2 border-[var(--rm-ink)]"
                      style={{
                        background: s.done ? "var(--rm-ink)" : "transparent",
                      }}
                      onClick={async () => {
                        await toggleStep(s.id, !s.done);
                        await load();
                      }}
                    />
                    <span
                      style={{
                        textDecoration: s.done ? "line-through" : undefined,
                        color: s.done ? "var(--rm-muted-2)" : undefined,
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  className="pl-6 text-[13px] font-bold text-[var(--rm-muted-2)]"
                  onClick={async () => {
                    const title = window.prompt("Novo passo");
                    if (!title) return;
                    await addTaskStep(id, title);
                    await load();
                  }}
                >
                  + passo
                </button>
              </div>
            </div>

            <div className="flex w-[104px] shrink-0 flex-col gap-0.5 pt-8">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className="rounded-[7px] px-2.5 py-1 text-left text-[12px] font-bold uppercase tracking-wide"
                  style={
                    currentStatus === st
                      ? { background: color, color: "#fff" }
                      : { color }
                  }
                  onClick={async () => {
                    if (st === "feita") {
                      await toggleTaskDone(task, true);
                    } else {
                      if (task.completed) await toggleTaskDone(task, false);
                      await updateTaskStatus(id, st);
                    }
                    await load();
                    await reload();
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div
            className="mt-3 flex gap-5 border-t border-dashed border-[var(--rm-line)] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ color }}
          >
            <span>
              Criada
              <br />
              <span className="text-[var(--rm-muted-2)]">
                {new Date(task.created_at).toLocaleDateString("pt-BR")}
              </span>
            </span>
            {task.wait_reason && (
              <span>
                Em espera
                <br />
                <span className="text-[var(--rm-muted-2)]">
                  {task.wait_reason}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rm-btn"
          style={{ background: color }}
          onClick={async () => {
            await toggleTaskDone(task, true);
            await load();
            await reload();
          }}
        >
          Marcar como feita
        </button>
        <button
          type="button"
          className="rm-btn rm-btn-ghost"
          onClick={async () => {
            if (task.wait_reason) {
              await setTaskWait(id, null);
            } else {
              const reason = window.prompt(
                "Motivo da espera",
                task.wait_reason ?? "aguardando algo externo"
              );
              if (!reason?.trim()) return;
              await setTaskWait(id, reason.trim());
            }
            await load();
            await reload();
          }}
        >
          {task.wait_reason ? "Retirar da espera" : "Colocar em espera"}
        </button>
        <button
          type="button"
          className="rm-btn rm-btn-ghost"
          onClick={async () => {
            if (!window.confirm(`Excluir “${task.title}”?`)) return;
            await deleteTask(id);
            await reload();
            back();
          }}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

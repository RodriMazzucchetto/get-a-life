"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { useRootmapModal } from "@/hooks/useRootmapModal";
import { ObjectiveEditorModal } from "@/components/rootmap/ObjectiveEditorModal";
import {
  createOpportunity,
  createSolution,
  createTask,
  toggleTaskDone,
} from "@/lib/rootmap/queries";
import type {
  TreeObjective,
  TreeOpportunity,
  TreeSolution,
} from "@/lib/rootmap/types";

const INK = "var(--rm-ink)";

function statusPill(st: string) {
  if (st === "agora") {
    return {
      label: "Agora",
      bg: INK,
      fg: "var(--rm-paper)",
      bd: INK,
    };
  }
  if (st === "proximo") {
    return {
      label: "Próximo",
      bg: "transparent",
      fg: INK,
      bd: INK,
    };
  }
  if (st === "validada") {
    return {
      label: "Validada",
      bg: "oklch(0.5 0.13 150)",
      fg: "#fff",
      bd: "oklch(0.5 0.13 150)",
    };
  }
  if (st === "descartada" || st === "resolvido") {
    return {
      label: st === "resolvido" ? "Resolvido" : "Descartada",
      bg: "transparent",
      fg: "var(--rm-muted)",
      bd: "var(--rm-line)",
    };
  }
  return {
    label: "Depois",
    bg: "transparent",
    fg: "var(--rm-muted)",
    bd: "#b9b0a2",
  };
}

function isFaded(st: string) {
  return st === "depois" || st === "descartada";
}

function lineEnds(i: number, n: number) {
  return {
    top: i === 0 ? "32px" : "0",
    bottom: i === n - 1 ? "calc(100% - 34px)" : "0",
  };
}

function ArvoresInner() {
  const { tree, companies, loading, error, reload } = useRootmapTree();
  const { open } = useRootmapModal();
  const params = useSearchParams();
  const filterParam = params.get("obj");
  const [filter, setFilter] = useState<string>(filterParam ?? "all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<
    null | { mode: "create" } | { mode: "edit"; objectiveId: string }
  >(null);
  const takenCompanyIds = tree
    .map((o) => o.company_id)
    .filter((id): id is string => Boolean(id));
  const editingObjective: TreeObjective | null =
    editor?.mode === "edit"
      ? (tree.find((o) => o.id === editor.objectiveId) ?? null)
      : null;

  const visible = useMemo(
    () => (filter === "all" ? tree : tree.filter((o) => o.id === filter)),
    [tree, filter]
  );

  function isCollapsed(key: string, fallback = false) {
    return collapsed[key] ?? fallback;
  }
  function flip(key: string, cur: boolean) {
    setCollapsed((s) => ({ ...s, [key]: !cur }));
  }

  if (loading) return <p className="rm-muted">A carregar Árvores…</p>;
  if (error) return <p className="text-red-700">{error}</p>;

  return (
    <div className="flex flex-col gap-[22px]">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="rm-display text-[42px] font-extrabold tracking-tight leading-none">
          Árvores
        </h1>
        <div className="ml-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rm-pill"
            data-active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
          {tree.map((ob) => (
            <button
              key={ob.id}
              type="button"
              className="rm-pill"
              data-active={filter === ob.id}
              onClick={() => setFilter(ob.id)}
            >
              {ob.tag}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            className="rm-pill"
            onClick={() => setCollapsed({})}
          >
            Expandir tudo
          </button>
          <button
            type="button"
            className="rm-pill"
            onClick={() => {
              const keys: string[] = [];
              for (const ob of tree) {
                keys.push(`o:${ob.id}`);
                ob.opportunities.forEach((opp, i) => {
                  keys.push(`p:${ob.id}-${i}`);
                  opp.solutions.forEach((_, j) =>
                    keys.push(`s:${ob.id}-${i}-${j}`)
                  );
                });
              }
              setCollapsed(Object.fromEntries(keys.map((k) => [k, true])));
            }}
          >
            Recolher tudo
          </button>
          <button
            type="button"
            className="rm-btn"
            onClick={() => setEditor({ mode: "create" })}
          >
            + Nova árvore
          </button>
        </div>
      </header>

      <p className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[13px] text-[var(--rm-muted)]">
        <span className="font-bold text-[var(--rm-ink)]">Legenda</span>
        <span>▾ ▸ expandir/recolher</span>
        <span>#n = ordem</span>
        <span>★ = foco do nível</span>
        <span>esmaecido = depois</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="rm-test-badge">TESTE</span>
          task que valida uma premissa
        </span>
      </p>

      <div className="flex flex-col gap-[30px] overflow-x-auto pb-4">
        {visible.map((ob, oi) => {
          const ok = `o:${ob.id}`;
          const oc = isCollapsed(ok, false);
          const nSol = ob.opportunities.reduce(
            (a, o) => a + o.solutions.length,
            0
          );
          const nTask = ob.opportunities.reduce(
            (a, o) =>
              a + o.solutions.reduce((b, s) => b + s.tasks.length, 0),
            0
          );
          return (
            <div key={ob.id} className="flex min-w-min items-start">
              {/* Objective */}
              <button
                type="button"
                onClick={() =>
                  setEditor({ mode: "edit", objectiveId: ob.id })
                }
                className="flex w-[220px] shrink-0 cursor-pointer flex-col gap-2 rounded-[14px] border-2 border-[var(--rm-ink)] p-3.5 text-left text-white shadow-[4px_4px_0_var(--rm-ink)] transition hover:brightness-110"
                style={{ background: ob.color }}
              >
                <div className="flex items-center gap-2 text-[12px] font-bold">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      flip(ok, oc);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        flip(ok, oc);
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-[13px] text-white"
                    aria-label={oc ? "Expandir" : "Recolher"}
                  >
                    {oc ? "▸" : "▾"}
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5">
                    #{oi + 1}
                  </span>
                  <span className="tracking-wider">OBJETIVO · {ob.tag}</span>
                </div>
                <div className="rm-display text-[20px] font-bold leading-tight">
                  {ob.title}
                </div>
                {ob.metric && (
                  <div className="text-[13px] font-semibold">{ob.metric}</div>
                )}
                {oc && (
                  <div className="border-t border-white/35 pt-2 text-[12px] font-semibold">
                    {ob.opportunities.length} problema
                    {ob.opportunities.length === 1 ? "" : "s"} · {nSol} solução
                    {nSol === 1 ? "" : "ões"} · {nTask} tasks
                  </div>
                )}
              </button>

              {!oc && (
                <>
                  <div className="mt-8 h-0.5 w-[26px] shrink-0 bg-[var(--rm-ink)]" />
                  <div className="flex flex-col">
                    {ob.opportunities.map((opp, i) => (
                      <OpportunityBranch
                        key={opp.id}
                        obColor={ob.color}
                        obSoft={ob.soft_color}
                        objectiveId={ob.id}
                        opp={opp}
                        index={i}
                        total={ob.opportunities.length}
                        flip={flip}
                        isCollapsed={isCollapsed}
                        open={open}
                        reload={reload}
                      />
                    ))}
                    <button
                      type="button"
                      className="pl-[26px] text-left text-[13px] font-bold text-[var(--rm-muted-2)]"
                      onClick={async () => {
                        const title = window.prompt(
                          "Novo problema / oportunidade"
                        );
                        if (!title) return;
                        await createOpportunity({
                          objective_id: ob.id,
                          title,
                        });
                        await reload();
                      }}
                    >
                      + Problema / Oportunidade
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {editor && (editor.mode === "create" || editingObjective) && (
        <ObjectiveEditorModal
          mode={editor.mode}
          objective={editingObjective}
          companies={companies}
          takenCompanyIds={takenCompanyIds}
          nextPos={(tree.length + 1) * 1000}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function OpportunityBranch({
  obColor,
  obSoft,
  objectiveId,
  opp,
  index,
  total,
  flip,
  isCollapsed,
  open,
  reload,
}: {
  obColor: string;
  obSoft: string;
  objectiveId: string;
  opp: TreeOpportunity;
  index: number;
  total: number;
  flip: (key: string, cur: boolean) => void;
  isCollapsed: (key: string, fallback?: boolean) => boolean;
  open: (kind: "opp" | "sol" | "task", id: string) => void;
  reload: () => Promise<void>;
}) {
  const pk = `p:${objectiveId}-${index}`;
  const pc = isCollapsed(pk, opp.status === "depois");
  const ends = lineEnds(index, total);
  const pill = statusPill(opp.status);
  const faded = isFaded(opp.status);

  return (
    <div
      className="relative flex items-start pb-4 pl-[26px]"
      style={{ opacity: faded ? 0.55 : 1 }}
    >
      <div
        className="absolute left-0 w-0.5 bg-[var(--rm-ink)]"
        style={{ top: ends.top, bottom: ends.bottom }}
      />
      <div className="absolute left-0 top-8 h-0.5 w-[26px] bg-[var(--rm-ink)]" />

      <button
        type="button"
        onClick={() => open("opp", opp.id)}
        className="flex w-[270px] shrink-0 flex-col gap-1.5 rounded-[12px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3.5 py-2.5 text-left"
        style={{
          boxShadow: opp.is_focus ? `4px 4px 0 ${obColor}` : undefined,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              flip(pk, pc);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                flip(pk, pc);
              }
            }}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-[1.5px] border-[var(--rm-ink)] text-[11px]"
          >
            {pc ? "▸" : "▾"}
          </span>
          <span
            className="text-[12px] font-extrabold"
            style={{ color: obColor }}
          >
            #{index + 1}
          </span>
          <span className="text-[10px] font-bold tracking-wide text-[var(--rm-muted)]">
            PROBLEMA / OPORT.
          </span>
          {opp.is_focus && (
            <span className="ml-auto text-[15px]" style={{ color: obColor }}>
              ★
            </span>
          )}
          <span
            className={`rounded-full border-[1.5px] px-2 py-0.5 text-[11px] font-bold ${opp.is_focus ? "" : "ml-auto"}`}
            style={{
              background: pill.bg,
              color: pill.fg,
              borderColor: pill.bd,
            }}
          >
            {pill.label}
          </span>
        </div>
        <div className="text-[14px] font-semibold leading-snug text-pretty">
          {opp.title}
        </div>
        {pc && (
          <div className="text-[12px] font-semibold text-[var(--rm-muted)]">
            {opp.solutions.length
              ? `${opp.solutions.length} solução${opp.solutions.length === 1 ? "" : "ões"} oculta${opp.solutions.length === 1 ? "" : "s"}`
              : "nenhuma solução ainda"}
          </div>
        )}
      </button>

      {!pc && (
        <>
          <div className="mt-8 h-0.5 w-[26px] shrink-0 bg-[var(--rm-ink)]" />
          <div className="flex flex-col">
            {opp.solutions.map((sol, j) => (
              <SolutionBranch
                key={sol.id}
                obColor={obColor}
                obSoft={obSoft}
                objectiveId={objectiveId}
                oppIndex={index}
                sol={sol}
                index={j}
                total={opp.solutions.length}
                isCollapsed={isCollapsed}
                flip={flip}
                open={open}
                reload={reload}
              />
            ))}
            <button
              type="button"
              className="pb-1.5 pl-[26px] text-left text-[13px] font-bold text-[var(--rm-muted-2)]"
              onClick={async () => {
                const title = window.prompt("Nova solução");
                if (!title) return;
                await createSolution({
                  opportunity_id: opp.id,
                  title,
                });
                await reload();
              }}
            >
              + Solução
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SolutionBranch({
  obColor,
  obSoft,
  objectiveId,
  oppIndex,
  sol,
  index,
  total,
  isCollapsed,
  flip,
  open,
  reload,
}: {
  obColor: string;
  obSoft: string;
  objectiveId: string;
  oppIndex: number;
  sol: TreeSolution;
  index: number;
  total: number;
  isCollapsed: (key: string, fallback?: boolean) => boolean;
  flip: (key: string, cur: boolean) => void;
  open: (kind: "opp" | "sol" | "task", id: string) => void;
  reload: () => Promise<void>;
}) {
  const sk = `s:${objectiveId}-${oppIndex}-${index}`;
  const sc = isCollapsed(sk, sol.status === "depois");
  const ends = lineEnds(index, total);
  const pill = statusPill(sol.status);
  const faded = isFaded(sol.status);
  const done = sol.tasks.filter((t) => t.completed).length;
  const hasTasks = sol.tasks.length > 0;

  return (
    <div
      className="relative flex items-start pb-2.5 pl-[26px]"
      style={{ opacity: faded ? 0.55 : 1 }}
    >
      <div
        className="absolute left-0 w-0.5 bg-[var(--rm-ink)]"
        style={{ top: ends.top, bottom: ends.bottom }}
      />
      <div className="absolute left-0 top-8 h-0.5 w-[26px] bg-[var(--rm-ink)]" />

      <button
        type="button"
        onClick={() => open("sol", sol.id)}
        className="flex w-[250px] shrink-0 flex-col gap-1.5 rounded-[12px] border-2 border-[var(--rm-ink)] px-3.5 py-2.5 text-left"
        style={{
          background: obSoft,
          boxShadow: sol.is_focus ? `4px 4px 0 ${INK}` : undefined,
        }}
      >
        <div className="flex items-center gap-1.5">
          {hasTasks && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                flip(sk, sc);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  flip(sk, sc);
                }
              }}
              className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-[1.5px] border-[var(--rm-ink)] text-[11px]"
            >
              {sc ? "▸" : "▾"}
            </span>
          )}
          <span
            className="text-[12px] font-extrabold"
            style={{ color: obColor }}
          >
            #{index + 1}
          </span>
          <span className="text-[11px] font-bold tracking-wider text-[var(--rm-muted)]">
            SOLUÇÃO
          </span>
          {sol.is_focus && (
            <span className="ml-auto text-[15px]" style={{ color: obColor }}>
              ★
            </span>
          )}
          <span
            className={`rounded-full border-[1.5px] px-2 py-0.5 text-[11px] font-bold ${sol.is_focus ? "" : "ml-auto"}`}
            style={{
              background: pill.bg,
              color: pill.fg,
              borderColor: pill.bd,
            }}
          >
            {pill.label}
          </span>
        </div>
        <div className="text-[14px] font-semibold leading-snug">{sol.title}</div>
        <div className="text-[12px] text-[var(--rm-muted)]">
          {hasTasks
            ? `${done}/${sol.tasks.length} tasks feitas`
            : "sem tasks ainda"}
        </div>
      </button>

      {hasTasks && !sc && (
        <>
          <div className="mt-8 h-0.5 w-5 shrink-0 bg-[var(--rm-ink)]" />
          <div className="w-[288px] shrink-0 rounded-[12px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-1.5">
            {sol.tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2 py-1.5"
              >
                <button
                  type="button"
                  aria-label="Concluir"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-2 border-[var(--rm-ink)] text-[10px] leading-none text-[var(--rm-paper)]"
                  style={{
                    background: t.completed ? INK : "transparent",
                  }}
                  onClick={async () => {
                    await toggleTaskDone(t, !t.completed);
                    await reload();
                  }}
                >
                  {t.completed ? "✓" : ""}
                </button>
                {t.kind === "teste" && (
                  <span className="rm-test-badge mt-0.5">TESTE</span>
                )}
                <button
                  type="button"
                  onClick={() => open("task", t.id)}
                  className="min-w-0 flex-1 text-left text-[13px] leading-snug hover:underline"
                  style={{
                    textDecoration: t.completed ? "line-through" : undefined,
                    color: t.completed ? "var(--rm-muted-2)" : undefined,
                  }}
                >
                  {t.title}
                </button>
                <span
                  className="pt-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    color:
                      t.status === "agora"
                        ? INK
                        : t.status === "proximo"
                          ? "var(--rm-muted)"
                          : "var(--rm-muted-2)",
                  }}
                >
                  {t.status === "agora"
                    ? "Agora"
                    : t.status === "proximo"
                      ? "próximo"
                      : "depois"}
                </span>
              </div>
            ))}
            <button
              type="button"
              className="py-1 text-[12px] font-bold text-[var(--rm-muted-2)]"
              onClick={async () => {
                const title = window.prompt("Nova task");
                if (!title) return;
                await createTask({
                  title,
                  solution_id: sol.id,
                  objective_id: objectiveId,
                });
                await reload();
              }}
            >
              + Task
            </button>
          </div>
        </>
      )}

      {!hasTasks && (
        <div className="mt-8 ml-5">
          <button
            type="button"
            className="text-[12px] font-bold text-[var(--rm-muted-2)]"
            onClick={async () => {
              const title = window.prompt("Nova task");
              if (!title) return;
              await createTask({
                title,
                solution_id: sol.id,
                objective_id: objectiveId,
              });
              await reload();
            }}
          >
            + Task
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArvoresPage() {
  return (
    <Suspense fallback={<p className="rm-muted">A carregar Árvores…</p>}>
      <ArvoresInner />
    </Suspense>
  );
}

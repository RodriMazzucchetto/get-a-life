"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import {
  createOpportunity,
  createSolution,
  createTask,
} from "@/lib/rootmap/queries";

function ArvoresInner() {
  const { tree, loading, error, reload } = useRootmapTree();
  const params = useSearchParams();
  const filterParam = params.get("obj");
  const [filter, setFilter] = useState<string>(filterParam ?? "all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="rm-display text-[42px] font-extrabold tracking-tight leading-none">
          Árvores
        </h1>
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
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
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

      <p className="text-[13px] text-[var(--rm-muted)]">
        ▾/▸ expandir · #n = ordem · ★ = foco · esmaecido = depois ·{" "}
        <span className="rm-test-badge">TESTE</span> valida premissa
      </p>

      <div className="flex flex-col gap-8">
        {visible.map((ob, oi) => {
          const ok = `o:${ob.id}`;
          const oc = isCollapsed(ok, false);
          return (
            <section key={ob.id} className="space-y-3">
              <button
                type="button"
                className="flex w-full items-start gap-3 text-left"
                onClick={() => flip(ok, oc)}
              >
                <span className="text-lg">{oc ? "▸" : "▾"}</span>
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                    #{oi + 1} · Objetivo · {ob.tag}
                  </div>
                  <div className="rm-display text-[28px] font-extrabold leading-tight">
                    {ob.title}
                  </div>
                  <div className="text-[14px] font-semibold">{ob.metric}</div>
                </div>
              </button>

              {!oc && (
                <div className="ml-4 space-y-2 border-l-2 border-[var(--rm-line)] pl-4">
                  {ob.opportunities.map((opp, i) => {
                    const pk = `p:${ob.id}-${i}`;
                    const pc = isCollapsed(pk, opp.status === "depois");
                    return (
                      <div
                        key={opp.id}
                        style={{ opacity: opp.status === "depois" ? 0.55 : 1 }}
                      >
                        <div className="flex items-start gap-2">
                          <button type="button" onClick={() => flip(pk, pc)}>
                            {pc ? "▸" : "▾"}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-bold text-[var(--rm-muted)]">
                                #{i + 1}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                                Problema / Oport.
                              </span>
                              {opp.is_focus && (
                                <span style={{ color: ob.color }}>★</span>
                              )}
                              <span className="rounded-md border border-[var(--rm-ink)] px-2 py-0.5 text-[11px] font-bold uppercase">
                                {opp.status}
                              </span>
                            </div>
                            <Link
                              href={`/oportunidades/${opp.id}`}
                              className="text-[16px] font-semibold hover:underline"
                            >
                              {opp.title}
                            </Link>
                          </div>
                        </div>

                        {!pc && (
                          <div className="ml-6 mt-2 space-y-2">
                            {opp.solutions.map((sol, j) => {
                              const sk = `s:${ob.id}-${i}-${j}`;
                              const sc = isCollapsed(
                                sk,
                                sol.status === "depois"
                              );
                              const done = sol.tasks.filter(
                                (t) => t.completed
                              ).length;
                              return (
                                <div
                                  key={sol.id}
                                  className="rounded-[12px] p-2"
                                  style={{
                                    background: sol.is_focus
                                      ? ob.soft_color
                                      : "transparent",
                                    boxShadow: sol.is_focus
                                      ? `4px 4px 0 var(--rm-ink)`
                                      : undefined,
                                    opacity:
                                      sol.status === "depois" ? 0.55 : 1,
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <button
                                      type="button"
                                      onClick={() => flip(sk, sc)}
                                    >
                                      {sc ? "▸" : "▾"}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                                        <span>#{j + 1} Solução</span>
                                        {sol.is_focus && <span>★</span>}
                                        <span>{sol.status}</span>
                                      </div>
                                      <Link
                                        href={`/solucoes/${sol.id}`}
                                        className="text-[15px] font-semibold hover:underline"
                                      >
                                        {sol.title}
                                      </Link>
                                      <div className="text-[12px] text-[var(--rm-muted)]">
                                        {sol.tasks.length
                                          ? `${done}/${sol.tasks.length} tasks feitas`
                                          : "sem tasks ainda"}
                                      </div>
                                    </div>
                                  </div>
                                  {!sc && (
                                    <div className="ml-6 mt-2 space-y-1">
                                      {sol.tasks.map((t) => (
                                        <Link
                                          key={t.id}
                                          href={`/tasks/${t.id}`}
                                          className="flex items-center gap-2 text-[14px] hover:underline"
                                          style={{
                                            textDecoration: t.completed
                                              ? "line-through"
                                              : undefined,
                                            color: t.completed
                                              ? "var(--rm-muted-2)"
                                              : undefined,
                                          }}
                                        >
                                          <span
                                            className="inline-block h-[14px] w-[14px] rounded-[3px] border-2 border-[var(--rm-ink)]"
                                            style={{
                                              background: t.completed
                                                ? "var(--rm-ink)"
                                                : "transparent",
                                            }}
                                          />
                                          {t.kind === "teste" && (
                                            <span className="rm-test-badge">
                                              TESTE
                                            </span>
                                          )}
                                          <span>{t.title}</span>
                                        </Link>
                                      ))}
                                      <button
                                        type="button"
                                        className="text-[13px] font-bold text-[var(--rm-muted-2)]"
                                        onClick={async () => {
                                          const title =
                                            window.prompt("Nova task");
                                          if (!title) return;
                                          await createTask({
                                            title,
                                            solution_id: sol.id,
                                            objective_id: ob.id,
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
                            })}
                            <button
                              type="button"
                              className="text-[13px] font-bold text-[var(--rm-muted-2)]"
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
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="text-[13px] font-bold text-[var(--rm-muted-2)]"
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
              )}
            </section>
          );
        })}
      </div>
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

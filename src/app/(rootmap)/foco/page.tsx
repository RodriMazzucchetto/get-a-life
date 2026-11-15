"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { createTask, toggleTaskDone } from "@/lib/rootmap/queries";
import type { HorizonStatus, RmTask } from "@/lib/rootmap/types";

export default function FocoPage() {
  const { tree, tasks, loading, error, reload } = useRootmapTree();
  const [tab, setTab] = useState<HorizonStatus>("agora");
  const [draft, setDraft] = useState("");
  const [draftTag, setDraftTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byId = useMemo(() => {
    const m = new Map(tree.map((o) => [o.id, o]));
    return m;
  }, [tree]);

  const solMeta = useMemo(() => {
    const m = new Map<
      string,
      { tag: string; color: string; origin: string; objectiveId: string }
    >();
    for (const ob of tree) {
      for (const opp of ob.opportunities) {
        for (const sol of opp.solutions) {
          m.set(sol.id, {
            tag: ob.tag,
            color: ob.color,
            origin: `${opp.title.slice(0, 28)}${opp.title.length > 28 ? "…" : ""} › ${sol.title}`,
            objectiveId: ob.id,
          });
        }
      }
    }
    return m;
  }, [tree]);

  const enriched = useMemo(() => {
    return tasks.map((t) => {
      if (t.solution_id && solMeta.has(t.solution_id)) {
        const meta = solMeta.get(t.solution_id)!;
        return { ...t, tag: meta.tag, color: meta.color, origin: meta.origin };
      }
      const ob = t.objective_id ? byId.get(t.objective_id) : null;
      return {
        ...t,
        tag: ob?.tag ?? "Geral",
        color: ob?.color ?? "#8a8173",
        origin: t.recurrence ? `↻ ${t.recurrence} · avulsa` : "Avulsa",
      };
    });
  }, [tasks, solMeta, byId]);

  const focusCards = tree.map((ob) => {
    const fo = ob.opportunities.find((o) => o.is_focus) ?? ob.opportunities[0];
    const fs = fo?.solutions.find((s) => s.is_focus) ?? fo?.solutions[0];
    const done = fs?.tasks.filter((t) => t.completed).length ?? 0;
    const total = fs?.tasks.length ?? 0;
    return { ob, fo, fs, done, total };
  });

  const open = enriched.filter((t) => !t.completed);
  const queue = open.filter((t) => t.status === tab);
  const doneCount = enriched.filter((t) => t.completed).length;

  async function add() {
    const title = draft.trim();
    if (!title) return;
    setBusy(true);
    try {
      await createTask({
        title,
        status: tab,
        objective_id: draftTag,
      });
      setDraft("");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(t: RmTask) {
    await toggleTaskDone(t, !t.completed);
    await reload();
  }

  if (loading) return <p className="rm-muted">A carregar Foco…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-700">{error}</p>
        <button type="button" className="rm-btn" onClick={() => void reload()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="rm-display text-[42px] font-extrabold tracking-tight leading-none">
            Foco
          </h1>
          <p className="mt-2 text-[16px] text-[var(--rm-muted)]">
            O problema/oportunidade e a solução ★ de cada objetivo, em ordem de
            prioridade.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {focusCards.map(({ ob, fo, fs, done, total }, idx) => (
          <article
            key={ob.id}
            className="flex min-h-[220px] flex-col rounded-[16px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] p-4"
            style={{ boxShadow: fo ? `4px 4px 0 ${ob.color}` : undefined }}
          >
            <div className="mb-2 flex items-center gap-2 text-[13px] font-bold">
              <span
                className="rounded-md px-2 py-0.5 text-white"
                style={{ background: ob.color }}
              >
                {ob.tag}
              </span>
              <span className="text-[var(--rm-muted)]">#{idx + 1}</span>
            </div>
            <h2 className="rm-display text-[20px] font-bold leading-tight">
              {ob.title}
            </h2>
            <p className="mt-1 text-[13px] font-semibold">{ob.metric}</p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                  ★ Problema / Oportunidade
                </div>
                {fo ? (
                  <Link
                    href={`/oportunidades/${fo.id}`}
                    className="text-[15px] font-semibold leading-snug hover:underline"
                  >
                    {fo.title}
                  </Link>
                ) : (
                  <p className="text-[15px] font-semibold">Sem problema em foco</p>
                )}
              </div>
              <div>
                <div
                  className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: ob.color }}
                >
                  ★ Solução
                </div>
                {fs ? (
                  <Link
                    href={`/solucoes/${fs.id}`}
                    className="block text-[14px] font-semibold leading-snug hover:underline"
                  >
                    {fs.title}
                  </Link>
                ) : (
                  <p className="text-[14px]">Sem solução em foco</p>
                )}
                <p className="text-[12px] text-[var(--rm-muted)]">
                  {total ? `${done}/${total} tasks feitas` : "sem tasks ainda"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="rm-display text-[28px] font-bold">Tasks</h2>
          {(["agora", "proximo", "depois"] as HorizonStatus[]).map((k) => {
            const count = open.filter((t) => t.status === k).length;
            const label =
              k === "agora" ? "Agora" : k === "proximo" ? "Próximo" : "Depois";
            return (
              <button
                key={k}
                type="button"
                className="rm-pill"
                data-active={tab === k}
                onClick={() => setTab(k)}
              >
                {label} · {count}
              </button>
            );
          })}
          <span className="ml-auto text-[13px] text-[var(--rm-muted)]">
            Feitas esta semana · {doneCount}
          </span>
        </div>

        <div className="rm-card flex flex-wrap items-center gap-3 p-3">
          <span className="w-6 text-center text-xl font-semibold">+</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
            placeholder="Nova task — ligada a uma solução ou avulsa…"
            className="min-w-0 flex-1 border-none bg-transparent py-1.5 text-[15px] outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-full border px-2.5 py-1 text-[12px] font-bold"
              style={{
                borderColor: "#8a8173",
                background: draftTag === null ? "#8a8173" : "transparent",
                color: draftTag === null ? "#fff" : "#8a8173",
              }}
              onClick={() => setDraftTag(null)}
            >
              Geral
            </button>
            {tree.map((ob) => (
              <button
                key={ob.id}
                type="button"
                className="rounded-full border px-2.5 py-1 text-[12px] font-bold"
                style={{
                  borderColor: ob.color,
                  background: draftTag === ob.id ? ob.color : "transparent",
                  color: draftTag === ob.id ? "#fff" : ob.color,
                }}
                onClick={() => setDraftTag(ob.id)}
              >
                {ob.tag}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rm-btn rounded-[9px]"
            disabled={busy}
            onClick={() => void add()}
          >
            Adicionar
          </button>
        </div>

        <div className="flex flex-col">
          {queue.map((t, i) => (
            <div
              key={t.id}
              className="flex items-start gap-2 border-b border-[var(--rm-line-soft)] py-3"
              style={{ opacity: tab === "depois" ? 0.55 : 1 }}
            >
              <span className="w-5 pt-0.5 text-[13px] font-bold text-[var(--rm-muted)]">
                {i + 1}
              </span>
              <button
                type="button"
                aria-label="Concluir"
                className="mt-0.5 h-[15px] w-[15px] shrink-0 rounded-[4px] border-2 border-[var(--rm-ink)]"
                onClick={() => void onToggle(t)}
              />
              {t.kind === "teste" && <span className="rm-test-badge">TESTE</span>}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/tasks/${t.id}`}
                  className="text-[15px] font-medium hover:underline"
                >
                  {t.title}
                </Link>
                <div className="text-[12px] text-[var(--rm-muted)]">{t.origin}</div>
              </div>
              {t.wait_reason && (
                <span className="rm-wait">Em espera · {t.wait_reason}</span>
              )}
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                style={{ background: t.color }}
              >
                {t.tag}
              </span>
            </div>
          ))}
          {queue.length === 0 && (
            <p className="py-6 text-[14px] text-[var(--rm-muted)]">
              Nenhuma task em {tab}.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

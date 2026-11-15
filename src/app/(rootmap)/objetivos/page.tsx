"use client";

import Link from "next/link";
import { useState } from "react";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { createObjective } from "@/lib/rootmap/queries";

export default function ObjetivosPage() {
  const { tree, loading, error, reload } = useRootmapTree();
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="rm-muted">A carregar Objetivos…</p>;
  if (error) return <p className="text-red-700">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="rm-display text-[42px] font-extrabold tracking-tight leading-none">
            Objetivos
          </h1>
          <p className="mt-2 text-[16px] text-[var(--rm-muted)]">
            Um objetivo por empresa. Ordem = prioridade.
          </p>
        </div>
        <button
          type="button"
          className="rm-btn ml-auto"
          disabled={busy}
          onClick={async () => {
            const tag = window.prompt("Tag da empresa (ex: KMN)");
            if (!tag) return;
            const title = window.prompt("Objetivo (outcome)");
            if (!title) return;
            const metric = window.prompt("Métrica (opcional)") ?? "";
            setBusy(true);
            try {
              await createObjective({
                tag: tag.toUpperCase(),
                title,
                metric: metric || undefined,
                pos: (tree.length + 1) * 1000,
              });
              await reload();
            } finally {
              setBusy(false);
            }
          }}
        >
          + Nova árvore
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tree.map((ob, i) => {
          const fo = ob.opportunities.find((o) => o.is_focus);
          const fs = fo?.solutions.find((s) => s.is_focus);
          return (
            <article key={ob.id} className="rm-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                  style={{ background: ob.color }}
                >
                  {ob.tag}
                </span>
                <span className="text-[13px] font-bold text-[var(--rm-muted)]">
                  #{i + 1}
                </span>
              </div>
              <h2 className="rm-display text-[24px] font-extrabold leading-tight">
                {ob.title}
              </h2>
              <p className="mt-1 text-[14px] font-semibold">{ob.metric}</p>
              <div className="mt-4 space-y-2 text-[14px]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                    ★ Problema
                  </div>
                  <p className="font-semibold">
                    {fo?.title ?? "Nenhum em foco"}
                  </p>
                </div>
                <div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: ob.color }}
                  >
                    ★ Solução
                  </div>
                  <p className="font-semibold">
                    {fs?.title ?? "Nenhuma em foco"}
                  </p>
                </div>
              </div>
              <Link
                href={`/arvores?obj=${ob.id}`}
                className="mt-4 inline-block text-[13px] font-bold text-[var(--rm-muted)] hover:underline"
              >
                Abrir árvore →
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

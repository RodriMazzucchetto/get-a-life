"use client";

import Link from "next/link";
import { useState } from "react";
import { ObjectiveEditorModal } from "@/components/rootmap/ObjectiveEditorModal";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import type { TreeObjective } from "@/lib/rootmap/types";

export default function ObjetivosPage() {
  const { tree, loading, error, reload } = useRootmapTree();
  const [editor, setEditor] = useState<
    null | { mode: "create" } | { mode: "edit"; objective: TreeObjective }
  >(null);

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
            Um objetivo por empresa. Ordem = prioridade. Clique para editar.
          </p>
        </div>
        <button
          type="button"
          className="rm-btn ml-auto"
          onClick={() => setEditor({ mode: "create" })}
        >
          + Nova árvore
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tree.map((ob, i) => {
          const fo = ob.opportunities.find((o) => o.is_focus);
          const fs = fo?.solutions.find((s) => s.is_focus);
          return (
            <article
              key={ob.id}
              className="rm-card flex flex-col p-5 transition hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => setEditor({ mode: "edit", objective: ob })}
                className="flex flex-1 flex-col text-left"
              >
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
                  <span className="ml-auto text-[12px] font-bold text-[var(--rm-muted)]">
                    Editar →
                  </span>
                </div>
                <h2 className="rm-display text-[24px] font-extrabold leading-tight">
                  {ob.title}
                </h2>
                {ob.description && (
                  <p className="mt-2 text-[14px] leading-snug text-[var(--rm-muted)]">
                    {ob.description}
                  </p>
                )}
                {ob.metric && (
                  <p className="mt-1 text-[14px] font-semibold">{ob.metric}</p>
                )}
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
              </button>
              <Link
                href={`/arvores?obj=${ob.id}`}
                className="mt-4 inline-block text-[13px] font-bold text-[var(--rm-muted)] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Abrir árvore →
              </Link>
            </article>
          );
        })}
      </div>

      {editor && (
        <ObjectiveEditorModal
          mode={editor.mode}
          objective={editor.mode === "edit" ? editor.objective : null}
          nextPos={(tree.length + 1) * 1000}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

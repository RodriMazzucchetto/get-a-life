"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import {
  addDiary,
  addEvidence,
  fetchOpportunityBundle,
  setOpportunityFocus,
  updateOpportunityStatus,
} from "@/lib/rootmap/queries";
import type {
  OpportunityStatus,
  RmDiaryEntry,
  RmEvidence,
  RmOpportunity,
  RmSolution,
} from "@/lib/rootmap/types";

const STATUSES: OpportunityStatus[] = [
  "agora",
  "proximo",
  "depois",
  "resolvido",
];

export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tree, reload } = useRootmapTree();
  const [opportunity, setOpportunity] = useState<RmOpportunity | null>(null);
  const [evidences, setEvidences] = useState<RmEvidence[]>([]);
  const [diary, setDiary] = useState<RmDiaryEntry[]>([]);
  const [solutions, setSolutions] = useState<RmSolution[]>([]);
  const [error, setError] = useState<string | null>(null);

  const objective = tree.find((o) =>
    o.opportunities.some((op) => op.id === id)
  );

  async function load() {
    try {
      const data = await fetchOpportunityBundle(id);
      setOpportunity(data.opportunity);
      setEvidences(data.evidences);
      setDiary(data.diary);
      setSolutions(data.solutions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!opportunity || !objective) {
    return <p className="rm-muted">A carregar…</p>;
  }

  const color = objective.color;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <button
        type="button"
        className="flex items-center gap-2 self-start text-[13px] font-bold"
        onClick={() => router.push("/arvores")}
      >
        ← Voltar para Árvores
        <span className="rounded border border-[var(--rm-ink)] px-1 text-[10px]">
          ESC
        </span>
      </button>

      <div
        className="rounded-[22px] p-6"
        style={{ background: objective.soft_color }}
      >
        <div className="rm-card flex flex-col">
          <div className="flex gap-6 p-6 pb-2">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--rm-ink)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--rm-paper)]">
                  P
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                  style={{ background: color }}
                >
                  {objective.tag}
                </span>
                <span className="text-[12px] font-bold" style={{ color }}>
                  ◎ {objective.title}
                </span>
              </div>
              <h1 className="rm-display text-[32px] font-extrabold leading-tight">
                {opportunity.title}
              </h1>
              {opportunity.description && (
                <p className="text-[16px] leading-relaxed text-[#2e2a24]">
                  {opportunity.description}
                </p>
              )}
            </div>
            <div className="flex w-[118px] shrink-0 flex-col gap-0.5 pt-8">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className="rounded-[7px] px-2.5 py-1 text-left text-[12px] font-bold uppercase tracking-wide"
                  style={
                    opportunity.status === st
                      ? { background: color, color: "#fff" }
                      : { color }
                  }
                  onClick={async () => {
                    await updateOpportunityStatus(id, st);
                    await load();
                    await reload();
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
                  await setOpportunityFocus(
                    id,
                    opportunity.objective_id,
                    !opportunity.is_focus
                  );
                  await load();
                  await reload();
                }}
              >
                {opportunity.is_focus ? "★ Em foco" : "Marcar ★"}
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-4">
            <section>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                Evidências
              </div>
              <div className="space-y-2">
                {evidences.map((e) => (
                  <p key={e.id} className="text-[15px] leading-snug">
                    {e.body}
                  </p>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-[13px] font-bold text-[var(--rm-muted-2)]"
                onClick={async () => {
                  const body = window.prompt("Nova evidência");
                  if (!body) return;
                  await addEvidence(id, body);
                  await load();
                }}
              >
                + evidência
              </button>
            </section>

            <section>
              <div className="mb-1 flex items-baseline">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                  Soluções
                </div>
                <div className="ml-auto text-[12px] text-[var(--rm-muted-2)]">
                  compare ao menos 3
                </div>
              </div>
              <div className="space-y-2">
                {solutions.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/solucoes/${s.id}`}
                    className="flex items-center gap-2 rounded-[10px] border border-[var(--rm-line-soft)] px-3 py-2 hover:bg-[var(--rm-panel)]"
                  >
                    <span className="text-[12px] font-bold text-[var(--rm-muted)]">
                      #{i + 1}
                    </span>
                    <span className="flex-1 font-semibold">{s.title}</span>
                    {s.is_focus && <span style={{ color }}>★</span>}
                    <span className="text-[11px] font-bold uppercase text-[var(--rm-muted)]">
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {opportunity.success_signal && (
              <section>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                  Sinal de sucesso
                </div>
                <p className="text-[15px]">{opportunity.success_signal}</p>
              </section>
            )}
          </div>

          <div
            className="mt-2 flex gap-5 border-t border-dashed border-[var(--rm-line)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ color }}
          >
            <span>
              Criado
              <br />
              <span className="text-[var(--rm-muted-2)]">
                {new Date(opportunity.created_at).toLocaleDateString("pt-BR")}
              </span>
            </span>
            <span>
              {solutions.length} soluções
              <br />
              <span className="text-[var(--rm-muted-2)]">ativas na árvore</span>
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-3 px-1">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
          Diário
        </div>
        {diary.map((d) => (
          <div key={d.id} className="text-[14px] leading-relaxed">
            <span className="font-bold">
              {new Date(d.created_at).toLocaleDateString("pt-BR")}
            </span>{" "}
            · {d.body}
          </div>
        ))}
        <button
          type="button"
          className="text-[13px] font-bold text-[var(--rm-muted-2)]"
          onClick={async () => {
            const body = window.prompt("Escrever uma atualização…");
            if (!body) return;
            await addDiary(id, body);
            await load();
          }}
        >
          Escrever uma atualização…
        </button>
      </section>
    </div>
  );
}

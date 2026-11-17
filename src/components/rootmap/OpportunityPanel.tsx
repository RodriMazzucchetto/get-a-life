"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineEditable } from "@/components/rootmap/InlineEditable";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import { useRootmapModal } from "@/hooks/useRootmapModal";
import {
  addDiary,
  addEvidence,
  createSolution,
  fetchOpportunityExtras,
  setOpportunityFocus,
  updateOpportunity,
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

export function OpportunityPanel({ id }: { id: string }) {
  const { tree, reload, patchOpportunity } = useRootmapTree();
  const { open } = useRootmapModal();

  const fromTree = useMemo(() => {
    for (const ob of tree) {
      const opp = ob.opportunities.find((o) => o.id === id);
      if (opp) {
        return {
          objective: ob,
          opportunity: opp as RmOpportunity,
          solutions: opp.solutions as RmSolution[],
        };
      }
    }
    return null;
  }, [tree, id]);

  const [opportunity, setOpportunity] = useState<RmOpportunity | null>(
    fromTree?.opportunity ?? null
  );
  const [solutions, setSolutions] = useState<RmSolution[]>(
    fromTree?.solutions ?? []
  );
  const [evidences, setEvidences] = useState<RmEvidence[]>([]);
  const [diary, setDiary] = useState<RmDiaryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extrasLoading, setExtrasLoading] = useState(true);

  // Mantém sync com a árvore em memória (abre instantâneo)
  useEffect(() => {
    if (!fromTree) return;
    setOpportunity(fromTree.opportunity);
    setSolutions(fromTree.solutions);
  }, [fromTree]);

  // Só busca evidências/diário (leve)
  useEffect(() => {
    let cancelled = false;
    setExtrasLoading(true);
    void fetchOpportunityExtras(id)
      .then((extras) => {
        if (cancelled) return;
        setEvidences(extras.evidences);
        setDiary(extras.diary);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro");
        }
      })
      .finally(() => {
        if (!cancelled) setExtrasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const objective = fromTree?.objective;

  async function saveField(patch: {
    title?: string;
    description?: string | null;
    success_signal?: string | null;
  }) {
    if (!opportunity || saving) return;
    setSaving(true);
    try {
      const updated = await updateOpportunity(id, patch);
      setOpportunity(updated);
      patchOpportunity(id, updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (error && !opportunity) return <p className="text-red-700">{error}</p>;
  if (!opportunity || !objective) {
    return <p className="rm-muted">A carregar…</p>;
  }

  const color = objective.color;

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
              <InlineEditable
                as="h1"
                value={opportunity.title}
                className="rm-display text-[32px] font-extrabold leading-tight"
                placeholder="Título do problema / oportunidade"
                onCommit={async (next) => {
                  if (!next || next === opportunity.title) return;
                  await saveField({ title: next });
                }}
              />
              <InlineEditable
                as="p"
                multiline
                value={opportunity.description ?? ""}
                className="text-[16px] leading-relaxed text-[#2e2a24]"
                placeholder="Descrição (opcional) — clique para editar"
                onCommit={async (next) => {
                  const prev = opportunity.description ?? "";
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
                    opportunity.status === st
                      ? { background: color, color: "#fff" }
                      : { color }
                  }
                  onClick={async () => {
                    await updateOpportunityStatus(id, st);
                    setOpportunity((o) => (o ? { ...o, status: st } : o));
                    patchOpportunity(id, { status: st });
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
                  const next = !opportunity.is_focus;
                  await setOpportunityFocus(
                    id,
                    opportunity.objective_id,
                    next
                  );
                  // Um foco por objetivo — soft reload só a árvore
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
              {extrasLoading && evidences.length === 0 ? (
                <p className="text-[13px] text-[var(--rm-muted-2)]">…</p>
              ) : (
                <div className="space-y-2">
                  {evidences.map((e) => (
                    <p key={e.id} className="text-[15px] leading-snug">
                      {e.body}
                    </p>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="mt-2 text-[13px] font-bold text-[var(--rm-muted-2)]"
                onClick={async () => {
                  const body = window.prompt("Nova evidência");
                  if (!body) return;
                  await addEvidence(id, body);
                  const extras = await fetchOpportunityExtras(id);
                  setEvidences(extras.evidences);
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
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => open("sol", s.id)}
                    className="flex w-full items-center gap-2 rounded-[10px] border border-[var(--rm-line-soft)] px-3 py-2 text-left hover:bg-[var(--rm-panel)]"
                  >
                    <span className="text-[12px] font-bold text-[var(--rm-muted)]">
                      #{i + 1}
                    </span>
                    <span className="flex-1 font-semibold">{s.title}</span>
                    {s.is_focus && <span style={{ color }}>★</span>}
                    <span className="text-[11px] font-bold uppercase text-[var(--rm-muted)]">
                      {s.status}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-[13px] font-bold text-[var(--rm-muted-2)]"
                onClick={async () => {
                  const t = window.prompt("Nova solução");
                  if (!t?.trim()) return;
                  const created = await createSolution({
                    opportunity_id: id,
                    title: t.trim(),
                  });
                  await reload();
                  open("sol", created.id);
                }}
              >
                + solução
              </button>
            </section>

            <section>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted-2)]">
                Sinal de sucesso
              </div>
              <InlineEditable
                as="p"
                multiline
                value={opportunity.success_signal ?? ""}
                className="text-[15px]"
                placeholder="Como saberemos que o problema foi resolvido?"
                onCommit={async (next) => {
                  const prev = opportunity.success_signal ?? "";
                  if (next === prev) return;
                  await saveField({ success_signal: next || null });
                }}
              />
            </section>
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
            {saving && (
              <span className="ml-auto self-center normal-case tracking-normal text-[var(--rm-muted)]">
                Salvando…
              </span>
            )}
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
            const extras = await fetchOpportunityExtras(id);
            setDiary(extras.diary);
          }}
        >
          Escrever uma atualização…
        </button>
      </section>
    </div>
  );
}

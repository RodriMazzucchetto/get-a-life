"use client";

import { useEffect, useMemo, useState } from "react";
import { RootmapOverlay } from "./RootmapOverlay";
import {
  createObjective,
  createOpportunity,
  deleteObjective,
  deleteOpportunity,
  updateObjective,
} from "@/lib/rootmap/queries";
import type { TreeObjective } from "@/lib/rootmap/types";

const COLOR_PRESETS: { color: string; soft: string; label: string }[] = [
  {
    label: "Vermelho",
    color: "oklch(0.55 0.2 28)",
    soft: "oklch(0.94 0.04 28)",
  },
  {
    label: "Roxo",
    color: "oklch(0.5 0.18 295)",
    soft: "oklch(0.94 0.04 295)",
  },
  {
    label: "Azul",
    color: "oklch(0.5 0.14 245)",
    soft: "oklch(0.94 0.03 245)",
  },
  {
    label: "Verde",
    color: "oklch(0.5 0.13 150)",
    soft: "oklch(0.94 0.04 150)",
  },
  {
    label: "Âmbar",
    color: "oklch(0.62 0.14 75)",
    soft: "oklch(0.95 0.04 75)",
  },
];

type DraftOpp = { key: string; id?: string; title: string; existing?: boolean };

export function ObjectiveEditorModal({
  mode,
  objective,
  nextPos,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  objective?: TreeObjective | null;
  nextPos: number;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [opps, setOpps] = useState<DraftOpp[]>([]);
  const [newOpp, setNewOpp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && objective) {
      setTag(objective.tag);
      setTitle(objective.title);
      setDescription(objective.description ?? "");
      setMetric(objective.metric ?? "");
      const idx = COLOR_PRESETS.findIndex((c) => c.color === objective.color);
      setColorIdx(idx >= 0 ? idx : 0);
      setOpps(
        objective.opportunities.map((o) => ({
          key: o.id,
          id: o.id,
          title: o.title,
          existing: true,
        }))
      );
    } else {
      setTag("");
      setTitle("");
      setDescription("");
      setMetric("");
      setColorIdx(0);
      setOpps([]);
    }
    setNewOpp("");
    setError(null);
  }, [mode, objective]);

  const preset = COLOR_PRESETS[colorIdx] ?? COLOR_PRESETS[0];

  const canSave = useMemo(
    () => tag.trim().length > 0 && title.trim().length > 0,
    [tag, title]
  );

  function addOppDraft() {
    const t = newOpp.trim();
    if (!t) return;
    setOpps((list) => [
      ...list,
      { key: `new-${Date.now()}-${list.length}`, title: t },
    ]);
    setNewOpp("");
  }

  async function save() {
    if (!canSave || busy) return;
    setBusy(true);
    setError(null);
    try {
      const company = tag.trim().toUpperCase().slice(0, 8);
      if (mode === "create") {
        const created = await createObjective({
          tag: company,
          title: title.trim(),
          description: description.trim() || null,
          metric: metric.trim() || undefined,
          color: preset.color,
          soft_color: preset.soft,
          pos: nextPos,
        });
        for (let i = 0; i < opps.length; i++) {
          await createOpportunity({
            objective_id: created.id,
            title: opps[i].title,
            is_focus: i === 0,
            pos: (i + 1) * 1000,
          });
        }
      } else if (objective) {
        await updateObjective(objective.id, {
          tag: company,
          title: title.trim(),
          description: description.trim() || null,
          metric: metric.trim() || null,
          color: preset.color,
          soft_color: preset.soft,
        });
        const fresh = opps.filter((o) => !o.existing);
        for (let i = 0; i < fresh.length; i++) {
          await createOpportunity({
            objective_id: objective.id,
            title: fresh[i].title,
            pos: (objective.opportunities.length + i + 1) * 1000,
          });
        }
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!objective) return;
    if (
      !window.confirm(
        `Remover o objetivo “${objective.title}” e toda a árvore (problemas, soluções e tasks)?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteObjective(objective.id);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setBusy(false);
    }
  }

  async function removeOpp(draft: DraftOpp) {
    if (draft.existing && draft.id) {
      if (
        !window.confirm(
          `Remover o problema “${draft.title}” e suas soluções/tasks?`
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        await deleteOpportunity(draft.id);
        setOpps((list) => list.filter((o) => o.key !== draft.key));
        await onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover problema");
      } finally {
        setBusy(false);
      }
      return;
    }
    setOpps((list) => list.filter((o) => o.key !== draft.key));
  }

  return (
    <RootmapOverlay
      backLabel="Voltar"
      onClose={onClose}
      width={560}
    >
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="rm-display text-[32px] font-extrabold leading-tight">
            {mode === "create" ? "Nova árvore" : "Editar objetivo"}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--rm-muted)]">
            Empresa, outcome e os primeiros problemas da árvore.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Empresa
          </span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            maxLength={8}
            placeholder="Ex: KMN"
            className="rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2.5 text-[15px] font-bold uppercase outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Nome do objetivo
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O outcome que importa"
            className="rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2.5 text-[15px] font-semibold outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Descrição
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Contexto do objetivo (opcional)"
            className="resize-y rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2.5 text-[14px] outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Métrica
          </span>
          <input
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="Ex: Pedidos/mês: 18 → 60"
            className="rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2.5 text-[14px] outline-none"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Cor
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c, i) => (
              <button
                key={c.color}
                type="button"
                onClick={() => setColorIdx(i)}
                className="h-9 w-9 rounded-full border-2 border-[var(--rm-ink)]"
                style={{
                  background: c.color,
                  boxShadow:
                    colorIdx === i ? `3px 3px 0 var(--rm-ink)` : undefined,
                }}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Problemas / oportunidades
          </span>
          <div className="space-y-2">
            {opps.map((o) => (
              <div
                key={o.key}
                className="flex items-start gap-2 rounded-[10px] border border-[var(--rm-line)] bg-[var(--rm-card)] px-3 py-2"
              >
                <span className="mt-0.5 text-[12px] font-bold text-[var(--rm-muted)]">
                  P
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
                  {o.title}
                </span>
                <button
                  type="button"
                  className="text-[12px] font-bold text-[var(--rm-muted)] hover:text-[oklch(0.5_0.18_25)]"
                  disabled={busy}
                  onClick={() => void removeOpp(o)}
                >
                  Remover
                </button>
              </div>
            ))}
            {opps.length === 0 && (
              <p className="text-[13px] text-[var(--rm-muted)]">
                Ainda sem problemas nesta árvore.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newOpp}
              onChange={(e) => setNewOpp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOppDraft();
                }
              }}
              placeholder="Novo problema / oportunidade"
              className="min-w-0 flex-1 rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2 text-[14px] outline-none"
            />
            <button
              type="button"
              className="rm-btn rm-btn-ghost rounded-[10px]"
              onClick={addOppDraft}
            >
              + Add
            </button>
          </div>
        </div>

        {error && <p className="text-[14px] text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            className="rm-btn"
            style={{ background: preset.color }}
            disabled={!canSave || busy}
            onClick={() => void save()}
          >
            {busy ? "Salvando…" : mode === "create" ? "Criar árvore" : "Salvar"}
          </button>
          <button
            type="button"
            className="rm-btn rm-btn-ghost"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          {mode === "edit" && (
            <button
              type="button"
              className="rm-btn rm-btn-ghost ml-auto"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remover objetivo
            </button>
          )}
        </div>
      </div>
    </RootmapOverlay>
  );
}

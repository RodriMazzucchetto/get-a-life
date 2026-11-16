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
import type { RmCompany, TreeObjective } from "@/lib/rootmap/types";

type DraftOpp = { key: string; id?: string; title: string; existing?: boolean };

export function ObjectiveEditorModal({
  mode,
  objective,
  companies,
  takenCompanyIds = [],
  nextPos,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  objective?: TreeObjective | null;
  companies: RmCompany[];
  /** Empresas que já têm objetivo (excluídas no create; no edit mantém a atual). */
  takenCompanyIds?: string[];
  nextPos: number;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [opps, setOpps] = useState<DraftOpp[]>([]);
  const [newOpp, setNewOpp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    const taken = new Set(takenCompanyIds);
    return companies.filter((c) => {
      if (mode === "edit" && objective?.company_id === c.id) return true;
      return !taken.has(c.id);
    });
  }, [companies, takenCompanyIds, mode, objective?.company_id]);

  // Sync lista de problemas com o objetivo atual (após reload soft).
  // Campos editáveis só reiniciam quando muda o id do objetivo / modo.
  const objectiveId = objective?.id ?? null;
  const opportunitySig = objective
    ? objective.opportunities.map((o) => o.id).join(",")
    : "";

  useEffect(() => {
    if (mode === "edit" && objective) {
      setCompanyId(objective.company_id ?? "");
      setTitle(objective.title);
      setDescription(objective.description ?? "");
      setMetric(objective.metric ?? "");
      setNewOpp("");
      setError(null);
    } else if (mode === "create") {
      setCompanyId("");
      setTitle("");
      setDescription("");
      setMetric("");
      setOpps([]);
      setNewOpp("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar de objetivo
  }, [mode, objectiveId]);

  useEffect(() => {
    if (mode !== "edit" || !objective) return;
    setOpps(
      objective.opportunities.map((o) => ({
        key: o.id,
        id: o.id,
        title: o.title,
        existing: true,
      }))
    );
  }, [mode, objectiveId, opportunitySig, objective]);

  const selected = companies.find((c) => c.id === companyId) ?? null;

  const canSave = useMemo(
    () => Boolean(companyId) && title.trim().length > 0,
    [companyId, title]
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
    if (!canSave || busy || !companyId) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        const created = await createObjective({
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          metric: metric.trim() || undefined,
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
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          metric: metric.trim() || null,
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
      setError(null);
      // Optimistic: some da lista já; se falhar, o sync do objective restaura
      setOpps((list) => list.filter((o) => o.key !== draft.key));
      try {
        await deleteOpportunity(draft.id);
        await onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover problema");
        await onSaved();
      } finally {
        setBusy(false);
      }
      return;
    }
    setOpps((list) => list.filter((o) => o.key !== draft.key));
  }

  return (
    <RootmapOverlay backLabel="Voltar" onClose={onClose} width={560}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="rm-display text-[32px] font-extrabold leading-tight">
            {mode === "create" ? "Nova árvore" : "Editar objetivo"}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--rm-muted)]">
            Escolha a empresa e defina o outcome. Empresas se gerem em
            Configurações.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
            Empresa
          </span>
          {selectable.length === 0 ? (
            <p className="rounded-[10px] border-2 border-dashed border-[var(--rm-line)] px-3 py-3 text-[14px] text-[var(--rm-muted)]">
              {companies.length === 0
                ? "Nenhuma empresa cadastrada. Vá em Configurações e adicione uma."
                : "Todas as empresas já têm objetivo. Adicione outra em Configurações."}
            </p>
          ) : (
            <div className="relative">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full appearance-none rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-3 py-2.5 pr-10 text-[15px] font-bold outline-none"
              >
                <option value="">Selecionar empresa…</option>
                {selectable.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tag}
                    {c.name ? ` — ${c.name}` : ""}
                  </option>
                ))}
              </select>
              {selected && (
                <span
                  className="pointer-events-none absolute right-10 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
                  style={{ background: selected.color }}
                />
              )}
            </div>
          )}
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
            style={{ background: selected?.color ?? "var(--rm-ink)" }}
            disabled={!canSave || busy || selectable.length === 0}
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

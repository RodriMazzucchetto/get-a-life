"use client";

import { useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRootmapTree } from "@/contexts/RootmapTreeContext";
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/lib/rootmap/queries";
import type { RmCompany } from "@/lib/rootmap/types";

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
    soft: "oklch(0.94 0.035 245)",
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

type Draft = {
  id?: string;
  tag: string;
  name: string;
  colorIdx: number;
};

function emptyDraft(): Draft {
  return { tag: "", name: "", colorIdx: 0 };
}

function draftFrom(c: RmCompany): Draft {
  const idx = COLOR_PRESETS.findIndex((p) => p.color === c.color);
  return {
    id: c.id,
    tag: c.tag,
    name: c.name ?? "",
    colorIdx: idx >= 0 ? idx : 0,
  };
}

export default function ConfigPage() {
  const { user } = useAuthContext();
  const { companies, tree, loading, error, reload } = useRootmapTree();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const objectiveCountByCompany = useMemo(() => {
    const m = new Map<string, number>();
    for (const ob of tree) {
      if (!ob.company_id) continue;
      m.set(ob.company_id, (m.get(ob.company_id) ?? 0) + 1);
    }
    return m;
  }, [tree]);

  async function save() {
    if (!editing) return;
    const tag = editing.tag.trim().toUpperCase();
    if (!tag) {
      setFormError("Informe a tag da empresa.");
      return;
    }
    const preset = COLOR_PRESETS[editing.colorIdx] ?? COLOR_PRESETS[0];
    setBusy(true);
    setFormError(null);
    try {
      if (editing.id) {
        await updateCompany(editing.id, {
          tag,
          name: editing.name.trim() || null,
          color: preset.color,
          soft_color: preset.soft,
        });
      } else {
        await createCompany({
          tag,
          name: editing.name.trim() || null,
          color: preset.color,
          soft_color: preset.soft,
          pos: (companies.length + 1) * 1000,
        });
      }
      setEditing(null);
      await reload({ companies: true });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: RmCompany) {
    const n = objectiveCountByCompany.get(c.id) ?? 0;
    if (n > 0) {
      window.alert(
        `“${c.tag}” tem ${n} objetivo(s). Remova o objetivo antes de excluir a empresa.`
      );
      return;
    }
    if (!window.confirm(`Remover a empresa “${c.tag}”?`)) return;
    setBusy(true);
    try {
      await deleteCompany(c.id);
      await reload({ companies: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="rm-display text-[36px] font-extrabold">Configurações</h1>
        <p className="mt-2 text-[15px] text-[var(--rm-muted)]">
          Conta: <strong>{user?.email}</strong>
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h2 className="rm-display text-[24px] font-bold">Empresas</h2>
            <p className="text-[14px] text-[var(--rm-muted)]">
              Tag, nome e cor. Usadas no seletor ao criar/editar objetivos.
            </p>
          </div>
          <button
            type="button"
            className="rm-btn ml-auto"
            disabled={busy}
            onClick={() => {
              setFormError(null);
              setEditing(emptyDraft());
            }}
          >
            + Empresa
          </button>
        </div>

        {loading && <p className="rm-muted">A carregar…</p>}
        {error && <p className="text-red-700">{error}</p>}

        <div className="flex flex-col gap-2">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-[12px] border-2 border-[var(--rm-ink)] bg-[var(--rm-card)] px-4 py-3"
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-[var(--rm-ink)]"
                style={{ background: c.color }}
              />
              <span className="text-[15px] font-extrabold">{c.tag}</span>
              {c.name && (
                <span className="text-[14px] text-[var(--rm-muted)]">
                  {c.name}
                </span>
              )}
              <span className="ml-auto text-[12px] font-bold text-[var(--rm-muted)]">
                {objectiveCountByCompany.get(c.id) ?? 0} obj.
              </span>
              <button
                type="button"
                className="text-[13px] font-bold hover:underline"
                disabled={busy}
                onClick={() => {
                  setFormError(null);
                  setEditing(draftFrom(c));
                }}
              >
                Editar
              </button>
              <button
                type="button"
                className="text-[13px] font-bold text-[var(--rm-muted)] hover:text-[oklch(0.5_0.18_25)]"
                disabled={busy}
                onClick={() => void remove(c)}
              >
                Remover
              </button>
            </div>
          ))}
          {!loading && companies.length === 0 && (
            <p className="text-[14px] text-[var(--rm-muted)]">
              Nenhuma empresa ainda.
            </p>
          )}
        </div>

        {editing && (
          <div className="rm-card space-y-4 p-5">
            <h3 className="rm-display text-[20px] font-bold">
              {editing.id ? "Editar empresa" : "Nova empresa"}
            </h3>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                Tag
              </span>
              <input
                value={editing.tag}
                onChange={(e) =>
                  setEditing((d) =>
                    d ? { ...d, tag: e.target.value } : d
                  )
                }
                maxLength={8}
                placeholder="Ex: KMN"
                className="rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-panel)] px-3 py-2.5 text-[15px] font-bold uppercase outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                Nome
              </span>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing((d) =>
                    d ? { ...d, name: e.target.value } : d
                  )
                }
                placeholder="Ex: KimonoLab"
                className="rounded-[10px] border-2 border-[var(--rm-ink)] bg-[var(--rm-panel)] px-3 py-2.5 text-[15px] outline-none"
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rm-muted)]">
                Cor
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p, i) => (
                  <button
                    key={p.color}
                    type="button"
                    title={p.label}
                    aria-label={p.label}
                    onClick={() =>
                      setEditing((d) => (d ? { ...d, colorIdx: i } : d))
                    }
                    className="h-9 w-9 rounded-full border-2 border-[var(--rm-ink)]"
                    style={{
                      background: p.color,
                      boxShadow:
                        editing.colorIdx === i
                          ? "3px 3px 0 var(--rm-ink)"
                          : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
            {formError && (
              <p className="text-[14px] text-red-700">{formError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rm-btn"
                style={{
                  background:
                    COLOR_PRESETS[editing.colorIdx]?.color ?? "var(--rm-ink)",
                }}
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                className="rm-btn rm-btn-ghost"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

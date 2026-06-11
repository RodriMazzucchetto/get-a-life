"use client";

import { useEffect, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { OS_BLOCK_DOT_COLORS, OS_BLOCK_LABELS, OS_BLOCK_TYPES } from "@/lib/os-queries";
import type { OsBetRow, OsBlockType } from "@/lib/os-types";

export interface PitchBlockGoal {
  id: string;
  title: string;
}

export interface PitchFormData {
  blockType: OsBlockType;
  title: string;
  pitchOutcome: string;
  pitchData: string;
  executionOwner: string;
}

interface PitchModalProps {
  open: boolean;
  onClose: () => void;
  pitch: OsBetRow | null;
  initialBlockType?: OsBlockType;
  blockGoals: Record<OsBlockType, PitchBlockGoal | null>;
  onSave: (data: PitchFormData) => Promise<void>;
  onDelete?: (pitchId: string) => Promise<void>;
  saving: boolean;
}

const EMPTY_FORM: PitchFormData = {
  blockType: "finance",
  title: "",
  pitchOutcome: "",
  pitchData: "",
  executionOwner: "",
};

export function PitchModal({
  open,
  onClose,
  pitch,
  initialBlockType,
  blockGoals,
  onSave,
  onDelete,
  saving,
}: PitchModalProps) {
  const [form, setForm] = useState<PitchFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const isEditing = pitch !== null;

  useEffect(() => {
    if (!open) return;

    if (pitch) {
      setForm({
        blockType: initialBlockType ?? "finance",
        title: pitch.title,
        pitchOutcome: pitch.pitch_outcome ?? "",
        pitchData: pitch.pitch_data ?? "",
        executionOwner: pitch.execution_owner ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        blockType: initialBlockType ?? "finance",
      });
    }
    setError(null);
  }, [open, pitch, initialBlockType]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Informe a ideia do pitch.");
      return;
    }

    const goal = blockGoals[form.blockType];
    if (!goal) {
      setError("Defina uma meta ativa para este pilar na página OS antes de criar pitches.");
      return;
    }

    setError(null);
    await onSave(form);
  };

  const handleDelete = async () => {
    if (!pitch || !onDelete) return;
    if (!window.confirm("Excluir este pitch permanentemente?")) return;
    await onDelete(pitch.id);
  };

  if (!open) return null;

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <div
        data-modal-content
        role="dialog"
        aria-modal="true"
        aria-labelledby="pitch-modal-title"
        className="pointer-events-auto relative z-[1] mx-auto max-h-[min(92dvh,56rem)] w-full max-w-2xl overflow-y-auto overscroll-contain border-2 border-black bg-white font-mono shadow-none [scrollbar-gutter:stable]"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b-2 border-black px-6 py-5 text-center">
          <h2 id="pitch-modal-title" className="text-xl font-bold uppercase tracking-[0.12em]">
            {isEditing ? "EDIT PITCH" : "SUBMIT PITCH"}
          </h2>
          {!isEditing ? (
            <p className="mt-3 text-left text-xs font-bold normal-case leading-relaxed">
              <span className="uppercase">Non-negotiable rule:</span> The Decision Pitch Worksheet
              must be completed in full. If you can&apos;t clearly articulate the idea, the execution
              plan, and why it matters, the conversation stops here.
            </p>
          ) : null}
        </div>

        <div className="space-y-8 px-6 py-6 normal-case">
          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide">
              What&apos;s your pitch idea?
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full border-2 border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-black/[0.03]"
              placeholder=""
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase tracking-wide">
              Which goal does this move us meaningfully toward?
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {OS_BLOCK_TYPES.map((blockType) => {
                const selected = form.blockType === blockType;
                const goal = blockGoals[blockType];
                return (
                  <div key={blockType} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, blockType }))}
                      className={`flex items-center gap-2 border-2 border-black px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide transition-colors ${
                        selected ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        aria-hidden
                      >
                        {selected ? "check_box" : "check_box_outline_blank"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: OS_BLOCK_DOT_COLORS[blockType] }}
                          aria-hidden
                        />
                        {OS_BLOCK_LABELS[blockType]}
                      </span>
                    </button>
                    <p className="mt-1.5 px-1 text-xs font-bold normal-case text-black/70">
                      {goal?.title ?? "Meta não definida"}
                    </p>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <hr className="border-black" />

          <label className="block">
            <span className="mb-1 block text-sm font-bold uppercase tracking-wide">
              Measurable impact / outcome
            </span>
            <p className="mb-2 text-xs text-black/70">
              What changes? What will be true and complete when this is done? Think revenue,
              efficiency, customer experience, margin, throughput, etc.
            </p>
            <textarea
              rows={4}
              value={form.pitchOutcome}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, pitchOutcome: event.target.value }))
              }
              className="w-full border-2 border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-black/[0.03]"
              placeholder="Specific, quantifiable goals"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold uppercase tracking-wide">
              Objective data
            </span>
            <p className="mb-2 text-xs text-black/70">
              What hard data supports this pitch? Include metrics, trends, costs, usage, failure
              points, customer input, etc. If no data exists, explain how you&apos;ll validate the
              idea before executing.
            </p>
            <textarea
              rows={4}
              value={form.pitchData}
              onChange={(event) => setForm((prev) => ({ ...prev, pitchData: event.target.value }))}
              className="w-full border-2 border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-black/[0.03]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold uppercase tracking-wide">
              Execution owner
            </span>
            <p className="mb-2 text-xs text-black/70">
              Who is responsible for executing this if approved? All team members listed must agree
              to take it on.
            </p>
            <select
              value={form.executionOwner}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, executionOwner: event.target.value }))
              }
              className="w-full border-2 border-black bg-black px-3 py-2.5 text-sm font-bold text-white outline-none"
            >
              <option value="">Execution owner</option>
              <option value="self">Eu (responsável)</option>
              <option value="team">Equipa</option>
              <option value="external">Externo</option>
            </select>
          </label>

          <div>
            <span className="mb-1 block text-sm font-bold uppercase tracking-wide">
              Optional attachments
            </span>
            <p className="mb-2 text-xs text-black/70">
              Slides, spreadsheets, screenshots, research, visuals/images, supporting documentation.
            </p>
            <div className="border-2 border-dashed border-black/40 px-4 py-8 text-center text-xs text-black/50">
              Upload em breve
            </div>
          </div>

          {error ? <p className="text-sm font-bold text-[#FF0000]">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
                className="border-2 border-[#FF0000] px-4 py-2 text-sm font-bold uppercase text-[#FF0000] hover:bg-[#FF0000]/5 disabled:opacity-50"
              >
                Excluir
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="border-2 border-black px-4 py-2 text-sm font-bold uppercase hover:bg-black/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white hover:bg-black/85 disabled:opacity-50"
              >
                {saving ? "Salvando..." : isEditing ? "Salvar" : "Submeter pitch"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

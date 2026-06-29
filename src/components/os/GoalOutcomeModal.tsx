"use client";

import { useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { OS_CYAN, OS_RED, getGoalOutcomeColor, type OsGoalOutcome } from "@/lib/os-queries";
import type { OsGoalRow } from "@/lib/os-types";

const OUTCOME_OPTIONS: { value: OsGoalOutcome; label: string; color: string }[] = [
  { value: "achieved", label: "ACHIEVED", color: OS_CYAN },
  { value: "abandoned", label: "ABANDONED", color: OS_RED },
];

interface GoalOutcomeModalProps {
  open: boolean;
  onClose: () => void;
  goal: OsGoalRow;
  onSubmit: (data: { outcome: OsGoalOutcome; note: string }) => Promise<void>;
  saving: boolean;
}

export function GoalOutcomeModal({
  open,
  onClose,
  goal,
  onSubmit,
  saving,
}: GoalOutcomeModalProps) {
  const [outcome, setOutcome] = useState<OsGoalOutcome>("achieved");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);
    try {
      await onSubmit({ outcome, note });
      setNote("");
      setOutcome("achieved");
      onClose();
    } catch {
      setError("Não foi possível concluir a meta.");
    }
  };

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <div
        data-modal-content
        className="pointer-events-auto relative z-[1] mx-auto w-full max-w-lg border border-ta-rule-2 bg-ta-paper font-sans shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ta-ink px-5 py-4 text-ta-paper">
          <h2 className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]">
            Concluir meta
          </h2>
          <p className="mt-1.5 font-sans text-xs text-ta-paper/70">{goal.title}</p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <fieldset>
            <legend className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
              Resultado
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setOutcome(option.value)}
                  className={`border px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    outcome === option.value
                      ? "border-ta-ink text-white"
                      : "border-ta-rule-2 bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
                  }`}
                  style={outcome === option.value ? { backgroundColor: option.color } : undefined}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11px] text-ta-muted">
              A meta sai da prioridade e vai para o backlog como concluída.
            </p>
          </fieldset>

          <label className="block">
            <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
              Nota de conclusão (opcional)
            </span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="O que foi alcançado ou por que foi abandonada?"
              className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2.5 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink"
            />
          </label>

          {error ? <p className="font-sans text-sm font-semibold text-ta-red">{error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ta-rule-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-ta-rule-2 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-ink transition-colors hover:bg-ta-paper-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="border px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-ink transition-colors hover:opacity-90 disabled:opacity-50"
              style={{
                borderColor: getGoalOutcomeColor(outcome),
                backgroundColor: getGoalOutcomeColor(outcome),
                color: "#fff",
              }}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

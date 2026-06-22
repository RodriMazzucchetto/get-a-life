"use client";

import { useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { OS_CYAN, OS_GREEN, OS_RED, OS_YELLOW, currentWeekStartDate } from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateStatus } from "@/lib/os-types";

const UPDATE_STATUS_OPTIONS: { value: OsBetUpdateStatus; label: string; color: string }[] = [
  { value: "on_course", label: "ON COURSE", color: OS_GREEN },
  { value: "deviating", label: "DEVIATING", color: OS_YELLOW },
  { value: "executed", label: "EXECUTED", color: OS_CYAN },
  { value: "failed", label: "FAILED", color: OS_RED },
];

interface WeeklyUpdateModalProps {
  open: boolean;
  onClose: () => void;
  pitch: OsBetRow;
  onSubmit: (data: {
    status: OsBetUpdateStatus;
    whatDone: string;
    blockers: string;
  }) => Promise<void>;
  saving: boolean;
}

export function WeeklyUpdateModal({
  open,
  onClose,
  pitch,
  onSubmit,
  saving,
}: WeeklyUpdateModalProps) {
  const [status, setStatus] = useState<OsBetUpdateStatus>("on_course");
  const [whatDone, setWhatDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!whatDone.trim()) {
      setError("Descreva o que foi feito esta semana.");
      return;
    }
    setError(null);
    try {
      await onSubmit({ status, whatDone, blockers });
      setWhatDone("");
      setBlockers("");
      setStatus("on_course");
      onClose();
    } catch {
      setError("Não foi possível salvar o weekly update.");
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
            Weekly update
          </h2>
          <p className="mt-1.5 font-sans text-xs text-ta-paper/70">{pitch.title}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ta-paper/40">
            Semana de {currentWeekStartDate()}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <fieldset>
            <legend className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
              Status
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {UPDATE_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`border px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    status === option.value
                      ? "border-ta-ink text-white"
                      : "border-ta-rule-2 bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
                  }`}
                  style={status === option.value ? { backgroundColor: option.color } : undefined}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
              O que foi feito?
            </span>
            <textarea
              rows={3}
              value={whatDone}
              onChange={(e) => setWhatDone(e.target.value)}
              className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2.5 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted">
              Blockers (opcional)
            </span>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2.5 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink"
            />
          </label>

          {error ? <p className="font-sans text-sm font-semibold text-ta-red">{error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ta-rule-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="border border-ta-rule-2 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-ink transition-colors hover:bg-ta-paper-2 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="border border-ta-ink bg-ta-ink px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-paper transition-colors hover:bg-ta-ink/90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar update"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

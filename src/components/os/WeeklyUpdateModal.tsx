"use client";

import { useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { OS_CYAN, OS_RED, OS_YELLOW, currentWeekStartDate } from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateStatus } from "@/lib/os-types";

const UPDATE_STATUS_OPTIONS: { value: OsBetUpdateStatus; label: string; color: string }[] = [
  { value: "on_course", label: "ON COURSE", color: OS_CYAN },
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
        className="pointer-events-auto relative z-[1] mx-auto w-full max-w-lg border-2 border-black bg-white font-mono"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-black px-5 py-4">
          <h2 className="text-lg font-bold uppercase tracking-wide">Weekly update</h2>
          <p className="mt-1 text-xs font-bold normal-case text-black/60">{pitch.title}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-black/40">
            Semana de {currentWeekStartDate()}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 normal-case">
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide">Status</legend>
            <div className="grid grid-cols-2 gap-2">
              {UPDATE_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`border-2 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
                    status === option.value
                      ? "border-black text-white"
                      : "border-black/30 bg-white text-black hover:bg-black/[0.03]"
                  }`}
                  style={status === option.value ? { backgroundColor: option.color } : undefined}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide">
              O que foi feito?
            </span>
            <textarea
              rows={3}
              value={whatDone}
              onChange={(e) => setWhatDone(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-sm outline-none focus:bg-black/[0.03]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide">
              Blockers (opcional)
            </span>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 text-sm outline-none focus:bg-black/[0.03]"
            />
          </label>

          {error ? <p className="text-sm font-bold text-[#FF0000]">{error}</p> : null}

          <div className="flex justify-end gap-2 border-t-2 border-black pt-4">
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
              {saving ? "Salvando..." : "Salvar update"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

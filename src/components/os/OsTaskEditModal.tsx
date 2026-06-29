"use client";

import { useEffect, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import { ProjectIdsPicker } from "@/components/ProjectIdsPicker";
import type { OsProjectOption } from "@/lib/os-queries";
import type { OsTaskRow } from "@/lib/os-types";
import { computeOsTaskScore } from "@/lib/osBoardHelpers";
import { osBtnGhost, osBtnPrimary, osInput, osLabelMuted } from "@/lib/os-ui";

interface OsTaskEditModalProps {
  open: boolean;
  task: OsTaskRow | null;
  projects: OsProjectOption[];
  onClose: () => void;
  onSave: (
    taskId: string,
    data: {
      title: string;
      description: string;
      importance: number | null;
      urgency: number | null;
      effort: number | null;
      projectIds: string[];
    }
  ) => Promise<void>;
}

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <span className={`mb-1 block ${osLabelMuted}`}>{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            className={`h-8 w-8 border-[1.5px] text-xs font-bold transition-colors ${
              value === n
                ? "border-ta-ink bg-ta-ink text-ta-paper"
                : "border-ta-ink bg-ta-paper hover:bg-ta-paper-2"
            }`}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OsTaskEditModal({ open, task, projects, onClose, onSave }: OsTaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState<number | null>(null);
  const [urgency, setUrgency] = useState<number | null>(null);
  const [effort, setEffort] = useState<number | null>(null);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setImportance(task.importance);
    setUrgency(task.urgency);
    setEffort(task.effort);
    setProjectIds(
      task.projectIds?.length ? task.projectIds : task.project_id ? [task.project_id] : []
    );
  }, [task]);

  if (!open || !task) return null;

  async function handleSave() {
    if (!task || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        importance,
        urgency,
        effort,
        projectIds,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <ModalPanel maxWidthClass="max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide">Editar task</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 font-mono normal-case">
          <label className="block">
            <span className={`mb-1 block ${osLabelMuted}`}>
              Título
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm font-bold ${osInput}`}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block ${osLabelMuted}`}>
              Descrição
            </span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 text-sm ${osInput}`}
            />
          </label>

          <div>
            <span className={`mb-1 block ${osLabelMuted}`}>Projetos / Quick Win</span>
            <ProjectIdsPicker
              projects={projects}
              value={projectIds}
              onChange={setProjectIds}
              variant="line"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ScorePicker label="Importância" value={importance} onChange={setImportance} />
            <ScorePicker label="Urgência" value={urgency} onChange={setUrgency} />
          </div>

          <ScorePicker label="Esforço" value={effort} onChange={setEffort} />

          <div className="border border-ta-ink bg-ta-paper-2 px-3 py-2 text-center">
            <span className={`block ${osLabelMuted}`}>Score</span>
            <p className="text-2xl font-bold tabular-nums">
              {computeOsTaskScore({ importance, urgency, effort }) ?? "—"}
            </p>
            <p className="text-[10px] text-ta-muted">
              {effort != null && effort > 1
                ? `(Importância × Urgência) ÷ Esforço`
                : `Importância × Urgência`}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={osBtnGhost}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !title.trim()}
              className={osBtnPrimary}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </ModalPanel>
    </ModalOverlay>
  );
}

interface OsTaskOnHoldModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function OsTaskOnHoldModal({ open, onClose, onConfirm }: OsTaskOnHoldModalProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <ModalPanel maxWidthClass="max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide">Colocar em espera</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <label className="block font-mono normal-case">
          <span className={`mb-1 block ${osLabelMuted}`}>
            Motivo
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`w-full px-3 py-2 text-sm ${osInput}`}
            placeholder="Por que esta task está em pausa?"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={osBtnGhost}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || !reason.trim()}
            className={osBtnPrimary}
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </ModalPanel>
    </ModalOverlay>
  );
}

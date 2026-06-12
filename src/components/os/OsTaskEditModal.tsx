"use client";

import { useEffect, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { ModalPanel } from "@/components/ModalPanel";
import type { OsTaskRow } from "@/lib/os-types";

interface OsTaskEditModalProps {
  open: boolean;
  task: OsTaskRow | null;
  onClose: () => void;
  onSave: (taskId: string, data: { title: string; description: string }) => Promise<void>;
}

export function OsTaskEditModal({ open, task, onClose, onSave }: OsTaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
  }, [task]);

  if (!open || !task) return null;

  async function handleSave() {
    if (!task || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(task.id, { title: title.trim(), description: description.trim() });
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
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-black/70">
              Título
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold outline-none focus:bg-black/5"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-black/70">
              Descrição
            </span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-black/5"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border-2 border-black px-4 py-2 text-sm font-bold uppercase hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !title.trim()}
              className="border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white disabled:opacity-50"
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
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-black/70">
            Motivo
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-black/5"
            placeholder="Por que esta task está em pausa?"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-black px-4 py-2 text-sm font-bold uppercase hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || !reason.trim()}
            className="border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </ModalPanel>
    </ModalOverlay>
  );
}

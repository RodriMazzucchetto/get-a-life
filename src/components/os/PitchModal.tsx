"use client";

import { useEffect, useState } from "react";
import ModalOverlay from "@/components/ModalOverlay";
import { PitchPriorityToggle } from "@/components/os/PitchPriorityToggle";
import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  OS_BLOCK_TYPES,
  currentWeekStartDate,
  getBetUpdateStatusColor,
  formatBetUpdateStatusLabel,
} from "@/lib/os-queries";
import type {
  OsBetRow,
  OsBetUpdateRow,
  OsBetUpdateStatus,
  OsBlockType,
  OsTaskRow,
} from "@/lib/os-types";

interface UpdateFormData {
  status: OsBetUpdateStatus;
  whatDone: string;
  blockers: string;
}

const UPDATE_STATUS_OPTIONS: { value: OsBetUpdateStatus; label: string }[] = [
  { value: "on_course", label: "On course" },
  { value: "deviating", label: "Deviating" },
  { value: "executed", label: "Executed" },
  { value: "failed", label: "Failed" },
];

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
  isPriority: boolean;
  onTogglePriority: () => Promise<void>;
  pitchTasks: OsTaskRow[];
  tasksLoading: boolean;
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  priorityLoading: boolean;
  weeklyUpdates?: OsBetUpdateRow[];
  weeklyUpdatesLoading?: boolean;
  onAddUpdate?: (data: UpdateFormData) => Promise<void>;
  onEditUpdate?: (updateId: string, data: UpdateFormData) => Promise<void>;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
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

const UPDATE_STATUS_COLORS: Record<OsBetUpdateStatus, string> = {
  on_course: "var(--color-ta-green)",
  deviating: "var(--color-ta-amber-muted)",
  executed: "var(--color-ta-cyan)",
  failed: "var(--color-ta-red)",
};

/** Campos compartilhados do formulário de weekly update (criar e editar). */
function UpdateFields({
  value,
  onChange,
}: {
  value: UpdateFormData;
  onChange: (next: UpdateFormData) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {UPDATE_STATUS_OPTIONS.map((opt) => {
          const selected = value.status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, status: opt.value })}
              className={`border px-2 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                selected ? "border-ta-ink text-white" : "border-ta-rule-2 bg-ta-paper text-ta-ink hover:bg-ta-paper"
              }`}
              style={selected ? { backgroundColor: UPDATE_STATUS_COLORS[opt.value] } : undefined}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <textarea
        rows={2}
        value={value.whatDone}
        onChange={(e) => onChange({ ...value, whatDone: e.target.value })}
        placeholder="O que foi feito esta semana?"
        className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink"
      />
      <textarea
        rows={2}
        value={value.blockers}
        onChange={(e) => onChange({ ...value, blockers: e.target.value })}
        placeholder="Blockers (opcional)"
        className="w-full border border-ta-rule-2 bg-ta-paper px-3 py-2 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink"
      />
    </div>
  );
}

// Estilos refinados (paper/ink, IBM Plex, regras 1px) — alinhados ao novo design OS.
const LABEL = "mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ta-muted";
const HELP = "mb-2 font-sans text-xs leading-relaxed text-ta-muted";
const FIELD =
  "w-full border border-ta-rule-2 bg-ta-paper px-3 py-2.5 font-sans text-sm text-ta-ink outline-none transition-colors focus:border-ta-ink";

export function PitchModal({
  open,
  onClose,
  pitch,
  initialBlockType,
  blockGoals,
  isPriority,
  onTogglePriority,
  pitchTasks,
  tasksLoading,
  onAddTask,
  onDeleteTask,
  priorityLoading,
  weeklyUpdates = [],
  weeklyUpdatesLoading = false,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate,
  onSave,
  onDelete,
  saving,
}: PitchModalProps) {
  const [form, setForm] = useState<PitchFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const isEditing = pitch !== null;

  // Weekly update — formulário de criação e edição inline
  const EMPTY_UPDATE: UpdateFormData = { status: "on_course", whatDone: "", blockers: "" };
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateFormData>(EMPTY_UPDATE);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editUpdateForm, setEditUpdateForm] = useState<UpdateFormData>(EMPTY_UPDATE);

  const submitNewUpdate = async () => {
    if (!onAddUpdate || !updateForm.whatDone.trim()) {
      setError("Descreva o que foi feito no update.");
      return;
    }
    setUpdateBusy(true);
    setError(null);
    try {
      await onAddUpdate(updateForm);
      setUpdateForm(EMPTY_UPDATE);
      setAddingUpdate(false);
    } catch {
      setError("Não foi possível salvar o update.");
    } finally {
      setUpdateBusy(false);
    }
  };

  const submitEditUpdate = async (updateId: string) => {
    if (!onEditUpdate || !editUpdateForm.whatDone.trim()) return;
    setUpdateBusy(true);
    setError(null);
    try {
      await onEditUpdate(updateId, editUpdateForm);
      setEditingUpdateId(null);
    } catch {
      setError("Não foi possível editar o update.");
    } finally {
      setUpdateBusy(false);
    }
  };

  const removeUpdate = async (updateId: string) => {
    if (!onDeleteUpdate) return;
    if (!window.confirm("Remover este weekly update?")) return;
    setUpdateBusy(true);
    setError(null);
    try {
      await onDeleteUpdate(updateId);
    } catch {
      setError("Não foi possível remover o update.");
    } finally {
      setUpdateBusy(false);
    }
  };

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
      setForm({ ...EMPTY_FORM, blockType: initialBlockType ?? "finance" });
    }
    setNewTaskTitle("");
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
    setError(null);
    try {
      await onDelete(pitch.id);
    } catch {
      setError("Não foi possível excluir o pitch.");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    setError(null);
    try {
      await onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    } catch {
      setError("Não foi possível adicionar a task.");
    } finally {
      setAddingTask(false);
    }
  };

  if (!open) return null;

  const doneTasks = pitchTasks.filter((t) => t.completed_at).length;

  return (
    <ModalOverlay isOpen={open} onClose={onClose}>
      <div
        data-modal-content
        role="dialog"
        aria-modal="true"
        aria-labelledby="pitch-modal-title"
        className="pointer-events-auto relative z-[1] mx-auto max-h-[min(92dvh,56rem)] w-full max-w-2xl overflow-y-auto overscroll-contain border border-ta-rule-2 bg-ta-paper font-sans shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] [scrollbar-gutter:stable]"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header — barra ink (igual ao header dos pilares) */}
        <div className="flex items-center gap-3 bg-ta-ink px-6 py-4 text-ta-paper">
          <h2
            id="pitch-modal-title"
            className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]"
          >
            {isEditing ? "Editar pitch" : "Submeter pitch"}
          </h2>
          {isEditing ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ta-paper/60">
                {isPriority ? "Priorizado" : "Backlog"}
              </span>
              <PitchPriorityToggle
                isPriority={isPriority}
                disabled={priorityLoading || saving}
                onToggle={() => void onTogglePriority()}
                size="md"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-7 px-6 py-6">
          {!isEditing ? (
            <p className="border-l-2 border-ta-ink bg-ta-paper-2 px-3 py-2.5 font-sans text-xs leading-relaxed text-ta-ink">
              <span className="font-semibold uppercase">Regra inegociável:</span> articule a ideia, o
              plano de execução e por que importa. Se não der pra deixar claro, a conversa para aqui.
            </p>
          ) : null}

          <label className="block">
            <span className={LABEL}>Qual é a ideia do pitch?</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className={FIELD}
            />
          </label>

          <fieldset>
            <legend className={LABEL}>Qual meta isto move de forma significativa?</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {OS_BLOCK_TYPES.map((blockType) => {
                const selected = form.blockType === blockType;
                const goal = blockGoals[blockType];
                return (
                  <div key={blockType} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, blockType }))}
                      className={`flex items-center gap-2 border px-3 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                        selected
                          ? "border-ta-ink bg-ta-ink text-ta-paper"
                          : "border-ta-rule-2 bg-ta-paper text-ta-ink hover:bg-ta-paper-2"
                      }`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: OS_BLOCK_DOT_COLORS[blockType] }}
                        aria-hidden
                      />
                      {OS_BLOCK_LABELS[blockType]}
                    </button>
                    <p className="mt-1.5 px-1 font-sans text-xs text-ta-muted">
                      {goal?.title ?? "Meta não priorizada"}
                    </p>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className={LABEL}>Impacto / outcome mensurável</span>
            <p className={HELP}>
              O que muda? O que estará verdadeiro e completo quando isto estiver pronto? Receita,
              eficiência, experiência do cliente, margem, throughput, etc.
            </p>
            <textarea
              rows={4}
              value={form.pitchOutcome}
              onChange={(event) => setForm((prev) => ({ ...prev, pitchOutcome: event.target.value }))}
              className={FIELD}
              placeholder="Objetivos específicos e quantificáveis"
            />
          </label>

          <label className="block">
            <span className={LABEL}>Dados objetivos</span>
            <p className={HELP}>
              Que dados duros sustentam este pitch? Métricas, tendências, custos, uso, pontos de
              falha, input de clientes. Sem dados, explique como vai validar antes de executar.
            </p>
            <textarea
              rows={4}
              value={form.pitchData}
              onChange={(event) => setForm((prev) => ({ ...prev, pitchData: event.target.value }))}
              className={FIELD}
            />
          </label>

          <label className="block">
            <span className={LABEL}>Responsável pela execução</span>
            <select
              value={form.executionOwner}
              onChange={(event) => setForm((prev) => ({ ...prev, executionOwner: event.target.value }))}
              className={`${FIELD} font-mono`}
            >
              <option value="">Selecionar responsável</option>
              <option value="self">Eu (responsável)</option>
              <option value="team">Equipa</option>
              <option value="external">Externo</option>
            </select>
          </label>

          {isEditing && isPriority ? (
            <section className="border-t border-ta-rule-2 pt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className={`${LABEL} mb-0`}>Weekly updates</h3>
                {!addingUpdate && onAddUpdate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateForm(EMPTY_UPDATE);
                      setAddingUpdate(true);
                      setEditingUpdateId(null);
                    }}
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ta-ink hover:underline"
                  >
                    + Novo update
                  </button>
                ) : null}
              </div>
              <p className={HELP}>Histórico de updates semanais — mais recente no topo.</p>

              {addingUpdate ? (
                <div className="mb-4 border border-ta-ink bg-ta-paper-2 p-3">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted">
                    Novo update · semana {currentWeekStartDate()}
                  </span>
                  <UpdateFields
                    value={updateForm}
                    onChange={setUpdateForm}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingUpdate(false)}
                      disabled={updateBusy}
                      className="border border-ta-rule-2 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ta-ink hover:bg-ta-paper disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitNewUpdate()}
                      disabled={updateBusy}
                      className="border border-ta-ink bg-ta-ink px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ta-paper hover:bg-ta-ink/90 disabled:opacity-50"
                    >
                      {updateBusy ? "Salvando..." : "Salvar update"}
                    </button>
                  </div>
                </div>
              ) : null}

              {weeklyUpdatesLoading ? (
                <p className="font-sans text-xs text-ta-muted">Carregando updates...</p>
              ) : weeklyUpdates.length > 0 ? (
                <ul className="space-y-3">
                  {weeklyUpdates.map((update) =>
                    editingUpdateId === update.id ? (
                      <li key={update.id} className="border border-ta-ink bg-ta-paper-2 p-3">
                        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted">
                          Editar · semana {update.week_start}
                        </span>
                        <UpdateFields value={editUpdateForm} onChange={setEditUpdateForm} />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUpdateId(null)}
                            disabled={updateBusy}
                            className="border border-ta-rule-2 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ta-ink hover:bg-ta-paper disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitEditUpdate(update.id)}
                            disabled={updateBusy}
                            className="border border-ta-ink bg-ta-ink px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ta-paper hover:bg-ta-ink/90 disabled:opacity-50"
                          >
                            {updateBusy ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li key={update.id} className="border border-ta-rule-2 bg-ta-paper px-3 py-2.5">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted">
                            Semana {update.week_start}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: getBetUpdateStatusColor(update.status) }}
                            >
                              {formatBetUpdateStatusLabel(update.status)}
                            </span>
                            {onEditUpdate ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUpdateId(update.id);
                                  setAddingUpdate(false);
                                  setEditUpdateForm({
                                    status: update.status,
                                    whatDone: update.what_done ?? "",
                                    blockers: update.blockers ?? "",
                                  });
                                }}
                                className="text-ta-muted transition-colors hover:text-ta-ink"
                                aria-label="Editar update"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            ) : null}
                            {onDeleteUpdate ? (
                              <button
                                type="button"
                                onClick={() => void removeUpdate(update.id)}
                                className="text-ta-muted transition-colors hover:text-ta-red"
                                aria-label="Remover update"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                        {update.what_done ? (
                          <p className="font-sans text-sm text-ta-ink">{update.what_done}</p>
                        ) : null}
                        {update.blockers ? (
                          <p className="mt-1 font-sans text-xs text-ta-muted">
                            <span className="font-semibold uppercase">Blockers:</span> {update.blockers}
                          </p>
                        ) : null}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="font-sans text-xs text-ta-muted">
                  Nenhum weekly update ainda. Clique em &ldquo;+ Novo update&rdquo;.
                </p>
              )}
            </section>
          ) : null}

          {isEditing && isPriority ? (
            <section className="border-t border-ta-rule-2 pt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className={`${LABEL} mb-0`}>Tasks do pitch</h3>
                {pitchTasks.length > 0 ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ta-muted">
                    {doneTasks}/{pitchTasks.length} entregues
                  </span>
                ) : null}
              </div>
              <p className={HELP}>
                Aparecem em Tasks OS com a tag da empresa e deste pitch. O estado reflete o Tasks OS —
                tasks concluídas aparecem riscadas.
              </p>

              {tasksLoading ? (
                <p className="font-sans text-xs text-ta-muted">Carregando tasks...</p>
              ) : pitchTasks.length > 0 ? (
                <ul className="mb-4 divide-y divide-ta-rule border border-ta-rule-2">
                  {pitchTasks.map((task) => {
                    const done = Boolean(task.completed_at);
                    return (
                      <li key={task.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{
                            color: done ? "var(--color-ta-cyan)" : "var(--color-ta-muted)",
                            fontVariationSettings: done ? '"FILL" 1' : '"FILL" 0',
                          }}
                          aria-hidden
                        >
                          {done ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        <span
                          className={`flex-1 font-sans text-sm ${
                            done ? "text-ta-muted line-through" : "text-ta-ink"
                          }`}
                        >
                          {task.title}
                        </span>
                        {done ? (
                          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ta-cyan">
                            Entregue
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void onDeleteTask(task.id)}
                          className="text-ta-muted transition-colors hover:text-ta-red"
                          aria-label="Excluir task"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mb-4 font-sans text-xs text-ta-muted">Nenhuma task ainda.</p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddTask();
                    }
                  }}
                  placeholder="Nova task..."
                  className={`min-w-0 flex-1 ${FIELD}`}
                />
                <button
                  type="button"
                  onClick={() => void handleAddTask()}
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="shrink-0 border border-ta-ink bg-ta-ink px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-paper transition-colors hover:bg-ta-ink/90 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </section>
          ) : null}

          {error ? <p className="font-sans text-sm font-semibold text-ta-red">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ta-rule-2 pt-5">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
                className="border border-ta-red px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ta-red transition-colors hover:bg-ta-red/5 disabled:opacity-50"
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
                {saving ? "Salvando..." : isEditing ? "Salvar" : "Submeter pitch"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

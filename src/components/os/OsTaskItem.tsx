"use client";

import { useState, type MouseEvent, type PointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlayIcon } from "@heroicons/react/24/outline";
import type { OsProjectOption } from "@/lib/os-queries";
import {
  osIconBtn,
  osIconBtnDanger,
  osTaskRow,
  osTaskRowOnHold,
} from "@/lib/os-ui";
import type { OsBetRow, OsTaskRow } from "@/lib/os-types";
import { isQuickWinProject } from "@/lib/project-filters";
import { projectShortCode } from "@/lib/problemHelpers";

interface OsTaskItemProps {
  task: OsTaskRow;
  company: OsProjectOption | null;
  linkedBet: OsBetRow | null;
  onToggleComplete: (task: OsTaskRow) => void;
  onEdit: (task: OsTaskRow) => void;
  onPutOnHold: (task: OsTaskRow) => void;
  onMoveToFocus: (task: OsTaskRow) => void;
  onMoveToBacklog: (task: OsTaskRow) => void;
  onDelete: (task: OsTaskRow) => void;
  deleting?: boolean;
}

function stopActionPointer(e: MouseEvent | PointerEvent) {
  e.stopPropagation();
}

export function OsTaskItem({
  task,
  company,
  linkedBet,
  onToggleComplete,
  onEdit,
  onPutOnHold,
  onMoveToFocus,
  onMoveToBacklog,
  onDelete,
  deleting = false,
}: OsTaskItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const showBacklogButton = task.status !== "backlog";
  const isInFocus = task.status === "in_progress";
  const companyColor = company?.color ?? "#888888";

  if (confirmDelete) {
    return (
      <div ref={setNodeRef} style={style} className={`${osTaskRow} border-ta-red bg-red-50/40`}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-xs font-bold normal-case text-ta-red">
            Excluir &ldquo;{task.title}&rdquo;?
          </span>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onDelete(task)}
            className="shrink-0 border-[1.5px] border-ta-red bg-ta-red px-2 py-1 text-[10px] font-bold uppercase text-ta-paper hover:bg-ta-red/90 disabled:opacity-50"
          >
            {deleting ? "..." : "Sim"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirmDelete(false)}
            className="shrink-0 border-[1.5px] border-ta-ink px-2 py-1 text-[10px] font-bold uppercase hover:bg-ta-paper-2 disabled:opacity-50"
          >
            Não
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${osTaskRow} ${task.on_hold ? osTaskRowOnHold : ""}`}
    >
      <div className="flex items-stretch gap-0">
        <button
          type="button"
          className="flex w-7 shrink-0 cursor-grab items-center justify-center text-ta-muted active:cursor-grabbing hover:bg-ta-paper-2 hover:text-ta-ink"
          aria-label="Arrastar task"
          {...attributes}
          {...listeners}
        >
          <span className="flex gap-0.5">
            <span className="flex flex-col gap-0.5">
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
              <span className="h-0.5 w-0.5 rounded-full bg-current" />
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-2 pl-0.5 pr-2 group-hover:pr-24 md:group-hover:pr-28">
          <div className="flex min-w-0 items-start gap-2.5">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onToggleComplete(task)}
              onPointerDown={stopActionPointer}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 border border-ta-ink accent-ta-ink"
              aria-label="Marcar como concluída"
            />

            <button
              type="button"
              onClick={(e) => {
                stopActionPointer(e);
                onEdit(task);
              }}
              onPointerDown={stopActionPointer}
              className="min-w-0 flex-1 border border-ta-ink bg-ta-paper px-2 py-1.5 text-left transition-colors hover:bg-ta-paper-2"
            >
              <span
                className="block text-sm font-bold normal-case leading-snug break-words"
                style={{ whiteSpace: "normal", overflow: "visible", textOverflow: "clip" }}
              >
                {task.title}
              </span>
              {task.on_hold && task.on_hold_reason ? (
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-ta-amber break-words">
                  Em espera: {task.on_hold_reason}
                </span>
              ) : null}
            </button>
          </div>

          {company || linkedBet ? (
            <div className="flex min-w-0 flex-wrap items-start gap-1.5 pl-[1.375rem]">
              {company ? (
                <span
                  className="inline-block max-w-full shrink-0 px-0.5 py-0.5 text-[10px] font-bold uppercase tracking-wide leading-snug"
                  style={{ color: companyColor }}
                  title={company.name}
                >
                  {projectShortCode(company.name)}
                </span>
              ) : null}
              {linkedBet ? (
                <span
                  className="inline-block min-w-0 max-w-full flex-1 px-0.5 py-0.5 text-[10px] font-bold normal-case leading-snug break-words text-ta-muted"
                  title={linkedBet.title}
                >
                  {linkedBet.title}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="absolute right-1.5 top-2 flex items-center gap-0.5 border border-ta-ink bg-ta-paper px-0.5 py-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {showBacklogButton ? (
            <button
              type="button"
              onPointerDown={stopActionPointer}
              onClick={(e) => {
                stopActionPointer(e);
                onMoveToBacklog(task);
              }}
              className={osIconBtn}
              title="Mover para backlog"
              aria-label="Mover para backlog"
            >
              <span className="material-symbols-outlined text-[17px]">inventory_2</span>
            </button>
          ) : null}

          <button
            type="button"
            onPointerDown={stopActionPointer}
            onClick={(e) => {
              stopActionPointer(e);
              onMoveToFocus(task);
            }}
            className={osIconBtn}
            title={isInFocus ? "Voltar para Semana Atual" : "Enviar para Foco Agora"}
            aria-label={isInFocus ? "Voltar para Semana Atual" : "Enviar para Foco Agora"}
          >
            {isInFocus ? (
              <span className="material-symbols-outlined text-[17px]">undo</span>
            ) : (
              <PlayIcon className="h-4 w-4" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onPointerDown={stopActionPointer}
            onClick={(e) => {
              stopActionPointer(e);
              onPutOnHold(task);
            }}
            className={`${osIconBtn} ${task.on_hold ? "bg-ta-amber/20 text-ta-ink" : ""}`}
            title={task.on_hold ? "Retirar da espera" : "Colocar em espera"}
            aria-label={task.on_hold ? "Retirar da espera" : "Colocar em espera"}
          >
            {task.on_hold ? (
              <span className="material-symbols-outlined text-[17px]">play_arrow</span>
            ) : (
              <span className="material-symbols-outlined text-[17px]">pause</span>
            )}
          </button>

          <button
            type="button"
            onPointerDown={stopActionPointer}
            onClick={(e) => {
              stopActionPointer(e);
              onEdit(task);
            }}
            className={osIconBtn}
            title="Editar"
            aria-label="Editar task"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>

          <button
            type="button"
            onPointerDown={stopActionPointer}
            onClick={(e) => {
              stopActionPointer(e);
              setConfirmDelete(true);
            }}
            className={osIconBtnDanger}
            title="Excluir"
            aria-label="Excluir task"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function resolveOsTaskCompany(
  task: OsTaskRow,
  projectsById: Map<string, OsProjectOption>
): OsProjectOption | null {
  if (!task.project_id) return null;
  const project = projectsById.get(task.project_id);
  if (!project || isQuickWinProject(project)) return null;
  return project;
}

export function resolveOsTaskCompanyColor(
  task: OsTaskRow,
  projectsById: Map<string, OsProjectOption>
): string {
  return resolveOsTaskCompany(task, projectsById)?.color ?? "#888888";
}

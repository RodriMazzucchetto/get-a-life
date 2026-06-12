"use client";

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
}: OsTaskItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${osTaskRow} ${task.on_hold ? osTaskRowOnHold : ""}`}
    >
      <div className="flex items-stretch gap-0">
        <button
          type="button"
          className="flex w-7 shrink-0 cursor-grab items-center justify-center text-black/30 active:cursor-grabbing hover:bg-black/[0.04] hover:text-black/50"
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

        <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-0.5 pr-2 group-hover:pr-24 md:group-hover:pr-28">
          <input
            type="checkbox"
            checked={false}
            onChange={() => onToggleComplete(task)}
            className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/25 accent-black"
            aria-label="Marcar como concluída"
          />

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="min-w-0 flex-1 text-left hover:underline"
          >
            <span className="block truncate text-sm font-bold normal-case">{task.title}</span>
            {task.on_hold && task.on_hold_reason ? (
              <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wide text-amber-700/90">
                Em espera: {task.on_hold_reason}
              </span>
            ) : null}
          </button>

          {company ? (
            <span
              className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide sm:inline"
              style={{ color: companyColor }}
            >
              {company.name}
            </span>
          ) : null}

          {linkedBet ? (
            <span
              className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide lg:inline"
              style={{ color: companyColor }}
              title={company ? `Pitch · ${company.name}` : linkedBet.title}
            >
              {linkedBet.title}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-sm bg-white/95 px-0.5 py-0.5 opacity-0 shadow-sm shadow-black/5 ring-1 ring-black/[0.06] backdrop-blur-sm transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          {showBacklogButton ? (
            <button
              type="button"
              onClick={() => onMoveToBacklog(task)}
              className={osIconBtn}
              title="Mover para backlog"
              aria-label="Mover para backlog"
            >
              <span className="material-symbols-outlined text-[17px]">inventory_2</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onMoveToFocus(task)}
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
            onClick={() => onPutOnHold(task)}
            className={`${osIconBtn} ${task.on_hold ? "bg-amber-100/80 text-amber-800" : ""}`}
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
            onClick={() => onEdit(task)}
            className={osIconBtn}
            title="Editar"
            aria-label="Editar task"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
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

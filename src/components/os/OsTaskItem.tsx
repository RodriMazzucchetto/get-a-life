"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlayIcon } from "@heroicons/react/24/outline";
import type { OsProjectOption } from "@/lib/os-queries";
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
    opacity: isDragging ? 0.4 : 1,
  };

  const showBacklogButton = task.status !== "backlog";
  const isInFocus = task.status === "in_progress";
  const companyColor = company?.color ?? "#888888";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative border-2 border-black bg-white ${task.on_hold ? "bg-[#FFF9E6]" : ""}`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex w-8 shrink-0 cursor-grab items-center justify-center border-r-2 border-black active:cursor-grabbing hover:bg-black/[0.03]"
          aria-label="Arrastar task"
          {...attributes}
          {...listeners}
        >
          <span className="flex gap-0.5">
            <span className="flex flex-col gap-0.5">
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
              <span className="h-0.5 w-0.5 rounded-full bg-black/50" />
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 pr-2 group-hover:pr-28 md:group-hover:pr-32">
          <input
            type="checkbox"
            checked={false}
            onChange={() => onToggleComplete(task)}
            className="h-4 w-4 shrink-0 border-2 border-black accent-black"
            aria-label="Marcar como concluída"
          />

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="min-w-0 flex-1 text-left hover:underline"
          >
            <span className="block truncate text-sm font-bold normal-case">{task.title}</span>
            {task.on_hold && task.on_hold_reason ? (
              <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wide text-[#B8860B]">
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

        <div className="pointer-events-none absolute right-0 top-0 flex h-full shrink-0 items-stretch border-l-2 border-black bg-white opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          {showBacklogButton ? (
            <button
              type="button"
              onClick={() => onMoveToBacklog(task)}
              className="flex items-center px-2 hover:bg-black/[0.03]"
              title="Mover para backlog"
              aria-label="Mover para backlog"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onMoveToFocus(task)}
            className="flex items-center border-l-2 border-black px-2 hover:bg-black/[0.03]"
            title={isInFocus ? "Voltar para Semana Atual" : "Enviar para Foco Agora"}
            aria-label={isInFocus ? "Voltar para Semana Atual" : "Enviar para Foco Agora"}
          >
            {isInFocus ? (
              <span className="material-symbols-outlined text-[18px]">undo</span>
            ) : (
              <PlayIcon className="h-4 w-4" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => onPutOnHold(task)}
            className={`flex items-center border-l-2 border-black px-2 hover:bg-black/[0.03] ${
              task.on_hold ? "bg-[#FFD600]/20" : ""
            }`}
            title={task.on_hold ? "Retirar da espera" : "Colocar em espera"}
            aria-label={task.on_hold ? "Retirar da espera" : "Colocar em espera"}
          >
            {task.on_hold ? (
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">pause</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex items-center border-l-2 border-black px-2 hover:bg-black/[0.03]"
            title="Editar"
            aria-label="Editar task"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
            className="flex items-center border-l-2 border-black px-2 text-[#FF0000] hover:bg-black/[0.03]"
            title="Excluir"
            aria-label="Excluir task"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
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

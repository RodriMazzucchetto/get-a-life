"use client";

import { useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlayIcon } from "@heroicons/react/24/outline";
import type { OsProjectOption } from "@/lib/os-queries";
import type { OsBetRow, OsTaskRow } from "@/lib/os-types";
import { computeOsTaskScore, hasOsTaskScore } from "@/lib/osBoardHelpers";
import { isQuickWinProject } from "@/lib/project-filters";
import { projectShortCode } from "@/lib/problemHelpers";

interface OsTaskItemProps {
  task: OsTaskRow;
  projectTags: OsProjectOption[];
  linkedBet: OsBetRow | null;
  inFocoColumn?: boolean;
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

function taskDotClass(task: OsTaskRow): string {
  if (task.on_hold) return "wait";
  if (task.status === "in_progress") return "run";
  return "idle";
}

function taskDesc(task: OsTaskRow, linkedBet: OsBetRow | null): string | null {
  const desc = task.description?.trim();
  if (desc) return desc;
  if (linkedBet?.title) return linkedBet.title;
  return null;
}

export function OsTaskItem({
  task,
  projectTags,
  linkedBet,
  inFocoColumn = false,
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
  const taskScore = computeOsTaskScore(task);
  const desc = taskDesc(task, linkedBet);
  const showRunState = inFocoColumn && task.status === "in_progress" && !task.on_hold;

  const metaItems: { key: string; node: ReactNode }[] = [];
  if (showRunState) {
    metaItems.push({ key: "run", node: <span className="state run">Em execução</span> });
  }
  if (task.on_hold && task.on_hold_reason) {
    metaItems.push({
      key: "wait",
      node: <span className="state wait">Em espera · {task.on_hold_reason}</span>,
    });
  }
  for (const project of projectTags) {
    metaItems.push({
      key: project.id,
      node: (
        <span className={`tag ${isQuickWinProject(project) ? "qw" : ""}`}>
          {projectShortCode(project.name)}
        </span>
      ),
    });
  }

  if (confirmDelete) {
    return (
      <div ref={setNodeRef} style={style} className="os-task os-task-delete">
        <span className="msg">Excluir &ldquo;{task.title}&rdquo;?</span>
        <div className="actions">
          <button type="button" disabled={deleting} className="confirm" onClick={() => void onDelete(task)}>
            {deleting ? "..." : "Sim"}
          </button>
          <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)}>
            Não
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="os-task group">
      <button
        type="button"
        className="handle"
        aria-label="Arrastar task"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <span className={`dot ${taskDotClass(task)}`} aria-hidden />

      <div className="body">
        <button
          type="button"
          className="task-title"
          onClick={(e) => {
            stopActionPointer(e);
            onEdit(task);
          }}
          onPointerDown={stopActionPointer}
        >
          {task.title}
        </button>

        {metaItems.length > 0 ? (
          <div className="meta">
            {metaItems.map((item, index) => (
              <span key={item.key} className="inline-flex items-center gap-2.5">
                {index > 0 ? <span className="sep">·</span> : null}
                {item.node}
              </span>
            ))}
          </div>
        ) : null}

        {desc ? <div className="desc">{desc}</div> : null}
      </div>

      <div className="right">
        <div className="os-task-actions">
          {showBacklogButton ? (
            <button
              type="button"
              onPointerDown={stopActionPointer}
              onClick={(e) => {
                stopActionPointer(e);
                onMoveToBacklog(task);
              }}
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
            title="Editar"
            aria-label="Editar task"
          >
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>

          <button
            type="button"
            className="danger"
            onPointerDown={stopActionPointer}
            onClick={(e) => {
              stopActionPointer(e);
              setConfirmDelete(true);
            }}
            title="Excluir"
            aria-label="Excluir task"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </div>

        {hasOsTaskScore(task) ? (
          <span className={`prio ${taskScore != null && taskScore >= 12 ? "high" : ""}`}>{taskScore}</span>
        ) : null}

        <input
          type="checkbox"
          checked={false}
          onChange={() => onToggleComplete(task)}
          onPointerDown={stopActionPointer}
          className="check"
          aria-label="Marcar como concluída"
        />
      </div>
    </div>
  );
}

export function resolveOsTaskProjectIds(task: OsTaskRow): string[] {
  if (task.projectIds?.length) return task.projectIds;
  return task.project_id ? [task.project_id] : [];
}

export function resolveOsTaskProjectTags(
  task: OsTaskRow,
  projectsById: Map<string, OsProjectOption>
): OsProjectOption[] {
  return resolveOsTaskProjectIds(task)
    .map((id) => projectsById.get(id))
    .filter((project): project is OsProjectOption => Boolean(project));
}

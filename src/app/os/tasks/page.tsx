"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OsDroppableColumn } from "@/components/os/OsDroppableColumn";
import { OsTaskEditModal, OsTaskOnHoldModal } from "@/components/os/OsTaskEditModal";
import { OsTaskItem, resolveOsTaskCompany } from "@/components/os/OsTaskItem";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  osCard,
  osCardHeader,
  osEmptyState,
  osErrorBanner,
  osInput,
  osInputRow,
  osLabelMuted,
  osPage,
} from "@/lib/os-ui";
import {
  OS_COL_BACKLOG,
  OS_COL_CURRENT_WEEK,
  OS_COL_IN_PROGRESS,
  appendOsTaskPosForStatus,
  appendOsTaskPosOnHoldAtBottom,
  computeOsTaskPosAtIndex,
  osColumnStatusFromId,
  osTasksForColumn,
  sortOsTasksByPos,
} from "@/lib/osBoardHelpers";
import {
  createOsTask,
  deleteOsTask,
  fetchAllOsTasks,
  fetchOsBetsByIds,
  fetchOsProjects,
  updateOsTask,
  type OsProjectOption,
} from "@/lib/os-queries";
import type { OsBetRow, OsTaskBoardStatus, OsTaskRow } from "@/lib/os-types";

function osTaskListClassName(taskCount: number): string {
  const base = "space-y-2";
  if (taskCount === 0) return `${base} min-h-[5rem]`;
  if (taskCount <= 4) return base;
  return `${base} max-h-[min(42vh,22rem)] overflow-y-auto [scrollbar-gutter:stable] md:max-h-[min(48vh,26rem)]`;
}

function OsTaskColumn({
  id,
  title,
  subtitle,
  tasks,
  betsById,
  projectsById,
  onToggleComplete,
  onEdit,
  onPutOnHold,
  onMoveToFocus,
  onMoveToBacklog,
  onDelete,
  onCreate,
  createPlaceholder,
  className,
}: {
  id: string;
  title: string;
  subtitle: string;
  tasks: OsTaskRow[];
  betsById: Map<string, OsBetRow>;
  projectsById: Map<string, OsProjectOption>;
  onToggleComplete: (task: OsTaskRow) => void;
  onEdit: (task: OsTaskRow) => void;
  onPutOnHold: (task: OsTaskRow) => void;
  onMoveToFocus: (task: OsTaskRow) => void;
  onMoveToBacklog: (task: OsTaskRow) => void;
  onDelete: (task: OsTaskRow) => void;
  onCreate: (title: string) => Promise<void>;
  createPlaceholder: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submitCreate() {
    const title = draft.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      await onCreate(title);
      setDraft("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className={`flex min-h-0 flex-col ${osCard} ${className ?? ""}`}>
      <header
        className={`${osCardHeader} ${tasks.length === 0 ? "py-2.5" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-[0.12em]">{title}</h2>
          <span className={`${osLabelMuted} normal-case`}>{tasks.length}</span>
        </div>
        <p className={`mt-1 ${osLabelMuted}`}>{subtitle}</p>
      </header>

      <div className="flex flex-col p-3 md:p-4">
        <div className={`mb-2.5 ${osInputRow}`}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCreate();
            }}
            placeholder={createPlaceholder}
            className={`min-w-0 flex-1 px-3 py-2 text-sm font-bold normal-case ${osInput} border-0 focus:border-0`}
          />
          <button
            type="button"
            onClick={() => void submitCreate()}
            disabled={creating || !draft.trim()}
            className="shrink-0 border-l border-ta-ink px-3 py-2 text-sm font-bold text-ta-muted transition-colors hover:bg-ta-paper-2 hover:text-ta-ink disabled:opacity-40"
          >
            +
          </button>
        </div>

        <OsDroppableColumn id={id} className={osTaskListClassName(tasks.length)}>
          {tasks.length === 0 ? (
            <p className={`py-3 text-center ${osLabelMuted} normal-case`}>
              Arraste tasks para cá ou crie uma nova.
            </p>
          ) : (
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <OsTaskItem
                  key={task.id}
                  task={task}
                  company={resolveOsTaskCompany(task, projectsById)}
                  linkedBet={task.bet_id ? (betsById.get(task.bet_id) ?? null) : null}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onPutOnHold={onPutOnHold}
                  onMoveToFocus={onMoveToFocus}
                  onMoveToBacklog={onMoveToBacklog}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>
          )}
        </OsDroppableColumn>
      </div>
    </section>
  );
}

export default function OsTasksPage() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<OsTaskRow[]>([]);
  const [betsById, setBetsById] = useState<Map<string, OsBetRow>>(new Map());
  const [projects, setProjects] = useState<OsProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<OsTaskRow | null>(null);
  const [onHoldTask, setOnHoldTask] = useState<OsTaskRow | null>(null);
  const dragRollbackRef = useRef<OsTaskRow[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const withPointer = pointerWithin(args);
    if (withPointer.length > 0) return withPointer;
    return closestCenter(args);
  }, []);

  const loadBoard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [taskRows, projectRows] = await Promise.all([
        fetchAllOsTasks(user.id),
        fetchOsProjects(user.id),
      ]);
      setTasks(taskRows);
      setProjects(projectRows);
      const betIds = [
        ...new Set(taskRows.map((t) => t.bet_id).filter((id): id is string => Boolean(id))),
      ];
      const bets = await fetchOsBetsByIds(betIds);
      setBetsById(new Map(bets.map((bet) => [bet.id, bet])));
    } catch (loadError) {
      console.error("Erro ao carregar tasks OS:", loadError);
      setError("Não foi possível carregar as tasks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const focusTasks = useMemo(() => osTasksForColumn(tasks, "in_progress"), [tasks]);
  const weekTasks = useMemo(() => osTasksForColumn(tasks, "current_week"), [tasks]);
  const backlogTasks = useMemo(() => osTasksForColumn(tasks, "backlog"), [tasks]);

  const activeDragTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;

  function replaceTask(updated: OsTaskRow) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleCreateInColumn(status: OsTaskBoardStatus, title: string) {
    if (!user) return;
    const created = await createOsTask(
      user.id,
      { title, status },
      tasks.filter((t) => t.completed_at == null)
    );
    setTasks((prev) => [...prev, created]);
  }

  async function handleToggleComplete(task: OsTaskRow) {
    const completed_at = new Date().toISOString();
    const updated = await updateOsTask(task.id, { completed_at });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleSaveEdit(taskId: string, data: { title: string; description: string }) {
    const updated = await updateOsTask(taskId, {
      title: data.title,
      description: data.description || null,
    });
    replaceTask(updated);
  }

  async function handleDelete(task: OsTaskRow) {
    if (!confirm(`Excluir task "${task.title}"?`)) return;
    await deleteOsTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function handlePutOnHold(task: OsTaskRow) {
    if (task.on_hold) {
      const pos = appendOsTaskPosForStatus(tasks, task.status, task.id);
      const updated = await updateOsTask(task.id, {
        on_hold: false,
        on_hold_reason: null,
        pos,
      });
      replaceTask(updated);
      return;
    }
    setOnHoldTask(task);
  }

  async function confirmOnHold(reason: string) {
    if (!onHoldTask) return;
    const pos = appendOsTaskPosOnHoldAtBottom(tasks, onHoldTask.status, onHoldTask.id);
    const updated = await updateOsTask(onHoldTask.id, {
      on_hold: true,
      on_hold_reason: reason,
      pos,
    });
    replaceTask(updated);
    setOnHoldTask(null);
  }

  async function moveTask(task: OsTaskRow, status: OsTaskBoardStatus) {
    if (task.status === status) return;
    const pos = appendOsTaskPosForStatus(tasks, status, task.id);
    const updated = await updateOsTask(task.id, {
      status,
      pos,
      on_hold: false,
      on_hold_reason: null,
    });
    replaceTask(updated);
  }

  async function handleMoveToFocus(task: OsTaskRow) {
    if (task.status === "in_progress") {
      await moveTask(task, "current_week");
    } else {
      await moveTask(task, "in_progress");
    }
  }

  async function handleMoveToBacklog(task: OsTaskRow) {
    await moveTask(task, "backlog");
  }

  async function applyColumnMove(
    activeId: string,
    columnTarget: OsTaskBoardStatus,
    insertBeforeTaskId?: string
  ) {
    const rollback = () => {
      if (dragRollbackRef.current) {
        setTasks(dragRollbackRef.current);
        dragRollbackRef.current = null;
      }
    };

    let newPos: number;
    const targetCol = tasks
      .filter((t) => t.status === columnTarget && t.completed_at == null && t.id !== activeId)
      .sort(sortOsTasksByPos);

    if (insertBeforeTaskId) {
      const overIndex = targetCol.findIndex((t) => t.id === insertBeforeTaskId);
      if (overIndex <= 0) {
        const first = targetCol[0];
        newPos = first ? (first.pos ?? 1000) - 500 : 1000;
      } else {
        const prev = targetCol[overIndex - 1];
        const next = targetCol[overIndex];
        newPos = ((prev.pos ?? 0) + (next.pos ?? 0)) / 2;
      }
    } else {
      newPos = appendOsTaskPosForStatus(tasks, columnTarget, activeId);
    }

    dragRollbackRef.current = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, status: columnTarget, pos: newPos, on_hold: false, on_hold_reason: null }
          : t
      )
    );

    try {
      const updated = await updateOsTask(activeId, {
        status: columnTarget,
        pos: newPos,
        on_hold: false,
        on_hold_reason: null,
      });
      replaceTask(updated);
      dragRollbackRef.current = null;
    } catch {
      rollback();
      setError("Não foi possível mover a task.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.completed_at) return;

    const overTask = tasks.find((t) => t.id === overId);

    if (overTask && activeTask.status !== overTask.status) {
      await applyColumnMove(activeId, overTask.status, overId);
      return;
    }

    const columnTarget = osColumnStatusFromId(overId);
    if (columnTarget && activeTask.status !== columnTarget) {
      await applyColumnMove(activeId, columnTarget);
      return;
    }

    if (!overTask || activeTask.status !== overTask.status) return;

    const rollback = () => {
      if (dragRollbackRef.current) {
        setTasks(dragRollbackRef.current);
        dragRollbackRef.current = null;
      }
    };

    const col = tasks
      .filter((t) => t.status === activeTask.status && t.completed_at == null)
      .sort(sortOsTasksByPos);
    const oldIdx = col.findIndex((t) => t.id === activeId);
    const newIdx = col.findIndex((t) => t.id === overId);
    if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;

    const reordered = arrayMove(col, oldIdx, newIdx);
    const newPos = computeOsTaskPosAtIndex(reordered, newIdx);

    dragRollbackRef.current = [...tasks];
    setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, pos: newPos } : t)));

    try {
      const updated = await updateOsTask(activeId, { pos: newPos });
      replaceTask(updated);
      dragRollbackRef.current = null;
    } catch {
      rollback();
      setError("Não foi possível reordenar a task.");
    }
  }

  return (
    <div className={`pb-10 ${osPage}`}>
      <header className="mb-5 border-b-[1.5px] border-ta-ink pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-[0.14em]">Tasks OS</h1>
        <p className={`mt-1 ${osLabelMuted} normal-case`}>
          Foco Agora · Semana Atual · Backlog
        </p>
      </header>

      {error ? (
        <div className={osErrorBanner}>{error}</div>
      ) : null}

      {loading ? (
        <div className={osEmptyState}>Carregando tasks...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={(e) => setActiveDragId(String(e.active.id))}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={(e) => {
            setActiveDragId(null);
            void handleDragEnd(e);
          }}
        >
          <div className="flex w-full flex-col gap-4 lg:gap-6">
            <OsTaskColumn
              id={OS_COL_IN_PROGRESS}
              title="Foco Agora"
              subtitle="Em execução — play envia para cá"
              tasks={focusTasks}
              betsById={betsById}
              projectsById={projectsById}
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onPutOnHold={handlePutOnHold}
              onMoveToFocus={handleMoveToFocus}
              onMoveToBacklog={handleMoveToBacklog}
              onDelete={handleDelete}
              onCreate={(title) => handleCreateInColumn("in_progress", title)}
              createPlaceholder="Nova task em foco..."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
              <OsTaskColumn
                id={OS_COL_CURRENT_WEEK}
                title="Semana Atual"
                subtitle="Planejadas para esta semana"
                tasks={weekTasks}
                betsById={betsById}
                projectsById={projectsById}
                onToggleComplete={handleToggleComplete}
                onEdit={setEditingTask}
                onPutOnHold={handlePutOnHold}
                onMoveToFocus={handleMoveToFocus}
                onMoveToBacklog={handleMoveToBacklog}
                onDelete={handleDelete}
                onCreate={(title) => handleCreateInColumn("current_week", title)}
                createPlaceholder="Nova task da semana..."
              />

              <OsTaskColumn
                id={OS_COL_BACKLOG}
                title="Backlog"
                subtitle="Tasks de pitch entram aqui"
                tasks={backlogTasks}
                betsById={betsById}
                projectsById={projectsById}
                onToggleComplete={handleToggleComplete}
                onEdit={setEditingTask}
                onPutOnHold={handlePutOnHold}
                onMoveToFocus={handleMoveToFocus}
                onMoveToBacklog={handleMoveToBacklog}
                onDelete={handleDelete}
                onCreate={(title) => handleCreateInColumn("backlog", title)}
                createPlaceholder="Nova task no backlog..."
              />
            </div>
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className={`${osCard} px-4 py-3 text-sm font-bold normal-case shadow-[6px_6px_0_var(--color-ta-ink)]`}>
                {activeDragTask.title}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <OsTaskEditModal
        open={editingTask !== null}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
      />

      <OsTaskOnHoldModal
        open={onHoldTask !== null}
        onClose={() => setOnHoldTask(null)}
        onConfirm={confirmOnHold}
      />
    </div>
  );
}

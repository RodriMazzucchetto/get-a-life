"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DroppableColumn } from "@/components/planning/DroppableColumn";
import { OsTaskEditModal, OsTaskOnHoldModal } from "@/components/os/OsTaskEditModal";
import { OsTaskItem, resolveOsTaskCompany } from "@/components/os/OsTaskItem";
import { useAuthContext } from "@/contexts/AuthContext";
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
    <section className="flex flex-col border-2 border-black bg-white">
      <header className="border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-[0.12em]">{title}</h2>
          <span className="text-xs font-bold text-black/50">{tasks.length}</span>
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-black/50">{subtitle}</p>
      </header>

      <div className="p-3">
        <div className="mb-3 flex border-2 border-black">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCreate();
            }}
            placeholder={createPlaceholder}
            className="min-w-0 flex-1 bg-white px-3 py-2 text-sm font-bold normal-case outline-none"
          />
          <button
            type="button"
            onClick={() => void submitCreate()}
            disabled={creating || !draft.trim()}
            className="border-l-2 border-black px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            +
          </button>
        </div>

        <DroppableColumn id={id} className="space-y-2 min-h-[8rem]">
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-xs font-bold normal-case text-black/40">
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
        </DroppableColumn>
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.completed_at) return;

    const rollback = () => {
      if (dragRollbackRef.current) {
        setTasks(dragRollbackRef.current);
        dragRollbackRef.current = null;
      }
    };

    const columnTarget = osColumnStatusFromId(overId);
    if (columnTarget && activeTask.status !== columnTarget) {
      dragRollbackRef.current = [...tasks];
      const pos = appendOsTaskPosForStatus(tasks, columnTarget, activeId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, status: columnTarget, pos, on_hold: false, on_hold_reason: null }
            : t
        )
      );
      try {
        const updated = await updateOsTask(activeId, {
          status: columnTarget,
          pos,
          on_hold: false,
          on_hold_reason: null,
        });
        replaceTask(updated);
        dragRollbackRef.current = null;
      } catch {
        rollback();
        setError("Não foi possível mover a task.");
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask || activeTask.status !== overTask.status) return;

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
    <div className="pb-10 font-mono uppercase tracking-wide text-black">
      <header className="mb-6 border-2 border-black bg-white px-4 py-4 text-center">
        <h1 className="text-2xl font-bold tracking-[0.14em]">Tasks OS</h1>
        <p className="mt-1 text-[10px] font-bold normal-case text-black/50">
          Backlog · Semana Atual · Foco Agora
        </p>
      </header>

      {error ? (
        <div className="mb-4 border-2 border-black bg-white px-4 py-2 text-sm font-bold normal-case text-[#FF0000]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="border-2 border-black bg-white px-4 py-12 text-center text-sm font-bold normal-case">
          Carregando tasks...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveDragId(String(e.active.id))}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={(e) => {
            setActiveDragId(null);
            void handleDragEnd(e);
          }}
        >
          <div className="space-y-6">
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

          <DragOverlay>
            {activeDragTask ? (
              <div className="border-2 border-black bg-white px-4 py-3 text-sm font-bold normal-case shadow-lg">
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

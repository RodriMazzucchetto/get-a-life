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
import { OsTaskItem, resolveOsTaskProjectTags } from "@/components/os/OsTaskItem";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import { osErrorBanner, osEmptyState } from "@/lib/os-ui";
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
  endOsTaskCycle,
  fetchActiveOsTaskCycle,
  incrementCycleAddedAfterPoints,
  incrementCycleDeliveredPoints,
  setOsTaskProjects,
  startOsTaskCycle,
  updateOsTask,
  type OsProjectOption,
} from "@/lib/os-queries";
import type { OsBetRow, OsTaskBoardStatus, OsTaskCycleRow, OsTaskRow } from "@/lib/os-types";
import { computeOsTaskEffort } from "@/lib/osBoardHelpers";

function OsTaskColumn({
  id,
  title,
  subtitle,
  tasks,
  betsById,
  projectsById,
  variant = "default",
  onToggleComplete,
  onEdit,
  onPutOnHold,
  onMoveToFocus,
  onMoveToBacklog,
  onDelete,
  onCreate,
  createLabel,
  deletingTaskId,
}: {
  id: string;
  title: string;
  subtitle: string;
  tasks: OsTaskRow[];
  betsById: Map<string, OsBetRow>;
  projectsById: Map<string, OsProjectOption>;
  variant?: "default" | "foco";
  onToggleComplete: (task: OsTaskRow) => void;
  onEdit: (task: OsTaskRow) => void;
  onPutOnHold: (task: OsTaskRow) => void;
  onMoveToFocus: (task: OsTaskRow) => void;
  onMoveToBacklog: (task: OsTaskRow) => void;
  onDelete: (task: OsTaskRow) => void;
  onCreate: (title: string) => Promise<void>;
  createLabel: string;
  deletingTaskId?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submitCreate() {
    const titleText = draft.trim();
    if (!titleText || creating) return;
    setCreating(true);
    try {
      await onCreate(titleText);
      setDraft("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  function openCreate() {
    setShowCreate(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <section className={variant === "foco" ? "col foco" : "col"}>
      <div className="col-head">
        <span className="title">{title}</span>
        <span className="count">{tasks.length}</span>
        <button type="button" className="add" title={createLabel} onClick={openCreate} aria-label={createLabel}>
          +
        </button>
      </div>
      <div className="col-sub">{subtitle}</div>

      <OsDroppableColumn id={id} className="list" dropHighlightClass="list-drop-active">
        {tasks.length === 0 ? (
          <p className="list-empty">Arraste tasks para cá ou crie uma nova.</p>
        ) : (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <OsTaskItem
                key={task.id}
                task={task}
                inFocoColumn={variant === "foco"}
                projectTags={resolveOsTaskProjectTags(task, projectsById)}
                linkedBet={task.bet_id ? (betsById.get(task.bet_id) ?? null) : null}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onPutOnHold={onPutOnHold}
                onMoveToFocus={onMoveToFocus}
                onMoveToBacklog={onMoveToBacklog}
                onDelete={onDelete}
                deleting={deletingTaskId === task.id}
              />
            ))}
          </SortableContext>
        )}
      </OsDroppableColumn>

      {showCreate ? (
        <div className="new-task-input">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCreate();
              if (e.key === "Escape") {
                setShowCreate(false);
                setDraft("");
              }
            }}
            placeholder={createLabel}
          />
          <button type="button" disabled={creating || !draft.trim()} onClick={() => void submitCreate()}>
            {creating ? "..." : "Add"}
          </button>
        </div>
      ) : (
        <button type="button" className="new-task" onClick={openCreate}>
          <span className="plus">+</span>
          {createLabel}
        </button>
      )}
    </section>
  );
}

export default function OsTasksPage() {
  const { user } = useAuthContext();
  const {
    tasks,
    setTasks,
    taskProjects: projects,
    betsById,
    tasksReady,
    tasksLoading,
    tasksError,
    refreshTasks,
  } = useOsLayout();
  const [error, setError] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<OsTaskRow | null>(null);
  const [onHoldTask, setOnHoldTask] = useState<OsTaskRow | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const dragRollbackRef = useRef<OsTaskRow[] | null>(null);

  const [activeCycle, setActiveCycle] = useState<OsTaskCycleRow | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchActiveOsTaskCycle(user.id).then(setActiveCycle);
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const withPointer = pointerWithin(args);
    if (withPointer.length > 0) return withPointer;
    return closestCenter(args);
  }, []);

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

  async function handleStartCycle() {
    if (!user || cycleLoading || activeCycle) return;
    setCycleLoading(true);
    try {
      const activeTasks = tasks.filter((t) => t.completed_at == null && (t.status === "current_week" || t.status === "in_progress"));
      const plannedPoints = activeTasks.reduce((sum, t) => sum + computeOsTaskEffort(t), 0);
      const cycle = await startOsTaskCycle(user.id, plannedPoints);
      setActiveCycle(cycle);
    } catch {
      setError("Não foi possível iniciar o ciclo.");
    } finally {
      setCycleLoading(false);
    }
  }

  async function handleEndCycle() {
    if (!activeCycle || cycleLoading) return;
    setCycleLoading(true);
    try {
      const closed = await endOsTaskCycle(activeCycle.id);
      setActiveCycle(null);
      // keep closed cycle visible briefly for UX
      void closed;
    } catch {
      setError("Não foi possível encerrar o ciclo.");
    } finally {
      setCycleLoading(false);
    }
  }

  async function handleCreateInColumn(status: OsTaskBoardStatus, title: string) {
    if (!user) return;
    const created = await createOsTask(
      user.id,
      { title, status },
      tasks.filter((t) => t.completed_at == null)
    );
    setTasks((prev) => [...prev, created]);
    // se há ciclo ativo e task está em Semana/Foco, conta como adicionada após início
    if (activeCycle && (status === "current_week" || status === "in_progress")) {
      const effort = computeOsTaskEffort(created);
      if (effort > 0) void incrementCycleAddedAfterPoints(activeCycle.id, effort);
    }
  }

  async function handleToggleComplete(task: OsTaskRow) {
    setError(null);
    try {
      const completed_at = new Date().toISOString();
      const updated = await updateOsTask(task.id, { completed_at });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // se há ciclo ativo, contabiliza o esforço entregue
      if (activeCycle) {
        const effort = computeOsTaskEffort(task);
        if (effort > 0) void incrementCycleDeliveredPoints(activeCycle.id, effort);
        // atualiza estado local do ciclo
        setActiveCycle((prev) => prev ? { ...prev, delivered_points: prev.delivered_points + effort } : prev);
      }
    } catch {
      setError("Não foi possível concluir a task.");
    }
  }

  async function handleSaveEdit(
    taskId: string,
    data: {
      title: string;
      description: string;
      importance: number | null;
      urgency: number | null;
      effort: number | null;
      projectIds: string[];
    }
  ) {
    setError(null);
    try {
      await updateOsTask(taskId, {
        title: data.title,
        description: data.description || null,
        importance: data.importance,
        urgency: data.urgency,
        effort: data.effort,
      });
      const updated = await setOsTaskProjects(taskId, data.projectIds, projects);
      replaceTask(updated);
    } catch {
      setError("Não foi possível salvar a task.");
      throw new Error("save failed");
    }
  }

  async function handleDelete(task: OsTaskRow) {
    setError(null);
    setDeletingTaskId(task.id);
    try {
      await deleteOsTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (editingTask?.id === task.id) setEditingTask(null);
    } catch {
      setError("Não foi possível excluir a task.");
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handlePutOnHold(task: OsTaskRow) {
    setError(null);
    try {
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
    } catch {
      setError("Não foi possível alterar o estado de espera.");
    }
  }

  async function confirmOnHold(reason: string) {
    if (!onHoldTask) return;
    setError(null);
    try {
      const pos = appendOsTaskPosOnHoldAtBottom(tasks, onHoldTask.status, onHoldTask.id);
      const updated = await updateOsTask(onHoldTask.id, {
        on_hold: true,
        on_hold_reason: reason,
        pos,
      });
      replaceTask(updated);
      setOnHoldTask(null);
    } catch {
      setError("Não foi possível colocar a task em espera.");
    }
  }

  async function moveTask(task: OsTaskRow, status: OsTaskBoardStatus) {
    if (task.status === status) return;
    setError(null);
    try {
      const pos = appendOsTaskPosForStatus(tasks, status, task.id);
      const updated = await updateOsTask(task.id, {
        status,
        pos,
        on_hold: false,
        on_hold_reason: null,
      });
      replaceTask(updated);
    } catch {
      setError("Não foi possível mover a task.");
    }
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

  const effectivenessTotal = activeCycle
    ? activeCycle.planned_points + activeCycle.added_after_points
    : 0;
  const effectivenessPct = effectivenessTotal > 0
    ? Math.round((activeCycle!.delivered_points / effectivenessTotal) * 100)
    : 0;

  return (
    <div className="pb-10">
      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h1>Tasks</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeCycle ? (
            <>
              <div style={{ display: "flex", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--color-ta-muted)" }}>
                <span>Ciclo #{activeCycle.cycle_number}</span>
                <span style={{ color: "var(--color-ta-ink)" }}>{activeCycle.planned_points.toFixed(1)} pts planejados</span>
                <span style={{ color: "var(--color-ta-cyan)" }}>{activeCycle.delivered_points.toFixed(1)} pts entregues</span>
                <span>{effectivenessPct}% efetividade</span>
              </div>
              <button
                type="button"
                onClick={() => void handleEndCycle()}
                disabled={cycleLoading}
                style={{ border: "1.5px solid var(--color-ta-red)", background: "transparent", color: "var(--color-ta-red)", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", cursor: "pointer", opacity: cycleLoading ? 0.5 : 1 }}
              >
                {cycleLoading ? "..." : "Encerrar ciclo"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleStartCycle()}
              disabled={cycleLoading}
              style={{ border: "1.5px solid var(--color-ta-ink)", background: "var(--color-ta-ink)", color: "var(--color-ta-paper)", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", cursor: "pointer", opacity: cycleLoading ? 0.5 : 1 }}
            >
              {cycleLoading ? "..." : "Iniciar ciclo"}
            </button>
          )}
        </div>
      </div>
      <div className="page-sub">Foco agora · Semana atual · Backlog</div>

      {error || tasksError ? (
        <div className={osErrorBanner}>{error ?? tasksError}</div>
      ) : null}

      {!tasksReady && tasksLoading && tasks.length === 0 ? (
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
          <div className="board">
            <OsTaskColumn
              id={OS_COL_IN_PROGRESS}
              title="Foco agora"
              subtitle="Em execução · Play envia pra cá"
              variant="foco"
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
              createLabel="Nova task em foco"
              deletingTaskId={deletingTaskId}
            />

            <div className="row-2">
              <OsTaskColumn
                id={OS_COL_CURRENT_WEEK}
                title="Semana atual"
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
                createLabel="Nova task da semana"
                deletingTaskId={deletingTaskId}
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
                createLabel="Nova task no backlog"
                deletingTaskId={deletingTaskId}
              />
            </div>
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className="os-refined-page">
                <div className="os-task bg-ta-paper px-2 shadow-[4px_4px_0_var(--color-ta-ink)]">
                  <span className="dot idle" aria-hidden />
                  <div className="body">
                    <div className="task-title">{activeDragTask.title}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <OsTaskEditModal
        open={editingTask !== null}
        task={editingTask}
        projects={projects}
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

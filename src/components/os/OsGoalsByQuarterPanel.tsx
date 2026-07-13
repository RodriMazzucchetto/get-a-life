"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  OS_BLOCK_LABELS,
  currentCalendarQuarter,
  formatGoalOutcomeLabel,
  goalIsConcluded,
} from "@/lib/os-queries";
import type { OsBlockType, OsGoalQuarter, OsGoalRow } from "@/lib/os-types";

const QUARTERS: OsGoalQuarter[] = [1, 2, 3, 4];

const PILLAR_DOT: Record<OsBlockType, string> = {
  finance: "var(--color-ta-amber-muted)",
  growth: "var(--color-ta-cyan)",
  ops: "var(--color-ta-green)",
};

function quarterStatusLabel(q: OsGoalQuarter, current: OsGoalQuarter): string {
  if (q < current) return "Concluído";
  if (q === current) return "Atual";
  return "Planejado";
}

type BlockInfo = { id: string; type: OsBlockType };

interface OsGoalsByQuarterPanelProps {
  goals: OsGoalRow[];
  blocks: BlockInfo[];
  busy?: boolean;
  onCreate: (blockId: string, quarter: OsGoalQuarter, title: string) => Promise<void>;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onMoveQuarter: (goal: OsGoalRow, quarter: OsGoalQuarter) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}

function GoalCard({
  goal,
  blockType,
  busy,
  onRename,
  onDelete,
  onTogglePriority,
  onConclude,
  onEdit,
}: {
  goal: OsGoalRow;
  blockType: OsBlockType;
  busy?: boolean;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}) {
  const concluded = goalIsConcluded(goal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    disabled: concluded,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const submitRename = async () => {
    const next = draft.trim();
    if (!next || next === goal.title) {
      setEditing(false);
      setDraft(goal.title);
      return;
    }
    await onRename(goal, next);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`os-q-goal ${concluded ? "concluded" : ""} ${goal.is_priority ? "prio" : ""}`}
    >
      {!concluded ? (
        <button type="button" className="os-q-handle" aria-label="Arrastar meta" {...attributes} {...listeners}>
          ⋮⋮
        </button>
      ) : (
        <span className="os-q-handle muted" aria-hidden>
          ·
        </span>
      )}

      <span className="os-q-dot" style={{ background: PILLAR_DOT[blockType] }} aria-hidden />

      <div className="os-q-goal-body">
        <div className="os-q-pillar">{OS_BLOCK_LABELS[blockType]}</div>
        {editing && !concluded ? (
          <input
            autoFocus
            className="os-q-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void submitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitRename();
              if (e.key === "Escape") {
                setDraft(goal.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="os-q-title"
            onClick={() => (concluded ? onEdit(goal) : setEditing(true))}
            title={concluded ? "Meta concluída" : "Editar título"}
          >
            {goal.title}
          </button>
        )}
        {concluded ? (
          <span className={`os-q-outcome ${goal.status === "abandoned" ? "failed" : "ok"}`}>
            {formatGoalOutcomeLabel(goal.status)}
          </span>
        ) : null}
      </div>

      <div className="os-q-actions">
        {!concluded ? (
          <>
            <button
              type="button"
              className={`os-q-star ${goal.is_priority ? "on" : ""}`}
              title={goal.is_priority ? "Despriorizar" : "Priorizar para o pilar"}
              disabled={busy}
              onClick={() => void onTogglePriority(goal)}
            >
              ★
            </button>
            <button
              type="button"
              className="os-q-icon"
              title="Concluir meta"
              disabled={busy}
              onClick={() => onConclude(goal)}
            >
              ✓
            </button>
            <button
              type="button"
              className="os-q-icon danger"
              title="Excluir meta"
              disabled={busy}
              onClick={() => void onDelete(goal)}
            >
              ✕
            </button>
          </>
        ) : (
          <button type="button" className="os-q-icon" title="Ver meta" onClick={() => onEdit(goal)}>
            ✎
          </button>
        )}
      </div>
    </div>
  );
}

function QuarterColumn({
  quarter,
  current,
  goals,
  blockById,
  busy,
  adding,
  onStartAdd,
  onCancelAdd,
  onCreate,
  onRename,
  onDelete,
  onTogglePriority,
  onConclude,
  onEdit,
}: {
  quarter: OsGoalQuarter;
  current: OsGoalQuarter;
  goals: OsGoalRow[];
  blockById: Map<string, BlockInfo>;
  busy?: boolean;
  adding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onCreate: (blockId: string, title: string) => Promise<void>;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `quarter-${quarter}` });
  const [title, setTitle] = useState("");
  const [blockId, setBlockId] = useState<string>("");
  const blocks = useMemo(() => [...blockById.values()], [blockById]);

  const submit = async () => {
    const t = title.trim();
    const bid = blockId || blocks[0]?.id;
    if (!t || !bid) {
      onCancelAdd();
      setTitle("");
      return;
    }
    await onCreate(bid, t);
    setTitle("");
    onCancelAdd();
  };

  return (
    <div
      ref={setNodeRef}
      className={`os-q-col ${quarter === current ? "current" : ""} ${isOver ? "over" : ""}`}
    >
      <div className="os-q-col-head">
        <div>
          <span className="q">Q{quarter}</span>
          <span className="status">{quarterStatusLabel(quarter, current)}</span>
        </div>
        <span className="count">{goals.length}</span>
      </div>

      <SortableContext items={goals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
        <div className="os-q-list">
          {goals.map((goal) => {
            const block = blockById.get(goal.block_id);
            if (!block) return null;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                blockType={block.type}
                busy={busy}
                onRename={onRename}
                onDelete={onDelete}
                onTogglePriority={onTogglePriority}
                onConclude={onConclude}
                onEdit={onEdit}
              />
            );
          })}
        </div>
      </SortableContext>

      {adding ? (
        <div className="os-q-add-form">
          <div className="os-q-pillar-picks">
            {blocks.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`os-q-pillar-pick ${(blockId || blocks[0]?.id) === b.id ? "on" : ""}`}
                style={{ "--dot": PILLAR_DOT[b.type] } as React.CSSProperties}
                onClick={() => setBlockId(b.id)}
              >
                {OS_BLOCK_LABELS[b.type]}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={title}
            placeholder="Nova meta…"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
              if (e.key === "Escape") {
                setTitle("");
                onCancelAdd();
              }
            }}
            onBlur={() => void submit()}
          />
        </div>
      ) : (
        <button type="button" className="os-q-add" onClick={onStartAdd}>
          <span className="plus">+</span> Nova meta
        </button>
      )}
    </div>
  );
}

export function OsGoalsByQuarterPanel({
  goals,
  blocks,
  busy,
  onCreate,
  onRename,
  onDelete,
  onMoveQuarter,
  onTogglePriority,
  onConclude,
  onEdit,
}: OsGoalsByQuarterPanelProps) {
  const [open, setOpen] = useState(true);
  const [addingQuarter, setAddingQuarter] = useState<OsGoalQuarter | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const current = currentCalendarQuarter();

  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  const byQuarter = useMemo(() => {
    const map: Record<OsGoalQuarter, OsGoalRow[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const goal of goals) {
      const q = goal.quarter ?? current;
      map[q].push(goal);
    }
    for (const q of QUARTERS) {
      map[q].sort((a, b) => {
        if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
        if (goalIsConcluded(a) !== goalIsConcluded(b)) return goalIsConcluded(a) ? 1 : -1;
        return (a.pos ?? 0) - (b.pos ?? 0);
      });
    }
    return map;
  }, [goals, current]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeGoal = activeId ? goals.find((g) => g.id === activeId) ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const goal = goals.find((g) => g.id === active.id);
    if (!goal || goalIsConcluded(goal)) return;

    let targetQuarter: OsGoalQuarter | null = null;
    const overId = String(over.id);
    if (overId.startsWith("quarter-")) {
      targetQuarter = Number(overId.replace("quarter-", "")) as OsGoalQuarter;
    } else {
      const overGoal = goals.find((g) => g.id === overId);
      if (overGoal) targetQuarter = overGoal.quarter;
    }

    if (!targetQuarter || targetQuarter === goal.quarter) return;
    await onMoveQuarter(goal, targetQuarter);
  };

  return (
    <section className={`os-quarters ${open ? "open" : ""}`}>
      <button type="button" className="os-quarters-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="chev">⌄</span>
        <span className="title">Metas por quarter</span>
        <span className="hint">arraste para mover entre quarters · priorize para o pilar</span>
        <span className="count-pill">{goals.length}</span>
      </button>

      {open ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <div className="os-quarters-grid">
            {QUARTERS.map((q) => (
              <QuarterColumn
                key={q}
                quarter={q}
                current={current}
                goals={byQuarter[q]}
                blockById={blockById}
                busy={busy}
                adding={addingQuarter === q}
                onStartAdd={() => setAddingQuarter(q)}
                onCancelAdd={() => setAddingQuarter(null)}
                onCreate={(blockId, title) => onCreate(blockId, q, title)}
                onRename={onRename}
                onDelete={onDelete}
                onTogglePriority={onTogglePriority}
                onConclude={onConclude}
                onEdit={onEdit}
              />
            ))}
          </div>

          <DragOverlay>
            {activeGoal ? (
              <div className="os-q-goal dragging">
                <span className="os-q-title">{activeGoal.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}
    </section>
  );
}

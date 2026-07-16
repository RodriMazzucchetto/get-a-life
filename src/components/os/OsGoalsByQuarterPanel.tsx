"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  OS_BLOCK_LABELS,
  currentCalendarQuarter,
  formatGoalOutcomeLabel,
  goalIsConcluded,
} from "@/lib/os-queries";
import type { OsBlockType, OsGoalQuarter, OsGoalRow } from "@/lib/os-types";

const QUARTERS: OsGoalQuarter[] = [1, 2, 3, 4];
const BACKLOG_ID = "drop-backlog";
const BLOCK_ORDER: OsBlockType[] = ["finance", "growth", "ops"];

const PILLAR_DOT: Record<OsBlockType, string> = {
  finance: "var(--color-ta-amber-muted)",
  growth: "var(--color-ta-cyan)",
  ops: "var(--color-ta-green)",
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};

function quarterStatusLabel(q: OsGoalQuarter, current: OsGoalQuarter): string {
  if (q < current) return "Concluído";
  if (q === current) return "Atual";
  return "Planejado";
}

function dropIdForQuarter(q: OsGoalQuarter) {
  return `drop-quarter-${q}`;
}

function resolveTargetQuarter(
  overId: string,
  goals: OsGoalRow[]
): OsGoalQuarter | null | undefined {
  if (overId === BACKLOG_ID) return null;
  if (overId.startsWith("drop-quarter-")) {
    const n = Number(overId.replace("drop-quarter-", ""));
    if (n === 1 || n === 2 || n === 3 || n === 4) return n;
    return undefined;
  }
  const overGoal = goals.find((g) => g.id === overId);
  if (overGoal) return overGoal.quarter;
  return undefined;
}

type BlockInfo = { id: string; type: OsBlockType };

function sortBlocks(blocks: BlockInfo[]): BlockInfo[] {
  return [...blocks].sort(
    (a, b) => BLOCK_ORDER.indexOf(a.type) - BLOCK_ORDER.indexOf(b.type)
  );
}

interface OsGoalsByQuarterPanelProps {
  goals: OsGoalRow[];
  blocks: BlockInfo[];
  busy?: boolean;
  onCreate: (blockId: string, quarter: OsGoalQuarter | null, title: string) => Promise<void>;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onChangeBlock: (goal: OsGoalRow, blockId: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onMoveQuarter: (goal: OsGoalRow, quarter: OsGoalQuarter | null) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}

function PillarPicks({
  blocks,
  value,
  onChange,
  disabled,
}: {
  blocks: BlockInfo[];
  value: string;
  onChange: (blockId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="os-q-pillar-picks">
      {blocks.map((b) => (
        <button
          key={b.id}
          type="button"
          disabled={disabled}
          className={`os-q-pillar-pick ${value === b.id ? "on" : ""}`}
          style={{ "--dot": PILLAR_DOT[b.type] } as React.CSSProperties}
          // Impede blur do input ao clicar — senão o formulário submete no Finance
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(b.id)}
        >
          {OS_BLOCK_LABELS[b.type]}
        </button>
      ))}
    </div>
  );
}

function GoalAddForm({
  blocks,
  placeholder,
  onCancel,
  onCreate,
}: {
  blocks: BlockInfo[];
  placeholder: string;
  onCancel: () => void;
  onCreate: (blockId: string, title: string) => Promise<void>;
}) {
  const ordered = useMemo(() => sortBlocks(blocks), [blocks]);
  const [title, setTitle] = useState("");
  const [blockId, setBlockId] = useState(ordered[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const t = title.trim();
    const bid = blockId || ordered[0]?.id;
    if (!t || !bid || saving) {
      if (!t) onCancel();
      return;
    }
    setSaving(true);
    try {
      await onCreate(bid, t);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="os-q-add-form">
      <PillarPicks blocks={ordered} value={blockId || ordered[0]?.id} onChange={setBlockId} disabled={saving} />
      <input
        autoFocus
        value={title}
        disabled={saving}
        placeholder={placeholder}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="os-q-add-actions">
        <button type="button" className="os-q-add-cancel" disabled={saving} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="os-q-add-confirm"
          disabled={saving || !title.trim()}
          onClick={() => void submit()}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  blockType,
  blocks,
  busy,
  variant = "default",
  onChangeBlock,
  onDelete,
  onTogglePriority,
  onConclude,
  onEdit,
}: {
  goal: OsGoalRow;
  blockType: OsBlockType;
  blocks: BlockInfo[];
  busy?: boolean;
  variant?: "default" | "compact" | "backlog";
  onRename?: (goal: OsGoalRow, title: string) => Promise<void>;
  onChangeBlock: (goal: OsGoalRow, blockId: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}) {
  const concluded = goalIsConcluded(goal);
  const compact = variant === "compact" || variant === "backlog";
  const [editingPillar, setEditingPillar] = useState(false);
  const ordered = useMemo(() => sortBlocks(blocks), [blocks]);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: goal.id,
    disabled: concluded,
    data: { quarter: goal.quarter },
  });

  const style = isDragging ? { opacity: 0.35 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`os-q-goal ${compact ? "compact" : ""} ${concluded ? "concluded" : ""} ${goal.is_priority ? "prio" : ""} ${isDragging ? "dragging" : ""}`}
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

      {editingPillar && !concluded ? (
        <div className="os-q-goal-pillar-edit">
          <PillarPicks
            blocks={ordered}
            value={goal.block_id}
            disabled={busy}
            onChange={(blockId) => {
              setEditingPillar(false);
              if (blockId !== goal.block_id) void onChangeBlock(goal, blockId);
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          className="os-q-dot"
          style={{ background: PILLAR_DOT[blockType] }}
          disabled={concluded || busy}
          title={concluded ? OS_BLOCK_LABELS[blockType] : `Pilar: ${OS_BLOCK_LABELS[blockType]} — clique para alterar`}
          aria-label={`Pilar ${OS_BLOCK_LABELS[blockType]}`}
          onClick={() => setEditingPillar(true)}
        />
      )}

      <div className="os-q-goal-body">
        {!compact && !editingPillar ? (
          <button
            type="button"
            className="os-q-pillar"
            disabled={concluded || busy}
            title={concluded ? undefined : "Alterar pilar"}
            onClick={() => setEditingPillar(true)}
          >
            {OS_BLOCK_LABELS[blockType]}
          </button>
        ) : null}
        <button
          type="button"
          className="os-q-title"
          onClick={() => onEdit(goal)}
          title="Abrir meta"
        >
          {goal.title}
        </button>
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
            {!compact ? (
              <button
                type="button"
                className="os-q-icon"
                title="Concluir meta"
                disabled={busy}
                onClick={() => onConclude(goal)}
              >
                ✓
              </button>
            ) : null}
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
  blocks,
  busy,
  adding,
  onStartAdd,
  onCancelAdd,
  onCreate,
  onRename,
  onChangeBlock,
  onDelete,
  onTogglePriority,
  onConclude,
  onEdit,
}: {
  quarter: OsGoalQuarter;
  current: OsGoalQuarter;
  goals: OsGoalRow[];
  blockById: Map<string, BlockInfo>;
  blocks: BlockInfo[];
  busy?: boolean;
  adding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onCreate: (blockId: string, title: string) => Promise<void>;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onChangeBlock: (goal: OsGoalRow, blockId: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropIdForQuarter(quarter),
    data: { quarter },
  });

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

      <div className="os-q-list">
        {goals.map((goal) => {
          const block = blockById.get(goal.block_id);
          if (!block) return null;
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              blockType={block.type}
              blocks={blocks}
              busy={busy}
              variant="compact"
              onRename={onRename}
              onChangeBlock={onChangeBlock}
              onDelete={onDelete}
              onTogglePriority={onTogglePriority}
              onConclude={onConclude}
              onEdit={onEdit}
            />
          );
        })}
      </div>

      {adding ? (
        <GoalAddForm
          blocks={blocks}
          placeholder="Nova meta…"
          onCancel={onCancelAdd}
          onCreate={async (blockId, title) => {
            await onCreate(blockId, title);
            onCancelAdd();
          }}
        />
      ) : (
        <button type="button" className="os-q-add" onClick={onStartAdd}>
          <span className="plus">+</span> Nova meta
        </button>
      )}
    </div>
  );
}

function GoalsBacklogSection({
  goals,
  blockById,
  blocks,
  busy,
  open,
  onToggleOpen,
  adding,
  onStartAdd,
  onCancelAdd,
  onCreate,
  onRename,
  onChangeBlock,
  onDelete,
  onTogglePriority,
  onConclude,
  onEdit,
  expandOnDragOver,
  onExpand,
}: {
  goals: OsGoalRow[];
  blockById: Map<string, BlockInfo>;
  blocks: BlockInfo[];
  busy?: boolean;
  open: boolean;
  onToggleOpen: () => void;
  adding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onCreate: (blockId: string, title: string) => Promise<void>;
  onRename: (goal: OsGoalRow, title: string) => Promise<void>;
  onChangeBlock: (goal: OsGoalRow, blockId: string) => Promise<void>;
  onDelete: (goal: OsGoalRow) => Promise<void>;
  onTogglePriority: (goal: OsGoalRow) => Promise<void>;
  onConclude: (goal: OsGoalRow) => void;
  onEdit: (goal: OsGoalRow) => void;
  expandOnDragOver: boolean;
  onExpand: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: BACKLOG_ID,
    data: { quarter: null },
  });

  useEffect(() => {
    if (isOver && expandOnDragOver && !open) onExpand();
  }, [isOver, expandOnDragOver, open, onExpand]);

  return (
    <div ref={setNodeRef} className={`os-q-backlog ${open ? "open" : ""} ${isOver ? "over" : ""}`}>
      <button
        type="button"
        className="os-q-backlog-toggle"
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        <span className="chev">⌄</span>
        <span className="title">Backlog de metas</span>
        <span className="hint">sem quarter · arraste metas para cá</span>
        <span className="count">{goals.length}</span>
      </button>

      {open ? (
        <>
          <div className="os-q-backlog-list">
            {goals.length === 0 ? (
              <p className="os-q-backlog-empty">
                Arraste metas dos quarters para cá, ou crie uma nova.
              </p>
            ) : null}
            {goals.map((goal) => {
              const block = blockById.get(goal.block_id);
              if (!block) return null;
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  blockType={block.type}
                  blocks={blocks}
                  busy={busy}
                  variant="compact"
                  onRename={onRename}
                  onChangeBlock={onChangeBlock}
                  onDelete={onDelete}
                  onTogglePriority={onTogglePriority}
                  onConclude={onConclude}
                  onEdit={onEdit}
                />
              );
            })}
          </div>

          {adding ? (
            <div className="os-q-backlog-add">
              <GoalAddForm
                blocks={blocks}
                placeholder="Nova meta no backlog…"
                onCancel={onCancelAdd}
                onCreate={onCreate}
              />
            </div>
          ) : (
            <button type="button" className="os-q-add" onClick={onStartAdd}>
              <span className="plus">+</span> Nova meta no backlog
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

export function OsGoalsByQuarterPanel({
  goals,
  blocks,
  busy,
  onCreate,
  onRename,
  onChangeBlock,
  onDelete,
  onMoveQuarter,
  onTogglePriority,
  onConclude,
  onEdit,
}: OsGoalsByQuarterPanelProps) {
  const [open, setOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(true);
  const [addingQuarter, setAddingQuarter] = useState<OsGoalQuarter | "backlog" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const current = currentCalendarQuarter();

  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const orderedBlocks = useMemo(() => sortBlocks(blocks), [blocks]);

  const { byQuarter, backlogGoals } = useMemo(() => {
    const map: Record<OsGoalQuarter, OsGoalRow[]> = { 1: [], 2: [], 3: [], 4: [] };
    const backlog: OsGoalRow[] = [];
    for (const goal of goals) {
      if (goal.quarter == null) {
        backlog.push(goal);
        continue;
      }
      map[goal.quarter].push(goal);
    }
    const sortGoals = (list: OsGoalRow[]) =>
      list.sort((a, b) => {
        if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
        if (goalIsConcluded(a) !== goalIsConcluded(b)) return goalIsConcluded(a) ? 1 : -1;
        return (a.pos ?? 0) - (b.pos ?? 0);
      });
    for (const q of QUARTERS) sortGoals(map[q]);
    sortGoals(backlog);
    return { byQuarter: map, backlogGoals: backlog };
  }, [goals]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeGoal = activeId ? goals.find((g) => g.id === activeId) ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const goal = goals.find((g) => g.id === String(active.id));
    if (!goal || goalIsConcluded(goal)) return;

    const dropData = over.data.current as { quarter?: OsGoalQuarter | null } | undefined;
    const targetQuarter =
      dropData && Object.prototype.hasOwnProperty.call(dropData, "quarter")
        ? (dropData.quarter ?? null)
        : resolveTargetQuarter(String(over.id), goals);

    if (targetQuarter === undefined) return;
    if (targetQuarter === goal.quarter) return;
    await onMoveQuarter(goal, targetQuarter);
  };

  return (
    <section className={`os-quarters ${open ? "open" : ""}`}>
      <button type="button" className="os-quarters-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="chev">⌄</span>
        <span className="title">Metas por quarter</span>
        <span className="hint">arraste entre quarters e backlog · priorize para o pilar</span>
        <span className="count-pill">{goals.length}</span>
      </button>

      {open ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveId(null)}
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
                blocks={orderedBlocks}
                busy={busy}
                adding={addingQuarter === q}
                onStartAdd={() => setAddingQuarter(q)}
                onCancelAdd={() => setAddingQuarter(null)}
                onCreate={(blockId, title) => onCreate(blockId, q, title)}
                onRename={onRename}
                onChangeBlock={onChangeBlock}
                onDelete={onDelete}
                onTogglePriority={onTogglePriority}
                onConclude={onConclude}
                onEdit={onEdit}
              />
            ))}
          </div>

          <GoalsBacklogSection
            goals={backlogGoals}
            blockById={blockById}
            blocks={orderedBlocks}
            busy={busy}
            open={backlogOpen}
            onToggleOpen={() => setBacklogOpen((v) => !v)}
            adding={addingQuarter === "backlog"}
            onStartAdd={() => setAddingQuarter("backlog")}
            onCancelAdd={() => setAddingQuarter(null)}
            onCreate={async (blockId, title) => {
              await onCreate(blockId, null, title);
              setAddingQuarter(null);
            }}
            onRename={onRename}
            onChangeBlock={onChangeBlock}
            onDelete={onDelete}
            onTogglePriority={onTogglePriority}
            onConclude={onConclude}
            onEdit={onEdit}
            expandOnDragOver={Boolean(activeId)}
            onExpand={() => setBacklogOpen(true)}
          />

          <DragOverlay dropAnimation={null}>
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

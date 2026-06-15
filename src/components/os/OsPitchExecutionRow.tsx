"use client";

import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  getBetDisplayStatus,
} from "@/lib/os-queries";
import { osDivider, osLabelMuted } from "@/lib/os-ui";
import type { OsBetRow, OsBetUpdateRow, OsBlockType } from "@/lib/os-types";

const TRACKABLE_STATUSES = new Set(["on_course", "deviating", "executed", "failed"]);

interface OsPitchExecutionRowProps {
  bet: OsBetRow;
  blockType: OsBlockType;
  latestUpdate: OsBetUpdateRow | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenPitch: () => void;
  onAddWeeklyUpdate: () => void;
}

export function OsPitchExecutionRow({
  bet,
  blockType,
  latestUpdate,
  expanded,
  onToggleExpand,
  onOpenPitch,
  onAddWeeklyUpdate,
}: OsPitchExecutionRowProps) {
  const displayStatus = getBetDisplayStatus(bet, latestUpdate);
  const hasTrackableStatus =
    Boolean(latestUpdate) || TRACKABLE_STATUSES.has(bet.status);
  const pillarColor = OS_BLOCK_DOT_COLORS[blockType];
  const pillarLabel = OS_BLOCK_LABELS[blockType];

  return (
    <div className={`border-b last:border-b-0 ${osDivider}`}>
      <div className="flex items-stretch bg-ta-paper">
        <button
          type="button"
          onClick={onToggleExpand}
          className={`flex w-10 shrink-0 items-center justify-center border-r hover:bg-ta-paper-2 ${osDivider}`}
          aria-expanded={expanded}
          aria-label={expanded ? "Recolher update" : "Expandir último update"}
        >
          <span
            className="material-symbols-outlined text-[18px] transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenPitch}
          className={`flex min-w-0 flex-1 items-center gap-2 border-r px-4 py-3 text-left hover:bg-ta-paper-2 ${osDivider}`}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold"
            style={{ color: pillarColor }}
            title={pillarLabel}
            aria-label={`Pilar ${pillarLabel}`}
          >
            ●
          </span>
          <span className="truncate text-sm font-bold normal-case">{bet.title}</span>
        </button>

        <div
          className="flex w-36 shrink-0 items-center justify-center px-2 py-3 text-center text-xs font-bold tracking-wide"
          style={{
            color: hasTrackableStatus ? displayStatus.color : pillarColor,
          }}
        >
          {hasTrackableStatus ? displayStatus.label : pillarLabel}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddWeeklyUpdate();
          }}
          className={`flex w-12 shrink-0 items-center justify-center border-l hover:bg-ta-paper-2 ${osDivider}`}
          title="Adicionar weekly update"
          aria-label="Adicionar weekly update"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {expanded && latestUpdate ? (
        <div className={`border-t bg-ta-paper-2 px-4 py-3 pl-14 normal-case ${osDivider}`}>
          <p className={`mb-1 ${osLabelMuted}`}>Último update — semana {latestUpdate.week_start}</p>
          {latestUpdate.what_done ? (
            <p className="text-sm text-ta-ink/80">{latestUpdate.what_done}</p>
          ) : (
            <p className={`text-sm ${osLabelMuted}`}>Sem descrição.</p>
          )}
          {latestUpdate.blockers ? (
            <p className="mt-2 text-xs text-ta-muted">
              <span className="font-bold uppercase">Blockers:</span> {latestUpdate.blockers}
            </p>
          ) : null}
        </div>
      ) : expanded ? (
        <div className={`border-t bg-ta-paper-2 px-4 py-3 pl-14 normal-case ${osDivider}`}>
          <p className={`text-sm ${osLabelMuted}`}>Nenhum weekly update ainda.</p>
          <button
            type="button"
            onClick={onAddWeeklyUpdate}
            className="mt-2 text-xs font-bold uppercase underline"
          >
            Adicionar primeiro update
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Grid partilhado entre header e linhas para alinhar colunas */
export const OS_EXECUTION_TABLE_GRID =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_9rem_3rem]";

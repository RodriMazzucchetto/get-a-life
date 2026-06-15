"use client";

import {
  OS_BLOCK_DOT_COLORS,
  OS_BLOCK_LABELS,
  getBetDisplayStatus,
} from "@/lib/os-queries";
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
    <div className="os-pitch-row">
      <div className="os-pitch-row-main">
        <button
          type="button"
          onClick={onToggleExpand}
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

        <button type="button" onClick={onOpenPitch} className="pitch-title-btn">
          <span
            className="shrink-0 text-[10px] font-bold"
            style={{ color: pillarColor }}
            title={pillarLabel}
            aria-label={`Pilar ${pillarLabel}`}
          >
            ●
          </span>
          <span className="truncate">{bet.title}</span>
        </button>

        <div
          className="pitch-status"
          style={{ color: hasTrackableStatus ? displayStatus.color : pillarColor }}
        >
          {hasTrackableStatus ? displayStatus.label : pillarLabel}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddWeeklyUpdate();
          }}
          title="Adicionar weekly update"
          aria-label="Adicionar weekly update"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {expanded && latestUpdate ? (
        <div className="os-pitch-row-detail">
          <p className="detail-label">Último update — semana {latestUpdate.week_start}</p>
          {latestUpdate.what_done ? (
            <p>{latestUpdate.what_done}</p>
          ) : (
            <p className="text-ta-muted-2">Sem descrição.</p>
          )}
          {latestUpdate.blockers ? (
            <p className="mt-2 text-xs text-ta-muted">
              <span className="font-semibold uppercase tracking-wide">Blockers:</span>{" "}
              {latestUpdate.blockers}
            </p>
          ) : null}
        </div>
      ) : expanded ? (
        <div className="os-pitch-row-detail">
          <p className="text-ta-muted-2">Nenhum weekly update ainda.</p>
          <button
            type="button"
            onClick={onAddWeeklyUpdate}
            className="mt-2 text-xs font-medium uppercase tracking-wide underline"
          >
            Adicionar primeiro update
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { getBetDisplayStatus } from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateRow, OsBlockType } from "@/lib/os-types";

const PILLAR_TONE: Record<OsBlockType, "amber" | "cyan" | "green"> = {
  finance: "amber",
  growth: "cyan",
  ops: "green",
};

const PILLAR_TAG_LABEL: Record<OsBlockType, string> = {
  finance: "Finance",
  growth: "Growth",
  ops: "Operations",
};

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
  const tone = PILLAR_TONE[blockType];
  const tagLabel = PILLAR_TAG_LABEL[blockType];
  const displayStatus = getBetDisplayStatus(bet, latestUpdate);

  return (
    <div className="os-pitch-row">
      <button
        type="button"
        className="chev-btn"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-label={expanded ? "Recolher update" : "Expandir último update"}
      >
        {expanded ? "▴" : "▾"}
      </button>
      <span className={`dot ${tone}`} aria-hidden />
      <button type="button" className="pitch-title" onClick={onOpenPitch} title={bet.title}>
        {bet.title}
      </button>
      <span className={`tag ${tone}`}>{tagLabel}</span>
      <button
        type="button"
        className="add-btn"
        onClick={(e) => {
          e.stopPropagation();
          onAddWeeklyUpdate();
        }}
        title="Adicionar weekly update"
        aria-label="Adicionar weekly update"
      >
        +
      </button>

      {expanded ? (
        <div className="os-pitch-row-detail">
          {latestUpdate ? (
            <>
              <p className="detail-label">
                Último update — semana {latestUpdate.week_start} · {displayStatus.label}
              </p>
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
            </>
          ) : (
            <>
              <p className="text-ta-muted-2">Nenhum weekly update ainda.</p>
              <button
                type="button"
                onClick={onAddWeeklyUpdate}
                className="mt-2 text-xs font-medium uppercase tracking-wide underline"
              >
                Adicionar primeiro update
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { PILLAR_TONE, PILLAR_TAG_LABEL };

"use client";

import { getBetDisplayStatus } from "@/lib/os-queries";
import { osDivider, osLabelMuted } from "@/lib/os-ui";
import type { OsBetRow, OsBetUpdateRow } from "@/lib/os-types";

interface OsPitchExecutionRowProps {
  bet: OsBetRow;
  latestUpdate: OsBetUpdateRow | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenPitch: () => void;
  onAddWeeklyUpdate: () => void;
}

export function OsPitchExecutionRow({
  bet,
  latestUpdate,
  expanded,
  onToggleExpand,
  onOpenPitch,
  onAddWeeklyUpdate,
}: OsPitchExecutionRowProps) {
  const displayStatus = getBetDisplayStatus(bet, latestUpdate);

  return (
    <div className={`border-b last:border-b-0 ${osDivider}`}>
      <div className="flex items-stretch bg-white">
        <button
          type="button"
          onClick={onToggleExpand}
          className={`flex w-10 shrink-0 items-center justify-center border-r hover:bg-black/[0.03] ${osDivider}`}
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
          className={`flex min-w-0 items-center gap-2 border-r px-4 py-3 text-left hover:bg-black/[0.03] ${osDivider}`}
        >
          {bet.is_priority ? (
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center bg-black text-xs font-bold text-white"
              title="Pitch prioritário"
              aria-label="Pitch prioritário"
            >
              !
            </span>
          ) : null}
          <span className="truncate text-sm font-bold normal-case">{bet.title}</span>
        </button>

        <div
          className="flex flex-1 items-center justify-center px-2 py-3 text-center text-xs font-bold tracking-wide"
          style={{ color: displayStatus.color }}
        >
          {displayStatus.label}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddWeeklyUpdate();
          }}
          className={`flex w-12 shrink-0 items-center justify-center border-l hover:bg-black/[0.03] ${osDivider}`}
          title="Adicionar weekly update"
          aria-label="Adicionar weekly update"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {expanded && latestUpdate ? (
        <div className="border-t bg-black/[0.02] px-4 py-3 pl-14 normal-case border-black/[0.06]">
          <p className={`mb-1 ${osLabelMuted}`}>Último update — semana {latestUpdate.week_start}</p>
          {latestUpdate.what_done ? (
            <p className="text-sm text-black/80">{latestUpdate.what_done}</p>
          ) : (
            <p className={`text-sm ${osLabelMuted}`}>Sem descrição.</p>
          )}
          {latestUpdate.blockers ? (
            <p className="mt-2 text-xs text-black/60">
              <span className="font-bold uppercase">Blockers:</span> {latestUpdate.blockers}
            </p>
          ) : null}
        </div>
      ) : expanded ? (
        <div className="border-t bg-black/[0.02] px-4 py-3 pl-14 normal-case border-black/[0.06]">
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

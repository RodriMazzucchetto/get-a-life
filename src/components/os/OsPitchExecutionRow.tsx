"use client";

import { useState } from "react";
import {
  formatExecutionOwnerInitials,
  getBetDisplayStatus,
} from "@/lib/os-queries";
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
  const owner = formatExecutionOwnerInitials(bet.execution_owner);

  return (
    <div className="border-b-2 border-black last:border-b-0">
      <div className="flex items-stretch bg-white">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex w-10 shrink-0 items-center justify-center border-r-2 border-black hover:bg-black/[0.03]"
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
          className="flex min-w-0 flex-[2] items-center border-r-2 border-black px-4 py-3 text-left hover:bg-black/[0.03]"
        >
          <span className="truncate text-sm font-bold normal-case">{bet.title}</span>
          {bet.is_priority ? (
            <span className="ml-2 shrink-0 border border-black bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">
              ATIVO
            </span>
          ) : null}
        </button>

        <div
          className="flex flex-1 items-center justify-center border-r-2 border-black px-3 py-3 text-xs font-bold tracking-wide"
          style={{ color: displayStatus.color }}
        >
          {displayStatus.label}
        </div>

        <div className="flex w-16 shrink-0 items-center justify-center border-r-2 border-black py-3">
          <span className="flex h-8 w-8 items-center justify-center bg-black text-xs font-bold text-white">
            {owner}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddWeeklyUpdate();
          }}
          className="flex w-12 shrink-0 items-center justify-center hover:bg-black/[0.03]"
          title="Adicionar weekly update"
          aria-label="Adicionar weekly update"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {expanded && latestUpdate ? (
        <div className="border-t border-black/20 bg-black/[0.02] px-4 py-3 pl-14 normal-case">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-black/50">
            Último update — semana {latestUpdate.week_start}
          </p>
          {latestUpdate.what_done ? (
            <p className="text-sm text-black/80">{latestUpdate.what_done}</p>
          ) : (
            <p className="text-sm text-black/40">Sem descrição.</p>
          )}
          {latestUpdate.blockers ? (
            <p className="mt-2 text-xs text-black/60">
              <span className="font-bold uppercase">Blockers:</span> {latestUpdate.blockers}
            </p>
          ) : null}
        </div>
      ) : expanded ? (
        <div className="border-t border-black/20 bg-black/[0.02] px-4 py-3 pl-14 normal-case">
          <p className="text-sm text-black/40">Nenhum weekly update ainda.</p>
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

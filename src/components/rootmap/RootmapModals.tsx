"use client";

import { useRootmapModal } from "@/hooks/useRootmapModal";
import { OpportunityPanel } from "./OpportunityPanel";
import { RootmapOverlay } from "./RootmapOverlay";
import { SolutionPanel } from "./SolutionPanel";
import { TaskPanel } from "./TaskPanel";

export function RootmapModals() {
  const { active, close } = useRootmapModal();

  if (!active) return null;

  if (active.kind === "opp") {
    return (
      <RootmapOverlay backLabel="Voltar" onClose={close} width={700}>
        <OpportunityPanel id={active.id} />
      </RootmapOverlay>
    );
  }

  if (active.kind === "sol") {
    return (
      <RootmapOverlay backLabel="Voltar" onClose={close} width={700}>
        <SolutionPanel id={active.id} />
      </RootmapOverlay>
    );
  }

  return (
    <RootmapOverlay backLabel="Voltar" onClose={close} width={700}>
      <TaskPanel id={active.id} />
    </RootmapOverlay>
  );
}

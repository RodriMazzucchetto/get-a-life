"use client";

import { useDroppable } from "@dnd-kit/core";
import { osDropHighlight } from "@/lib/os-ui";

type OsDroppableColumnProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function OsDroppableColumn({ id, children, className = "" }: OsDroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[4rem] rounded-sm transition-colors ${isOver ? osDropHighlight : ""} ${className}`}
    >
      {children}
    </div>
  );
}

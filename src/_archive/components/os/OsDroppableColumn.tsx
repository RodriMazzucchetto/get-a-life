"use client";

import { useDroppable } from "@dnd-kit/core";
import { osDropHighlight } from "@/lib/os-ui";

type OsDroppableColumnProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  dropHighlightClass?: string;
};

export function OsDroppableColumn({
  id,
  children,
  className = "",
  dropHighlightClass = osDropHighlight,
}: OsDroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[4rem] transition-colors ${isOver ? dropHighlightClass : ""} ${className}`}
    >
      {children}
    </div>
  );
}

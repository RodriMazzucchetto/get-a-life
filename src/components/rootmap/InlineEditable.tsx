"use client";

import { useEffect, useRef } from "react";

/**
 * Texto com o mesmo visual do design (h1/p), editável no lugar.
 * Descontrolado após o mount para não resetar o cursor a cada tecla.
 */
export function InlineEditable({
  as: Tag = "div",
  value,
  className,
  placeholder,
  multiline = false,
  onCommit,
}: {
  as?: "h1" | "h2" | "p" | "div" | "span";
  value: string;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  onCommit: (next: string) => void | Promise<void>;
}) {
  const ref = useRef<HTMLElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (lastValue.current === value && ref.current.textContent === value) return;
    lastValue.current = value;
    ref.current.textContent = value;
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      className={`rm-editable ${className ?? ""}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      role="textbox"
      aria-multiline={multiline || undefined}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim();
        if (next === lastValue.current.trim()) {
          if (!next && placeholder) e.currentTarget.textContent = "";
          return;
        }
        lastValue.current = next;
        void onCommit(next);
      }}
    />
  );
}

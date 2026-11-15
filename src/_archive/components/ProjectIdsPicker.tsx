"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { projectShortCode } from "@/lib/problemHelpers";

export type ProjectLite = { id: string; name: string; color: string };

type Props = {
  projects: ProjectLite[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** compact = badges coloridos | line = igual às tasks (texto + cor, uma linha) */
  variant?: "default" | "compact" | "line";
  className?: string;
};

export function ProjectIdsPicker({
  projects,
  value,
  onChange,
  disabled,
  variant = "default",
  className = "",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const add = (id: string) => {
    if (!id || value.includes(id)) return;
    onChange([...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  const available = projects.filter((p) => !value.includes(p.id));

  useLayoutEffect(() => {
    if (!menuOpen || !buttonRef.current) {
      setMenuPos(null);
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isLine = variant === "line";

  const menu =
    menuOpen && menuPos && available.length > 0 ? (
      <ul
        ref={menuRef}
        role="listbox"
        style={{ top: menuPos.top, left: menuPos.left }}
        className="fixed z-[10000] min-w-[10.5rem] overflow-hidden rounded-lg border border-outline-variant/25 bg-white py-1 text-left shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-900"
      >
        {available.map((p) => (
          <li key={p.id} role="none">
            <button
              type="button"
              role="option"
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-on-surface transition-colors hover:bg-surface-container-low dark:hover:bg-slate-800"
              onClick={() => {
                add(p.id);
                setMenuOpen(false);
              }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: p.color || "#6366f1" }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">
                {variant === "compact" || variant === "line" ? (
                  <>
                    <span className="font-black uppercase tracking-wide">
                      {projectShortCode(p.name)}
                    </span>
                    <span className="text-on-surface-variant"> — {p.name}</span>
                  </>
                ) : (
                  p.name
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div
      className={`flex items-center gap-x-2 gap-y-1 ${
        isLine ? "min-w-0 flex-nowrap" : "flex-wrap"
      } ${className}`}
    >
      {value.map((id) => {
        const p = projects.find((x) => x.id === id);
        if (!p) return null;
        if (isLine) {
          return (
            <span
              key={id}
              className="inline-flex max-w-[7rem] shrink-0 items-center gap-0.5 sm:max-w-[10rem]"
              title={p.name}
            >
              <span
                className="truncate text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: p.color || "#64748b" }}
              >
                {p.name.trim().toUpperCase()}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="shrink-0 rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
                  style={{ color: p.color || "#64748b" }}
                  aria-label={`Remover ${p.name}`}
                >
                  ×
                </button>
              )}
            </span>
          );
        }
        return (
          <span
            key={id}
            className={`inline-flex max-w-[11rem] items-center gap-0.5 truncate rounded-md px-2 py-0.5 text-xs font-black tracking-wide text-white ring-1 ring-black/10 ${
              variant === "compact" ? "uppercase" : "font-semibold"
            }`}
            style={{ backgroundColor: p.color || "#6366f1" }}
            title={p.name}
          >
            {variant === "compact" ? projectShortCode(p.name) : p.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(id)}
                className="ml-0.5 shrink-0 rounded p-0.5 hover:bg-white/20"
                aria-label={`Remover ${p.name}`}
              >
                ×
              </button>
            )}
          </span>
        );
      })}
      {!disabled && available.length > 0 && (
        <div className="relative inline-flex shrink-0" ref={wrapRef}>
          <button
            ref={buttonRef}
            type="button"
            aria-label="Adicionar projeto"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
            onClick={() => setMenuOpen((o) => !o)}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-outline-variant/45 bg-surface-container-high text-on-surface-variant/90 shadow-sm transition-colors hover:border-outline-variant hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-800/80"
          >
            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden>
              add
            </span>
          </button>
          {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
        </div>
      )}
    </div>
  );
}

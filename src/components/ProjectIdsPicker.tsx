"use client";

import { useEffect, useRef, useState } from "react";
import { projectShortCode } from "@/lib/problemHelpers";

export type ProjectLite = { id: string; name: string; color: string };

type Props = {
  projects: ProjectLite[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** compact = badges curtos (problemas) */
  variant?: "default" | "compact";
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
  const wrapRef = useRef<HTMLDivElement>(null);

  const add = (id: string) => {
    if (!id || value.includes(id)) return;
    onChange([...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  const available = projects.filter((p) => !value.includes(p.id));

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
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

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {value.map((id) => {
        const p = projects.find((x) => x.id === id);
        if (!p) return null;
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
        <div className="relative inline-flex" ref={wrapRef}>
          <button
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
          {menuOpen && (
            <ul
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border border-outline-variant/25 bg-white py-1 text-left shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-900"
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
                      {variant === "compact" ? (
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
          )}
        </div>
      )}
    </div>
  );
}

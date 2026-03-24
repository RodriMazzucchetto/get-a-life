"use client";

import { projectShortCode } from "@/lib/problemHelpers";

export type ProjectLite = { id: string; name: string; color: string };

type Props = {
  projects: ProjectLite[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** compact = badge estilo problemas (maiúsculas curtas) */
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
  const add = (id: string) => {
    if (!id || value.includes(id)) return;
    onChange([...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((x) => x !== id));
  };

  const available = projects.filter((p) => !value.includes(p.id));

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
        <label className="inline-flex items-center gap-0.5">
          <span className="sr-only">Adicionar projeto</span>
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) add(v);
              e.target.value = "";
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`max-w-[10rem] cursor-pointer rounded-md border-0 bg-surface-container-high py-1 pl-2 pr-6 text-xs text-on-surface ring-1 ring-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/25 ${
              variant === "compact" ? "font-black uppercase tracking-wide" : ""
            }`}
          >
            <option value="">+ projeto</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {variant === "compact" ? `${projectShortCode(p.name)} — ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

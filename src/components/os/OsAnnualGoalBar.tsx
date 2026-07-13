"use client";

import { useEffect, useState } from "react";

interface OsAnnualGoalBarProps {
  year: number;
  value: string | null | undefined;
  onSave: (text: string) => Promise<void>;
}

export function OsAnnualGoalBar({ year, value, onSave }: OsAnnualGoalBarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  const display = (value ?? "").trim();

  const commit = async () => {
    const next = draft.trim();
    if (next === display) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="os-annual-goal">
      <div className="os-annual-goal-label">
        <span className="eyebrow">Annual Goal</span>
        <span className="year">{year}</span>
      </div>
      <div className="os-annual-goal-body">
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            disabled={saving}
            rows={2}
            placeholder="Clique para definir o objetivo anual da empresa…"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(value ?? "");
                setEditing(false);
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void commit();
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={`os-annual-goal-text ${display ? "" : "empty"}`}
            onClick={() => setEditing(true)}
            title="Clique para editar"
          >
            {display || "Clique para definir o objetivo anual…"}
          </button>
        )}
      </div>
    </div>
  );
}

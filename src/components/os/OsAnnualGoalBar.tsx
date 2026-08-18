"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface OsAnnualGoalBarProps {
  year: number;
  value: string | null | undefined;
  onSave: (text: string) => Promise<void>;
}

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "BR", "P", "DIV", "SPAN"]);

function isEmptyHtml(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text.length === 0;
}

function looksLikeHtml(raw: string) {
  return /<\/?[a-z][\s\S]*>/i.test(raw);
}

function escapeText(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeStrategyHtml(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        walk(el);
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        continue;
      }
      for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
      walk(el);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function toEditorHtml(raw: string) {
  if (!raw.trim()) return "";
  if (looksLikeHtml(raw)) return sanitizeStrategyHtml(raw);
  return escapeText(raw).replace(/\n/g, "<br>");
}

export function OsAnnualGoalBar({ year, value, onSave }: OsAnnualGoalBarProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useLayoutEffect(() => {
    if (focused) return;
    const next = toEditorHtml(value ?? "");
    setDraft(next);
    const el = editorRef.current;
    if (el && el.innerHTML !== next) el.innerHTML = next;
  }, [value, focused]);

  const empty = isEmptyHtml(draft);

  const emitDraft = () => {
    const el = editorRef.current;
    if (!el) return "";
    const html = sanitizeStrategyHtml(el.innerHTML);
    const next = isEmptyHtml(html) ? "" : html;
    setDraft(next);
    return next;
  };

  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand("bold");
    emitDraft();
  };

  const commit = async () => {
    const next = emitDraft();
    const current = toEditorHtml(value ?? "");
    if (next === current || (isEmptyHtml(next) && isEmptyHtml(current))) {
      setFocused(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setFocused(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="os-strategy">
      <div className="os-strategy-head">
        <span className="title">Strategy</span>
        <span className="year">{year}</span>
      </div>
      <div className={`os-strategy-card ${focused ? "focus" : ""} ${saving ? "saving" : ""}`}>
        <div className="os-strategy-toolbar">
          <button
            type="button"
            className="os-strategy-tool"
            title="Negrito (Ctrl+B)"
            aria-label="Negrito"
            disabled={saving}
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyBold}
          >
            B
          </button>
          <span className="hint">Enter para nova linha · Ctrl+B negrito</span>
        </div>
        {empty && !focused ? (
          <span className="os-strategy-placeholder">Clique para definir a estratégia do ano…</span>
        ) : null}
        <div
          ref={editorRef}
          className="os-strategy-editor"
          contentEditable={!saving}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Strategy"
          onInput={emitDraft}
          onFocus={() => setFocused(true)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              const restored = toEditorHtml(value ?? "");
              setDraft(restored);
              if (editorRef.current) editorRef.current.innerHTML = restored;
              setFocused(false);
              editorRef.current?.blur();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData("text/html");
            const text = e.clipboardData.getData("text/plain");
            if (html) {
              document.execCommand("insertHTML", false, sanitizeStrategyHtml(html));
            } else {
              document.execCommand("insertText", false, text);
            }
            emitDraft();
          }}
        />
      </div>
    </div>
  );
}

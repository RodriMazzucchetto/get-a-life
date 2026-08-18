"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface OsAnnualGoalBarProps {
  year: number;
  value: string | null | undefined;
  onSave: (text: string) => Promise<void>;
}

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "BR",
  "P",
  "DIV",
  "SPAN",
  "UL",
  "OL",
  "LI",
]);

const TOOLBAR: { cmd: string; label: string; title: string }[] = [
  { cmd: "bold", label: "B", title: "Negrito (Ctrl+B)" },
  { cmd: "italic", label: "I", title: "Itálico (Ctrl+I)" },
  { cmd: "underline", label: "U", title: "Sublinhado (Ctrl+U)" },
  { cmd: "insertUnorderedList", label: "•", title: "Lista com marcadores" },
  { cmd: "insertOrderedList", label: "1.", title: "Lista numerada" },
];

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

  for (const div of Array.from(doc.body.querySelectorAll("div"))) {
    const p = doc.createElement("p");
    p.innerHTML = div.innerHTML;
    div.replaceWith(p);
  }

  return doc.body.innerHTML.replace(/(<p>\s*<\/p>|<br>\s*)+$/gi, "").trim();
}

function toDisplayHtml(raw: string) {
  if (!raw.trim()) return "";
  if (looksLikeHtml(raw)) return sanitizeStrategyHtml(raw);
  const escaped = escapeText(raw);
  const paragraphs = escaped.split(/\n{2,}/);
  if (paragraphs.length === 1) return escaped.replace(/\n/g, "<br>");
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

export function OsAnnualGoalBar({ year, value, onSave }: OsAnnualGoalBarProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftHtml, setDraftHtml] = useState(() => toDisplayHtml(value ?? ""));

  const storedHtml = toDisplayHtml(value ?? "");
  const displayHtml = editing ? draftHtml : storedHtml;
  const empty = isEmptyHtml(displayHtml);

  useLayoutEffect(() => {
    if (!editing) return;
    const el = editorRef.current;
    if (!el) return;
    const html = draftHtml || "<p><br></p>";
    el.innerHTML = html;
    el.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init editor só ao entrar em edição
  }, [editing]);

  const emitDraft = () => {
    const el = editorRef.current;
    if (!el) return "";
    const html = sanitizeStrategyHtml(el.innerHTML);
    const next = isEmptyHtml(html) ? "" : html;
    setDraftHtml(next);
    return next;
  };

  const runCommand = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd);
    emitDraft();
  };

  const startEditing = () => {
    if (saving) return;
    setDraftHtml(storedHtml);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftHtml(storedHtml);
    setEditing(false);
  };

  const commit = async () => {
    const next = editing ? emitDraft() : storedHtml;
    if (next === storedHtml || (isEmptyHtml(next) && isEmptyHtml(storedHtml))) {
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
    <div className="os-strategy">
      <div className="os-strategy-head">
        <span className="title">Strategy</span>
        <span className="year">{year}</span>
      </div>

      {editing ? (
        <div className={`os-strategy-card editing ${saving ? "saving" : ""}`}>
          <div className="os-strategy-toolbar" role="toolbar" aria-label="Formatação">
            {TOOLBAR.map((item) => (
              <button
                key={item.cmd}
                type="button"
                className="os-strategy-tool"
                title={item.title}
                aria-label={item.title}
                disabled={saving}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runCommand(item.cmd)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            ref={editorRef}
            className="os-strategy-editor"
            contentEditable={!saving}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Strategy"
            onInput={emitDraft}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEditing();
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

          <div className="os-strategy-actions">
            <button
              type="button"
              className="os-strategy-action cancel"
              disabled={saving}
              onClick={cancelEditing}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="os-strategy-action save"
              disabled={saving}
              onClick={() => void commit()}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`os-strategy-card os-strategy-view ${empty ? "empty" : ""}`}
          onClick={startEditing}
          title="Clique para editar"
        >
          {empty ? (
            <span className="os-strategy-placeholder">Clique para definir a estratégia do ano…</span>
          ) : (
            <div
              className="os-strategy-display"
              dangerouslySetInnerHTML={{ __html: displayHtml }}
            />
          )}
        </button>
      )}
    </div>
  );
}

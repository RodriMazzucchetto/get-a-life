"use client";

import { useEffect, useRef, useState } from "react";
import { uploadOsGoalImage } from "@/lib/os-media";

interface OsGoalDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  userId: string | undefined;
  disabled?: boolean;
  placeholder?: string;
}

function isEmptyHtml(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text.length === 0 && !/<img\b/i.test(html);
}

export function OsGoalDescriptionEditor({
  value,
  onChange,
  userId,
  disabled,
  placeholder = "Contexto, problema ou detalhes que originaram esta meta…",
}: OsGoalDescriptionEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    onChange(isEmptyHtml(html) ? "" : html);
  };

  const insertImage = async (file: File) => {
    if (!userId || disabled) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadOsGoalImage(userId, file);
      const el = ref.current;
      if (!el) return;
      el.focus();
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Anexo da meta";
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && el.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        el.appendChild(document.createElement("br"));
        el.appendChild(img);
      }
      emit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative border border-ta-rule-2 bg-ta-paper transition-colors focus-within:border-ta-ink ${
          disabled ? "opacity-70" : ""
        }`}
      >
        {isEmptyHtml(value) && !disabled ? (
          <span className="pointer-events-none absolute left-3 top-2.5 font-sans text-sm text-ta-muted-2">
            {placeholder}
          </span>
        ) : null}
        <div
          ref={ref}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Problema ou detalhes da meta"
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            const items = Array.from(e.clipboardData?.items ?? []);
            const imageItem = items.find((item) => item.type.startsWith("image/"));
            if (imageItem) {
              e.preventDefault();
              const file = imageItem.getAsFile();
              if (file) void insertImage(file);
            }
          }}
          className="os-goal-desc-editor min-h-[120px] max-h-[280px] overflow-y-auto px-3 py-2.5 font-sans text-sm leading-relaxed text-ta-ink outline-none empty:before:content-['']"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || uploading || !userId}
          onClick={() => fileRef.current?.click()}
          className="border border-ta-rule-2 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ta-muted transition-colors hover:border-ta-ink hover:text-ta-ink disabled:opacity-40"
        >
          {uploading ? "A enviar…" : "+ Imagem / print"}
        </button>
        <span className="font-mono text-[10px] text-ta-muted-2">
          Também podes colar um print (Ctrl+V)
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void insertImage(file);
          }}
        />
      </div>
      {error ? <p className="font-sans text-xs font-semibold text-ta-red">{error}</p> : null}
    </div>
  );
}

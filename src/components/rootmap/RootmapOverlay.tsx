"use client";

import { useEffect } from "react";

export function RootmapOverlay({
  backLabel,
  onClose,
  children,
  width = 720,
}: {
  backLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(40,30,20,0.45)] px-4 py-8 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-auto w-full rounded-[16px] bg-[var(--rm-panel)] px-5 pb-12 pt-5 shadow-[0_30px_60px_-30px_rgba(40,30,20,0.45)] md:px-7"
        style={{ maxWidth: Math.max(width + 80, 900) }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="mb-4 flex items-center gap-2 text-[13px] font-bold"
          onClick={onClose}
        >
          ← {backLabel}
          <span className="rounded border border-[var(--rm-ink)] px-1 text-[10px]">
            ESC
          </span>
        </button>
        <div className="mx-auto" style={{ maxWidth: width }}>
          {children}
        </div>
      </div>
    </div>
  );
}

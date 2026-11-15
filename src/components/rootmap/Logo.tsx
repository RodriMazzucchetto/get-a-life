export function RootmapLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rm-display flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
      <span
        aria-hidden
        className="grid grid-cols-2 gap-[3px]"
        style={{ width: 21, height: 21 }}
      >
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: "oklch(0.55 0.2 28)" }} />
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: "oklch(0.5 0.18 295)" }} />
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: "oklch(0.5 0.14 245)" }} />
        <span className="h-[9px] w-[9px] rounded-full" style={{ background: "oklch(0.5 0.13 150)" }} />
      </span>
      {!compact && <span>Rootmap</span>}
    </div>
  );
}

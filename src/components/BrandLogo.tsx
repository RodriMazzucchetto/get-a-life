import { TA_WORDMARK } from "@/lib/ta-tokens";

type BrandLogoProps = {
  /** sidebar — lockup compacto; horizontal — header; icon — só o símbolo */
  variant?: "sidebar" | "horizontal" | "icon";
  className?: string;
  /** ink (default) ou paper para fundos escuros */
  tone?: "ink" | "paper";
};

export function BrandMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinejoin="miter"
      aria-hidden
    >
      <polygon points="50,10 90,50 50,90 10,50" />
      <line x1="50" y1="10" x2="50" y2="90" />
      <line x1="10" y1="50" x2="90" y2="50" />
    </svg>
  );
}

const WORDMARK_CLASS =
  "font-mono font-semibold uppercase tracking-[0.18em] whitespace-nowrap leading-none";

export function BrandLogo({
  variant = "sidebar",
  className = "",
  tone = "ink",
}: BrandLogoProps) {
  const colorClass = tone === "paper" ? "text-ta-paper" : "text-ta-ink";

  if (variant === "icon") {
    return (
      <span className={`inline-flex ${colorClass} ${className}`} aria-label={TA_WORDMARK}>
        <BrandMark size={32} />
      </span>
    );
  }

  const markSize = variant === "horizontal" ? 36 : 26;
  const textSize = variant === "horizontal" ? "text-sm" : "text-[11px]";

  return (
    <div className={`inline-flex items-center gap-3 ${colorClass} ${className}`}>
      <BrandMark size={markSize} />
      <span className={`${WORDMARK_CLASS} ${textSize}`}>{TA_WORDMARK}</span>
    </div>
  );
}

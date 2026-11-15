"use client";

function PitchPriorityToggle({
  isPriority,
  disabled,
  onToggle,
  size = "sm",
}: {
  isPriority: boolean;
  disabled?: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  const boxSize = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const dotSize = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={disabled}
      className={`flex ${boxSize} shrink-0 items-center justify-center border-[1.5px] border-ta-ink transition-colors focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-ta-paper-2"
      } ${isPriority ? "bg-ta-ink" : "bg-ta-paper"}`}
      title={
        isPriority
          ? "Aposta priorizada — clique para voltar ao backlog (outras priorizadas permanecem)"
          : "Priorizar esta aposta (pode haver várias por meta)"
      }
      aria-pressed={isPriority}
      aria-label={isPriority ? "Remover prioridade" : "Priorizar aposta"}
    >
      {isPriority ? (
        <span className={`block ${dotSize} bg-ta-cyan`} aria-hidden />
      ) : (
        <span className={`block ${dotSize} border border-ta-ink/30`} aria-hidden />
      )}
    </button>
  );
}

export { PitchPriorityToggle };

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
      className={`flex ${boxSize} shrink-0 items-center justify-center border-2 border-black transition-colors focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-black/[0.04]"
      } ${isPriority ? "bg-black" : "bg-white"}`}
      title={
        isPriority
          ? "Pitch em execução — clique para remover"
          : "Marcar como pitch em execução"
      }
      aria-pressed={isPriority}
      aria-label={isPriority ? "Remover prioridade de execução" : "Marcar como em execução"}
    >
      {isPriority ? (
        <span className={`block ${dotSize} bg-white`} aria-hidden />
      ) : (
        <span className={`block ${dotSize} border border-black/20`} aria-hidden />
      )}
    </button>
  );
}

export { PitchPriorityToggle };

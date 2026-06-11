"use client";

function PitchPriorityToggle({
  isPriority,
  disabled,
  onToggle,
}: {
  isPriority: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={disabled}
      className={`shrink-0 rounded-md p-1 transition-colors focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-black/[0.04]"
      }`}
      title={
        isPriority
          ? "Pitch prioritário — clique para remover"
          : "Marcar como pitch prioritário"
      }
      aria-pressed={isPriority}
      aria-label={isPriority ? "Remover prioridade" : "Marcar como prioritário"}
    >
      <svg
        className={`h-4 w-4 ${isPriority ? "text-red-500" : "text-black/30"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M14.4 6L14 4H5v17h2v-8h5.6l.4 2h7V6z" />
      </svg>
    </button>
  );
}

export { PitchPriorityToggle };

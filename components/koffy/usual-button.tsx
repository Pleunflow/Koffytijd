"use client";

/** De grote lichtgele knop "… met mijn vaste bestelling" + drankje · optie + →. */
export function UsualButton({
  caption,
  label,
  disabled,
  onClick,
}: {
  caption: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mb-3 flex w-full items-center justify-between gap-3 rounded-btn-lg border-2 border-toppy-yellow bg-toppy-yellow-light px-4 py-3.5 text-left transition-colors duration-[120ms] hover:bg-toppy-yellow active:scale-[0.99] disabled:opacity-50"
    >
      <span>
        <span className="block text-xs font-semibold text-toppy-grey-darker">{caption}</span>
        <span className="block text-base font-bold text-toppy-ink">{label}</span>
      </span>
      <span className="flex-none text-[22px] font-bold text-toppy-ink">&#8594;</span>
    </button>
  );
}

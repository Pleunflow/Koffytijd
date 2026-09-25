"use client";

import { ToppyIcon } from "@/components/icons";

type Props = {
  onHome: () => void;
  round: { heart: string; officeName: string; clock: string } | null;
};

export function Header({ onHome, round }: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-toppy-ink px-8 py-3.5 text-white shadow-header">
      <button type="button" onClick={onHome} className="flex items-center gap-3">
        <ToppyIcon size={30} className="text-toppy-yellow" />
        <span className="text-[21px] font-bold tracking-[0.2px]">
          Koffy<span className="text-toppy-yellow">tijd</span>
        </span>
      </button>
      {round && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/12 px-3 py-1.5 text-[13px] font-semibold text-white">
            {round.heart} {round.officeName}
          </span>
          <span className="rounded-pill bg-toppy-yellow px-4 py-1.5 text-base font-bold text-toppy-ink tabular-nums">
            {round.clock}
          </span>
        </div>
      )}
    </header>
  );
}

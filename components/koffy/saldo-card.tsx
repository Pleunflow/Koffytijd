"use client";

import type { OfficeState } from "@/lib/api-client";
import { formatSaldo, isBijna, opdrachtText, owesOpdracht } from "@/lib/saldo";
import { cn } from "@/lib/utils";
import { Card } from "./parts";

type Props = {
  saldi: OfficeState["saldi"];
  officeName: string;
  compact?: boolean;
  onOpdrachtDone: (userId: string) => void;
};

export function SaldoCard({ saldi, officeName, compact = false, onOpdrachtDone }: Props) {
  const opdrachten = saldi.filter((s) => owesOpdracht(s.value));
  // Nog niemand heeft een saldo in dit kantoor: dan is er niets te tonen.
  if (saldi.length === 0) return null;

  return (
    <Card soft={compact} className={cn("text-left", compact ? "p-5" : "px-6 py-[22px]")}>
      {compact ? (
        <div className="mb-3 text-[13px] font-bold text-toppy-grey-darker">Koffiesaldo</div>
      ) : (
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
          <span className="text-[15px] font-bold">Koffiesaldo · {officeName}</span>
          <span className="text-xs text-toppy-grey-dark">
            +1 per drankje gehaald, −1 per drankje laten halen
          </span>
        </div>
      )}

      <div className="flex flex-col gap-[9px]">
        {saldi.map((s, idx) => {
          const owes = owesOpdracht(s.value);
          const warn = isBijna(s.value);
          return (
            <div
              key={s.userId}
              className={cn("flex items-center gap-2.5", compact ? "text-sm" : "text-[15px]")}
            >
              <span className={cn("text-center", compact ? "w-[18px]" : "w-5")}>
                {idx === 0 && s.value > 0 ? "👑" : ""}
              </span>
              <span className={cn("flex-1 font-semibold", owes && "text-toppy-red")}>{s.name}</span>
              {owes && (
                <span
                  className={cn(
                    "rounded-pill bg-toppy-red-light font-bold text-toppy-red",
                    compact ? "px-2 py-0.5 text-[10px]" : "px-[9px] py-0.5 text-[11px]",
                  )}
                >
                  opdracht!
                </span>
              )}
              {warn && !compact && (
                <span
                  className={cn(
                    "rounded-pill bg-toppy-yellow-light font-bold text-toppy-ink",
                    compact ? "px-2 py-0.5 text-[10px]" : "px-[9px] py-0.5 text-[11px]",
                  )}
                >
                  bijna!
                </span>
              )}
              <span
                className={cn(
                  "font-bold tabular-nums",
                  owes ? "text-toppy-red" : s.value > 0 ? "text-toppy-green" : "text-toppy-ink",
                )}
              >
                {formatSaldo(s.value)}
              </span>
            </div>
          );
        })}
      </div>

      {opdrachten.map((s) => (
        <div
          key={s.userId}
          className={cn(
            "flex flex-col gap-2.5 rounded-md border-2 border-toppy-red bg-toppy-red-light",
            compact ? "mt-3 px-[13px] py-[11px]" : "mt-3.5 px-3.5 py-3",
          )}
        >
          <span
            className={cn(
              "font-semibold text-toppy-ink",
              compact ? "text-[13px]" : "text-[13.5px]",
            )}
          >
            ⚠️ {opdrachtText(s.name, s.value)}
          </span>
          <button
            type="button"
            onClick={() => onOpdrachtDone(s.userId)}
            className="self-start rounded-pill border-2 border-toppy-ink bg-white px-3.5 py-[7px] text-[13px] font-semibold text-toppy-ink hover:bg-toppy-grey-lighter active:scale-[0.97]"
          >
            Opdracht gedaan, saldo naar 0
          </button>
        </div>
      ))}
    </Card>
  );
}

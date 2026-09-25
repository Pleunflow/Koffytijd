"use client";

import { MegaphoneIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { OfficeState, RoundView } from "@/lib/api-client";
import { usualLabel } from "@/lib/menu";
import { cn } from "@/lib/utils";
import { Card, firstName } from "./parts";
import { UsualButton } from "./usual-button";

type Props = {
  state: OfficeState;
  round: RoundView;
  clock: string;
  secondsLeft: number;
  closed: boolean;
  busy: boolean;
  onJoinUsual: () => void;
  onJoinOther: () => void;
  onSkip: () => void;
};

export function JoinScreen({
  state,
  round,
  clock,
  secondsLeft,
  closed,
  busy,
  onJoinUsual,
  onJoinOther,
  onSkip,
}: Props) {
  const usual = state.me.usual;
  const others = round.orders.filter(
    (o) => o.userId !== state.me.id && o.userId !== round.haler?.id && o.drinkType !== "skip",
  );

  return (
    <div className="mx-auto mt-6 max-w-[620px] animate-kt-rise">
      <div className="rounded-hero bg-toppy-yellow px-7 py-[30px] text-center shadow-yellow">
        <div className="mb-3.5 inline-flex size-16 -rotate-3 items-center justify-center rounded-[18px] bg-toppy-ink text-toppy-yellow">
          <MegaphoneIcon size={38} />
        </div>
        <h1 className="mb-2.5 text-5xl leading-[1.05] font-bold text-toppy-ink">Koffytijd!</h1>
        <p className="mb-[18px] text-lg font-semibold text-toppy-ink">
          {firstName(round.haler?.name ?? "")} haalt koffie voor {state.office.heart}{" "}
          {state.office.name}
        </p>
        <div className="inline-flex items-baseline gap-2.5 rounded-pill bg-toppy-ink px-[22px] py-2.5 text-white">
          <span className="text-sm text-toppy-grey">nog</span>
          <span
            className={cn(
              "text-[30px] font-bold tabular-nums",
              closed ? "text-toppy-grey" : secondsLeft <= 30 ? "text-toppy-red" : "text-white",
            )}
          >
            {clock}
          </span>
        </div>
        <p className="mt-3.5 text-sm text-toppy-ink">{others.length} collega&apos;s doen al mee</p>
      </div>

      {closed ? (
        <div className="mt-4 rounded-card bg-white p-[22px] text-center text-base font-semibold text-toppy-ink">
          Te laat, de ronde is gesloten. Volgende keer sneller!
        </div>
      ) : (
        <Card className="mt-4 p-6">
          {usual && (
            <UsualButton
              caption="Doe mee met je vaste bestelling"
              label={usualLabel(usual)}
              disabled={busy}
              onClick={onJoinUsual}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="lg" disabled={busy} onClick={onSkip}>
              Ik sla &apos;n beurtje over
            </Button>
            <div className="min-w-[200px] flex-1">
              {usual ? (
                <Button variant="outline" size="lg" fullWidth disabled={busy} onClick={onJoinOther}>
                  Doe mee, maar vandaag iets anders
                </Button>
              ) : (
                <Button size="lg" fullWidth disabled={busy} onClick={onJoinOther}>
                  Doe mee
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

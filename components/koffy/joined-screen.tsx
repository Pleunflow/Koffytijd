"use client";

import { Button } from "@/components/ui/button";
import type { OfficeState, RoundView } from "@/lib/api-client";
import { drinkPhrase } from "@/lib/menu";
import { cn } from "@/lib/utils";
import { Card, firstName, ParticipantList } from "./parts";

type Props = {
  state: OfficeState;
  round: RoundView;
  clock: string;
  secondsLeft: number;
  closed: boolean;
  onChange: () => void;
};

export function JoinedScreen({ state, round, clock, secondsLeft, closed, onChange }: Props) {
  const mine = round.orders.find((o) => o.userId === state.me.id);
  const haler = firstName(round.haler?.name ?? "");
  const text = !mine
    ? ""
    : mine.drinkType === "skip"
      ? "Je slaat deze ronde over."
      : `${haler} neemt je ${drinkPhrase(mine)} mee.`;

  return (
    <div className="mx-auto mt-6 max-w-[620px] animate-kt-rise">
      <Card className="rounded-hero px-7 py-[30px] text-center">
        <div className="mb-3.5 inline-flex size-16 items-center justify-center rounded-full bg-toppy-green">
          <span
            aria-hidden
            className="mt-[-4px] block h-[22px] w-3 rotate-45 border-r-[5px] border-b-[5px] border-white"
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold">Je staat op de lijst!</h1>
        <p className="mb-[18px] text-[17px] text-toppy-grey-darker">{text}</p>
        <div className="inline-flex items-baseline gap-2.5 rounded-pill bg-toppy-ink px-5 py-2 text-white">
          <span className="text-[13px] text-toppy-grey">
            {closed ? "Ronde gesloten" : "Nog te bestellen"}
          </span>
          <span
            className={cn(
              "text-[22px] font-bold tabular-nums",
              closed ? "text-toppy-grey" : secondsLeft <= 30 ? "text-toppy-red" : "text-white",
            )}
          >
            {clock}
          </span>
        </div>
      </Card>

      <Card soft className="mt-4 px-[22px] py-5">
        <div className="mb-3 text-[13px] font-bold text-toppy-grey-darker">Wie doen er mee</div>
        <ParticipantList orders={round.orders} meId={state.me.id} showTags={false} />
      </Card>

      {!closed && (
        <div className="mt-3.5 flex justify-center">
          <Button variant="ghost" size="md" onClick={onChange}>
            Bestelling wijzigen
          </Button>
        </div>
      )}
    </div>
  );
}

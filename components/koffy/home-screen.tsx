"use client";

import { MegaphoneIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { OfficeState } from "@/lib/api-client";
import { usualLabel } from "@/lib/menu";
import { Card, FieldLabel, PillChip } from "./parts";
import { SaldoCard } from "./saldo-card";
import { UsualButton } from "./usual-button";

export type OfficeOption = { id: string; name: string; heartEmoji: string };

type Props = {
  offices: OfficeOption[];
  state: OfficeState;
  busy: boolean;
  onSelectOffice: (officeId: string) => void;
  onStart: (withUsual: boolean) => void;
  onOpdrachtDone: (userId: string) => void;
};

export function HomeScreen({
  offices,
  state,
  busy,
  onSelectOffice,
  onStart,
  onOpdrachtDone,
}: Props) {
  const usual = state.me.usual;

  return (
    <div className="mx-auto mt-6 max-w-[620px] animate-kt-rise text-center">
      <div className="mb-[22px] inline-flex size-[76px] -rotate-3 items-center justify-center rounded-hero bg-toppy-yellow text-toppy-ink shadow-yellow-icon">
        <MegaphoneIcon size={38} />
      </div>
      <h1 className="mb-3.5 text-[52px] leading-[1.05] font-bold text-balance">
        Wie roept er
        <br />
        <span className="mt-1.5 inline-block -rotate-2 rounded-[5px] bg-toppy-yellow px-4 py-0.5 text-toppy-ink">
          Koffytijd?
        </span>
      </h1>
      <p className="mx-auto mb-[30px] max-w-[440px] text-[17px] leading-[1.55] text-toppy-grey-darker">
        Wie roept, haalt. Je collega&apos;s krijgen <strong>2 minuten</strong> om hun bestelling
        door te geven. Jij krijgt het lijstje en gaat halen.
      </p>

      <Card className="px-6 py-[26px] text-left">
        <FieldLabel>Voor welk kantoor?</FieldLabel>
        <div className="mb-[18px] flex flex-wrap gap-2.5">
          {offices.map((o) => (
            <PillChip
              key={o.id}
              selected={o.id === state.office.id}
              disabled={busy}
              onClick={() => o.id !== state.office.id && onSelectOffice(o.id)}
            >
              {o.heartEmoji} {o.name}
            </PillChip>
          ))}
        </div>

        {usual ? (
          <>
            <UsualButton
              caption="Ik haal, met mijn vaste bestelling"
              label={usualLabel(usual)}
              disabled={busy}
              onClick={() => onStart(true)}
            />
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={busy}
              onClick={() => onStart(false)}
            >
              Ik haal, en neem vandaag iets anders
            </Button>
          </>
        ) : (
          <Button size="lg" fullWidth disabled={busy} onClick={() => onStart(false)}>
            Ik haal! Koffytijd roepen
          </Button>
        )}
        <p className="mt-3.5 text-center text-[13px] text-toppy-grey-dark">
          Met deze knop beloof je dat jij de koffie gaat halen.
        </p>
      </Card>

      <div className="mt-4">
        <SaldoCard
          saldi={state.saldi}
          officeName={state.office.name}
          onOpdrachtDone={onOpdrachtDone}
        />
      </div>
    </div>
  );
}

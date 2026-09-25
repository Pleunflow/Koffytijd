"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OrderView } from "@/lib/api-client";
import {
  COFFEE_STRENGTHS,
  COFFEES,
  coffeeFollowUp,
  DEFAULT_COFFEE_STRENGTH,
  DEFAULT_TEA_FLAVOR,
  DEFAULT_WATER_STRENGTH,
  type DrinkChoice,
  TEA_FLAVORS,
  WATER_FLAVORS,
  WATER_STRENGTHS,
} from "@/lib/menu";
import { Card, Checkbox, ChoiceButton, firstName, ParticipantList, SectionLabel } from "./parts";

type Form = {
  cat: "koffie" | "water";
  coffee: string;
  strength: string;
  teaFlavor: string;
  flavor: string;
  waterStrength: string;
};

const DEFAULTS: Form = {
  cat: "koffie",
  coffee: "Cappuccino",
  strength: DEFAULT_COFFEE_STRENGTH,
  teaFlavor: DEFAULT_TEA_FLAVOR,
  flavor: "Bosbes",
  waterStrength: DEFAULT_WATER_STRENGTH,
};

/** Begin met je huidige bestelling (bij wijzigen), anders je vaste, anders de standaard. */
function initialForm(start: DrinkChoice | null): Form {
  if (!start || start.drinkType === "skip") return DEFAULTS;
  if (start.drinkType === "water") {
    return { ...DEFAULTS, cat: "water", flavor: start.drink, waterStrength: start.option };
  }
  const follow = coffeeFollowUp(start.drink);
  return {
    ...DEFAULTS,
    cat: "koffie",
    coffee: start.drink,
    strength: follow === "strength" ? start.option : DEFAULT_COFFEE_STRENGTH,
    teaFlavor: follow === "tea" ? start.option : DEFAULT_TEA_FLAVOR,
  };
}

function toChoice(f: Form): DrinkChoice {
  if (f.cat === "water") return { drinkType: "water", drink: f.flavor, option: f.waterStrength };
  const follow = coffeeFollowUp(f.coffee);
  return {
    drinkType: "koffie",
    drink: f.coffee,
    option: follow === "strength" ? f.strength : follow === "tea" ? f.teaFlavor : "",
  };
}

type Props = {
  myName: string;
  meId: string;
  clock: string;
  hasUsual: boolean;
  start: DrinkChoice | null;
  busy: boolean;
  /** Alleen voor de haler: de live lijst "Wie doen er al mee". */
  incoming: OrderView[] | null;
  onSubmit: (choice: DrinkChoice, saveUsual: boolean) => void;
  onSkip: () => void;
};

export function OrderScreen({
  myName,
  meId,
  clock,
  hasUsual,
  start,
  busy,
  incoming,
  onSubmit,
  onSkip,
}: Props) {
  const [form, setForm] = useState<Form>(() => initialForm(start));
  // Standaard aan als je nog geen vaste bestelling hebt, uit als je er al een hebt.
  const [saveUsual, setSaveUsual] = useState(!hasUsual);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const follow = coffeeFollowUp(form.coffee);

  return (
    <div className="mx-auto max-w-[720px] animate-kt-rise-fast">
      <p className="mb-1.5 text-[13px] font-semibold tracking-[0.08em] text-toppy-grey-dark uppercase">
        De klok tikt &#8212; {clock}
      </p>
      <h1 className="mb-6 text-[38px] leading-tight font-bold">
        Wat wil jij, {firstName(myName)}?
      </h1>

      <div className="mb-[26px] flex gap-2.5">
        {(
          [
            ["koffie", "☕", "Koffie"],
            ["water", "💧", "Water met smaakje"],
          ] as const
        ).map(([cat, emoji, label]) => (
          <ChoiceButton
            key={cat}
            selected={form.cat === cat}
            onClick={() => set({ cat })}
            className="flex-1 rounded-btn-lg p-4 text-center text-base"
          >
            {emoji} {label}
          </ChoiceButton>
        ))}
      </div>

      {form.cat === "koffie" && (
        <>
          <SectionLabel>Kies je koffie</SectionLabel>
          <div className="mb-[26px] grid grid-cols-2 gap-2.5">
            {COFFEES.map((c) => (
              <ChoiceButton
                key={c.name}
                selected={form.coffee === c.name}
                onClick={() => set({ coffee: c.name })}
              >
                {c.emoji} {c.name}
              </ChoiceButton>
            ))}
          </div>

          {follow === "tea" && (
            <>
              <SectionLabel>Welk theetje?</SectionLabel>
              <div className="mb-[26px] grid grid-cols-2 gap-2.5">
                {TEA_FLAVORS.map((t) => (
                  <ChoiceButton
                    key={t.name}
                    selected={form.teaFlavor === t.name}
                    onClick={() => set({ teaFlavor: t.name })}
                  >
                    {t.emoji} {t.name}
                  </ChoiceButton>
                ))}
              </div>
            </>
          )}

          {follow === "strength" && (
            <>
              <SectionLabel>Hoe sterk?</SectionLabel>
              <div className="mb-[26px] flex gap-2.5">
                {COFFEE_STRENGTHS.map((s) => (
                  <ChoiceButton
                    key={s.name}
                    selected={form.strength === s.name}
                    onClick={() => set({ strength: s.name })}
                    className="flex-1 p-3.5 text-center"
                  >
                    {s.emoji} {s.name}
                  </ChoiceButton>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {form.cat === "water" && (
        <>
          <SectionLabel>Water met smaakje</SectionLabel>
          <div className="mb-[26px] grid grid-cols-2 gap-2.5">
            {WATER_FLAVORS.map((f) => (
              <ChoiceButton
                key={f.name}
                selected={form.flavor === f.name}
                onClick={() => set({ flavor: f.name })}
              >
                {f.emoji} {f.name}
              </ChoiceButton>
            ))}
          </div>
          <SectionLabel>Hoe sterk?</SectionLabel>
          <div className="mb-[26px] flex gap-2.5">
            {WATER_STRENGTHS.map((s) => (
              <ChoiceButton
                key={s.name}
                selected={form.waterStrength === s.name}
                onClick={() => set({ waterStrength: s.name })}
                className="flex-1 p-3.5 text-center"
              >
                {s.emoji} {s.name}
              </ChoiceButton>
            ))}
          </div>
        </>
      )}

      <div className="mb-[26px]">
        <Checkbox
          checked={saveUsual}
          onChange={setSaveUsual}
          label={
            hasUsual
              ? "Maak dit mijn nieuwe vaste bestelling"
              : "Onthoud dit als mijn vaste bestelling"
          }
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" disabled={busy} onClick={onSkip}>
          Ik sla &apos;n beurtje over
        </Button>
        <Button
          size="lg"
          fullWidth
          disabled={busy}
          onClick={() => onSubmit(toChoice(form), saveUsual)}
        >
          Zet op de lijst
        </Button>
      </div>

      {incoming && (
        <Card soft className="mt-6 px-[22px] py-5">
          <div className="mb-3 flex items-baseline justify-between gap-2.5">
            <span className="text-sm font-bold text-toppy-ink">Wie doen er al mee</span>
            <span className="text-xs text-toppy-grey-dark">live</span>
          </div>
          {incoming.length === 0 ? (
            <div className="text-sm text-toppy-grey-dark">
              Nog niemand. De eerste bestellingen komen zo binnen.
            </div>
          ) : (
            <ParticipantList orders={incoming} meId={meId} showTags />
          )}
        </Card>
      )}
    </div>
  );
}

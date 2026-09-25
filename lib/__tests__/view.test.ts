import { describe, expect, it } from "vitest";
import type { OfficeState, RoundView } from "@/lib/api-client";
import { deriveView, type ViewInput } from "@/lib/view";

const ME = "me";
const HALER = "haler";

function round(
  orders: { userId: string; drinkType?: "koffie" | "skip" }[],
  closed = false,
): RoundView {
  return {
    id: "r1",
    haler: { id: HALER, name: "Robin" },
    startedAt: "2026-09-25T10:00:00.000Z",
    endsAt: "2026-09-25T10:02:00.000Z",
    closedAt: closed ? "2026-09-25T10:02:00.000Z" : null,
    settled: closed,
    orders: orders.map((o, i) => ({
      id: `o${i}`,
      userId: o.userId,
      name: o.userId,
      drinkType: o.drinkType ?? "koffie",
      drink: "Cappuccino",
      option: "Normaal",
      done: false,
      createdAt: "2026-09-25T10:00:10.000Z",
    })),
  };
}

function input(partial: {
  meId?: string;
  active?: RoundView | null;
  recent?: RoundView | null;
  over?: Partial<ViewInput>;
}): ViewInput {
  const state = {
    serverNow: "",
    me: { id: partial.meId ?? ME, name: "Ik", officeId: "rookhok", usual: null },
    office: { id: "rookhok", name: "Rookhok", heart: "❤️" },
    activeRound: partial.active ?? null,
    recentRound: partial.recent ?? null,
    saldi: [],
  } as OfficeState;
  return {
    state,
    orderingRoundId: null,
    dismissed: new Set(),
    seenOpenRoundId: null,
    expired: false,
    ...partial.over,
  };
}

describe("deriveView", () => {
  it("geen ronde: startscherm", () => {
    expect(deriveView(input({})).name).toBe("home");
  });

  it("collega zonder bestelling ziet het meedoen-scherm, nooit het startscherm", () => {
    expect(deriveView(input({ active: round([]) })).name).toBe("join");
  });

  it("collega met bestelling ziet de bevestiging; wijzigen gaat naar het bestelscherm", () => {
    const r = round([{ userId: ME }]);
    expect(deriveView(input({ active: r })).name).toBe("joined");
    expect(deriveView(input({ active: r, over: { orderingRoundId: "r1" } })).name).toBe("order");
  });

  it("haler zonder eigen bestelling bestelt eerst, daarna het lijstje", () => {
    expect(deriveView(input({ meId: HALER, active: round([]) })).name).toBe("order");
    expect(deriveView(input({ meId: HALER, active: round([{ userId: HALER }]) })).name).toBe(
      "list",
    );
  });

  it("timer op 0: niet meer naar het bestelscherm", () => {
    const v = deriveView(
      input({ active: round([]), over: { expired: true, orderingRoundId: "r1" } }),
    );
    expect(v).toMatchObject({ name: "join", closed: true });
  });

  it("gesloten ronde: haler houdt het lijstje, deelnemer de bevestiging, tot wegklikken", () => {
    const r = round([{ userId: ME }], true);
    expect(deriveView(input({ meId: HALER, recent: r }))).toMatchObject({
      name: "list",
      closed: true,
    });
    expect(deriveView(input({ recent: r }))).toMatchObject({ name: "joined", closed: true });
    expect(deriveView(input({ recent: r, over: { dismissed: new Set(["r1"]) } })).name).toBe(
      "home",
    );
  });

  it("wie de ronde open had maar niets bestelde, ziet 'Te laat'", () => {
    const r = round([], true);
    expect(deriveView(input({ recent: r, over: { seenOpenRoundId: "r1" } }))).toMatchObject({
      name: "join",
      closed: true,
    });
    expect(deriveView(input({ recent: r })).name).toBe("home");
  });
});

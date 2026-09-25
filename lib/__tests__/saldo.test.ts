import { describe, expect, it } from "vitest";
import {
  computeSettlement,
  formatSaldo,
  isBijna,
  opdrachtFor,
  opdrachtText,
  OPDRACHTEN,
  owesOpdracht,
} from "@/lib/saldo";

describe("computeSettlement", () => {
  it("haler krijgt +1 per drankje voor een ander, z'n eigen drankje telt niet", () => {
    const events = computeSettlement("haler", [
      { userId: "haler", drinkType: "koffie" },
      { userId: "a", drinkType: "koffie" },
      { userId: "b", drinkType: "water" },
    ]);
    expect(events).toEqual([
      { userId: "haler", delta: 2, reason: "haal" },
      { userId: "a", delta: -1, reason: "besteld" },
      { userId: "b", delta: -1, reason: "besteld" },
    ]);
  });

  it("overslaan telt voor niemand mee", () => {
    const events = computeSettlement("haler", [
      { userId: "a", drinkType: "skip" },
      { userId: "b", drinkType: "koffie" },
    ]);
    expect(events).toEqual([
      { userId: "haler", delta: 1, reason: "haal" },
      { userId: "b", delta: -1, reason: "besteld" },
    ]);
  });

  it("geen events als de haler alleen voor zichzelf haalt", () => {
    expect(computeSettlement("haler", [{ userId: "haler", drinkType: "koffie" }])).toEqual([]);
    expect(computeSettlement("haler", [])).toEqual([]);
  });

  it("de som van alle deltas is altijd 0", () => {
    const events = computeSettlement("h", [
      { userId: "a", drinkType: "koffie" },
      { userId: "b", drinkType: "koffie" },
      { userId: "c", drinkType: "skip" },
      { userId: "h", drinkType: "water" },
    ]);
    expect(events.reduce((s, e) => s + e.delta, 0)).toBe(0);
  });
});

describe("opdrachtdrempel", () => {
  it("≤ −10 is een opdracht", () => {
    expect(owesOpdracht(-10)).toBe(true);
    expect(owesOpdracht(-14)).toBe(true);
    expect(owesOpdracht(-9)).toBe(false);
    expect(owesOpdracht(0)).toBe(false);
  });

  it("−7 t/m −9 is bijna!, verder niet", () => {
    expect([-6, -7, -8, -9, -10].map(isBijna)).toEqual([false, true, true, true, false]);
  });

  it("kiest per persoon altijd dezelfde opdracht uit de lijst", () => {
    expect(opdrachtFor("Mark")).toBe(opdrachtFor("Mark"));
    expect(OPDRACHTEN).toContain(opdrachtFor("Sanne"));
  });

  it("maakt de tekst uit de handoff", () => {
    expect(opdrachtText("Mark", -10)).toBe(`Mark staat op −10 en ${opdrachtFor("Mark")}`);
  });
});

describe("formatSaldo", () => {
  it("gebruikt + en een echte min", () => {
    expect(formatSaldo(4)).toBe("+4");
    expect(formatSaldo(-3)).toBe("−3");
    expect(formatSaldo(0)).toBe("0");
  });
});

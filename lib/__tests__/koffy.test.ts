import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { round, saldoEvent } from "@/db/schema";
import {
  closeRound,
  getOfficeState,
  getSaldo,
  placeOrder,
  resetOpdracht,
  ROUND_SECONDS,
  setOrderDone,
  settleRound,
  startRound,
} from "@/lib/koffy";
import { KoffyError } from "@/lib/koffy-errors";
import type { DrinkChoice } from "@/lib/menu";
import { at, closeTestDb, makeUser, resetDb, testDb } from "@/test/db";

const db = testDb();

const cappuccino: DrinkChoice = { drinkType: "koffie", drink: "Cappuccino", option: "Normaal" };
const water: DrinkChoice = { drinkType: "water", drink: "Limoen", option: "Subtiel" };
const skip: DrinkChoice = { drinkType: "skip", drink: "", option: "" };

async function expectKoffyError(p: Promise<unknown>, code: string) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(KoffyError);
  expect((err as KoffyError).code).toBe(code);
  return err as KoffyError;
}

async function saldoEvents(roundId: string) {
  return db.select().from(saldoEvent).where(eq(saldoEvent.roundId, roundId));
}

beforeEach(resetDb);
afterAll(closeTestDb);

describe("één actieve ronde per kantoor", () => {
  it("een tweede Koffytijd roepen geeft ROUND_ALREADY_ACTIVE met de lopende ronde", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const first = await startRound(db, robin, { withUsual: false }, at(0));

    const err = await expectKoffyError(
      startRound(db, sanne, { withUsual: false }, at(10)),
      "ROUND_ALREADY_ACTIVE",
    );
    expect(err.details.roundId).toBe(first.id);
  });

  it("andere kantoren kunnen tegelijk een ronde hebben", async () => {
    const robin = await makeUser("Robin", "rookhok");
    const lisa = await makeUser("Lisa", "beneeeje");
    await startRound(db, robin, { withUsual: false }, at(0));
    await expect(startRound(db, lisa, { withUsual: false }, at(1))).resolves.toBeDefined();
  });

  it("bij gelijktijdig roepen wint er precies één", async () => {
    const people = await Promise.all(["A", "B", "C", "D", "E"].map((n) => makeUser(n)));
    const results = await Promise.allSettled(
      people.map((p) => startRound(db, p, { withUsual: false }, at(0))),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    for (const r of rejected) {
      expect((r.reason as KoffyError).code).toBe("ROUND_ALREADY_ACTIVE");
    }
    const open = await db.select().from(round);
    expect(open).toHaveLength(1);
  });

  it("na ends_at kan er een nieuwe ronde gestart worden (de oude wordt eerst verrekend)", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const first = await startRound(db, robin, { withUsual: false }, at(0));
    await placeOrder(db, sanne, first.id, { choice: cappuccino, saveUsual: false }, at(5));

    const second = await startRound(db, sanne, { withUsual: false }, at(ROUND_SECONDS + 1));
    expect(second.id).not.toBe(first.id);

    const [old] = await db.select().from(round).where(eq(round.id, first.id));
    expect(old.settled).toBe(true);
    expect(old.closedAt?.toISOString()).toBe(first.endsAt.toISOString());
  });

  it("ends_at staat op de server: started_at + 120 s", async () => {
    const robin = await makeUser("Robin");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    expect(r.endsAt.getTime() - r.startedAt.getTime()).toBe(120_000);
  });
});

describe("bestellen na sluiten wordt geweigerd", () => {
  it("na ends_at: niet bestellen, niet wijzigen, niet overslaan", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const jeroen = await makeUser("Jeroen");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    await placeOrder(db, sanne, r.id, { choice: cappuccino, saveUsual: false }, at(10));

    const late = at(ROUND_SECONDS);
    await expectKoffyError(
      placeOrder(db, jeroen, r.id, { choice: cappuccino, saveUsual: false }, late),
      "ROUND_CLOSED",
    );
    await expectKoffyError(
      placeOrder(db, sanne, r.id, { choice: water, saveUsual: false }, late),
      "ROUND_CLOSED",
    );
    await expectKoffyError(
      placeOrder(db, jeroen, r.id, { choice: skip, saveUsual: false }, late),
      "ROUND_CLOSED",
    );
  });

  it("na Ronde afronden: ook binnen de 120 s niet meer bestellen", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    await closeRound(db, robin, r.id, at(30));
    await expectKoffyError(
      placeOrder(db, sanne, r.id, { choice: cappuccino, saveUsual: false }, at(31)),
      "ROUND_CLOSED",
    );
  });

  it("zolang de ronde open is, overschrijft wijzigen de bestelling", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    const first = await placeOrder(
      db,
      sanne,
      r.id,
      { choice: cappuccino, saveUsual: false },
      at(5),
    );
    const changed = await placeOrder(db, sanne, r.id, { choice: water, saveUsual: false }, at(50));
    expect(changed.id).toBe(first.id);
    expect(changed.drinkType).toBe("water");
  });

  it("je kunt niet bestellen in een ronde van een ander kantoor", async () => {
    const robin = await makeUser("Robin", "rookhok");
    const lisa = await makeUser("Lisa", "beneeeje");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    await expectKoffyError(
      placeOrder(db, lisa, r.id, { choice: cappuccino, saveUsual: false }, at(1)),
      "NOT_YOUR_OFFICE",
    );
  });
});

describe("verrekenen", () => {
  async function roundWithOrders() {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const jeroen = await makeUser("Jeroen");
    const priya = await makeUser("Priya");
    const r = await startRound(db, robin, { withUsual: false }, at(0));
    await placeOrder(db, robin, r.id, { choice: cappuccino, saveUsual: false }, at(1)); // eigen drankje
    await placeOrder(db, sanne, r.id, { choice: cappuccino, saveUsual: false }, at(2));
    await placeOrder(db, jeroen, r.id, { choice: water, saveUsual: false }, at(3));
    await placeOrder(db, priya, r.id, { choice: skip, saveUsual: false }, at(4));
    return { r, robin, sanne, jeroen, priya };
  }

  it("haler +1 per drankje voor een ander, collega's −1, overslaan 0", async () => {
    const { r, robin, sanne, jeroen, priya } = await roundWithOrders();
    const result = await closeRound(db, robin, r.id, at(60));
    expect(result).toMatchObject({ settled: true, fetched: 2 });

    expect(await getSaldo(db, "rookhok", robin.id)).toBe(2);
    expect(await getSaldo(db, "rookhok", sanne.id)).toBe(-1);
    expect(await getSaldo(db, "rookhok", jeroen.id)).toBe(-1);
    expect(await getSaldo(db, "rookhok", priya.id)).toBe(0);
  });

  it("twee keer Ronde afronden verrekent maar één keer", async () => {
    const { r, robin } = await roundWithOrders();
    await closeRound(db, robin, r.id, at(60));
    const again = await closeRound(db, robin, r.id, at(61));
    expect(again).toEqual({ settled: false });
    expect(await saldoEvents(r.id)).toHaveLength(3);
    expect(await getSaldo(db, "rookhok", robin.id)).toBe(2);
  });

  it("gelijktijdig verrekenen (afronden + lazy + nog eens) gebeurt precies één keer", async () => {
    const { r, robin } = await roundWithOrders();
    const results = await Promise.all([
      closeRound(db, robin, r.id, at(ROUND_SECONDS + 5)),
      settleRound(db, r.id, at(ROUND_SECONDS + 5)),
      settleRound(db, r.id, at(ROUND_SECONDS + 5)),
      getOfficeState(db, robin, "rookhok", at(ROUND_SECONDS + 5)),
    ]);
    const settledCount = results
      .slice(0, 3)
      .filter((x) => (x as { settled: boolean }).settled).length;
    expect(settledCount).toBe(1);
    expect(await saldoEvents(r.id)).toHaveLength(3);
    expect(await getSaldo(db, "rookhok", robin.id)).toBe(2);
  });

  it("ook als niemand op afronden klikt: het eerste request na ends_at verrekent", async () => {
    const { r, robin, sanne } = await roundWithOrders();

    // Vóór ends_at gebeurt er niets.
    await getOfficeState(db, sanne, "rookhok", at(ROUND_SECONDS - 1));
    expect(await saldoEvents(r.id)).toHaveLength(0);

    const state = await getOfficeState(db, sanne, "rookhok", at(ROUND_SECONDS + 1));
    expect(state.activeRound).toBeNull();
    expect(state.recentRound?.id).toBe(r.id);
    expect(state.recentRound?.closedAt).toBe(r.endsAt.toISOString());
    expect(await getSaldo(db, "rookhok", robin.id)).toBe(2);

    // Nog meer polls veranderen niets.
    await getOfficeState(db, sanne, "rookhok", at(ROUND_SECONDS + 3));
    await getOfficeState(db, robin, "rookhok", at(ROUND_SECONDS + 5));
    await closeRound(db, robin, r.id, at(ROUND_SECONDS + 6));
    expect(await saldoEvents(r.id)).toHaveLength(3);
    expect(await getSaldo(db, "rookhok", robin.id)).toBe(2);
  });

  it("verrekenen vóór ends_at zonder afronden doet niets", async () => {
    const { r } = await roundWithOrders();
    expect(await settleRound(db, r.id, at(30))).toEqual({ settled: false });
    const [row] = await db.select().from(round).where(eq(round.id, r.id));
    expect(row.settled).toBe(false);
    expect(row.closedAt).toBeNull();
  });

  it("alleen de haler kan afronden en afvinken", async () => {
    const { r, sanne } = await roundWithOrders();
    await expectKoffyError(closeRound(db, sanne, r.id, at(30)), "NOT_HALER");
    const state = await getOfficeState(db, sanne, "rookhok", at(30));
    const order = state.activeRound!.orders.find((o) => o.userId === sanne.id)!;
    await expectKoffyError(setOrderDone(db, sanne, order.id, true), "NOT_HALER");
  });
});

describe("opdrachtdrempel", () => {
  /** Laat `victim` n keer iets halen door `haler`. */
  async function owe(n: number) {
    const haler = await makeUser("Robin");
    const victim = await makeUser("Mark");
    for (let i = 0; i < n; i++) {
      const t = i * 1000;
      const r = await startRound(db, haler, { withUsual: false }, at(t));
      await placeOrder(db, victim, r.id, { choice: cappuccino, saveUsual: false }, at(t + 1));
      await closeRound(db, haler, r.id, at(t + 2));
    }
    return { haler, victim };
  }

  it("op −10: opdracht, en Opdracht gedaan zet het saldo op 0", async () => {
    const { haler, victim } = await owe(10);
    expect(await getSaldo(db, "rookhok", victim.id)).toBe(-10);

    const state = await getOfficeState(db, haler, "rookhok", at(20_000));
    expect(state.saldi.find((s) => s.userId === victim.id)?.value).toBe(-10);

    const res = await resetOpdracht(db, haler, "rookhok", victim.id, at(20_001));
    expect(res.previous).toBe(-10);
    expect(await getSaldo(db, "rookhok", victim.id)).toBe(0);

    const [event] = await db
      .select()
      .from(saldoEvent)
      .where(eq(saldoEvent.reason, "opdracht_reset"));
    expect(event).toMatchObject({ userId: victim.id, delta: 10, roundId: null });
  });

  it("op −9 is er nog geen opdracht", async () => {
    const { haler, victim } = await owe(9);
    await expectKoffyError(
      resetOpdracht(db, haler, "rookhok", victim.id, at(20_000)),
      "NO_OPDRACHT_DUE",
    );
    expect(await getSaldo(db, "rookhok", victim.id)).toBe(-9);
  });

  it("twee keer tegelijk Opdracht gedaan geeft maar één reset", async () => {
    const { haler, victim } = await owe(10);
    const results = await Promise.allSettled([
      resetOpdracht(db, haler, "rookhok", victim.id, at(20_000)),
      resetOpdracht(db, victim, "rookhok", victim.id, at(20_000)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await getSaldo(db, "rookhok", victim.id)).toBe(0);
  });
});

describe("vaste bestelling", () => {
  it("met vaste bestelling roepen zonder er een te hebben wordt geweigerd", async () => {
    const robin = await makeUser("Robin");
    await expectKoffyError(startRound(db, robin, { withUsual: true }, at(0)), "NO_USUAL_ORDER");
    expect(await db.select().from(round)).toHaveLength(0);
  });

  it("onthouden en daarna met 1 klik meedoen of roepen", async () => {
    const robin = await makeUser("Robin");
    const sanne = await makeUser("Sanne");
    const r1 = await startRound(db, robin, { withUsual: false }, at(0));
    await placeOrder(db, sanne, r1.id, { choice: water, saveUsual: true }, at(1));
    await placeOrder(db, robin, r1.id, { choice: cappuccino, saveUsual: true }, at(2));
    await closeRound(db, robin, r1.id, at(3));

    const r2 = await startRound(db, robin, { withUsual: true }, at(1000));
    await placeOrder(db, sanne, r2.id, { useUsual: true }, at(1001));
    const state = await getOfficeState(db, sanne, "rookhok", at(1002));
    expect(state.me.usual).toEqual(water);
    expect(state.activeRound!.orders.map((o) => [o.name, o.drink])).toEqual([
      ["Robin", "Cappuccino"],
      ["Sanne", "Limoen"],
    ]);
  });
});

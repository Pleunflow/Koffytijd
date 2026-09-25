import { and, asc, desc, eq, gt, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { office, order, round, saldoEvent, user, usualOrder } from "@/db/schema";
import { KoffyError } from "@/lib/koffy-errors";
import type { DrinkChoice } from "@/lib/menu";
import { computeSettlement, owesOpdracht } from "@/lib/saldo";

/*
 * Alle regels van Koffytijd. Elke functie krijgt de database en "nu" mee,
 * zodat tests de tijd kunnen laten verstrijken zonder te wachten.
 */

export const ROUND_SECONDS = 120;
/** Hoe lang een gesloten ronde nog getoond wordt (lijstje afvinken, "Te laat"). */
export const RECENT_ROUND_MINUTES = 15;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export type Actor = { id: string; officeId: string };

function isUniqueViolation(err: unknown): boolean {
  for (let e = err as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505") return true;
  }
  return false;
}

function assertOwnOffice(actor: Actor, officeId: string) {
  if (actor.officeId !== officeId) throw new KoffyError("NOT_YOUR_OFFICE");
}

// ---------------------------------------------------------------------------
// Verrekenen
// ---------------------------------------------------------------------------

export type SettleResult =
  { settled: false } | { settled: true; roundId: string; halerUserId: string; fetched: number };

/**
 * Sluit en verrekent een ronde, precies één keer.
 *
 * De UPDATE ... WHERE settled = false is de "claim": twee gelijktijdige aanroepen
 * worden door Postgres na elkaar uitgevoerd, en alleen de eerste krijgt een rij
 * terug. Alles gebeurt in één transactie, dus bij een fout wordt ook de claim
 * teruggedraaid.
 *
 * - `closeNow`: de haler klikt op Ronde afronden; de ronde sluit op `now`.
 * - anders: alleen als de ronde al voorbij `ends_at` is (lazy verrekenen).
 */
export async function settleRound(
  db: Db,
  roundId: string,
  now: Date,
  opts: { closeNow?: boolean } = {},
): Promise<SettleResult> {
  return db.transaction(async (tx) => {
    const closeNow = opts.closeNow ?? false;
    const [claimed] = await tx
      .update(round)
      .set({
        settled: true,
        closedAt: closeNow
          ? sql`COALESCE(${round.closedAt}, LEAST(${now.toISOString()}::timestamptz, ${round.endsAt}))`
          : sql`COALESCE(${round.closedAt}, ${round.endsAt})`,
      })
      .where(
        and(
          eq(round.id, roundId),
          eq(round.settled, false),
          closeNow ? undefined : or(isNotNull(round.closedAt), lte(round.endsAt, now)),
        ),
      )
      .returning({ id: round.id, officeId: round.officeId, halerUserId: round.halerUserId });

    if (!claimed) return { settled: false } as const;

    const orders = await tx
      .select({ userId: order.userId, drinkType: order.drinkType })
      .from(order)
      .where(eq(order.roundId, roundId));

    const events = computeSettlement(claimed.halerUserId, orders);
    if (events.length > 0) {
      await tx.insert(saldoEvent).values(
        events.map((e) => ({
          officeId: claimed.officeId,
          userId: e.userId,
          roundId,
          delta: e.delta,
          reason: e.reason,
          createdAt: now,
        })),
      );
    }
    const fetched = events.find((e) => e.reason === "haal")?.delta ?? 0;
    return { settled: true, roundId, halerUserId: claimed.halerUserId, fetched } as const;
  });
}

/** Verreken alle rondes in dit kantoor waarvan de tijd om is. Aan het begin van elk request. */
export async function settleDueRounds(db: Db, officeId: string, now: Date) {
  const due = await db
    .select({ id: round.id })
    .from(round)
    .where(
      and(
        eq(round.officeId, officeId),
        eq(round.settled, false),
        or(isNotNull(round.closedAt), lte(round.endsAt, now)),
      ),
    );
  for (const r of due) await settleRound(db, r.id, now);
}

// ---------------------------------------------------------------------------
// Rondes en bestellingen
// ---------------------------------------------------------------------------

async function findOpenRound(db: Executor, officeId: string) {
  const [r] = await db
    .select()
    .from(round)
    .where(and(eq(round.officeId, officeId), isNull(round.closedAt)))
    .limit(1);
  return r ?? null;
}

async function loadUsual(db: Executor, userId: string): Promise<DrinkChoice | null> {
  const [u] = await db.select().from(usualOrder).where(eq(usualOrder.userId, userId));
  if (!u) return null;
  return { drinkType: u.drinkType, drink: u.drink, option: u.option } as DrinkChoice;
}

/**
 * "Ik haal! Koffytijd roepen". Loopt er al een ronde, dan ROUND_ALREADY_ACTIVE
 * met het id van die ronde, zodat de client naar het meedoen-scherm gaat.
 */
export async function startRound(db: Db, actor: Actor, opts: { withUsual: boolean }, now: Date) {
  await settleDueRounds(db, actor.officeId, now);

  const existing = await findOpenRound(db, actor.officeId);
  if (existing) throw new KoffyError("ROUND_ALREADY_ACTIVE", { roundId: existing.id });

  const usual = opts.withUsual ? await loadUsual(db, actor.id) : null;
  if (opts.withUsual && !usual) throw new KoffyError("NO_USUAL_ORDER");

  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(round)
        .values({
          officeId: actor.officeId,
          halerUserId: actor.id,
          startedAt: now,
          endsAt: new Date(now.getTime() + ROUND_SECONDS * 1000),
        })
        .returning();
      if (usual) {
        await tx
          .insert(order)
          .values({ roundId: created.id, userId: actor.id, ...usual, createdAt: now });
      }
      return created;
    });
  } catch (err) {
    // Iemand anders was ons net voor (partial unique index op office_id).
    if (isUniqueViolation(err)) {
      const winner = await findOpenRound(db, actor.officeId);
      throw new KoffyError("ROUND_ALREADY_ACTIVE", { roundId: winner?.id ?? null });
    }
    throw err;
  }
}

export type PlaceOrderInput = { useUsual: true } | { choice: DrinkChoice; saveUsual: boolean };

/** Bestellen, wijzigen of overslaan. Alleen zolang de ronde open is. */
export async function placeOrder(
  db: Db,
  actor: Actor,
  roundId: string,
  input: PlaceOrderInput,
  now: Date,
) {
  return db.transaction(async (tx) => {
    // FOR UPDATE: wacht op een lopende verrekening, zodat er nooit een
    // bestelling binnenkomt nadat de ronde is afgerond.
    const [r] = await tx.select().from(round).where(eq(round.id, roundId)).for("update");
    if (!r) throw new KoffyError("ROUND_NOT_FOUND");
    assertOwnOffice(actor, r.officeId);
    if (r.closedAt || r.endsAt.getTime() <= now.getTime()) throw new KoffyError("ROUND_CLOSED");

    let choice: DrinkChoice;
    if ("useUsual" in input) {
      const usual = await loadUsual(tx, actor.id);
      if (!usual) throw new KoffyError("NO_USUAL_ORDER");
      choice = usual;
    } else {
      choice = input.choice;
      if (input.saveUsual && choice.drinkType !== "skip") {
        await tx
          .insert(usualOrder)
          .values({ userId: actor.id, ...choice })
          .onConflictDoUpdate({
            target: usualOrder.userId,
            set: { drinkType: choice.drinkType, drink: choice.drink, option: choice.option },
          });
      }
    }

    const [saved] = await tx
      .insert(order)
      .values({ roundId, userId: actor.id, ...choice, createdAt: now })
      .onConflictDoUpdate({
        target: [order.roundId, order.userId],
        set: {
          drinkType: choice.drinkType,
          drink: choice.drink,
          option: choice.option,
          done: false,
        },
      })
      .returning();
    return saved;
  });
}

/** "Ronde afronden" door de haler. Idempotent: nog een keer klikken doet niets. */
export async function closeRound(db: Db, actor: Actor, roundId: string, now: Date) {
  const [r] = await db.select().from(round).where(eq(round.id, roundId));
  if (!r) throw new KoffyError("ROUND_NOT_FOUND");
  if (r.halerUserId !== actor.id) throw new KoffyError("NOT_HALER");
  return settleRound(db, roundId, now, { closeNow: true });
}

/** Afvinken op het lijstje. Alleen de haler; mag ook nog na het sluiten. */
export async function setOrderDone(db: Db, actor: Actor, orderId: string, done: boolean) {
  const [row] = await db
    .select({ order, halerUserId: round.halerUserId })
    .from(order)
    .innerJoin(round, eq(order.roundId, round.id))
    .where(eq(order.id, orderId));
  if (!row) throw new KoffyError("ORDER_NOT_FOUND");
  if (row.halerUserId !== actor.id) throw new KoffyError("NOT_HALER");
  if (row.order.drinkType === "skip") return row.order;
  const [updated] = await db.update(order).set({ done }).where(eq(order.id, orderId)).returning();
  return updated;
}

// ---------------------------------------------------------------------------
// Saldo
// ---------------------------------------------------------------------------

export async function getSaldi(db: Executor, officeId: string) {
  const rows = await db
    .select({
      userId: saldoEvent.userId,
      name: user.displayName,
      value: sql<number>`COALESCE(SUM(${saldoEvent.delta}), 0)::int`,
    })
    .from(saldoEvent)
    .innerJoin(user, eq(saldoEvent.userId, user.id))
    .where(eq(saldoEvent.officeId, officeId))
    .groupBy(saldoEvent.userId, user.displayName);
  return rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export async function getSaldo(db: Executor, officeId: string, userId: string) {
  const [row] = await db
    .select({ value: sql<number>`COALESCE(SUM(${saldoEvent.delta}), 0)::int` })
    .from(saldoEvent)
    .where(and(eq(saldoEvent.officeId, officeId), eq(saldoEvent.userId, userId)));
  return row?.value ?? 0;
}

/** "Opdracht gedaan, saldo naar 0". Mag voor v1 door iedereen in het kantoor. */
export async function resetOpdracht(
  db: Db,
  actor: Actor,
  officeId: string,
  targetUserId: string,
  now: Date,
) {
  assertOwnOffice(actor, officeId);
  return db.transaction(async (tx) => {
    // Lock op de collega, zodat twee keer tegelijk klikken niet twee resets geeft.
    const [target] = await tx.select().from(user).where(eq(user.id, targetUserId)).for("update");
    if (!target) throw new KoffyError("NO_OPDRACHT_DUE");
    const saldo = await getSaldo(tx, officeId, targetUserId);
    if (!owesOpdracht(saldo)) throw new KoffyError("NO_OPDRACHT_DUE", { saldo });
    await tx.insert(saldoEvent).values({
      officeId,
      userId: targetUserId,
      roundId: null,
      delta: -saldo,
      reason: "opdracht_reset",
      createdAt: now,
    });
    return { userId: targetUserId, name: target.displayName, previous: saldo };
  });
}

// ---------------------------------------------------------------------------
// Profiel en state
// ---------------------------------------------------------------------------

export async function listOffices(db: Executor) {
  return db.select().from(office).orderBy(asc(office.sort));
}

export async function setUserOffice(db: Db, actor: Actor, officeId: string) {
  const [known] = await db.select({ id: office.id }).from(office).where(eq(office.id, officeId));
  if (!known) throw new KoffyError("UNKNOWN_OFFICE");
  await db.update(user).set({ officeId }).where(eq(user.id, actor.id));
}

async function roundView(db: Executor, r: typeof round.$inferSelect) {
  const [haler] = await db
    .select({ id: user.id, name: user.displayName })
    .from(user)
    .where(eq(user.id, r.halerUserId));
  const orders = await db
    .select({
      id: order.id,
      userId: order.userId,
      name: user.displayName,
      drinkType: order.drinkType,
      drink: order.drink,
      option: order.option,
      done: order.done,
      createdAt: order.createdAt,
    })
    .from(order)
    .innerJoin(user, eq(order.userId, user.id))
    .where(eq(order.roundId, r.id))
    .orderBy(asc(order.createdAt), asc(order.id));
  return {
    id: r.id,
    haler,
    startedAt: r.startedAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
    settled: r.settled,
    orders: orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
  };
}

export type RoundView = Awaited<ReturnType<typeof roundView>>;

/** Alles wat een scherm nodig heeft, in één antwoord. Wordt elke 2 s gepolld. */
export async function getOfficeState(
  db: Db,
  actor: Actor & { displayName: string },
  officeId: string,
  now: Date,
) {
  assertOwnOffice(actor, officeId);
  await settleDueRounds(db, officeId, now);

  const [off] = await db.select().from(office).where(eq(office.id, officeId));
  if (!off) throw new KoffyError("UNKNOWN_OFFICE");

  const open = await findOpenRound(db, officeId);
  let recent: typeof round.$inferSelect | null = null;
  if (!open) {
    const since = new Date(now.getTime() - RECENT_ROUND_MINUTES * 60_000);
    [recent = null] = await db
      .select()
      .from(round)
      .where(
        and(eq(round.officeId, officeId), isNotNull(round.closedAt), gt(round.closedAt, since)),
      )
      .orderBy(desc(round.startedAt))
      .limit(1);
  }

  const [activeRound, recentRound, saldi, usual] = await Promise.all([
    open ? roundView(db, open) : null,
    recent ? roundView(db, recent) : null,
    getSaldi(db, officeId),
    loadUsual(db, actor.id),
  ]);

  return {
    serverNow: now.toISOString(),
    me: { id: actor.id, name: actor.displayName, officeId: actor.officeId, usual },
    office: { id: off.id, name: off.name, heart: off.heartEmoji },
    activeRound,
    recentRound,
    saldi,
  };
}

export type OfficeState = Awaited<ReturnType<typeof getOfficeState>>;

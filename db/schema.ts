import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const drinkType = pgEnum("drink_type", ["koffie", "water", "skip"]);
export const saldoReason = pgEnum("saldo_reason", ["haal", "besteld", "opdracht_reset"]);

export const office = pgTable("office", {
  id: text("id").primaryKey(), // slug, bv. "rookhok"
  name: text("name").notNull(),
  heartEmoji: text("heart_emoji").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const user = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Komt later uit Google SSO. In AUTH_MODE=local leeg.
    email: text("email"),
    displayName: text("display_name").notNull(),
    officeId: text("office_id")
      .notNull()
      .references(() => office.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_email_uq").on(t.email)],
);

export const usualOrder = pgTable("usual_order", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  drinkType: drinkType("drink_type").notNull(),
  drink: text("drink").notNull(),
  option: text("option").notNull().default(""),
});

export const round = pgTable(
  "round",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    officeId: text("office_id")
      .notNull()
      .references(() => office.id),
    halerUserId: uuid("haler_user_id")
      .notNull()
      .references(() => user.id),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    settled: boolean("settled").notNull().default(false),
  },
  (t) => [
    // Per kantoor maximaal één ronde die nog niet gesloten is.
    uniqueIndex("round_one_open_per_office_uq")
      .on(t.officeId)
      .where(sql`${t.closedAt} IS NULL`),
    index("round_office_started_idx").on(t.officeId, t.startedAt),
    check("round_settled_implies_closed", sql`NOT ${t.settled} OR ${t.closedAt} IS NOT NULL`),
  ],
);

export const order = pgTable(
  "order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    drinkType: drinkType("drink_type").notNull(),
    drink: text("drink").notNull().default(""),
    option: text("option").notNull().default(""),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Eén bestelling per persoon per ronde; wijzigen = overschrijven.
  (t) => [uniqueIndex("order_round_user_uq").on(t.roundId, t.userId)],
);

// Ledger: het saldo is SUM(delta) per (office, user).
export const saldoEvent = pgTable(
  "saldo_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    officeId: text("office_id")
      .notNull()
      .references(() => office.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    roundId: uuid("round_id").references(() => round.id),
    delta: integer("delta").notNull(),
    reason: saldoReason("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("saldo_event_office_user_idx").on(t.officeId, t.userId),
    // Vangnet naast round.settled: per ronde kan iemand maar één keer verrekend worden.
    uniqueIndex("saldo_event_round_user_uq")
      .on(t.roundId, t.userId)
      .where(sql`${t.roundId} IS NOT NULL`),
  ],
);

export type Office = typeof office.$inferSelect;
export type User = typeof user.$inferSelect;
export type Round = typeof round.$inferSelect;
export type Order = typeof order.$inferSelect;
export type UsualOrder = typeof usualOrder.$inferSelect;
export type DrinkType = (typeof drinkType.enumValues)[number];

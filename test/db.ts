import { sql } from "drizzle-orm";
import { createDb } from "@/db";
import { office, user } from "@/db/schema";
import type { Actor } from "@/lib/koffy";
import { OFFICES } from "@/lib/offices";

export function testDatabaseUrl() {
  return process.env.TEST_DATABASE_URL ?? "postgres://koffy:koffy@localhost:5432/koffytijd_test";
}

let shared: ReturnType<typeof createDb> | null = null;

export function testDb() {
  shared ??= createDb(testDatabaseUrl());
  return shared.db;
}

export async function closeTestDb() {
  await shared?.client.end();
  shared = null;
}

export async function resetDb() {
  const db = testDb();
  await db.execute(
    sql`TRUNCATE saldo_event, "order", round, usual_order, "user", office RESTART IDENTITY CASCADE`,
  );
  await db.insert(office).values([...OFFICES]);
}

export async function makeUser(
  name: string,
  officeId = "rookhok",
): Promise<Actor & { displayName: string }> {
  const [u] = await testDb().insert(user).values({ displayName: name, officeId }).returning();
  return { id: u.id, officeId: u.officeId, displayName: u.displayName };
}

/** Een vast startmoment; tests tellen hier seconden bij op. */
export const T0 = new Date("2026-09-25T10:00:00.000Z");
export const at = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

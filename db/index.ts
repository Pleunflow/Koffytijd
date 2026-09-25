import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string) {
  const client = postgres(url, {
    // Op Vercel draait elke functie los: houd het per functie bij één verbinding.
    max: process.env.VERCEL ? 1 : 10,
    // Nodig voor de connection pooler van Neon; lokaal maakt het niet uit.
    prepare: false,
  });
  return { db: drizzle(client, { schema }), client };
}

// Eén connectie-pool per proces, ook bij hot reload in dev.
const globalForDb = globalThis as unknown as { __koffyDb?: ReturnType<typeof createDb> };

export function getDb(): Db {
  globalForDb.__koffyDb ??= createDb(databaseUrl());
  return globalForDb.__koffyDb.db;
}

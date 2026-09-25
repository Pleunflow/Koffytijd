import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string) {
  const client = postgres(url, { max: 10 });
  return { db: drizzle(client, { schema }), client };
}

// Eén connectie-pool per proces, ook bij hot reload in dev.
const globalForDb = globalThis as unknown as { __koffyDb?: ReturnType<typeof createDb> };

export function getDb(): Db {
  globalForDb.__koffyDb ??= createDb(databaseUrl());
  return globalForDb.__koffyDb.db;
}

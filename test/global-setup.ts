import { config } from "dotenv";
config({ quiet: true });
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { testDatabaseUrl } from "./db";

// Zet het schema klaar in de testdatabase, één keer per testrun.
export default async function setup() {
  const url = testDatabaseUrl();
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client`select 1`;
  } catch (err) {
    throw new Error(
      `Kan de testdatabase niet bereiken (${url.replace(/:[^:@/]+@/, ":***@")}). Draai eerst \`pnpm db:up\`.\n${String(err)}`,
    );
  }
  await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
  await client.end();
}

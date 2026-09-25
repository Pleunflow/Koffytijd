import { config } from "dotenv";
config({ quiet: true });
import { sql } from "drizzle-orm";
import { OFFICES } from "@/lib/offices";
import { databaseUrl } from "@/lib/env";
import { createDb } from "./index";
import { office } from "./schema";

async function main() {
  const { db, client } = createDb(databaseUrl());
  await db
    .insert(office)
    .values([...OFFICES])
    .onConflictDoUpdate({
      target: office.id,
      set: {
        name: sql`excluded.name`,
        heartEmoji: sql`excluded.heart_emoji`,
        sort: sql`excluded.sort`,
      },
    });
  console.log(`✓ ${OFFICES.length} kantoren staan in de database`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

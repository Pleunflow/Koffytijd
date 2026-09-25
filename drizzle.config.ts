import { config } from "dotenv";
config({ quiet: true });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migraties liever zonder pooler; Neon op Vercel zet DATABASE_URL_UNPOOLED.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "postgres://koffy:koffy@localhost:5432/koffytijd",
  },
});

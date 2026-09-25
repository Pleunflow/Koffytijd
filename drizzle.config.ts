import { config } from "dotenv";
config({ quiet: true });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://koffy:koffy@localhost:5432/koffytijd",
  },
});

// Eén plek voor environment-variabelen. Geen secrets in code: alles komt uit .env
// (lokaal) of uit de environment van het platform (later Vercel).

const LOCAL_DATABASE_URL = "postgres://koffy:koffy@localhost:5432/koffytijd";

export function databaseUrl(): string {
  // Neon via Vercel zet DATABASE_URL, en soms alleen de POSTGRES_*-namen.
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL ontbreekt.");
  }
  // Handig op een schone laptop: de database uit docker-compose.yml.
  return LOCAL_DATABASE_URL;
}

export type AuthMode = "local";

export function authMode(): AuthMode {
  const mode = process.env.AUTH_MODE || "local"; // leeg telt als niet gezet
  if (mode !== "local") {
    throw new Error(`AUTH_MODE=${mode} wordt nog niet ondersteund. Gebruik AUTH_MODE=local.`);
  }
  return mode;
}

export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET ontbreekt of is te kort (minstens 32 tekens). Draai `pnpm db:up` of zet hem zelf in .env (openssl rand -hex 32).",
    );
  }
  return secret;
}

/** Voor migraties en seed: liever zonder connection pooler. */
export function directDatabaseUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? databaseUrl();
}

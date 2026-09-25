import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { office, user } from "@/db/schema";
import { authMode, authSecret } from "@/lib/env";
import { decodeSessionToken, encodeSessionToken } from "@/lib/session-token";

/*
 * De enige plek in de app die weet hoe iemand inlogt.
 *
 * Nu: AUTH_MODE=local. Bij het eerste bezoek kies je kantoor en naam; dat wordt
 * een `user`-record en het user-id gaat (ondertekend) in een httpOnly-cookie.
 *
 * Later: better-auth + Google SSO. Dan verandert alleen dit bestand: getCurrentUser()
 * haalt de user dan uit de better-auth-sessie (koppelen via user.email). De rest van
 * de app roept alleen getCurrentUser() aan.
 */

const COOKIE_NAME = "koffy_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export type CurrentUser = {
  id: string;
  displayName: string;
  officeId: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  authMode();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const userId = decodeSessionToken(token, authSecret());
  if (!userId) return null;

  const [row] = await getDb()
    .select({ id: user.id, displayName: user.displayName, officeId: user.officeId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row ?? null;
}

export class NotSignedInError extends Error {
  constructor() {
    super("Niet ingelogd");
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) throw new NotSignedInError();
  return current;
}

/** AUTH_MODE=local: maak een collega aan en log die in. Alleen in een Route Handler aanroepen. */
export async function signInLocal(input: {
  displayName: string;
  officeId: string;
}): Promise<CurrentUser> {
  authMode();
  const db = getDb();
  const [known] = await db
    .select({ id: office.id })
    .from(office)
    .where(eq(office.id, input.officeId));
  if (!known) throw new Error("Onbekend kantoor");

  const [created] = await db
    .insert(user)
    .values({ displayName: input.displayName, officeId: input.officeId })
    .returning({ id: user.id, displayName: user.displayName, officeId: user.officeId });

  (await cookies()).set(COOKIE_NAME, encodeSessionToken(created.id, authSecret()), {
    httpOnly: true,
    sameSite: "lax",
    // Lokaal draait alles over http://<ip>:3000, dus alleen secure in productie.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return created;
}

export async function signOut() {
  (await cookies()).delete(COOKIE_NAME);
}

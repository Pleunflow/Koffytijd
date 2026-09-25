import { createHmac, timingSafeEqual } from "node:crypto";

// Een cookie-waarde is `<userId>.<handtekening>`, zodat niemand zich als een
// andere collega kan voordoen door alleen een user-id in de cookie te zetten.

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function encodeSessionToken(userId: string, secret: string) {
  return `${userId}.${sign(userId, secret)}`;
}

export function decodeSessionToken(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return userId;
}

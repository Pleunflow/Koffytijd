// Koffiesaldo-regels. Puur, zonder database, zodat ze los te testen zijn.

export const OPDRACHT_LIMIT = -10; // saldo ≤ −10: opdracht!
export const BIJNA_FROM = -9; // −9 t/m −7: bijna!
export const BIJNA_TO = -7;

export const OPDRACHTEN = [
  "moet een dag lang bellen met een banaan als telefoon 🍌",
  "doet de hele middag mee in de vergadering met de camera ondersteboven 🙃",
  "moet elke collega begroeten met een diepe buiging 🙇",
  "geeft de plant op kantoor een naam en stelt 'm voor aan het team 🪴",
  "zet z'n stoel een dag lager dan iedereen en doet alsof 't normaal is 🪑",
  "moet een dag lang praten in de derde persoon 🗣️",
  "draagt de vrijdag een verkleedhoedje op kantoor 🎩",
  "doet een dramatische slow-clap als iemand de vergaderruimte binnenkomt 👏",
  "moet z'n volgende mailtje volledig in rijm sturen ✉️",
  "houdt een minuut speech over het beste koekje bij de koffie 🍪",
] as const;

export function owesOpdracht(saldo: number) {
  return saldo <= OPDRACHT_LIMIT;
}

export function isBijna(saldo: number) {
  return saldo >= BIJNA_FROM && saldo <= BIJNA_TO;
}

/** Deterministisch één opdracht per persoon (zelfde hash als het prototype). */
export function opdrachtFor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return OPDRACHTEN[h % OPDRACHTEN.length];
}

export function opdrachtText(name: string, saldo: number) {
  return `${name} staat op −${Math.abs(saldo)} en ${opdrachtFor(name)}`;
}

/** "+3", "−2" (met echte min), "0". */
export function formatSaldo(saldo: number) {
  if (saldo > 0) return `+${saldo}`;
  if (saldo < 0) return `−${Math.abs(saldo)}`;
  return "0";
}

export type SettlementOrder = { userId: string; drinkType: "koffie" | "water" | "skip" };
export type SettlementEvent = { userId: string; delta: number; reason: "haal" | "besteld" };

/**
 * Verrekening van één ronde.
 * - Haler: +1 per drankje dat hij voor een ander haalt (z'n eigen drankje telt niet).
 * - Elke collega die iets laat halen: −1.
 * - Overslaan: 0.
 */
export function computeSettlement(
  halerUserId: string,
  orders: SettlementOrder[],
): SettlementEvent[] {
  const fetchedFor = orders.filter((o) => o.drinkType !== "skip" && o.userId !== halerUserId);
  const events: SettlementEvent[] = fetchedFor.map((o) => ({
    userId: o.userId,
    delta: -1,
    reason: "besteld",
  }));
  if (fetchedFor.length > 0) {
    events.unshift({ userId: halerUserId, delta: fetchedFor.length, reason: "haal" });
  }
  return events;
}

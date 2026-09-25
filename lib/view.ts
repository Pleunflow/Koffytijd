import type { OfficeState, RoundView } from "@/lib/api-client";

/*
 * Welk scherm iemand ziet. De ronde bepaalt je rol: wie hem startte is de haler,
 * de rest is collega. (Geen "Bekijk als"-schakelaar zoals in het prototype.)
 */
export type View =
  | { name: "home" }
  | { name: "join"; round: RoundView; closed: boolean }
  | { name: "order"; round: RoundView }
  | { name: "joined"; round: RoundView; closed: boolean }
  | { name: "list"; round: RoundView; closed: boolean };

export type ViewInput = {
  state: OfficeState;
  /** De gebruiker koos "iets anders" of "Bestelling wijzigen" voor deze ronde. */
  orderingRoundId: string | null;
  /** Gesloten rondes die de gebruiker al heeft weggeklikt (logo of Nieuwe ronde). */
  dismissed: ReadonlySet<string>;
  /** De ronde die de gebruiker open had toen hij sloot (voor "Te laat"). */
  seenOpenRoundId: string | null;
  /** De timer van de actieve ronde staat (volgens de server-klok) op 0. */
  expired: boolean;
};

export function deriveView({
  state,
  orderingRoundId,
  dismissed,
  seenOpenRoundId,
  expired,
}: ViewInput): View {
  const meId = state.me.id;
  const active = state.activeRound;

  // Loopt er een ronde, dan nooit het startscherm.
  if (active) {
    const closed = expired || active.closedAt !== null;
    const isHaler = active.haler?.id === meId;
    const mine = active.orders.some((o) => o.userId === meId);
    if (!closed && orderingRoundId === active.id) return { name: "order", round: active };
    if (isHaler)
      return mine || closed
        ? { name: "list", round: active, closed }
        : { name: "order", round: active };
    if (mine) return { name: "joined", round: active, closed };
    return { name: "join", round: active, closed };
  }

  const recent = state.recentRound;
  if (recent && !dismissed.has(recent.id)) {
    if (recent.haler?.id === meId) return { name: "list", round: recent, closed: true };
    if (recent.orders.some((o) => o.userId === meId)) {
      return { name: "joined", round: recent, closed: true };
    }
    if (seenOpenRoundId === recent.id) return { name: "join", round: recent, closed: true };
  }

  return { name: "home" };
}

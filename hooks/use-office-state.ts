"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type OfficeState } from "@/lib/api-client";

export const POLL_MS = 2000;

/**
 * Pollt GET /api/office/[id]/state elke 2 s. Houdt ook het verschil tussen de
 * klok van de server en die van deze laptop bij, zodat de timer altijd vanaf
 * `ends_at` op de server aftelt.
 *
 * `onUpdate(prev, next)` wordt bij elk nieuw antwoord aangeroepen (voor toasts e.d.).
 */
export function useOfficeState(
  officeId: string,
  onUpdate?: (prev: OfficeState | null, next: OfficeState) => void,
) {
  const [state, setState] = useState<OfficeState | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const offsetRef = useRef(0);
  const seq = useRef(0);
  const last = useRef<OfficeState | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const sentAt = Date.now();
    try {
      const next = await api.state(officeId);
      if (mine !== seq.current) return; // er is al een nieuwer verzoek onderweg
      const midpoint = (sentAt + Date.now()) / 2;
      offsetRef.current = new Date(next.serverNow).getTime() - midpoint;
      onUpdateRef.current?.(last.current, next);
      last.current = next;
      setState(next);
      setError(null);
    } catch (err) {
      if (mine !== seq.current) return;
      setError(err instanceof ApiError ? err : new ApiError(0, "NETWORK"));
    }
  }, [officeId]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { state, error, refresh, serverNow };
}

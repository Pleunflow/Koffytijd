"use client";

import { useEffect, useState } from "react";
import { ROUND_SECONDS } from "@/lib/constants";

/** Resterende seconden tot `endsAt` (server-tijd), ververst 4× per seconde. */
export function useCountdown(endsAt: string | null | undefined, serverNow: () => number) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(serverNow()), 250);
    return () => clearInterval(id);
  }, [endsAt, serverNow]);
  if (!endsAt) return 0;
  const left = Math.ceil((new Date(endsAt).getTime() - now) / 1000);
  // Kleine klokverschillen mogen nooit meer dan 2:00 laten zien.
  return Math.min(ROUND_SECONDS, Math.max(0, left));
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

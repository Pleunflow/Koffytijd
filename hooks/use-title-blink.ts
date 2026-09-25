"use client";

import { useEffect } from "react";

const BASE = "Koffytijd";
const ALERT = "☕ Koffytijd!";

/** Laat de tab-titel knipperen zolang `active` waar is: "☕ Koffytijd!" ↔ "Koffytijd". */
export function useTitleBlink(active: boolean) {
  useEffect(() => {
    if (!active) {
      document.title = BASE;
      return;
    }
    let on = true;
    document.title = ALERT;
    const id = setInterval(() => {
      on = !on;
      document.title = on ? ALERT : BASE;
    }, 1000);
    return () => {
      clearInterval(id);
      document.title = BASE;
    };
  }, [active]);
}

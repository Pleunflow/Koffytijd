"use client";

import { useCallback, useRef, useState } from "react";
import { Tick } from "./parts";

export type Toast = { id: number; text: string };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const toast = useCallback((text: string) => {
    const id = ++next.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, toast };
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-7 z-40 flex flex-col gap-2.5"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-kt-pop items-center gap-2.5 rounded-md border-l-4 border-toppy-green bg-white py-3 pr-[18px] pl-3.5 shadow-toast"
        >
          <span className="inline-flex size-[30px] flex-none items-center justify-center rounded-full bg-toppy-green-light">
            <Tick className="border-toppy-green" />
          </span>
          <span className="text-sm font-semibold text-toppy-ink">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

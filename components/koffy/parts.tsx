"use client";

import type * as React from "react";
import type { OrderView } from "@/lib/api-client";
import { orderTags, orderTitle } from "@/lib/menu";
import { cn } from "@/lib/utils";

export function Card({
  className,
  soft = false,
  ...props
}: React.ComponentProps<"div"> & { soft?: boolean }) {
  return (
    <div
      className={cn("rounded-card bg-white", soft ? "shadow-soft" : "shadow-card", className)}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[13px] font-semibold text-toppy-grey-darker">{children}</span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-semibold text-toppy-grey-darker">{children}</p>;
}

/** Keuzeknop: geel met ink-rand als geselecteerd, anders wit met grijze rand. */
export function ChoiceButton({
  selected,
  className,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-choice border-2 px-4 py-[15px] text-left text-[15px] font-semibold text-toppy-ink transition-all duration-[120ms] active:scale-[0.97]",
        selected
          ? "border-toppy-ink bg-toppy-yellow"
          : "border-toppy-grey-light bg-white hover:border-toppy-grey",
        className,
      )}
      {...props}
    />
  );
}

/** Pill-chip, bv. voor kantoren. */
export function PillChip({
  selected,
  className,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-pill border-2 px-4 py-[11px] text-[15px] font-semibold text-toppy-ink transition-all duration-[120ms] active:scale-[0.97]",
        selected
          ? "border-toppy-ink bg-toppy-yellow"
          : "border-toppy-grey-light bg-white hover:border-toppy-grey",
        className,
      )}
      {...props}
    />
  );
}

/** Vinkje van CSS-randen, zoals in het prototype. */
export function Tick({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-[-2px] block h-[11px] w-1.5 rotate-45 border-r-[3px] border-b-[3px]",
        className,
      )}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left select-none"
    >
      <span
        className={cn(
          "inline-flex size-[26px] flex-none items-center justify-center rounded-sm border-2 transition-all duration-[120ms]",
          checked ? "border-toppy-ink bg-toppy-yellow" : "border-toppy-grey bg-white",
        )}
      >
        {checked && <Tick className="border-toppy-ink" />}
      </span>
      <span className="text-[15px] text-toppy-ink">{label}</span>
    </button>
  );
}

const PALETTE = [
  "bg-toppy-blue",
  "bg-toppy-green",
  "bg-toppy-red",
  "bg-toppy-blue-dark",
  "bg-toppy-yellow-deep",
  "bg-toppy-teal-dark",
];

export function avatarClass(o: OrderView, index: number, meId: string) {
  if (o.drinkType === "skip") return "bg-toppy-grey-dark";
  if (o.userId === meId) return "bg-toppy-ink";
  return PALETTE[index % PALETTE.length];
}

export function Avatar({
  name,
  className,
  size = 34,
}: {
  name: string;
  className: string;
  size?: 34 | 44;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-bold text-white",
        size === 44 ? "size-11 text-[17px]" : "size-[34px] text-sm",
        className,
      )}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill bg-toppy-grey-lighter px-[9px] py-0.5 text-xs font-semibold whitespace-nowrap text-toppy-grey-darker">
      {children}
    </span>
  );
}

/** Compacte rij voor "Wie doen er (al) mee". */
export function ParticipantList({
  orders,
  meId,
  showTags,
}: {
  orders: OrderView[];
  meId: string;
  showTags: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {orders.map((o, i) => {
        const t = orderTitle(o);
        const tags = orderTags(o);
        return (
          <div
            key={o.id}
            className={cn(
              "flex animate-kt-pop items-center gap-3",
              o.drinkType === "skip" && "opacity-70",
            )}
          >
            <Avatar name={o.name} className={avatarClass(o, i, meId)} />
            <span className="min-w-20 text-[15px] font-semibold">{o.name}</span>
            <span className="text-sm whitespace-nowrap text-toppy-grey-darker">
              {t.emoji} {t.title}
            </span>
            {showTags && tags[0] && <TagPill>{tags[0]}</TagPill>}
          </div>
        );
      })}
    </div>
  );
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "jij";
}

"use client";

import { CarSpeedIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { OfficeState, OrderView, RoundView } from "@/lib/api-client";
import { orderTags, orderTitle, shoppingList } from "@/lib/menu";
import { cn } from "@/lib/utils";
import { Avatar, avatarClass, Card, firstName, TagPill, Tick } from "./parts";
import { SaldoCard } from "./saldo-card";

type Props = {
  state: OfficeState;
  round: RoundView;
  clock: string;
  secondsLeft: number;
  closed: boolean;
  busy: boolean;
  onToggle: (order: OrderView) => void;
  onClose: () => void;
  onNewRound: () => void;
  onOpdrachtDone: (userId: string) => void;
};

export function ListScreen({
  state,
  round,
  clock,
  secondsLeft,
  closed,
  busy,
  onToggle,
  onClose,
  onNewRound,
  onOpdrachtDone,
}: Props) {
  const meId = state.me.id;
  const drinks = round.orders.filter((o) => o.drinkType !== "skip");
  const total = drinks.length;
  const doneCount = drinks.filter((o) => o.done).length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  const summary = shoppingList(round.orders);

  return (
    <div className="animate-kt-rise-fast">
      <div className="mb-1.5 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-bold whitespace-nowrap">Het lijstje</h1>
        <span className="inline-flex items-center gap-[7px] rounded-pill bg-toppy-ink px-3.5 py-[7px] text-[13px] font-semibold text-white">
          <CarSpeedIcon size={18} className="text-toppy-yellow" />
          {firstName(round.haler?.name ?? "")} haalt
        </span>
      </div>
      <p className="mb-6 text-[15px] text-toppy-grey-darker">
        {state.office.heart} Kantoor {state.office.name} &#8212; {total} bestellingen, vink af wat
        je hebt gehaald.
      </p>

      <div className="grid items-start gap-[26px] md:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          {round.orders.map((o, i) => (
            <OrderRow
              key={o.id}
              order={o}
              isMe={o.userId === meId}
              avatar={avatarClass(o, i, meId)}
              onToggle={() => onToggle(o)}
            />
          ))}
        </div>

        <div className="sticky top-24 flex flex-col gap-4">
          <div className="rounded-card bg-toppy-ink p-[22px] text-center text-white">
            <div className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-toppy-grey uppercase">
              {closed ? "Ronde gesloten" : "Nog te bestellen"}
            </div>
            <div
              className={cn(
                "text-[46px] leading-none font-bold tabular-nums",
                closed ? "text-toppy-grey" : secondsLeft <= 30 ? "text-toppy-red" : "text-white",
              )}
            >
              {clock}
            </div>
            <div className="mt-[18px] h-2 overflow-hidden rounded-pill bg-white/15">
              <div
                className="h-full rounded-pill bg-toppy-green transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-[13px] text-toppy-grey">
              {doneCount} van {total} gehaald
            </div>
          </div>

          <Card soft className="p-5">
            <div className="mb-3 text-[13px] font-bold text-toppy-grey-darker">
              Boodschappenlijstje
            </div>
            <div className="flex flex-col gap-2">
              {summary.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 text-sm">
                  <span className="inline-flex h-[26px] min-w-[26px] flex-none items-center justify-center rounded-sm bg-toppy-yellow px-[7px] font-bold text-toppy-ink">
                    {s.count}&#215;
                  </span>
                  <span className="text-toppy-ink">{s.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <SaldoCard
            compact
            saldi={state.saldi}
            officeName={state.office.name}
            onOpdrachtDone={onOpdrachtDone}
          />

          {closed ? (
            <>
              <div className="rounded-btn-lg border-2 border-toppy-yellow bg-toppy-yellow-light px-4 py-3.5 text-center text-sm font-semibold text-toppy-ink">
                Tijd is om! De ronde is gesloten.
              </div>
              <Button variant="ghost" size="md" fullWidth onClick={onNewRound}>
                Nieuwe ronde
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="md" fullWidth disabled={busy} onClick={onClose}>
              Ronde afronden
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  order: o,
  isMe,
  avatar,
  onToggle,
}: {
  order: OrderView;
  isMe: boolean;
  avatar: string;
  onToggle: () => void;
}) {
  const isSkip = o.drinkType === "skip";
  const t = orderTitle(o);
  const tags = orderTags(o);
  const strike = o.done && "line-through";

  return (
    <div
      role={isSkip ? undefined : "checkbox"}
      aria-checked={isSkip ? undefined : o.done}
      tabIndex={isSkip ? undefined : 0}
      onClick={isSkip ? undefined : onToggle}
      onKeyDown={(e) => {
        if (!isSkip && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "flex animate-kt-pop items-center gap-4 rounded-lg border-2 px-[18px] py-4 shadow-soft transition-all duration-150",
        isSkip ? "cursor-default" : "cursor-pointer",
        isMe
          ? "border-toppy-yellow-deep bg-toppy-yellow-light"
          : "border-toppy-grey-light bg-white",
        o.done ? "opacity-55" : isSkip && "opacity-70",
      )}
    >
      <Avatar name={o.name} size={44} className={avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-base font-bold", strike)}>{o.name}</span>
          {isMe && (
            <span className="rounded-pill bg-toppy-yellow px-2 py-0.5 text-[11px] font-bold text-toppy-ink">
              JIJ
            </span>
          )}
        </div>
        <div className="mt-[3px] flex flex-wrap items-center gap-2">
          <span className={cn("text-sm whitespace-nowrap text-toppy-grey-darker", strike)}>
            {t.emoji} {t.title}
          </span>
          {tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
      </div>
      {!isSkip && (
        <span
          className={cn(
            "inline-flex size-[30px] flex-none items-center justify-center rounded-[10px] border-2 transition-all duration-150",
            o.done ? "border-toppy-green bg-toppy-green" : "border-toppy-grey bg-white",
          )}
        >
          {o.done && <Tick className="h-3 w-[7px] border-white" />}
        </span>
      )}
    </div>
  );
}

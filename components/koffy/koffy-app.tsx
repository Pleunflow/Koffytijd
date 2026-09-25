"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock, useCountdown } from "@/hooks/use-countdown";
import { useOfficeState } from "@/hooks/use-office-state";
import { useTitleBlink } from "@/hooks/use-title-blink";
import { api, ApiError, type OfficeState, type OrderView, type RoundView } from "@/lib/api-client";
import type { DrinkChoice } from "@/lib/menu";
import { deriveView } from "@/lib/view";
import { Header } from "./header";
import { HomeScreen, type OfficeOption } from "./home-screen";
import { JoinScreen } from "./join-screen";
import { JoinedScreen } from "./joined-screen";
import { ListScreen } from "./list-screen";
import { OrderScreen } from "./order-screen";
import { firstName } from "./parts";
import { Toasts, useToasts } from "./toasts";

const SKIP: DrinkChoice = { drinkType: "skip", drink: "", option: "" };
const DISMISSED_KEY = "koffytijd_dismissed_rounds";

function loadDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids].slice(-20)));
  } catch {
    // Geen localStorage (privévenster): dan onthouden we het alleen in deze tab.
  }
}

function fetchedCount(r: RoundView) {
  return r.orders.filter((o) => o.drinkType !== "skip" && o.userId !== r.haler?.id).length;
}

type Props = { offices: OfficeOption[]; initialOfficeId: string };

export function KoffyApp({ offices, initialOfficeId }: Props) {
  const [officeId, setOfficeId] = useState(initialOfficeId);
  const { toasts, toast } = useToasts();
  return (
    <>
      <OfficeApp
        key={officeId}
        officeId={officeId}
        offices={offices}
        toast={toast}
        onOfficeChange={setOfficeId}
      />
      <Toasts toasts={toasts} />
    </>
  );
}

function OfficeApp({
  officeId,
  offices,
  toast,
  onOfficeChange,
}: {
  officeId: string;
  offices: OfficeOption[];
  toast: (text: string) => void;
  onOfficeChange: (officeId: string) => void;
}) {
  const [orderingRoundId, setOrderingRoundId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : loadDismissed(),
  );
  const [seenOpenRoundId, setSeenOpenRoundId] = useState<string | null>(null);
  const [blinkRoundId, setBlinkRoundId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});
  const toastedClosed = useRef(new Set<string>());

  const onUpdate = useCallback(
    (prev: OfficeState | null, next: OfficeState) => {
      const meId = next.me.id;
      const active = next.activeRound;
      if (active) setSeenOpenRoundId(active.id);

      // Start er een ronde terwijl je de site open hebt: laat de tab-titel knipperen.
      if (prev && active && prev.activeRound?.id !== active.id && active.haler?.id !== meId) {
        setBlinkRoundId(active.id);
      }

      // "Sanne deed mee!"
      if (prev?.activeRound && active && prev.activeRound.id === active.id) {
        const known = new Set(prev.activeRound.orders.map((o) => o.userId));
        for (const o of active.orders) {
          if (
            !known.has(o.userId) &&
            o.userId !== meId &&
            o.userId !== active.haler?.id &&
            o.drinkType !== "skip"
          ) {
            toast(`${firstName(o.name)} deed mee!`);
          }
        }
      }

      // Ronde gesloten door de timer (of door de haler op een andere laptop).
      const closed = next.recentRound;
      if (
        prev?.activeRound &&
        closed &&
        prev.activeRound.id === closed.id &&
        !toastedClosed.current.has(closed.id) &&
        (closed.haler?.id === meId || closed.orders.some((o) => o.userId === meId))
      ) {
        toastedClosed.current.add(closed.id);
        toast(
          `Ronde afgerond: +${fetchedCount(closed)} voor ${firstName(closed.haler?.name ?? "")}`,
        );
      }
    },
    [toast],
  );

  const { state, error, refresh, serverNow } = useOfficeState(officeId, onUpdate);
  const secondsLeft = useCountdown(state?.activeRound?.endsAt, serverNow);

  const view = state
    ? deriveView({
        state,
        orderingRoundId,
        dismissed,
        seenOpenRoundId,
        expired: !!state.activeRound && secondsLeft === 0,
      })
    : null;

  const me = state?.me;
  const active = state?.activeRound ?? null;
  useTitleBlink(
    !!active &&
      blinkRoundId === active.id &&
      secondsLeft > 0 &&
      !active.orders.some((o) => o.userId === me?.id),
  );

  // Uitgelogd (bv. database leeggemaakt) of kantoor elders gewijzigd: opnieuw laden.
  const mustReload = error?.code === "NOT_SIGNED_IN" || error?.code === "NOT_YOUR_OFFICE";
  useEffect(() => {
    if (mustReload) window.location.reload();
  }, [mustReload]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      if (err.code === "NETWORK") toast("Geen verbinding met Koffytijd");
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const dismiss = (roundId: string) => {
    setDismissed((d) => {
      const next = new Set(d).add(roundId);
      saveDismissed(next);
      return next;
    });
  };

  const round = view && view.name !== "home" ? view.round : null;
  const closed = view && "closed" in view ? view.closed : false;
  const clock = round && !closed && round === active ? formatClock(secondsLeft) : "0:00";

  const goHome = () => {
    setOrderingRoundId(null);
    if (round && closed) dismiss(round.id);
  };

  const withDone = (r: RoundView): RoundView => ({
    ...r,
    orders: r.orders.map((o) => (o.id in doneOverride ? { ...o, done: doneOverride[o.id] } : o)),
  });

  const actions = {
    start: (withUsual: boolean) =>
      run(async () => {
        try {
          const { roundId } = await api.startRound(officeId, withUsual);
          if (!withUsual) setOrderingRoundId(roundId);
        } catch (err) {
          // Iemand anders riep net Koffytijd: na verversen zie je het meedoen-scherm.
          if (err instanceof ApiError && err.code === "ROUND_ALREADY_ACTIVE") return;
          throw err;
        }
      }),
    joinUsual: (r: RoundView) => run(() => api.orderUsual(r.id)),
    order: (r: RoundView, choice: DrinkChoice, saveUsual: boolean) =>
      run(async () => {
        setOrderingRoundId(null);
        await api.order(r.id, choice, saveUsual);
      }),
    skip: (r: RoundView) =>
      run(async () => {
        setOrderingRoundId(null);
        await api.order(r.id, SKIP, false);
      }),
    toggle: async (o: OrderView) => {
      const done = !(doneOverride[o.id] ?? o.done);
      setDoneOverride((m) => ({ ...m, [o.id]: done }));
      try {
        await api.setDone(o.id, done);
      } finally {
        await refresh();
        setDoneOverride((m) => {
          const rest = { ...m };
          delete rest[o.id];
          return rest;
        });
      }
    },
    close: (r: RoundView) =>
      run(async () => {
        const res = await api.closeRound(r.id);
        if (res.settled && !toastedClosed.current.has(r.id)) {
          toastedClosed.current.add(r.id);
          toast(`Ronde afgerond: +${res.fetched ?? 0} voor ${firstName(r.haler?.name ?? "")}`);
        }
      }),
    opdrachtDone: (userId: string) =>
      run(async () => {
        const res = await api.resetOpdracht(officeId, userId);
        toast(`${firstName(res.name)} is weer schoon: saldo 0`);
      }),
    selectOffice: (id: string) =>
      run(async () => {
        await api.setOffice(id);
        onOfficeChange(id);
      }),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onHome={goHome}
        round={
          round && state
            ? { heart: state.office.heart, officeName: state.office.name, clock }
            : null
        }
      />
      <main className="mx-auto w-full max-w-[1060px] flex-1 px-7 pt-10 pb-16">
        {state && me && view?.name === "home" && (
          <HomeScreen
            offices={offices}
            state={state}
            busy={busy}
            onSelectOffice={actions.selectOffice}
            onStart={actions.start}
            onOpdrachtDone={actions.opdrachtDone}
          />
        )}
        {state && view?.name === "join" && (
          <JoinScreen
            state={state}
            round={view.round}
            clock={clock}
            secondsLeft={secondsLeft}
            closed={view.closed}
            busy={busy}
            onJoinUsual={() => actions.joinUsual(view.round)}
            onJoinOther={() => setOrderingRoundId(view.round.id)}
            onSkip={() => actions.skip(view.round)}
          />
        )}
        {state && me && view?.name === "order" && (
          <OrderScreen
            key={view.round.id}
            myName={me.name}
            meId={me.id}
            clock={clock}
            hasUsual={!!me.usual}
            start={
              (view.round.orders.find((o) => o.userId === me.id) as DrinkChoice | undefined) ??
              me.usual
            }
            busy={busy}
            incoming={
              view.round.haler?.id === me.id
                ? view.round.orders.filter((o) => o.userId !== me.id)
                : null
            }
            onSubmit={(choice, saveUsual) => actions.order(view.round, choice, saveUsual)}
            onSkip={() => actions.skip(view.round)}
          />
        )}
        {state && view?.name === "joined" && (
          <JoinedScreen
            state={state}
            round={view.round}
            clock={clock}
            secondsLeft={secondsLeft}
            closed={view.closed}
            onChange={() => setOrderingRoundId(view.round.id)}
          />
        )}
        {state && view?.name === "list" && (
          <ListScreen
            state={state}
            round={withDone(view.round)}
            clock={clock}
            secondsLeft={secondsLeft}
            closed={view.closed}
            busy={busy}
            onToggle={actions.toggle}
            onClose={() => actions.close(view.round)}
            onNewRound={() => dismiss(view.round.id)}
            onOpdrachtDone={actions.opdrachtDone}
          />
        )}
      </main>
    </div>
  );
}

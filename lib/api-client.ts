import type { OfficeState } from "@/lib/koffy";
import type { KoffyErrorCode } from "@/lib/koffy-errors";
import type { DrinkChoice } from "@/lib/menu";

export type { OfficeState };
export type RoundView = NonNullable<OfficeState["activeRound"]>;
export type OrderView = RoundView["orders"][number];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: KoffyErrorCode | "NOT_SIGNED_IN" | "INVALID_INPUT" | "INTERNAL" | "NETWORK",
    readonly body: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? "INTERNAL", json);
  return json as T;
}

export const api = {
  signIn: (displayName: string, officeId: string) =>
    call("POST", "/api/session", { displayName, officeId }),
  setOffice: (officeId: string) => call("PATCH", "/api/me", { officeId }),
  state: (officeId: string) => call<OfficeState>("GET", `/api/office/${officeId}/state`),
  startRound: (officeId: string, withUsual: boolean) =>
    call<{ roundId: string }>("POST", `/api/office/${officeId}/rounds`, { withUsual }),
  order: (roundId: string, choice: DrinkChoice, saveUsual: boolean) =>
    call("POST", `/api/rounds/${roundId}/orders`, { choice, saveUsual }),
  orderUsual: (roundId: string) =>
    call("POST", `/api/rounds/${roundId}/orders`, { useUsual: true }),
  closeRound: (roundId: string) =>
    call<{ settled: boolean; fetched?: number }>("POST", `/api/rounds/${roundId}/close`),
  setDone: (orderId: string, done: boolean) => call("PATCH", `/api/orders/${orderId}`, { done }),
  resetOpdracht: (officeId: string, userId: string) =>
    call<{ name: string }>("POST", `/api/office/${officeId}/opdracht-reset`, { userId }),
};

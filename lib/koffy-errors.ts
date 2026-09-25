export type KoffyErrorCode =
  | "ROUND_ALREADY_ACTIVE"
  | "ROUND_CLOSED"
  | "ROUND_NOT_FOUND"
  | "NOT_HALER"
  | "NOT_YOUR_OFFICE"
  | "ORDER_NOT_FOUND"
  | "NO_USUAL_ORDER"
  | "NO_OPDRACHT_DUE"
  | "UNKNOWN_OFFICE";

const STATUS: Record<KoffyErrorCode, number> = {
  ROUND_ALREADY_ACTIVE: 409,
  ROUND_CLOSED: 409,
  ROUND_NOT_FOUND: 404,
  NOT_HALER: 403,
  NOT_YOUR_OFFICE: 403,
  ORDER_NOT_FOUND: 404,
  NO_USUAL_ORDER: 400,
  NO_OPDRACHT_DUE: 409,
  UNKNOWN_OFFICE: 404,
};

export class KoffyError extends Error {
  readonly status: number;
  constructor(
    readonly code: KoffyErrorCode,
    readonly details: Record<string, unknown> = {},
  ) {
    super(code);
    this.status = STATUS[code];
  }
}

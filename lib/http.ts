import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NotSignedInError } from "@/lib/auth";
import { KoffyError } from "@/lib/koffy-errors";

/** Vertaalt bekende fouten naar nette JSON-antwoorden. */
export function handleError(err: unknown) {
  if (err instanceof NotSignedInError) {
    return NextResponse.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  }
  if (err instanceof KoffyError) {
    return NextResponse.json({ error: err.code, ...err.details }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_INPUT", issues: err.issues }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}

import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { getOfficeState } from "@/lib/koffy";

export const dynamic = "force-dynamic";

/** Wordt elke 2 s gepolld: actieve ronde, bestellingen, timer en saldo's. */
export async function GET(_req: Request, ctx: RouteContext<"/api/office/[id]/state">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    const state = await getOfficeState(getDb(), me, id, new Date());
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleError(err);
  }
}

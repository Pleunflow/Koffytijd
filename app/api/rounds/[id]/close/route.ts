import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { closeRound } from "@/lib/koffy";

/** "Ronde afronden" door de haler. Idempotent. */
export async function POST(_req: Request, ctx: RouteContext<"/api/rounds/[id]/close">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    const result = await closeRound(getDb(), me, id, new Date());
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { startRound } from "@/lib/koffy";
import { KoffyError } from "@/lib/koffy-errors";

const Input = z.object({ withUsual: z.boolean().default(false) });

/** "Ik haal! Koffytijd roepen". 409 met roundId als er al een ronde loopt. */
export async function POST(req: Request, ctx: RouteContext<"/api/office/[id]/rounds">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    if (me.officeId !== id) throw new KoffyError("NOT_YOUR_OFFICE");
    const { withUsual } = Input.parse(await req.json().catch(() => ({})));
    const created = await startRound(getDb(), me, { withUsual }, new Date());
    return NextResponse.json({ roundId: created.id }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

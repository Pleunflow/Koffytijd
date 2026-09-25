import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { resetOpdracht } from "@/lib/koffy";

const Input = z.object({ userId: z.uuid() });

/** "Opdracht gedaan, saldo naar 0". */
export async function POST(req: Request, ctx: RouteContext<"/api/office/[id]/opdracht-reset">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    const { userId } = Input.parse(await req.json());
    const res = await resetOpdracht(getDb(), me, id, userId, new Date());
    return NextResponse.json(res);
  } catch (err) {
    return handleError(err);
  }
}

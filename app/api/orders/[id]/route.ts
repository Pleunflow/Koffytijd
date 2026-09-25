import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { setOrderDone } from "@/lib/koffy";

const Input = z.object({ done: z.boolean() });

/** Afvinken op het lijstje (alleen de haler). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    const { done } = Input.parse(await req.json());
    const updated = await setOrderDone(getDb(), me, id, done);
    return NextResponse.json({ order: updated });
  } catch (err) {
    return handleError(err);
  }
}

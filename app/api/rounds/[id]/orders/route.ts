import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { placeOrder } from "@/lib/koffy";
import { DrinkChoiceSchema } from "@/lib/menu";

const Input = z.union([
  z.object({ useUsual: z.literal(true) }),
  z.object({ choice: DrinkChoiceSchema, saveUsual: z.boolean().default(false) }),
]);

/** Bestellen, wijzigen of overslaan (drinkType "skip"). 409 ROUND_CLOSED na sluiten. */
export async function POST(req: Request, ctx: RouteContext<"/api/rounds/[id]/orders">) {
  try {
    const { id } = await ctx.params;
    const me = await requireUser();
    const input = Input.parse(await req.json());
    const saved = await placeOrder(getDb(), me, id, input, new Date());
    return NextResponse.json({ order: saved });
  } catch (err) {
    return handleError(err);
  }
}

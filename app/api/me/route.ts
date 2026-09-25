import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { setUserOffice } from "@/lib/koffy";

const Input = z.object({ officeId: z.string().min(1) });

/** Kantoor wijzigen (komt uit het profiel, alleen op het startscherm te wijzigen). */
export async function PATCH(req: Request) {
  try {
    const me = await requireUser();
    const { officeId } = Input.parse(await req.json());
    await setUserOffice(getDb(), me, officeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

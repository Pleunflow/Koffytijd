import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, signInLocal, signOut } from "@/lib/auth";
import { handleError } from "@/lib/http";

const SignInInput = z.object({
  displayName: z.string().trim().min(1).max(40),
  officeId: z.string().min(1),
});

/** AUTH_MODE=local: kantoor + naam kiezen bij het eerste bezoek. */
export async function POST(req: Request) {
  try {
    const input = SignInInput.parse(await req.json());
    const created = await signInLocal(input);
    return NextResponse.json({ user: created });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}

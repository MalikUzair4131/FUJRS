import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { customerService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function PATCH(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    await customerService.updateName(auth.profile.id, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}

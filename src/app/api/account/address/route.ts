import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { customerService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(20),
});

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const address = await customerService.getAddress(auth.profile.id);
    return NextResponse.json({ address });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load address" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    await customerService.updateAddress(auth.profile.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update address" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { cartService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await cartService.list(auth.profile.id);

  return NextResponse.json({ items });
}

const cartItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  image: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  stitching: z.object({ label: z.string(), addOn: z.number().nonnegative() }).optional(),
  stitcherSlug: z.string().optional(),
});

const syncSchema = z.object({ items: z.array(cartItemSchema) });

export async function PUT(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  await cartService.sync(auth.profile.id, parsed.data.items);

  return NextResponse.json({ ok: true });
}

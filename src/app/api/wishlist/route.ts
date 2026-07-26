import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { wishlistService } from "@/lib/supabase/services";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slugs = await wishlistService.list(auth.profile.id);
  return NextResponse.json({ slugs });
}

const toggleSchema = z.object({ productSlug: z.string().min(1) });

export async function POST(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product slug" }, { status: 400 });
  }

  const { productSlug } = parsed.data;
  const wishlisted = await wishlistService.toggle(auth.profile.id, productSlug);
  return NextResponse.json({ wishlisted });
}

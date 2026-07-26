import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { productDraftService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["VENDOR", "ADMIN"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const drafts = await productDraftService.list(auth.profile.role, auth.profile.id);
  return NextResponse.json({ drafts });
}

const draftSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  price: z.number().positive(),
  fabric: z.string().min(1),
  category: z.string().min(1),
  gender: z.enum(["Men", "Women", "Unisex"]),
  description: z.string().min(10, "Add a bit more description"),
});

export async function POST(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["VENDOR", "ADMIN"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product" },
      { status: 400 }
    );
  }

  const draft = await productDraftService.create(auth.profile.id, parsed.data);

  return NextResponse.json({ draft }, { status: 201 });
}

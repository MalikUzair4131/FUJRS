import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { tailoringService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await tailoringService.getConfig(auth.profile.id);
  return NextResponse.json({ config });
}

const configSchema = z.object({
  measurements: z.record(z.string()),
  neckline: z.string(),
  necklinePrice: z.number(),
  sleeve: z.string(),
  sleevePrice: z.number(),
  hemline: z.string(),
  hemlinePrice: z.number(),
  garmentType: z.string(),
  basePrice: z.number(),
  stitcherSlug: z.string(),
});

export async function PUT(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid configuration payload" }, { status: 400 });
  }

  const data = parsed.data;
  const userId = auth.profile.id;

  await tailoringService.saveConfig(userId, data);

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { tailoringQueueService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["TAILOR", "ADMIN"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const items = await tailoringQueueService.list(auth.profile.role, auth.profile.assignedStitcherSlug);

  return NextResponse.json({ items });
}

const STATUSES = [
  "Awaiting Measurements",
  "In Progress",
  "Quality Check",
  "Ready for Fitting",
  "Delivered",
] as const;

const updateSchema = z.object({
  itemId: z.string(),
  status: z.enum(STATUSES),
});

export async function PATCH(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["TAILOR", "ADMIN"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const item = await tailoringQueueService.updateStatus(parsed.data.itemId, parsed.data.status);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

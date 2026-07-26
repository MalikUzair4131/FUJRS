import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { productDraftService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || auth.profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const drafts = await productDraftService.list("ADMIN", auth.profile.id);
  return NextResponse.json({ drafts });
}

export async function PATCH(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || auth.profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { id, action } = body ?? {};
  if (!id || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await productDraftService.updateStatus(id, action);
  return NextResponse.json({ draft: updated });
}

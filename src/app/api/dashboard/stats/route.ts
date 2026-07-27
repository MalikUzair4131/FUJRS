import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { orderService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["ADMIN", "SUPER_ADMIN"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const stats = await orderService.stats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("GET /api/dashboard/stats failed", err);
    return NextResponse.json({ error: "Unable to load stats." }, { status: 500 });
  }
}

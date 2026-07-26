import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { orderService } from "@/lib/supabase/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || auth.profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const stats = await orderService.stats();

  return NextResponse.json(stats);
}

import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { orderService } from "@/lib/supabase/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await orderService.getById(resolvedParams.id, auth.profile.id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

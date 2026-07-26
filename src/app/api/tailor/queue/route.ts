import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["TAILOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // A tailor only sees bespoke items assigned to them; an admin sees the
  // full queue across every tailor.
  const where =
    session.user.role === "ADMIN"
      ? { stitchingLabel: { not: null } }
      : { stitchingLabel: { not: null }, stitcherSlug: session.user.assignedStitcherSlug ?? "__none__" };

  const items = await prisma.orderItem.findMany({
    where,
    include: { order: { select: { id: true, firstName: true, lastName: true, createdAt: true } } },
    orderBy: { order: { createdAt: "desc" } },
  });

  return NextResponse.json({
    items: items.map((i: any) => ({
      id: i.id,
      orderId: i.order.id,
      customer: `${i.order.firstName} ${i.order.lastName}`,
      garment: i.title,
      stitchingLabel: i.stitchingLabel,
      stitcherSlug: i.stitcherSlug,
      status: i.stitchingStatus ?? "Awaiting Measurements",
      createdAt: i.order.createdAt,
    })),
  });
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
  const session = await getServerSession(authOptions);
  if (!session?.user || !["TAILOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item || !item.stitchingLabel) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // A tailor can only update items assigned to them; admins can update any.
  if (
    session.user.role === "TAILOR" &&
    item.stitcherSlug !== session.user.assignedStitcherSlug
  ) {
    return NextResponse.json({ error: "This item isn't assigned to you." }, { status: 403 });
  }

  const updated = await prisma.orderItem.update({
    where: { id: parsed.data.itemId },
    data: { stitchingStatus: parsed.data.status },
  });

  return NextResponse.json({ item: updated });
}

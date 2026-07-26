import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [totalOrders, orders, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({ select: { total: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  const totalRevenue = orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    recentOrders: recentOrders.map((o: any) => ({
      id: o.id,
      customer: `${o.firstName} ${o.lastName}`,
      total: o.total,
      status: o.status,
      itemCount: o.items.length,
    })),
  });
}

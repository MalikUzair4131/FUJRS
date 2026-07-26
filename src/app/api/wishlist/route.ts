import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ slugs: items.map((i) => i.productSlug) });
}

const toggleSchema = z.object({ productSlug: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product slug" }, { status: 400 });
  }

  const { productSlug } = parsed.data;
  const userId = session.user.id;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productSlug: { userId, productSlug } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  }

  await prisma.wishlistItem.create({ data: { userId, productSlug } });
  return NextResponse.json({ wishlisted: true });
}

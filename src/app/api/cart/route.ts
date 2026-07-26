import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    items: items.map((i: any) => ({
      id: i.id,
      slug: i.productSlug,
      title: i.title,
      image: i.image,
      price: i.price,
      qty: i.qty,
      stitching:
        i.stitchingLabel && i.stitchingAddOn != null
          ? { label: i.stitchingLabel, addOn: i.stitchingAddOn }
          : undefined,
      stitcherSlug: i.stitcherSlug ?? undefined,
    })),
  });
}

const cartItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  image: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  stitching: z.object({ label: z.string(), addOn: z.number().nonnegative() }).optional(),
  stitcherSlug: z.string().optional(),
});

const syncSchema = z.object({ items: z.array(cartItemSchema) });

// Full-replace sync: simplest correct approach for a cart this size —
// delete everything for this user, recreate from the given list. Avoids
// having to reconcile individual row diffs on every quantity change.
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  const userId = session.user.id;

  await prisma.cartItem.deleteMany({ where: { userId } });

  if (parsed.data.items.length > 0) {
    await prisma.cartItem.createMany({
      data: parsed.data.items.map((item) => ({
        userId,
        productSlug: item.slug,
        title: item.title,
        image: item.image,
        price: item.price,
        qty: item.qty,
        stitchingLabel: item.stitching?.label,
        stitchingAddOn: item.stitching?.addOn,
        stitcherSlug: item.stitcherSlug,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}

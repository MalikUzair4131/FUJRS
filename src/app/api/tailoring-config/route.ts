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

  const config = await prisma.tailoringConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({
    config: {
      measurements: JSON.parse(config.measurements),
      neckline: config.neckline,
      necklinePrice: config.necklinePrice,
      sleeve: config.sleeve,
      sleevePrice: config.sleevePrice,
      hemline: config.hemline,
      hemlinePrice: config.hemlinePrice,
      garmentType: config.garmentType,
      basePrice: config.basePrice,
      stitcherSlug: config.stitcherSlug,
    },
  });
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid configuration payload" }, { status: 400 });
  }

  const data = parsed.data;
  const userId = session.user.id;

  await prisma.tailoringConfig.upsert({
    where: { userId },
    create: {
      userId,
      measurements: JSON.stringify(data.measurements),
      neckline: data.neckline,
      necklinePrice: data.necklinePrice,
      sleeve: data.sleeve,
      sleevePrice: data.sleevePrice,
      hemline: data.hemline,
      hemlinePrice: data.hemlinePrice,
      garmentType: data.garmentType,
      basePrice: data.basePrice,
      stitcherSlug: data.stitcherSlug,
    },
    update: {
      measurements: JSON.stringify(data.measurements),
      neckline: data.neckline,
      necklinePrice: data.necklinePrice,
      sleeve: data.sleeve,
      sleevePrice: data.sleevePrice,
      hemline: data.hemline,
      hemlinePrice: data.hemlinePrice,
      garmentType: data.garmentType,
      basePrice: data.basePrice,
      stitcherSlug: data.stitcherSlug,
    },
  });

  return NextResponse.json({ ok: true });
}

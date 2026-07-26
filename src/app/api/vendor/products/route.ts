import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Admins see everything submitted; vendors see only their own drafts.
  const where = session.user.role === "ADMIN" ? {} : { vendorId: session.user.id };

  const drafts = await prisma.productDraft.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ drafts });
}

const draftSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  price: z.number().positive(),
  fabric: z.string().min(1),
  category: z.string().min(1),
  gender: z.enum(["Men", "Women", "Unisex"]),
  description: z.string().min(10, "Add a bit more description"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product" },
      { status: 400 }
    );
  }

  const draft = await prisma.productDraft.create({
    data: {
      vendorId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json({ draft }, { status: 201 });
}

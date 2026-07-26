import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stitchers } from "@/data/stitchers";

const stitcherSlugs = stitchers.map((s) => s.slug) as [string, ...string[]];

const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    staffInviteCode: z.string().optional(),
    staffRole: z.enum(["VENDOR", "TAILOR"]).optional(),
    assignedStitcherSlug: z.enum(stitcherSlugs).optional(),
  })
  .refine((data) => data.staffRole !== "TAILOR" || !!data.assignedStitcherSlug, {
    message: "Select which Master Stitcher this account represents.",
    path: ["assignedStitcherSlug"],
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, staffInviteCode, staffRole, assignedStitcherSlug } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // Never trust a client-supplied role on its own — only apply it if the
  // shared staff invite code matches. Without a real admin-managed invite
  // system yet, this is a pragmatic, clearly-labeled way to create
  // internal Vendor/Tailor accounts for this project's current scope.
  let role = "CUSTOMER";
  let stitcherSlug: string | null = null;
  const inviteCode = process.env.STAFF_INVITE_CODE;

  if (staffRole && staffInviteCode && inviteCode && staffInviteCode === inviteCode) {
    role = staffRole;
    if (staffRole === "TAILOR" && assignedStitcherSlug) {
      stitcherSlug = assignedStitcherSlug;
    }
  } else if (staffRole) {
    return NextResponse.json({ error: "Invalid staff invite code." }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      assignedStitcherSlug: stitcherSlug,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { stitchers } from "@/data/stitchers";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

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

  let role: "CUSTOMER" | "VENDOR" | "TAILOR" = "CUSTOMER";
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

  try {
    const supabase = await createAdminSupabaseClient();
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        assigned_stitcher_slug: stitcherSlug,
      },
    });

    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? "Unable to create account." }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      email: normalizedEmail,
      role,
      assigned_stitcher_slug: stitcherSlug,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ user: { id: user.id, name, email: normalizedEmail, role } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth";
import { customerService } from "@/lib/supabase/services";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"]),
});

export async function GET() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || auth.profile.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const [users, roleCounts] = await Promise.all([
      customerService.list(),
      customerService.countsByRole(),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
      roleCounts,
    });
  } catch (err) {
    console.error("GET /api/admin/users failed", err);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || auth.profile.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const supabase = await createAdminSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (error || !user) {
      console.error("POST /api/admin/users: createUser failed", error);
      return NextResponse.json({ error: "Unable to create account." }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      email: normalizedEmail,
      role,
    });

    if (profileError) {
      console.error("POST /api/admin/users: profile insert failed", profileError);
      return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
    }

    return NextResponse.json(
      { user: { id: user.id, name, email: normalizedEmail, role } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/users: unexpected error", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}

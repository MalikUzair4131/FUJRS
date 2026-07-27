import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

  const { name, email, password } = parsed.data;
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
      user_metadata: { name, role: "CUSTOMER" },
    });

    if (error || !user) {
      console.error("Register: createUser failed", error);
      return NextResponse.json({ error: "Unable to create account." }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      email: normalizedEmail,
      role: "CUSTOMER",
    });

    if (profileError) {
      console.error("Register: profile insert failed", profileError);
      return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
    }

    return NextResponse.json(
      { user: { id: user.id, name, email: normalizedEmail, role: "CUSTOMER" } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register: unexpected error", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}

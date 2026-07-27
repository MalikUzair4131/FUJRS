import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { uploadService } from "@/lib/supabase/services";

export async function POST(request: Request) {
  const auth = await getCurrentAppUser();
  if (!auth?.profile || !["ADMIN", "VENDOR"].includes(auth.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = `products/${auth.profile.id}/${Date.now()}-${file.name}`;
  const url = await uploadService.uploadFile(
    buffer,
    file.name,
    "product-images",
    path,
    file.type || undefined
  );

  return NextResponse.json({ url, path });
}

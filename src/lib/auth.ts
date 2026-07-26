import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function getCurrentAppUser() {
  return getAuthenticatedUser();
}

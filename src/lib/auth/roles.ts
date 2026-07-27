import type { AppRole } from "@/lib/supabase/server";

export const ROLE_LABELS: Record<AppRole, string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  VENDOR: "Vendor",
  TAILOR: "Tailor",
  SUPER_ADMIN: "Super Admin",
};

export const STAFF_ROLES: AppRole[] = ["ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"];

export function isStaffRole(role: AppRole | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function canAccessDashboard(role: AppRole | null | undefined): boolean {
  return isStaffRole(role);
}

// Demo accounts are a pure UI fixture — signing in with one of these emails
// never touches Supabase. AuthProvider builds a client-only session from this
// list, and the dashboard views read from src/lib/auth/demoData.ts instead of
// hitting the real APIs. No Supabase project or env file is required.
// Set NEXT_PUBLIC_DEMO_AUTH="false" later when wiring real Supabase auth.
export const DEMO_ACCOUNTS: { email: string; role: AppRole }[] = [
  { email: "user@gmail.com", role: "CUSTOMER" },
  { email: "admin@gmail.com", role: "ADMIN" },
  { email: "vendor@gmail.com", role: "VENDOR" },
  { email: "tailor@gmail.com", role: "TAILOR" },
  { email: "superadmin@gmail.com", role: "SUPER_ADMIN" },
];

const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((account) => account.email));

export function isDemoAuthEnabled(): boolean {
  // On by default for UI demos — no .env needed. Opt out with "false".
  return process.env.NEXT_PUBLIC_DEMO_AUTH !== "false";
}

export function isDemoEmail(email: string): boolean {
  return DEMO_EMAILS.has(email.trim().toLowerCase());
}

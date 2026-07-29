export type AppRole = "CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR" | "SUPER_ADMIN";

export const ROLE_LABELS: Record<AppRole, string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  VENDOR: "Vendor",
  TAILOR: "Tailor",
  SUPER_ADMIN: "Super Admin",
};

export type StaffRole = Exclude<AppRole, "CUSTOMER">;

export const STAFF_ROLES: StaffRole[] = ["ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"];

export function isStaffRole(role: AppRole | null | undefined): role is StaffRole {
  return !!role && STAFF_ROLES.includes(role as StaffRole);
}

export function canAccessDashboard(role: AppRole | null | undefined): boolean {
  return isStaffRole(role);
}

/**
 * What each staff role is responsible for. Drives the staff account screen —
 * customers get order history instead, which means nothing to these roles.
 */
export const ROLE_WORKSPACE: Record<StaffRole, { summary: string; duties: string[] }> = {
  SUPER_ADMIN: {
    summary:
      "Full access across FUJRS — you manage who else gets in, and what they're allowed to see.",
    duties: [
      "Create and manage dashboard users",
      "Assign roles and access permissions",
      "Review store-wide revenue and orders",
    ],
  },
  ADMIN: {
    summary: "Day-to-day running of the store — orders, catalogue submissions, and performance.",
    duties: [
      "Review orders and revenue",
      "Approve or reject vendor product drafts",
      "Monitor the bespoke stitching pipeline",
    ],
  },
  VENDOR: {
    summary: "Propose new pieces for the FUJRS catalogue and track where each submission stands.",
    duties: [
      "Submit new products for review",
      "Track pending and approved submissions",
      "Keep fabric and pricing details current",
    ],
  },
  TAILOR: {
    summary: "Your bespoke queue — every made-to-measure order assigned to your atelier.",
    duties: [
      "Work through the measurement queue",
      "Update stitching status as each piece progresses",
      "Flag pieces ready for fitting",
    ],
  },
};

// This build has no backend. Signing in with one of these emails builds a
// client-only session, and the dashboard views read fixtures from
// src/lib/auth/demoData.ts. Any password is accepted — there is nothing to
// authenticate against until the real backend exists.
export const DEMO_ACCOUNTS: { email: string; role: AppRole }[] = [
  { email: "user@gmail.com", role: "CUSTOMER" },
  { email: "admin@gmail.com", role: "ADMIN" },
  { email: "vendor@gmail.com", role: "VENDOR" },
  { email: "tailor@gmail.com", role: "TAILOR" },
  { email: "superadmin@gmail.com", role: "SUPER_ADMIN" },
];

const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((account) => account.email));

export function isDemoEmail(email: string): boolean {
  return DEMO_EMAILS.has(email.trim().toLowerCase());
}

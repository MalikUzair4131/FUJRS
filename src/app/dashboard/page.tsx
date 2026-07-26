"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminView } from "@/components/dashboard/AdminView";
import { useAuth } from "@/components/providers/AuthProvider";
import { VendorView } from "@/components/dashboard/VendorView";
import { TailorView } from "@/components/dashboard/TailorView";

type Role = "ADMIN" | "VENDOR" | "TAILOR";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  VENDOR: "Vendor",
  TAILOR: "Tailor",
};

export default function DashboardPage() {
  const { session, status } = useAuth();
  const [activeTab, setActiveTab] = useState<Role | null>(null);

  if (status === "loading") {
    return (
      <div className="container-luxe py-24 text-center text-text-muted">
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted">lock</span>
        <h1 className="mt-6 font-display text-headline-md">Staff Sign-In Required</h1>
        <p className="mt-2 max-w-sm text-body-md text-text-muted">
          The dashboard is for FUJRS Admin, Vendor, and Tailor accounts.
        </p>
        <Link
          href="/login?callbackUrl=/dashboard"
          className="mt-8 bg-primary text-on-primary px-10 py-4 font-body text-label-md uppercase tracking-widest hover:bg-marketplace-bronze transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const userRole = session?.user.role as Role | "CUSTOMER" | undefined;
  const availableRoles: Role[] =
    userRole === "ADMIN" ? ["ADMIN", "VENDOR", "TAILOR"] : userRole && userRole !== "CUSTOMER" ? [userRole] : [];

  if (availableRoles.length === 0) {
    return (
      <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted">block</span>
        <h1 className="mt-6 font-display text-headline-md">Staff Access Only</h1>
        <p className="mt-2 max-w-sm text-body-md text-text-muted">
          This dashboard is for FUJRS staff accounts. Your account is a
          regular customer account.
        </p>
        <Link
          href="/account"
          className="mt-8 border border-primary px-10 py-4 font-body text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
        >
          Back to My Account
        </Link>
      </div>
    );
  }

  const role = activeTab && availableRoles.includes(activeTab) ? activeTab : availableRoles[0];

  return (
    <div className="container-luxe py-12">
      <p className="label-caps text-gold">Internal Tools</p>
      <h1 className="mt-2 font-display text-headline-md">Dashboard</h1>
      <p className="mt-2 text-body-md text-text-muted">
        Signed in as {session?.user.name} — {roleLabels[role]}. All data
        below is live from the database.
      </p>

      {availableRoles.length > 1 && (
        <div className="mt-8 flex gap-2 border border-outline-variant p-1 w-fit">
          {availableRoles.map((r) => (
            <button
              key={r}
              onClick={() => setActiveTab(r)}
              className={`px-6 py-2.5 label-caps ${
                role === r ? "bg-primary text-on-primary" : "text-on-surface"
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {role === "ADMIN" && <AdminView />}
        {role === "VENDOR" && <VendorView />}
        {role === "TAILOR" && <TailorView />}
      </div>
    </div>
  );
}

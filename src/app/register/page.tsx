"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { stitchers } from "@/data/stitchers";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isStaff, setIsStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<"VENDOR" | "TAILOR">("VENDOR");
  const [staffInviteCode, setStaffInviteCode] = useState("");
  const [assignedStitcherSlug, setAssignedStitcherSlug] = useState(stitchers[0].slug);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        ...(isStaff
          ? {
              staffRole,
              staffInviteCode,
              ...(staffRole === "TAILOR" ? { assignedStitcherSlug } : {}),
            }
          : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push(isStaff ? "/dashboard" : "/account");
    router.refresh();
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-headline-md">Create Account</h1>
        <p className="mt-2 text-center font-body text-body-md text-on-surface-variant">
          Join FUJRS for faster checkout and order tracking
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
              Full Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <p className="mt-1 font-label-sm text-on-surface-variant">At least 8 characters.</p>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <label className="flex items-center gap-2 font-label-sm uppercase tracking-widest text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={isStaff}
                onChange={(e) => setIsStaff(e.target.checked)}
                className="h-4 w-4"
              />
              This is a staff account (Vendor / Tailor)
            </label>

            {isStaff && (
              <div className="mt-4 space-y-4 border border-marketplace-bronze/30 bg-surface-container-low p-4">
                <div>
                  <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Role
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as "VENDOR" | "TAILOR")}
                    className="mt-1 w-full border border-outline-variant bg-white px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
                  >
                    <option value="VENDOR">Vendor (merchandising)</option>
                    <option value="TAILOR">Tailor (master stitcher)</option>
                  </select>
                </div>

                {staffRole === "TAILOR" && (
                  <div>
                    <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
                      Which Master Stitcher is this?
                    </label>
                    <select
                      value={assignedStitcherSlug}
                      onChange={(e) => setAssignedStitcherSlug(e.target.value)}
                      className="mt-1 w-full border border-outline-variant bg-white px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
                    >
                      {stitchers.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Staff Invite Code
                  </label>
                  <input
                    required={isStaff}
                    value={staffInviteCode}
                    onChange={(e) => setStaffInviteCode(e.target.value)}
                    className="mt-1 w-full border border-outline-variant bg-white px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
                  />
                  <p className="mt-1 font-label-sm text-on-surface-variant">
                    Ask an admin for this. Without a valid code, the
                    account is created as a regular customer instead.
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="font-label-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 font-body text-label-md uppercase tracking-widest hover:bg-marketplace-bronze transition-colors disabled:opacity-60"
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

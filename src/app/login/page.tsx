"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { DEMO_ACCOUNTS, ROLE_LABELS, isDemoAuthEnabled, isStaffRole } from "@/lib/auth/roles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn(email, password);
    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    if (result.role) {
      // Demo session: no real Supabase cookie, so server-rendered pages like
      // /account (which hard-redirect unauthenticated visitors) don't work.
      // Only /dashboard is safe to land on for a demo session.
      router.push(callbackUrl === "/dashboard" ? callbackUrl : isStaffRole(result.role) ? "/dashboard" : "/");
    } else {
      router.push(callbackUrl);
    }
    router.refresh();
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-headline-md">Welcome Back</h1>
        <p className="mt-2 text-center font-body text-body-md text-on-surface-variant">
          Sign in to your FUJRS account
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-body text-label-sm text-on-surface-variant underline hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>

          {error && <p className="font-label-sm text-error">{error}</p>}

          <Button type="submit" disabled={loading} variant="primary" className="w-full !py-4">
            {loading ? "Signing In…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          New here?{" "}
          <Link href="/register" className="text-primary underline">
            Create an account
          </Link>
        </p>

        {isDemoAuthEnabled() && (
          <div className="mt-8 border-t border-outline-variant pt-6">
            <p className="font-label-sm uppercase tracking-widest text-marketplace-bronze">
              Demo accounts (any password)
            </p>
            <ul className="mt-2 space-y-1 font-body text-body-md text-on-surface-variant">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  {account.email} — {ROLE_LABELS[account.role]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

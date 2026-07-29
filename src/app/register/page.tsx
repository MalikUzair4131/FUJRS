"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // The account is created on this device only — there's no backend to
    // register against, and the password is intentionally not stored.
    const result = await signUp({ email, password, name });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/account");
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
            <label
              htmlFor="register-name"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Full Name
            </label>
            <input
              id="register-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <p className="mt-1 font-label-sm text-on-surface-variant">At least 8 characters.</p>
          </div>

          {error && <p className="font-label-sm text-error">{error}</p>}

          <Button type="submit" disabled={loading} variant="primary" className="w-full !py-4">
            {loading ? "Creating Account…" : "Create Account"}
          </Button>
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

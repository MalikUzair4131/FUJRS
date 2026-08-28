"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    // Validation is real; the save isn't — passwords need a backend to live
    // in. This page is reached from the emailed reset link once that exists.
    router.push("/login");
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-headline-md">Set New Password</h1>
        <p className="mt-2 text-center font-body text-body-md text-on-surface-variant">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="reset-password"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <p className="mt-1 font-label-sm text-on-surface-variant">At least 8 characters.</p>
          </div>
          <div>
            <label
              htmlFor="reset-confirm-password"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>

          {error && <p className="font-label-sm text-error">{error}</p>}

          <Button type="submit" disabled={submitting} variant="primary" className="w-full !py-4">
            {submitting ? "Saving…" : "Save New Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

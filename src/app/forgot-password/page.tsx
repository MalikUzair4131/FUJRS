"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to Supabase Auth's resetPasswordForEmail(email) once
    // project email/SMTP delivery is configured. UI-only for now — always
    // shows the generic confirmation below so we don't leak which emails
    // have accounts.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm text-center">
          <span className="material-symbols-outlined text-4xl text-marketplace-bronze">
            mark_email_read
          </span>
          <h1 className="mt-6 font-display text-headline-md">Check Your Email</h1>
          <p className="mt-2 font-body text-body-md text-on-surface-variant">
            If an account exists for {email}, we&apos;ve sent a link to reset your password.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block font-body text-label-md text-primary underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-headline-md">Reset Password</h1>
        <p className="mt-2 text-center font-body text-body-md text-on-surface-variant">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="forgot-email"
              className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full !py-4">
            Send Reset Link
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          Remembered your password?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

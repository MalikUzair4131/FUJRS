"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="border border-primary px-8 py-3 font-body text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
    >
      Sign Out
    </button>
  );
}

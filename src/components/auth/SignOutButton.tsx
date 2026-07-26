"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="border border-primary px-8 py-3 font-body text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
    >
      Sign Out
    </button>
  );
}

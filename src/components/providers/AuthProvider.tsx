"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppRole } from "@/lib/auth/roles";
import { isDemoEmail } from "@/lib/auth/roles";
import {
  clearSession,
  createDemoUser,
  persistSession,
  readSession,
  type StoredUser,
} from "@/lib/auth/session";
import * as accounts from "@/lib/local/profile";

type AuthUser = StoredUser;

interface AuthSession {
  user: AuthUser;
}

interface AuthContextValue {
  session: AuthSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: AppRole }>;
  signUp: (input: { email: string; password: string; name: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  updateName: (newName: string) => Promise<{ error?: string }>;
}

const NO_BACKEND_ERROR = "Password changes need the live backend — not wired up yet.";
const UNKNOWN_ACCOUNT_ERROR =
  "No account found for that email on this device. Create one, or use a demo login.";

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(account: accounts.LocalAccount): AuthUser {
  return {
    id: `local-${account.email}`,
    email: account.email,
    name: account.name || account.email,
    role: account.role,
    assignedStitcherSlug: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const stored = readSession();
    if (stored) {
      // Profile edits are saved per-email, so re-apply them over the fixture.
      const saved = accounts.findAccount(stored.email);
      setSession({ user: saved?.name ? { ...stored, name: saved.name } : stored });
      setStatus("authenticated");
    } else {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      async signIn(email) {
        const demoUser = isDemoEmail(email) ? createDemoUser(email) : null;
        if (demoUser) {
          const saved = accounts.findAccount(demoUser.email);
          const user = saved?.name ? { ...demoUser, name: saved.name } : demoUser;
          persistSession(user);
          setSession({ user });
          setStatus("authenticated");
          return { role: user.role };
        }

        const account = accounts.findAccount(email);
        if (!account) return { error: UNKNOWN_ACCOUNT_ERROR };

        const user = toUser(account);
        persistSession(user);
        setSession({ user });
        setStatus("authenticated");
        return { role: user.role };
      },
      async signUp(input) {
        if (isDemoEmail(input.email)) {
          return { error: "That email is reserved for a demo login." };
        }
        const account = accounts.createAccount({ name: input.name, email: input.email });
        const user = toUser(account);
        persistSession(user);
        setSession({ user });
        setStatus("authenticated");
        return {};
      },
      async signOut() {
        clearSession();
        setSession(null);
        setStatus("unauthenticated");
      },
      async updatePassword() {
        return { error: NO_BACKEND_ERROR };
      },
      async updateName(newName) {
        if (!session) return { error: "Not signed in." };
        accounts.updateName(session.user.email, newName);
        const user = { ...session.user, name: newName.trim() };
        persistSession(user);
        setSession({ user });
        return {};
      },
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/supabase/server";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  assignedStitcherSlug: string | null;
}

interface AuthSession {
  user: AuthUser;
}

interface AuthContextValue {
  session: AuthSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: { email: string; password: string; name: string; role?: AppRole; assignedStitcherSlug?: string | null }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(user: any): AuthUser {
  const metadata = user?.user_metadata ?? {};
  return {
    id: user?.id ?? "",
    email: user?.email ?? "",
    name: metadata.name ?? user?.email ?? "",
    role: (metadata.role ?? "CUSTOMER") as AppRole,
    assignedStitcherSlug: metadata.assigned_stitcher_slug ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [client] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const { data: { session: initialSession }, error } = await client.auth.getSession();
      if (!mounted) return;
      if (error) {
        setSession(null);
        setStatus("unauthenticated");
        return;
      }

      if (initialSession?.user) {
        setSession({ user: toUser(initialSession.user) });
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    }

    hydrate();

    const { data: subscription } = client.auth.onAuthStateChange((event: string, nextSession: { user?: any } | null) => {
      if (!mounted) return;
      if (nextSession?.user) {
        setSession({ user: toUser(nextSession.user) });
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        return { error: error?.message };
      },
      async signUp(input) {
        const { error } = await client.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              name: input.name,
              role: input.role ?? "CUSTOMER",
              assigned_stitcher_slug: input.assignedStitcherSlug ?? null,
            },
          },
        });
        return { error: error?.message };
      },
      async signOut() {
        await client.auth.signOut();
      },
    }),
    [client, session, status]
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

import type { AppRole } from "@/lib/supabase/server";
import { DEMO_ACCOUNTS } from "./roles";

const DEMO_SESSION_KEY = "fujrs_demo_session";

export interface DemoAuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  assignedStitcherSlug: string | null;
  isDemo: true;
}

const DEMO_DISPLAY_NAMES: Record<AppRole, string> = {
  CUSTOMER: "Demo Customer",
  ADMIN: "Demo Admin",
  VENDOR: "Demo Vendor",
  TAILOR: "Demo Tailor",
  SUPER_ADMIN: "Demo Super Admin",
};

export function createDemoUser(email: string): DemoAuthUser | null {
  const account = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
  if (!account) return null;

  return {
    id: `demo-${account.role.toLowerCase()}`,
    email: account.email,
    name: DEMO_DISPLAY_NAMES[account.role],
    role: account.role,
    assignedStitcherSlug: null,
    isDemo: true,
  };
}

export function persistDemoSession(user: DemoAuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
}

export function readDemoSession(): DemoAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoAuthUser;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

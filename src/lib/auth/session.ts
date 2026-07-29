// The signed-in user, persisted in the browser. There is no backend session
// to validate against yet — this is the whole of "auth" in this build.
import type { AppRole } from "@/lib/auth/roles";
import { DEMO_ACCOUNTS } from "./roles";

const SESSION_KEY = "fujrs-session";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  assignedStitcherSlug: string | null;
  /** Set on the fixture staff logins, which read dashboard demo data. */
  isDemo?: boolean;
}

const DEMO_DISPLAY_NAMES: Record<AppRole, string> = {
  CUSTOMER: "Demo Customer",
  ADMIN: "Demo Admin",
  VENDOR: "Demo Vendor",
  TAILOR: "Demo Tailor",
  SUPER_ADMIN: "Demo Super Admin",
};

export function createDemoUser(email: string): StoredUser | null {
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

export function persistSession(user: StoredUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function readSession(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

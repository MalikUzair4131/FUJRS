// Customer accounts and profile fields, stored in the browser. Replaces the
// profiles table until a real backend exists. Passwords are deliberately not
// stored — there is nothing to authenticate against, so sign-in only checks
// that an account with that email was registered on this device.
import type { AppRole } from "@/lib/auth/roles";

const STORAGE_KEY = "fujrs-accounts";

export interface SavedAddress {
  street: string;
  city: string;
  postalCode: string;
}

export interface LocalAccount {
  email: string;
  name: string;
  role: AppRole;
  address: SavedAddress | null;
  /** Data URL of the avatar, or null. Downscaled by <ImageUpload /> on the way in. */
  avatar: string | null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readAll(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: LocalAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function findAccount(email: string): LocalAccount | null {
  const target = normalizeEmail(email);
  return readAll().find((a) => a.email === target) ?? null;
}

export function createAccount(input: { name: string; email: string }): LocalAccount {
  const account: LocalAccount = {
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    role: "CUSTOMER",
    address: null,
    avatar: null,
  };
  const existing = readAll().filter((a) => a.email !== account.email);
  writeAll([...existing, account]);
  return account;
}

/** Creates the record on first write so demo logins can save profile data too. */
function upsert(email: string, patch: Partial<LocalAccount>): LocalAccount {
  const target = normalizeEmail(email);
  const all = readAll();
  const current = all.find((a) => a.email === target);
  const next: LocalAccount = {
    email: target,
    name: current?.name ?? "",
    role: current?.role ?? "CUSTOMER",
    address: current?.address ?? null,
    avatar: current?.avatar ?? null,
    ...patch,
  };
  writeAll([...all.filter((a) => a.email !== target), next]);
  return next;
}

export function updateName(email: string, name: string) {
  return upsert(email, { name: name.trim() });
}

// There is deliberately no updateEmail: the account email is the identity key
// for every other local store, and changing it isn't a customer-side action.

export function getAvatar(email: string): string | null {
  return findAccount(email)?.avatar ?? null;
}

export function updateAvatar(email: string, avatar: string | null) {
  return upsert(email, { avatar });
}

export function getAddress(email: string): SavedAddress | null {
  return findAccount(email)?.address ?? null;
}

export function updateAddress(email: string, address: SavedAddress) {
  return upsert(email, { address });
}

// Customer accounts and profile fields. Passwords are deliberately not stored:
// there is nothing to authenticate against, so sign-in only checks that an
// account with that email was registered on this device.

import type { ProfileStore } from "../ports";
import type { Account } from "../types";
import { normaliseEmail, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-accounts";

const readAll = (): Account[] => readJSON<Account[]>(KEY, []);

function find(email: string): Account | null {
  const target = normaliseEmail(email);
  return readAll().find((a) => a.email === target) ?? null;
}

/** Creates the record on first write so demo logins can save profile data too. */
function upsert(email: string, patch: Partial<Account>): Account {
  const target = normaliseEmail(email);
  const all = readAll();
  const current = all.find((a) => a.email === target);

  const next: Account = {
    email: target,
    name: current?.name ?? "",
    role: current?.role ?? "CUSTOMER",
    address: current?.address ?? null,
    avatar: current?.avatar ?? null,
    ...patch,
  };

  writeJSON(KEY, [...all.filter((a) => a.email !== target), next]);
  return next;
}

export const localProfiles: ProfileStore = {
  async find(email) {
    return find(email);
  },

  async create(input) {
    const all = readAll();

    // Bootstrap: the first account on a fresh browser becomes SUPER_ADMIN.
    //
    // Under Supabase the first Super Admin is made deliberately in SQL
    // (supabase/promote-staff.sql) because sign-up must never be able to
    // assign its own role. There is no SQL here, so without this the local
    // build would have no route to a staff role at all and every dashboard
    // would be unreachable. Local-only, and safe: this data never leaves the
    // browser it was typed into.
    const role = all.length === 0 ? "SUPER_ADMIN" : (input.role ?? "CUSTOMER");

    const account: Account = {
      email: normaliseEmail(input.email),
      name: input.name.trim(),
      role,
      address: null,
      avatar: null,
    };

    writeJSON(KEY, [...all.filter((a) => a.email !== account.email), account]);
    return account;
  },

  // There is deliberately no updateEmail: the account email is the identity
  // key for every other local store, and changing it isn't a customer-side
  // action. Once Supabase is wired in the key becomes users.id instead.

  async updateName(email, name) {
    return upsert(email, { name: name.trim() });
  },

  async getAvatar(email) {
    return find(email)?.avatar ?? null;
  },

  async updateAvatar(email, avatar) {
    return upsert(email, { avatar });
  },

  async getAddress(email) {
    return find(email)?.address ?? null;
  },

  async updateAddress(email, address) {
    return upsert(email, { address });
  },
};

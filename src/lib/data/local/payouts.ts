// Payout requests a vendor has raised against their pending commission.
//
// Nothing here moves money. A request is a record that the vendor asked —
// approving and paying it needs a backend and a payout provider, and the
// dashboard says so on screen.

import { INITIAL_PAYOUT_STATUS, PayoutValidationError, validatePayout } from "@/lib/payouts";
import type { PayoutStore } from "../ports";
import type { PayoutRequest } from "../types";
import { makeId, normaliseEmail, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-payout-requests";

type RequestsByVendor = Record<string, PayoutRequest[]>;

const readAll = (): RequestsByVendor => readJSON<RequestsByVendor>(KEY, {});

function listFor(email: string): PayoutRequest[] {
  const mine = readAll()[normaliseEmail(email)] ?? [];
  return [...mine].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export const localPayouts: PayoutStore = {
  async list(email) {
    return listFor(email);
  },

  /**
   * Derived, never stored. A stored balance drifts the first time a write
   * fails halfway, and then the vendor's money is wrong.
   */
  async availableToRequest(email, pendingBalance) {
    const open = listFor(email)
      .filter((request) => request.status !== "Paid")
      .reduce((sum, request) => sum + request.amount, 0);

    return Math.max(0, pendingBalance - open);
  },

  async request(email, amount, available) {
    const problem = validatePayout(amount, available);
    if (problem) throw new PayoutValidationError(problem);

    const key = normaliseEmail(email);
    const all = readAll();
    const request: PayoutRequest = {
      id: makeId(),
      amount: Math.round(amount),
      requestedAt: new Date().toISOString(),
      status: INITIAL_PAYOUT_STATUS,
    };

    writeJSON(KEY, { ...all, [key]: [...(all[key] ?? []), request] });
    return request;
  },
};

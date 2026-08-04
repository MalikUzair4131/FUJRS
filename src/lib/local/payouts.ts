// Payout requests a vendor has raised against their pending commission.
// Stored in the browser and keyed by vendor email; this module is the only
// place that reads/writes them.
//
// Nothing here moves money. A request is a record that the vendor asked —
// approving and paying it needs a backend and a payout provider, and the
// dashboard says so on screen.

const STORAGE_KEY = "fujrs-payout-requests";

/**
 * The least a vendor can withdraw at once. Placeholder until the programme
 * terms are agreed — Section 8 of REQUIREMENTS.md still has this open.
 */
export const MIN_PAYOUT_PKR = 5_000;

export const PAYOUT_STATUSES = ["Requested", "Processing", "Paid"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/** Status every new request starts in. */
export const INITIAL_PAYOUT_STATUS: PayoutStatus = "Requested";

export interface PayoutRequest {
  id: string;
  amount: number;
  requestedAt: string;
  status: PayoutStatus;
}

type RequestsByVendor = Record<string, PayoutRequest[]>;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readAll(): RequestsByVendor {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as RequestsByVendor) : {};
  } catch {
    return {};
  }
}

function writeAll(requests: RequestsByVendor) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // Nothing here is large enough to hit the quota; a failed write just means
    // the request isn't remembered, which the caller surfaces on next read.
  }
}

/** Newest first. */
export function listRequests(email: string): PayoutRequest[] {
  const mine = readAll()[normaliseEmail(email)] ?? [];
  return [...mine].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/** Amount already spoken for by requests that haven't been paid out yet. */
export function pendingRequestTotal(email: string): number {
  return listRequests(email)
    .filter((request) => request.status !== "Paid")
    .reduce((sum, request) => sum + request.amount, 0);
}

/**
 * What's left to request: the balance the vendor has earned, less anything
 * already sitting in an open request.
 */
export function availableToRequest(email: string, pendingBalance: number): number {
  return Math.max(0, pendingBalance - pendingRequestTotal(email));
}

/** Null when the amount is requestable, otherwise the reason to show the vendor. */
export function validatePayout(amount: number, available: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter how much you'd like to withdraw.";
  }
  if (amount < MIN_PAYOUT_PKR) {
    return `The minimum withdrawal is PKR ${MIN_PAYOUT_PKR.toLocaleString()}.`;
  }
  if (available < MIN_PAYOUT_PKR) {
    return `You need at least PKR ${MIN_PAYOUT_PKR.toLocaleString()} available to withdraw.`;
  }
  if (amount > available) {
    return `You only have PKR ${available.toLocaleString()} available to withdraw.`;
  }
  return null;
}

export class PayoutValidationError extends Error {}

/**
 * Records a withdrawal request. Throws `PayoutValidationError` when the amount
 * isn't requestable — callers should run `validatePayout` first to show the
 * reason inline, so the throw only guards against a bad call.
 */
export function requestPayout(email: string, amount: number, available: number): PayoutRequest {
  const problem = validatePayout(amount, available);
  if (problem) throw new PayoutValidationError(problem);

  const key = normaliseEmail(email);
  const all = readAll();
  const request: PayoutRequest = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    amount: Math.round(amount),
    requestedAt: new Date().toISOString(),
    status: INITIAL_PAYOUT_STATUS,
  };

  writeAll({ ...all, [key]: [...(all[key] ?? []), request] });
  return request;
}

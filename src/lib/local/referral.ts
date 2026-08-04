// The shopper's side of the affiliate system: when someone lands on the site
// through a vendor's link, the code that brought them here is held for the
// length of the attribution window and attached to any order they place.
//
// This module is the only place that reads/writes the captured referral, so
// swapping it for a server-set cookie later is a one-file change. Attribution
// is provisional until then — a browser store can't see traffic, and anyone
// can put any code in the URL. The server has to be the one that decides a
// sale really belongs to a vendor.
import { isValidReferralCode, normaliseReferralCode } from "@/lib/local/affiliate";

const STORAGE_KEY = "fujrs-referral";

/**
 * How long a referral stays credited to the vendor after the click. Placeholder
 * until the real programme terms are agreed — Section 8 of REQUIREMENTS.md.
 */
export const ATTRIBUTION_WINDOW_DAYS = 30;

const MS_PER_DAY = 86_400_000;

export interface CapturedReferral {
  /** The vendor's referral code, e.g. `FJ-1A2B3C`. */
  code: string;
  /** Which product the shopper landed on — the vendor's link always names one. */
  productSlug: string | null;
  capturedAt: string;
}

function isExpired(referral: CapturedReferral): boolean {
  const age = Date.now() - new Date(referral.capturedAt).getTime();
  return !Number.isFinite(age) || age > ATTRIBUTION_WINDOW_DAYS * MS_PER_DAY;
}

/** The active referral, or null when there isn't one or it has aged out. */
export function getReferral(): CapturedReferral | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;

    const referral = parsed as CapturedReferral;
    if (!isValidReferralCode(referral.code) || isExpired(referral)) {
      clearReferral();
      return null;
    }
    return referral;
  } catch {
    return null;
  }
}

/**
 * Records a code from a `?ref=` link. A later click overwrites an earlier one —
 * last touch wins, which is the simplest rule to explain to vendors and the
 * one the backend should keep unless the programme terms say otherwise.
 * Returns null when the code isn't one FUJRS would have issued.
 */
export function captureReferral(code: string, productSlug: string | null): CapturedReferral | null {
  if (typeof window === "undefined" || !isValidReferralCode(code)) return null;

  const referral: CapturedReferral = {
    code: normaliseReferralCode(code),
    productSlug,
    capturedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(referral));
  } catch {
    // A failed write just means the referral isn't remembered; the shopper's
    // journey is unaffected, so there's nothing to surface.
    return null;
  }
  return referral;
}

export function clearReferral() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** The code to stamp on an order, or null when the visit wasn't referred. */
export function activeReferralCode(): string | null {
  return getReferral()?.code ?? null;
}

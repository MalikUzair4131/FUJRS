// The products a vendor is marketing, stored in the browser and keyed by
// vendor email. This module is the only place that reads/writes them, so
// swapping it for an API client later is a one-file change.
//
// Click and sale tracking is deliberately absent: attributing a sale to a
// referral needs a server that sees the traffic. The dashboard says so on
// screen rather than showing invented numbers.

const STORAGE_KEY = "fujrs-affiliate-links";
const REFERRAL_PREFIX = "FJ";
const REFERRAL_CODE_LENGTH = 6;

/** Query parameter a referral link carries. The backend will read this later. */
export const REFERRAL_PARAM = "ref";

export interface AffiliateLink {
  id: string;
  productSlug: string;
  productTitle: string;
  /** Sale price at the time the link was taken, for the vendor's own reference. */
  productPrice: number;
  createdAt: string;
}

type LinksByVendor = Record<string, AffiliateLink[]>;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A stable code per vendor, derived from their email so it survives a page
 * reload without needing to be stored. The real one will be issued by the
 * backend — this only has to be consistent within the browser.
 */
export function referralCodeFor(email: string): string {
  const normalised = normaliseEmail(email);
  let hash = 0;
  for (let i = 0; i < normalised.length; i += 1) {
    hash = (hash * 31 + normalised.charCodeAt(i)) | 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(REFERRAL_CODE_LENGTH, "0");
  return `${REFERRAL_PREFIX}-${code.slice(0, REFERRAL_CODE_LENGTH)}`;
}

const REFERRAL_CODE_PATTERN = new RegExp(`^${REFERRAL_PREFIX}-[0-9A-Z]{${REFERRAL_CODE_LENGTH}}$`);

/** Codes arrive from a URL, so they're untrusted until they match the issued shape. */
export function normaliseReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidReferralCode(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(normaliseReferralCode(code));
}

/** The vendor a code belongs to, or null when no vendor claims it. */
export function vendorEmailForCode(code: string, vendorEmails: string[]): string | null {
  const target = normaliseReferralCode(code);
  return vendorEmails.find((email) => referralCodeFor(email) === target) ?? null;
}

export function buildReferralUrl(origin: string, productSlug: string, code: string): string {
  return `${origin}/products/${productSlug}?${REFERRAL_PARAM}=${code}`;
}

function readAll(): LinksByVendor {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as LinksByVendor) : {};
  } catch {
    return {};
  }
}

function writeAll(links: LinksByVendor) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Nothing here is large enough to hit the quota; a failed write just means
    // the link isn't remembered, which the caller surfaces on next read.
  }
}

/** Newest first. */
export function listLinks(email: string): AffiliateLink[] {
  const mine = readAll()[normaliseEmail(email)] ?? [];
  return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Records a product the vendor has taken a link for. Taking the same link
 * twice refreshes the existing entry rather than duplicating the row.
 */
export function addLink(
  email: string,
  product: { slug: string; title: string; price: number }
): AffiliateLink {
  const key = normaliseEmail(email);
  const all = readAll();
  const existing = (all[key] ?? []).find((link) => link.productSlug === product.slug);

  const link: AffiliateLink = {
    id: existing?.id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    productSlug: product.slug,
    productTitle: product.title,
    productPrice: product.price,
    createdAt: new Date().toISOString(),
  };

  const rest = (all[key] ?? []).filter((l) => l.productSlug !== product.slug);
  writeAll({ ...all, [key]: [...rest, link] });
  return link;
}

export function removeLink(email: string, id: string) {
  const key = normaliseEmail(email);
  const all = readAll();
  writeAll({ ...all, [key]: (all[key] ?? []).filter((link) => link.id !== id) });
}

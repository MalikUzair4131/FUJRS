// The products a vendor is marketing, keyed by vendor email.
//
// Click and sale tracking is deliberately absent: attributing a sale to a
// referral needs a server that sees the traffic. The dashboard says so on
// screen rather than showing invented numbers.

import type { AffiliateStore } from "../ports";
import type { AffiliateLink } from "../types";
import { makeId, normaliseEmail, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-affiliate-links";

type LinksByVendor = Record<string, AffiliateLink[]>;

const readAll = (): LinksByVendor => readJSON<LinksByVendor>(KEY, {});

export const localAffiliate: AffiliateStore = {
  async listLinks(email) {
    const mine = readAll()[normaliseEmail(email)] ?? [];
    return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addLink(email, product) {
    const key = normaliseEmail(email);
    const all = readAll();
    const existing = (all[key] ?? []).find((link) => link.productSlug === product.slug);

    const link: AffiliateLink = {
      // Keep the original id so a re-taken link stays the same row.
      id: existing?.id ?? makeId(),
      productSlug: product.slug,
      productTitle: product.title,
      productPrice: product.price,
      createdAt: new Date().toISOString(),
    };

    const rest = (all[key] ?? []).filter((l) => l.productSlug !== product.slug);
    writeJSON(KEY, { ...all, [key]: [...rest, link] });
    return link;
  },

  async removeLink(email, id) {
    const key = normaliseEmail(email);
    const all = readAll();
    writeJSON(KEY, { ...all, [key]: (all[key] ?? []).filter((link) => link.id !== id) });
  },
};

// The static catalogue, presented through the same domain shape as the
// database one.
//
// `src/data/products.ts` is the hand-written source the app shipped with, and
// it stays the input to `scripts/generate-seed.mjs`. This file is the boundary
// translation for it — exactly like an adapter maps a database row — so the
// storefront reads `CatalogItem` and never learns that the `local` backend is
// serving a TypeScript array.
//
// No I/O, so it runs on the server and in the browser alike.

import { products } from "@/data/products";
import type { CatalogReadStore } from "../ports";
import type { CatalogItem } from "../types";

/**
 * Stock the static pieces are treated as carrying. The array has no stock
 * figures, and the seed uses the same number — keeping them equal is what
 * makes the `local` storefront and a freshly seeded database look identical.
 */
const ASSUMED_STOCK = 25;

/** Sorted newest-first by list order: the array is authored oldest-first. */
const items: CatalogItem[] = products
  .map((product): CatalogItem => {
    // Everything the static array leaves off is absent, not blank — the same
    // distinction the database columns make.
    const { compareAtPrice, sku, badge, meters, embroidery, dupattaInfo, heritageStory } = product;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      compareAtPrice: compareAtPrice ?? null,
      fabric: product.fabric,
      category: product.category,
      gender: product.gender,
      color: product.color,
      sizes: product.sizes,
      stock: ASSUMED_STOCK,
      sku: sku ?? null,
      description: product.description,
      isNewArrival: product.isNewArrival,
      // A piece is stitchable exactly when it carries a charge — the same rule
      // the seed generator applies.
      stitchingEligible: product.stitchingAddOn != null,
      stitchingAddOn: product.stitchingAddOn ?? null,
      badge: badge ?? null,
      meters: meters ?? null,
      embroidery: embroidery ?? null,
      dupattaInfo: dupattaInfo ?? null,
      heritageStory: heritageStory ?? null,
      images: product.images,
      rating: product.rating,
      reviewCount: product.reviewCount,
      addedByEmail: "",
      addedByName: "FUJRS",
      createdAt: new Date(0).toISOString(),
    };
  })
  .reverse();

export const staticCatalog: CatalogReadStore = {
  async list() {
    return items;
  },
  async getBySlug(slug) {
    return items.find((item) => item.slug === slug) ?? null;
  },
};

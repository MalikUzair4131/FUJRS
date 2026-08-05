// Catalogue products added from the dashboard. Admins and Super Admins publish
// immediately — there is no review step, because no role submits products for
// approval.

import { slugify, uniqueSlug } from "@/lib/slug";
import type { CatalogStore } from "../ports";
import type { CatalogItem, ProductGender } from "../types";
import { makeId, normaliseEmail, readJSON, writeJSON } from "./storage";

const KEY = "fujrs-catalog";

/** What fabric is sold as, for rows written before sizes were captured. */
const DEFAULT_SIZES = ["Unstitched"];

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Rows written before the review step was removed carry `submittedBy*` and a
 * status; rows written before the form captured the full product are missing
 * colour, sizes, stock and the product-page details. Normalising here keeps
 * every old shape out of the components — an old row reads as a product with
 * blanks, not as a crash.
 */
function normalise(row: Record<string, unknown>): CatalogItem {
  // Rows written before products supported more than one photo carry a single
  // `image`. Lifting it into the array here keeps the old shape out of every
  // component that reads a product.
  const gallery = Array.isArray(row.images)
    ? (row.images as unknown[]).filter((image): image is string => typeof image === "string")
    : typeof row.image === "string" && row.image
      ? [row.image]
      : [];

  const title = str(row.title);

  return {
    id: str(row.id, makeId()),
    slug: str(row.slug) || slugify(title),
    title,
    price: num(row.price) ?? 0,
    compareAtPrice: num(row.compareAtPrice),
    fabric: str(row.fabric),
    category: str(row.category),
    gender: str(row.gender, "Women") as ProductGender,
    color: str(row.color),
    sizes: Array.isArray(row.sizes)
      ? (row.sizes as unknown[]).filter((size): size is string => typeof size === "string")
      : DEFAULT_SIZES,
    stock: num(row.stock) ?? 0,
    sku: str(row.sku) || null,
    description: str(row.description),
    isNewArrival: row.isNewArrival === true,
    stitchingEligible: row.stitchingEligible === true,
    stitchingAddOn: num(row.stitchingAddOn),
    badge: str(row.badge) || null,
    meters: str(row.meters) || null,
    embroidery: str(row.embroidery) || null,
    dupattaInfo: str(row.dupattaInfo) || null,
    heritageStory: str(row.heritageStory) || null,
    images: gallery,
    // Reviews aren't built, so nothing has a rating yet. Null rather than 0 —
    // see the note on CatalogItem.rating.
    rating: num(row.rating),
    reviewCount: num(row.reviewCount) ?? 0,
    addedByEmail: str(row.addedByEmail) || str(row.submittedByEmail),
    addedByName: str(row.addedByName) || str(row.submittedByName) || "—",
    createdAt: str(row.createdAt, new Date(0).toISOString()),
  };
}

const readAll = (): CatalogItem[] => readJSON<Record<string, unknown>[]>(KEY, []).map(normalise);

export const localCatalog: CatalogStore = {
  async list() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getBySlug(slug) {
    return readAll().find((item) => item.slug === slug) ?? null;
  },

  // Throws StoreWriteError when the quota is hit — images are data URLs here,
  // so a large upload can exceed it. CatalogManager surfaces that to the user.
  async create(input, author) {
    const existing = readAll();
    const { images, ...rest } = input;

    const item: CatalogItem = {
      ...rest,
      id: makeId(),
      slug: uniqueSlug(
        input.title,
        existing.map((product) => product.slug)
      ),
      // The dimensions the uploader measured matter to Storage, not to a data
      // URL the browser renders directly — only the URL is kept here.
      images: images.map((image) => image.dataUrl),
      rating: null,
      reviewCount: 0,
      addedByEmail: normaliseEmail(author.email),
      addedByName: author.name,
      createdAt: new Date().toISOString(),
    };

    writeJSON(KEY, [...existing, item]);
    return item;
  },

  async remove(id) {
    writeJSON(
      KEY,
      readAll().filter((item) => item.id !== id)
    );
  },
};

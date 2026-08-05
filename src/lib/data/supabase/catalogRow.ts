// Shared row → domain translation for the catalogue.
//
// Deliberately free of a `"use client"` directive and of any client/server
// client import: the browser adapter and the server read path both need this
// mapping, and duplicating it is how the two would drift.

import { SUPABASE_URL } from "./env";
import type { CatalogItem, ProductGender } from "../types";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Every column the app reads, plus the two child tables the PDP needs. */
export const PRODUCT_SELECT = `
  id, slug, title, description, price_paisa, compare_at_paisa, fabric, category, gender,
  color, sku, stock, is_new_arrival, stitching_eligible, stitching_addon_paisa,
  badge, heritage_story, embroidery, dupatta_info, meters, rating, review_count,
  created_at, created_by,
  product_images ( storage_path, position ),
  product_variants ( size )
`;

/** PKR in the app, integer paisa in the database (SCHEMA.md). */
export const toPaisa = (pkr: number) => Math.round(pkr * 100);
export const toPkr = (paisa: number) => paisa / 100;
export const toPaisaOrNull = (pkr: number | null) => (pkr === null ? null : toPaisa(pkr));
const toPkrOrNull = (paisa: number | null) => (paisa === null ? null : toPkr(paisa));

/**
 * Rows hold a bucket path, but the seeded catalogue holds absolute URLs from
 * the old design-tool host — see the note atop supabase/seed.sql. Anything
 * starting with http(s) is used as-is; everything else is a bucket object.
 *
 * The URL is composed from the project URL rather than through
 * `storage.getPublicUrl()`, because that needs a client instance and this has
 * to run on the server as well. It is the same string either way.
 */
function toPublicUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${storagePath}`;
}

/** The shape of `PRODUCT_SELECT`, before it becomes a domain object. */
export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_paisa: number;
  compare_at_paisa: number | null;
  fabric: string;
  category: string;
  gender: string;
  color: string;
  sku: string | null;
  stock: number;
  is_new_arrival: boolean;
  stitching_eligible: boolean;
  stitching_addon_paisa: number | null;
  badge: string | null;
  heritage_story: string | null;
  embroidery: string | null;
  dupatta_info: string | null;
  meters: string | null;
  rating: number | null;
  review_count: number;
  created_at: string;
  created_by: string | null;
  product_images: { storage_path: string; position: number }[] | null;
  product_variants: { size: string }[] | null;
}

export function toCatalogItem(row: ProductRow): CatalogItem {
  // Ordered by position — index 0 is the primary image.
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => toPublicUrl(image.storage_path));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: toPkr(row.price_paisa),
    compareAtPrice: toPkrOrNull(row.compare_at_paisa),
    fabric: row.fabric,
    category: row.category,
    gender: row.gender as ProductGender,
    color: row.color,
    sizes: (row.product_variants ?? []).map((variant) => variant.size),
    stock: row.stock,
    sku: row.sku,
    description: row.description,
    isNewArrival: row.is_new_arrival,
    stitchingEligible: row.stitching_eligible,
    stitchingAddOn: toPkrOrNull(row.stitching_addon_paisa),
    badge: row.badge,
    meters: row.meters,
    embroidery: row.embroidery,
    dupattaInfo: row.dupatta_info,
    heritageStory: row.heritage_story,
    images,
    rating: row.rating,
    reviewCount: row.review_count,
    // The row records WHO created it by id; resolving that to a name needs a
    // join the list view doesn't justify. Shown as "—" until something needs it.
    addedByEmail: row.created_by ?? "",
    addedByName: "—",
    createdAt: row.created_at,
  };
}

// Generates supabase/seed.sql from the static catalogue.
//
// NOT part of the normal flow. Products are created through the admin
// dashboard so that path stays exercised and honest. This exists only for a
// future bulk import of the real catalogue — run it deliberately, never as
// part of setup.
//
//   node --experimental-strip-types scripts/generate-seed.mjs
//
// Why generate rather than hand-write: src/data/products.ts stays the single
// source of truth for the catalogue while the app runs on the local adapter,
// so the seed can be regenerated whenever it changes instead of drifting.
//
// The output is idempotent — re-running it updates existing rows rather than
// duplicating them — so it is safe to apply more than once.

import { writeFileSync } from "node:fs";
import { products } from "../src/data/products.ts";

/** Single-quote escaping is the whole injection surface here. */
const q = (value) => (value == null ? "NULL" : `'${String(value).replace(/'/g, "''")}'`);
const n = (value) => (value == null ? "NULL" : String(value));

/** PKR in the app, integer paisa in the database (SCHEMA.md). */
const paisa = (pkr) => (pkr == null ? "NULL" : String(Math.round(pkr * 100)));

const GENDER = { Women: "Women", Men: "Men", Unisex: "Unisex" };

const lines = [
  "-- FUJRS catalogue seed — GENERATED, do not edit by hand.",
  "-- Regenerate: node --experimental-strip-types scripts/generate-seed.mjs",
  "--",
  "-- Idempotent: re-running updates rows rather than duplicating them.",
  "-- Product ids are derived from the slug so they are stable across runs.",
  "--",
  "-- KNOWN EXCEPTION: product_images.storage_path is documented as a bucket",
  "-- path, never a URL. These rows hold absolute lh3.googleusercontent.com",
  "-- URLs, because the current catalogue photography lives on a design-tool",
  "-- preview host and was never uploaded to the bucket. The adapter treats a",
  "-- value starting with http(s) as an absolute URL and anything else as a",
  "-- bucket path.",
  "--",
  "-- This is transitional. Those URLs already fail intermittently and will",
  "-- break for good; replacing them with real FUJRS photography in the",
  "-- product-images bucket is what removes this exception.",
  "",
  "begin;",
  "",
];

for (const p of products) {
  // A deterministic uuid from the slug keeps ids stable across re-seeds, so
  // cart_items and order_items don't end up pointing at replaced rows.
  const id = `md5(${q(p.slug)})::uuid`;

  lines.push(
    `insert into products (
  id, slug, title, description, price_paisa, compare_at_paisa,
  fabric, category, gender, color, sku, stock,
  is_new_arrival, stitching_eligible, stitching_addon_paisa,
  badge, heritage_story, embroidery, dupatta_info, meters,
  rating, review_count
) values (
  ${id}, ${q(p.slug)}, ${q(p.title)}, ${q(p.description)},
  ${paisa(p.price)}, ${paisa(p.compareAtPrice)},
  ${q(p.fabric)}, ${q(p.category)}, ${q(GENDER[p.gender] ?? "Unisex")}, ${q(p.color)},
  ${q(p.sku)}, 25,
  ${p.isNewArrival ? "true" : "false"},
  ${p.stitchingAddOn != null ? "true" : "false"},
  ${paisa(p.stitchingAddOn)},
  ${q(p.badge)}, ${q(p.heritageStory)}, ${q(p.embroidery)}, ${q(p.dupattaInfo)}, ${q(p.meters)},
  ${n(p.rating)}, ${n(p.reviewCount ?? 0)}
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_paisa = excluded.price_paisa,
  compare_at_paisa = excluded.compare_at_paisa,
  fabric = excluded.fabric,
  category = excluded.category,
  gender = excluded.gender,
  color = excluded.color,
  stock = excluded.stock,
  is_new_arrival = excluded.is_new_arrival,
  stitching_eligible = excluded.stitching_eligible,
  stitching_addon_paisa = excluded.stitching_addon_paisa,
  rating = excluded.rating,
  review_count = excluded.review_count,
  updated_at = now();
`
  );

  // Replace the image set wholesale — simpler and more predictable than
  // reconciling positions one by one.
  lines.push(`delete from product_images where product_id = ${id};`);

  p.images.forEach((url, index) => {
    lines.push(
      `insert into product_images (product_id, storage_path, alt, position, width, height, mime_type)
values (${id}, ${q(url)}, ${q(p.title)}, ${index}, 1600, 2000, 'image/jpeg');`
    );
  });

  if (p.sizes?.length) {
    lines.push(`delete from product_variants where product_id = ${id};`);
    for (const size of p.sizes) {
      lines.push(
        `insert into product_variants (product_id, size, stock) values (${id}, ${q(size)}, 10);`
      );
    }
  }

  lines.push("");
}

lines.push("commit;", "");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"));
console.log(`Wrote supabase/seed.sql — ${products.length} products.`);

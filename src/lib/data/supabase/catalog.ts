"use client";

// Catalogue CRUD against `products` + `product_images` + `product_variants`.
//
// Writes are gated by RLS (`products_staff_write`), so a signed-in Admin or
// Super Admin succeeds and everyone else is rejected by the database — not by
// the UI hiding a button.

import { slugify } from "@/lib/slug";
import type { CatalogStore } from "../ports";
import { StoreWriteError } from "../types";
import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_SELECT,
  toCatalogItem,
  toPaisa,
  toPaisaOrNull,
  type ProductRow,
} from "./catalogRow";
import { getBrowserClient } from "./client";

/** The admin form produces a data URL; Storage needs bytes. */
function dataUrlToBlob(dataUrl: string): { blob: Blob; extension: string } | null {
  const match = /^data:(image\/([a-z+]+));base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, subtype, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  return {
    blob: new Blob([bytes], { type: mimeType }),
    extension: subtype === "jpeg" ? "jpg" : subtype,
  };
}

export const supabaseCatalog: CatalogStore = {
  async list() {
    const { data, error } = await getBrowserClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new StoreWriteError("Couldn't load the catalogue.");

    return (data as unknown as ProductRow[] | null)?.map(toCatalogItem) ?? [];
  },

  async getBySlug(slug) {
    const { data, error } = await getBrowserClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw new StoreWriteError("Couldn't load that product.");

    return data ? toCatalogItem(data as unknown as ProductRow) : null;
  },

  async create(input, author) {
    const supabase = getBrowserClient();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new StoreWriteError("You need to be signed in to publish a product.");

    // Slug must be unique; a repeated title would otherwise fail on the
    // constraint with an opaque driver error.
    const base = slugify(input.title);
    const slug = `${base}-${Date.now().toString(36).slice(-4)}`;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        slug,
        title: input.title,
        description: input.description,
        price_paisa: toPaisa(input.price),
        compare_at_paisa: toPaisaOrNull(input.compareAtPrice),
        fabric: input.fabric,
        category: input.category,
        gender: input.gender,
        color: input.color,
        sku: input.sku,
        stock: input.stock,
        is_new_arrival: input.isNewArrival,
        stitching_eligible: input.stitchingEligible,
        stitching_addon_paisa: toPaisaOrNull(input.stitchingAddOn),
        badge: input.badge,
        heritage_story: input.heritageStory,
        embroidery: input.embroidery,
        dupatta_info: input.dupattaInfo,
        meters: input.meters,
        created_by: auth.user.id,
      })
      .select("id, created_at")
      .single();

    if (error || !product) {
      // 42501 is Postgres "insufficient privilege" — i.e. RLS said no.
      // 23505 is a unique violation, which here can only be the SKU: the slug
      // carries a timestamp suffix, so it can't collide.
      throw new StoreWriteError(
        error?.code === "42501"
          ? "Your account isn't allowed to publish products."
          : error?.code === "23505"
            ? "That SKU is already used by another product."
            : "Couldn't save that product."
      );
    }

    // Sizes are rows in product_variants, which is also where per-size stock
    // will live. Until the form tracks stock per size, the product-level count
    // is the source of truth and variants carry zero.
    if (input.sizes.length > 0) {
      await supabase
        .from("product_variants")
        .insert(input.sizes.map((size) => ({ product_id: product.id, size, stock: 0 })));
    }

    // Upload each image, then record the ones that made it. Order is the
    // array order, so `position` is the index the admin arranged.
    const uploaded: {
      path: string;
      mimeType: string;
      position: number;
      bytes: number;
      width: number;
      height: number;
    }[] = [];

    for (const [index, image] of input.images.entries()) {
      const decoded = dataUrlToBlob(image.dataUrl);
      if (!decoded) continue;

      const path = `${product.id}/${index}-${base}.${decoded.extension}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, decoded.blob, { contentType: decoded.blob.type, upsert: true });

      if (!uploadError) {
        uploaded.push({
          path,
          mimeType: decoded.blob.type,
          position: index,
          bytes: decoded.blob.size,
          width: image.width,
          height: image.height,
        });
      }
      // A failed upload skips that image rather than failing the publish —
      // a product with three of four photos is recoverable by editing it;
      // losing the whole submission is not.
    }

    if (uploaded.length > 0) {
      await supabase.from("product_images").insert(
        uploaded.map((image) => ({
          product_id: product.id,
          storage_path: image.path,
          alt: input.title,
          position: image.position,
          // Measured by the uploader as the file was downscaled, so next/image
          // can reserve the right space instead of reflowing on load.
          width: image.width,
          height: image.height,
          bytes: image.bytes,
          mime_type: image.mimeType,
        }))
      );
    }

    return {
      id: product.id,
      slug,
      title: input.title,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      fabric: input.fabric,
      category: input.category,
      gender: input.gender,
      color: input.color,
      sizes: input.sizes,
      stock: input.stock,
      sku: input.sku,
      description: input.description,
      isNewArrival: input.isNewArrival,
      stitchingEligible: input.stitchingEligible,
      stitchingAddOn: input.stitchingAddOn,
      badge: input.badge,
      meters: input.meters,
      embroidery: input.embroidery,
      dupattaInfo: input.dupattaInfo,
      heritageStory: input.heritageStory,
      images: input.images.map((image) => image.dataUrl),
      rating: null,
      reviewCount: 0,
      addedByEmail: author.email,
      addedByName: author.name,
      createdAt: product.created_at,
    };
  },

  async remove(id) {
    // Archive, never delete: orders reference products, and a hard delete
    // would orphan order history (SCHEMA.md §2).
    const { error } = await getBrowserClient()
      .from("products")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new StoreWriteError(
        error.code === "42501"
          ? "Your account isn't allowed to remove products."
          : "Couldn't remove that product."
      );
    }
  },
};

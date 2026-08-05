// Order placement.
//
// This route exists because there is deliberately no client insert policy on
// `orders` (see the RLS migration). Writing an order, its line items and its
// referral attribution has to happen together, and none of it may be decided
// by the browser.
//
// SECURITY — what is NOT trusted from the request body:
//
//   * prices. Every catalogue line is re-priced from the `products` table, so
//     a posted `price: 1` buys nothing cheaply.
//   * totals. Recomputed from the re-priced lines with the same pure helper
//     the bag uses (`@/lib/pricing`), then compared to what was posted.
//   * the referral code. Re-derived server-side; a browser can name any
//     vendor it likes and would otherwise be paying them commission.
//   * who the caller is. Taken from the verified session, never the payload.
//
// The client-side validation in checkout is UX. This is the boundary.

import { NextResponse } from "next/server";
import { INITIAL_ORDER_STATUS } from "@/lib/orderStatus";
import { generateOrderNumber } from "@/lib/orderNumber";
import { orderTotals } from "@/lib/pricing";
import { isValidReferralCode } from "@/lib/referral";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import { createAdminSupabase, createServerSupabase } from "@/lib/data/supabase/server";
import type { Order, PaymentMethod } from "@/lib/data/types";

/** PKR in the app, integer paisa in the database (SCHEMA.md). */
const toPaisa = (pkr: number) => Math.round(pkr * 100);
const toPkr = (paisa: number) => paisa / 100;

/**
 * The bespoke line the tailoring flow adds to the bag. It has no product row,
 * so its price cannot be checked against the catalogue.
 *
 * KNOWN GAP: its price is accepted as posted. Closing it means persisting the
 * stitching request (base + neckline + sleeve + hemline) and re-pricing from
 * that — which is the `stitching_requests` adapter, not yet written. Until
 * then this is the one line a client can price itself, and it is capped at a
 * single unit so it cannot be multiplied.
 */
const BESPOKE_SLUG = "bespoke-stitching-project";

/** Cash on Delivery is the only method that completes an order today. */
const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = ["cod"];

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 20;
/** Rounding on the client can drift by a rupee; a real mismatch is larger. */
const TOTAL_TOLERANCE_PKR = 1;

interface IncomingLine {
  productSlug?: unknown;
  title?: unknown;
  image?: unknown;
  price?: unknown;
  qty?: unknown;
  stitchingLabel?: unknown;
  stitchingAddOn?: unknown;
  stitcherSlug?: unknown;
}

const text = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  // getUser() verifies the token with the auth server. getSession() would only
  // decode the cookie, which is forgeable.
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user ?? null;

  let body: {
    items?: unknown;
    shipping?: unknown;
    total?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    street?: unknown;
    city?: unknown;
    postalCode?: unknown;
    paymentMethod?: unknown;
    referralCode?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request.");
  }

  // --- Shipping details ------------------------------------------------------

  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const street = text(body.street, 200);
  const city = text(body.city, 80);
  const postalCode = text(body.postalCode, 20);

  if (!firstName || !lastName) return bad("A first and last name are required.");
  if (!street || !city || !postalCode) return bad("A complete delivery address is required.");

  const paymentMethod = body.paymentMethod as PaymentMethod;
  if (!SUPPORTED_PAYMENT_METHODS.includes(paymentMethod)) {
    return bad("That payment method isn't available yet.");
  }

  // --- Lines -----------------------------------------------------------------

  const incoming = Array.isArray(body.items) ? (body.items as IncomingLine[]) : [];
  if (incoming.length === 0) return bad("Your bag is empty.");
  if (incoming.length > MAX_LINES) return bad("That's too many items for one order.");

  const slugs = [...new Set(incoming.map((line) => text(line.productSlug, 80)).filter(Boolean))];

  // Read the catalogue as admin: an anonymous shopper can see products under
  // RLS anyway, and this keeps pricing independent of who is checking out.
  const admin = await createAdminSupabase();
  const { data: productRows, error: productError } = await admin
    .from("products")
    .select("id, slug, title, price_paisa, stitching_eligible, stitching_addon_paisa, stock")
    .in("slug", slugs)
    .is("archived_at", null);

  if (productError) return bad("Couldn't price your order. Please try again.", 500);

  const bySlug = new Map((productRows ?? []).map((row) => [row.slug, row]));

  const priced: {
    product_id: string | null;
    title: string;
    image_url: string | null;
    unit_price_paisa: number;
    quantity: number;
    stitching_label: string | null;
    stitching_addon_paisa: number | null;
    stitcherSlug: string | null;
  }[] = [];

  for (const line of incoming) {
    const slug = text(line.productSlug, 80);
    const qty = Number(line.qty);

    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return bad("One of the items has an invalid quantity.");
    }

    if (slug === BESPOKE_SLUG) {
      const price = Number(line.price);
      if (!Number.isFinite(price) || price <= 0) return bad("That bespoke order isn't priced.");
      priced.push({
        product_id: null,
        title: text(line.title, 200) || "Bespoke Stitching",
        image_url: text(line.image, 500) || null,
        unit_price_paisa: toPaisa(price),
        quantity: 1, // see BESPOKE_SLUG
        stitching_label: text(line.stitchingLabel, 200) || null,
        stitching_addon_paisa: 0,
        stitcherSlug: text(line.stitcherSlug, 80) || null,
      });
      continue;
    }

    const product = bySlug.get(slug);
    if (!product) return bad("One of the items is no longer available.");
    if (product.stock < qty) return bad(`“${product.title}” doesn't have that many left.`);

    // Stitching is only chargeable when the product is actually stitchable,
    // and only at the rate the product carries.
    const wantsStitching = Boolean(text(line.stitchingLabel, 200));
    if (wantsStitching && !product.stitching_eligible) {
      return bad(`“${product.title}” isn't available for stitching.`);
    }

    priced.push({
      product_id: product.id,
      title: product.title,
      image_url: text(line.image, 500) || null,
      unit_price_paisa: product.price_paisa,
      quantity: qty,
      stitching_label: wantsStitching ? text(line.stitchingLabel, 200) : null,
      stitching_addon_paisa: wantsStitching ? (product.stitching_addon_paisa ?? 0) : null,
      stitcherSlug: text(line.stitcherSlug, 80) || null,
    });
  }

  // --- Totals ----------------------------------------------------------------

  const totals = orderTotals(
    priced.map((line) => ({
      price: toPkr(line.unit_price_paisa),
      qty: line.quantity,
      stitchingAddOn: toPkr(line.stitching_addon_paisa ?? 0),
    }))
  );

  // The posted total is not used — this only catches a client that has drifted,
  // so the customer isn't silently charged something other than what they saw.
  const claimed = Number(body.total);
  if (Number.isFinite(claimed) && Math.abs(claimed - totals.total) > TOTAL_TOLERANCE_PKR) {
    return bad("Your bag total has changed. Please review it and try again.");
  }

  // --- Referral --------------------------------------------------------------

  // Shape-checked, then confirmed against a real vendor. An unknown code is
  // dropped rather than rejected: the order is still a good order.
  const claimedCode = text(body.referralCode, 20).toUpperCase();
  let referralCode: string | null = null;
  if (claimedCode && isValidReferralCode(claimedCode)) {
    const { data: vendor } = await admin
      .from("users")
      .select("id")
      .eq("referral_code", claimedCode)
      .eq("role", "VENDOR")
      .maybeSingle();
    if (vendor) referralCode = claimedCode;
  }

  // --- Write -----------------------------------------------------------------

  const contactEmail = user?.email ?? "";

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      user_id: user?.id ?? null,
      status: INITIAL_ORDER_STATUS,
      fabric_total_paisa: toPaisa(totals.fabricTotal),
      stitching_total_paisa: toPaisa(totals.stitchingTotal),
      shipping_paisa: toPaisa(totals.shipping),
      total_paisa: toPaisa(totals.total),
      ship_first_name: firstName,
      ship_last_name: lastName,
      ship_street: street,
      ship_city: city,
      ship_postal: postalCode,
      contact_email: contactEmail,
      referral_code: referralCode,
    })
    .select("id, order_number, placed_at, status")
    .single();

  if (orderError || !orderRow) {
    return bad("We couldn't place your order. Please try again.", 500);
  }

  const { data: itemRows, error: itemsError } = await admin
    .from("order_items")
    .insert(
      priced.map((line) => ({
        order_id: orderRow.id,
        product_id: line.product_id,
        title: line.title,
        image_url: line.image_url,
        unit_price_paisa: line.unit_price_paisa,
        quantity: line.quantity,
        stitching_label: line.stitching_label,
        stitching_addon_paisa: line.stitching_addon_paisa,
      }))
    )
    .select("id");

  if (itemsError) {
    // An order with no lines is worse than no order — it would show as a paid
    // total with nothing in it. Remove the header rather than leave that.
    await admin.from("orders").delete().eq("id", orderRow.id);
    return bad("We couldn't place your order. Please try again.", 500);
  }

  // Take the stock. The `stock >= qty` check above was advisory — it can go
  // stale between reading it and writing this order. THIS is the one that
  // decides, because the database evaluates and decrements in one locked
  // statement, so two shoppers can't both take the last piece.
  const { error: stockError } = await admin.rpc("reserve_order_stock", {
    p_order_id: orderRow.id,
  });

  if (stockError) {
    // The reservation is all-or-nothing, so nothing was taken. Drop the order
    // (items cascade) rather than leave one that was never stocked.
    await admin.from("orders").delete().eq("id", orderRow.id);
    return bad("Someone just took the last of one of these. Please review your bag.", 409);
  }

  const order: Order = {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    createdAt: orderRow.placed_at,
    status: INITIAL_ORDER_STATUS,
    items: priced.map((line, index) => ({
      id: itemRows?.[index]?.id ?? `${index}`,
      productSlug: text(incoming[index]?.productSlug, 80),
      title: line.title,
      image: line.image_url ?? "",
      price: toPkr(line.unit_price_paisa),
      qty: line.quantity,
      stitchingLabel: line.stitching_label,
      stitchingAddOn: line.stitching_addon_paisa ? toPkr(line.stitching_addon_paisa) : null,
      stitcherSlug: line.stitcherSlug,
      stitchingStatus: line.stitching_label ? STITCHING_STATUSES[0] : null,
    })),
    fabricTotal: totals.fabricTotal,
    stitchingTotal: totals.stitchingTotal,
    shipping: totals.shipping,
    total: totals.total,
    firstName,
    lastName,
    street,
    city,
    postalCode,
    paymentMethod,
    referralCode,
  };

  return NextResponse.json({ order });
}

// Domain shapes the app works in. Deliberately free of any storage detail:
// no localStorage keys, no database rows, no snake_case. Adapters translate
// at the boundary (CLAUDE.md), so a component never sees a raw row.

import type { AppRole } from "@/lib/auth/roles";
import type { CommissionRate } from "@/lib/commission";
import type { OrderStatus } from "@/lib/orderStatus";
import type { StitchingStatus } from "@/lib/stitchingStatus";
import type { PayoutStatus } from "@/lib/payouts";
import type { MeasurementSet } from "@/lib/measurements";
import type { UploadedImage } from "@/lib/downscaleImage";

export type { UploadedImage };

// --- Accounts ---------------------------------------------------------------

export interface SavedAddress {
  street: string;
  city: string;
  postalCode: string;
}

export interface Account {
  email: string;
  name: string;
  role: AppRole;
  address: SavedAddress | null;
  /** Data URL today; an object path once Supabase Storage is wired in. */
  avatar: string | null;
}

// --- Orders -----------------------------------------------------------------

export type PaymentMethod = "card" | "cod";

export interface OrderItem {
  id: string;
  productSlug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitchingLabel: string | null;
  stitchingAddOn: number | null;
  stitcherSlug: string | null;
  stitchingStatus: StitchingStatus | null;
}

export interface Order {
  id: string;
  /**
   * The short code the customer is given, e.g. "2VVS7D5B". Show this, never
   * `id` — that's a uuid nobody can read back to you (`orders.order_number`).
   */
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  fabricTotal: number;
  stitchingTotal: number;
  shipping: number;
  total: number;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  /** Referral code credited with this order, or null when direct. */
  referralCode: string | null;
}

export interface NewOrderInput {
  items: Array<{
    productSlug: string;
    title: string;
    image: string;
    price: number;
    qty: number;
    stitchingLabel?: string;
    stitchingAddOn?: number;
    stitcherSlug?: string;
  }>;
  fabricTotal: number;
  stitchingTotal: number;
  shipping: number;
  total: number;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
}

// --- Catalogue --------------------------------------------------------------

export const PRODUCT_GENDERS = ["Women", "Men", "Unisex"] as const;
export type ProductGender = (typeof PRODUCT_GENDERS)[number];

/**
 * A published product, as both the dashboard and the storefront read it.
 *
 * This is the full row, not a summary: the PDP renders the specs (fabric,
 * colour, embroidery, dupatta, meters) and the listings render the badge and
 * new-arrival flag, so anything the screens show has to be captured when the
 * product is created — see `NewCatalogItem`.
 */
export interface CatalogItem {
  id: string;
  /** URL key. Derived from the title at creation; never edited afterwards. */
  slug: string;
  title: string;
  price: number;
  /** Was-price for a markdown. Null when the piece isn't discounted. */
  compareAtPrice: number | null;
  fabric: string;
  category: string;
  gender: ProductGender;
  color: string;
  /** `["Unstitched"]` for fabric; real sizes for made-up pieces. */
  sizes: string[];
  stock: number;
  sku: string | null;
  description: string;
  isNewArrival: boolean;
  /** Whether the piece can be sent for bespoke stitching at checkout. */
  stitchingEligible: boolean;
  /** Added to the price when stitching is chosen. Null when not eligible. */
  stitchingAddOn: number | null;
  badge: string | null;
  meters: string | null;
  embroidery: string | null;
  dupattaInfo: string | null;
  heritageStory: string | null;
  /** Ordered; the first is the primary shown in listings. Empty is allowed. */
  images: string[];
  /**
   * Derived from reviews, never entered by hand — a product with no reviews
   * has a null rating rather than a zero, which would read as "rated badly".
   */
  rating: number | null;
  reviewCount: number;
  addedByEmail: string;
  addedByName: string;
  createdAt: string;
}

/**
 * What the product form collects. The fields left out of it are the ones the
 * store owns: `id`, `slug`, `rating`/`reviewCount` (derived from reviews) and
 * the authorship/timestamp columns.
 */
export interface NewCatalogItem extends Omit<
  CatalogItem,
  "id" | "slug" | "images" | "rating" | "reviewCount" | "addedByEmail" | "addedByName" | "createdAt"
> {
  /**
   * Carries intrinsic dimensions, unlike the string URLs on `CatalogItem` —
   * `product_images.width`/`.height` are NOT NULL and can only be measured
   * here, in the browser, at upload time.
   */
  images: UploadedImage[];
}

export interface Author {
  email: string;
  name: string;
}

// --- Affiliate --------------------------------------------------------------

export interface AffiliateLink {
  id: string;
  productSlug: string;
  productTitle: string;
  /** Sale price when the link was taken, for the vendor's own reference. */
  productPrice: number;
  createdAt: string;
}

export interface CapturedReferral {
  code: string;
  productSlug: string | null;
  capturedAt: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  requestedAt: string;
  status: PayoutStatus;
}

// --- Bag and wishlist -------------------------------------------------------

export interface StitchingSelection {
  label: string;
  addOn: number;
}

export interface CartLine {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitching?: StitchingSelection;
  /** Which Master Stitcher this line is assigned to; only set when stitched. */
  stitcherSlug?: string;
}

// --- Bespoke configuration --------------------------------------------------

export interface TailoringConfig {
  measurements: MeasurementSet;
  neckline: string;
  necklinePrice: number;
  sleeve: string;
  sleevePrice: number;
  hemline: string;
  hemlinePrice: number;
  garmentType: string;
  basePrice: number;
  stitcherSlug: string;
}

// --- Staff administration ---------------------------------------------------

/** A dashboard user as the Super Admin manages them. */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  /** Vendors only. */
  referralCode: string | null;
  commission: CommissionRate | null;
}

// --- Errors -----------------------------------------------------------------

/**
 * Thrown when a store can't persist. Adapters catch driver-specific failures
 * (a localStorage quota error, a PostgrestError) and raise this instead, so a
 * component never has to know which backend is running.
 */
export class StoreWriteError extends Error {
  constructor(
    message: string,
    /** True when the cause was capacity rather than a transient fault. */
    readonly outOfSpace = false
  ) {
    super(message);
    this.name = "StoreWriteError";
  }
}

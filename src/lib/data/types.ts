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

/**
 * A photo the customer supplied with a bespoke request.
 *
 * `url` is SIGNED and short-lived: the bucket is private because these are
 * pictures of a customer, and a permanent link that leaks would stay valid
 * forever. Re-read the list to refresh them rather than caching the URL.
 */
export interface ReferenceImage {
  id: string;
  url: string;
}

// --- Enquiries --------------------------------------------------------------

export interface ContactMessage {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}

// --- Reviews ----------------------------------------------------------------

export const MIN_REVIEW_RATING = 1;
export const MAX_REVIEW_RATING = 5;

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: string;
  /** True when the reviewer's account has an order containing this product. */
  verifiedPurchase: boolean;
  /** True when this is the signed-in reader's own review, so it can be edited. */
  mine: boolean;
}

export interface NewReview {
  rating: number;
  title: string | null;
  body: string | null;
}

// --- Stitching queue --------------------------------------------------------

/** A bespoke garment as the tailor who has to cut it sees it. */
export interface StitchingJob {
  id: string;
  /** The order it belongs to, for quoting back to the customer. */
  orderNumber: string;
  customer: string;
  garment: string;
  neckline: string;
  sleeve: string;
  hemline: string;
  notes: string | null;
  measurements: MeasurementSet;
  status: StitchingStatus;
  /** False while the job is still in the pool, waiting to be claimed. */
  claimed: boolean;
  /** What the customer sent to show what they mean. Signed URLs. */
  references: ReferenceImage[];
}

// --- Vendor performance -----------------------------------------------------

/** What a vendor's referral links have actually done. */
export interface VendorPerformance {
  clicks: number;
  sales: number;
  /** Commission credited or paid, in PKR — what they can draw against. */
  earned: number;
  /** Commission on sales still inside the return window. */
  pending: number;
  /**
   * The rate a Super Admin set for them. Read here rather than assumed, so the
   * figure a vendor is quoted is the one their commission is calculated from.
   */
  commission: CommissionRate;
  /**
   * The code their links carry — ISSUED and stored, never derived.
   *
   * The browser build hashes the vendor's email to get one, which works only
   * because nothing else checks it. The order route matches on
   * `users.referral_code`, so a derived code would build links that credit
   * nobody. Null when no code has been issued yet.
   */
  referralCode: string | null;
}

/** A sale credited to a vendor's links. */
export interface ReferredSale {
  id: string;
  orderNumber: string;
  product: string;
  salePrice: number;
  date: string;
  /** Commission on this sale, as it was calculated at the time. */
  commission: number;
}

// --- Dashboard statistics ---------------------------------------------------

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: OrderStatus;
    itemCount: number;
  }[];
}

// --- Access control ---------------------------------------------------------

/**
 * The areas access is granted over. Matches the `access_category` enum, in
 * SCREAMING_SNAKE for the same reason the status enums are: the database
 * stores keys, and the wording on screen can change without a migration.
 */
export const ACCESS_CATEGORIES = ["PRODUCTS", "ORDERS", "STITCHING", "VENDORS", "REPORTS"] as const;
export type AccessCategory = (typeof ACCESS_CATEGORIES)[number];

export const ACCESS_CATEGORY_LABELS: Record<AccessCategory, string> = {
  PRODUCTS: "Products",
  ORDERS: "Orders",
  STITCHING: "Stitching",
  VENDORS: "Vendors",
  REPORTS: "Reports",
};

/**
 * What a role may do in one area.
 *
 * Two flags rather than one, because the table has two and collapsing them
 * would mean the screen couldn't express "can see orders, can't refund them" —
 * which is the main thing a permission grid is for.
 */
export interface AccessGrant {
  canView: boolean;
  canEdit: boolean;
}

/** Every role's grants. SUPER_ADMIN is absent: it bypasses the grid entirely. */
export type AccessGrid = Partial<Record<AppRole, Record<AccessCategory, AccessGrant>>>;

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

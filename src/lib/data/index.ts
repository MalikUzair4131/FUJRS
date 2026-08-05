// The app's only data entry point.
//
// Components import from here and never learn which backend is running:
//
//   import { orders } from "@/lib/data";
//   const list = await orders.list();
//
// Swapping to Supabase, or later to a custom REST backend, means writing an
// adapter against the interfaces in ./ports and changing the picks below.
// No component changes. See BACKEND_SETUP.md §1.

import { localAffiliate } from "./local/affiliate";
import { localAuth } from "./local/auth";
import { localCart } from "./local/cart";
import { localCatalog } from "./local/catalog";
import { localOrders } from "./local/orders";
import { localPayouts } from "./local/payouts";
import { localProfiles } from "./local/profile";
import { localReferrals } from "./local/referral";
import { localTailoring } from "./local/tailoring";
import { localUsers } from "./local/users";
import { localWishlist } from "./local/wishlist";

import { supabaseAuth } from "./supabase/auth";
import { supabaseCatalog } from "./supabase/catalog";
import { supabaseOrders } from "./supabase/orders";
import { supabaseUsers } from "./supabase/users";

import type {
  AffiliateStore,
  AuthStore,
  CartStore,
  CatalogStore,
  OrderStore,
  PayoutStore,
  ProfileStore,
  ReferralStore,
  TailoringStore,
  UserAdminStore,
  WishlistStore,
} from "./ports";

/**
 * Which adapter set to use. `NEXT_PUBLIC_DATA_BACKEND` is inlined at build
 * time, so the unused branch is tree-shaken out of the bundle rather than
 * shipped and skipped.
 *
 * Keeping `local` working is deliberate: it's what lets the app stay demoable
 * with no database, and it's the fallback if Supabase is ever unreachable
 * during development.
 */
const backend = process.env.NEXT_PUBLIC_DATA_BACKEND ?? "local";

if (backend !== "local" && backend !== "supabase") {
  throw new Error(`NEXT_PUBLIC_DATA_BACKEND must be "local" or "supabase", got "${backend}".`);
}

const useSupabase = backend === "supabase";

// --- Migrated to Supabase ---------------------------------------------------

export const auth: AuthStore = useSupabase ? supabaseAuth : localAuth;
export const catalog: CatalogStore = useSupabase ? supabaseCatalog : localCatalog;
export const orders: OrderStore = useSupabase ? supabaseOrders : localOrders;
export const users: UserAdminStore = useSupabase ? supabaseUsers : localUsers;

// --- Still browser-only -----------------------------------------------------
// These keep working under either flag. Each becomes a one-line swap once its
// Supabase adapter exists; the ports don't change.

export const profiles: ProfileStore = localProfiles;
export const affiliate: AffiliateStore = localAffiliate;
export const referrals: ReferralStore = localReferrals;
export const payouts: PayoutStore = localPayouts;
export const cart: CartStore = localCart;
export const wishlist: WishlistStore = localWishlist;
export const tailoring: TailoringStore = localTailoring;

export * from "./types";
export type * from "./ports";

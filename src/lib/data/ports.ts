// The contract between the app and whatever is storing its data.
//
// Every method is async even though the current adapter is synchronous
// localStorage. That is deliberate: a network-backed adapter cannot be
// synchronous, so making the interface async now means components handle
// awaiting and loading states ONCE, rather than changing again when the
// backend lands. See BACKEND_SETUP.md.
//
// Implementations live in `local/` and (later) `supabase/`. Adding a custom
// REST backend means writing `http/` against these same interfaces — no
// component changes.

import type { AppRole } from "@/lib/auth/roles";
import type { CommissionRate } from "@/lib/commission";
import type { OrderStatus } from "@/lib/orderStatus";
import type { StoredUser } from "@/lib/auth/session";
import type {
  ManagedUser,
  Account,
  AffiliateLink,
  Author,
  CapturedReferral,
  CartLine,
  CatalogItem,
  NewCatalogItem,
  NewOrderInput,
  Order,
  PayoutRequest,
  SavedAddress,
  TailoringConfig,
} from "./types";

export interface AuthResult {
  user?: StoredUser;
  error?: string;
}

/**
 * Super Admin user management (REQUIREMENTS.md §4.1).
 *
 * Creating a user needs privileges the browser must never hold, so the
 * Supabase adapter goes through a server route rather than calling the
 * database directly. The port hides that difference.
 */
export interface UserAdminStore {
  list(): Promise<ManagedUser[]>;
  create(input: {
    name: string;
    email: string;
    password: string;
    role: AppRole;
  }): Promise<{ user?: ManagedUser; error?: string }>;
  setCommission(id: string, rate: CommissionRate): Promise<{ error?: string }>;
}

export interface AuthStore {
  /** The signed-in user, or null. */
  current(): Promise<StoredUser | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: { email: string; password: string; name: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Null error on success. Password changes need a real auth provider. */
  updatePassword(newPassword: string): Promise<{ error?: string }>;
  updateName(name: string): Promise<AuthResult>;
  /**
   * Notifies when the session changes underneath the app — a token refresh, a
   * sign-out in another tab. Returns an unsubscribe function. The local
   * adapter has nothing to report and returns a no-op.
   */
  onChange(callback: (user: StoredUser | null) => void): () => void;
}

export interface OrderStore {
  /** Newest first. */
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(input: NewOrderInput): Promise<Order>;
  /** Null when the order is gone or the transition isn't legal. */
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}

export interface ProfileStore {
  find(email: string): Promise<Account | null>;
  /** `role` is only honoured when a Super Admin creates the account. */
  create(input: { name: string; email: string; role?: AppRole }): Promise<Account>;
  updateName(email: string, name: string): Promise<Account>;
  getAvatar(email: string): Promise<string | null>;
  updateAvatar(email: string, avatar: string | null): Promise<Account>;
  getAddress(email: string): Promise<SavedAddress | null>;
  updateAddress(email: string, address: SavedAddress): Promise<Account>;
}

/**
 * The read half of the catalogue, split out because the storefront only ever
 * reads — and reads on the SERVER, where the `local` adapter can't run. The
 * static array satisfies this interface too, which is what lets the shop pages
 * render identically on either backend.
 */
export interface CatalogReadStore {
  /** Newest first. Published products only — archived ones are excluded. */
  list(): Promise<CatalogItem[]>;
  /** Null when no published product has that slug. Backs the product page. */
  getBySlug(slug: string): Promise<CatalogItem | null>;
}

export interface CatalogStore extends CatalogReadStore {
  create(input: NewCatalogItem, author: Author): Promise<CatalogItem>;
  remove(id: string): Promise<void>;
}

export interface AffiliateStore {
  /** Newest first. */
  listLinks(email: string): Promise<AffiliateLink[]>;
  /** Taking the same link twice refreshes it rather than duplicating. */
  addLink(
    email: string,
    product: { slug: string; title: string; price: number }
  ): Promise<AffiliateLink>;
  removeLink(email: string, id: string): Promise<void>;
}

export interface ReferralStore {
  /** The active referral, or null when there isn't one or it has aged out. */
  get(): Promise<CapturedReferral | null>;
  /** Null when the code isn't one FUJRS would have issued. */
  capture(code: string, productSlug: string | null): Promise<CapturedReferral | null>;
  clear(): Promise<void>;
}

export interface PayoutStore {
  /** Newest first. */
  list(email: string): Promise<PayoutRequest[]>;
  /** Balance minus anything already sitting in an open request. */
  availableToRequest(email: string, pendingBalance: number): Promise<number>;
  /** Throws PayoutValidationError when the amount isn't requestable. */
  request(email: string, amount: number, available: number): Promise<PayoutRequest>;
}

export interface CartStore {
  read(): Promise<CartLine[]>;
  write(lines: CartLine[]): Promise<void>;
}

export interface WishlistStore {
  /** Product slugs. */
  read(): Promise<string[]>;
  write(slugs: string[]): Promise<void>;
}

export interface TailoringStore {
  read(): Promise<TailoringConfig | null>;
  write(config: TailoringConfig): Promise<void>;
}

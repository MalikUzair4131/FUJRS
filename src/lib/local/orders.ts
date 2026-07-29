// Orders live in the browser until a real backend exists. This module is the
// single place that reads/writes them — pages never touch localStorage
// directly, so swapping this for an API client later is a one-file change.
import { INITIAL_ORDER_STATUS, type OrderStatus } from "@/lib/orderStatus";
import { STITCHING_STATUSES, type StitchingStatus } from "@/lib/stitchingStatus";

const STORAGE_KEY = "fujrs-orders";

export type PaymentMethod = "card" | "cod";

export interface LocalOrderItem {
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

export interface LocalOrder {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: LocalOrderItem[];
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

function readAll(): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(orders: LocalOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function makeId() {
  // Not a real order number — just stable and unique enough for the UI.
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first, matching what the account order list expects. */
export function listOrders(): LocalOrder[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(id: string): LocalOrder | null {
  return readAll().find((order) => order.id === id) ?? null;
}

export function createOrder(input: NewOrderInput): LocalOrder {
  const order: LocalOrder = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    status: INITIAL_ORDER_STATUS,
    items: input.items.map((item, index) => ({
      id: `${index}-${item.productSlug}`,
      productSlug: item.productSlug,
      title: item.title,
      image: item.image,
      price: item.price,
      qty: item.qty,
      stitchingLabel: item.stitchingLabel ?? null,
      stitchingAddOn: item.stitchingAddOn ?? null,
      stitcherSlug: item.stitcherSlug ?? null,
      stitchingStatus: item.stitchingLabel ? STITCHING_STATUSES[0] : null,
    })),
    fabricTotal: input.fabricTotal,
    stitchingTotal: input.stitchingTotal,
    shipping: input.shipping,
    total: input.total,
    firstName: input.firstName,
    lastName: input.lastName,
    street: input.street,
    city: input.city,
    postalCode: input.postalCode,
    paymentMethod: input.paymentMethod,
  };

  writeAll([...readAll(), order]);
  return order;
}

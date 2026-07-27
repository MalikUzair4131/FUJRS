"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "@/components/providers/AuthProvider";

export interface StitchingSelection {
  label: string;
  addOn: number;
}

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitching?: StitchingSelection;
  // Which Master Stitcher this line is assigned to — only meaningful
  // when `stitching` is set. Used to route bespoke orders to the right
  // Tailor dashboard queue.
  stitcherSlug?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (
    product: Product,
    qty?: number,
    stitching?: StitchingSelection,
    stitcherSlug?: string
  ) => void;
  addCustomItem: (item: {
    id: string;
    slug: string;
    title: string;
    image: string;
    price: number;
    stitching?: StitchingSelection;
    stitcherSlug?: string;
  }) => void;
  removeItem: (id: string, stitched?: boolean) => void;
  updateQty: (id: string, qty: number, stitched?: boolean) => void;
  clear: () => void;
  mounted: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fujrs-cart";

function lineKeyById(id: string, stitched: boolean) {
  return `${id}::${stitched ? "stitched" : "plain"}`;
}

function lineKeyBySlug(slug: string, stitched: boolean) {
  return `${slug}::${stitched ? "stitched" : "plain"}`;
}

async function syncCartToServer(items: CartItem[]) {
  try {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch {
    // Optimistic local state already applied — a retry/toast layer is a
    // reasonable future addition, not required for this pass.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const hydrated = useRef(false);

  // Guests: load from localStorage. Signed-in: load from the DB, merging
  // in anything saved locally before they signed in (by slug, since a
  // DB-loaded row's id is a database id, not the product id).
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      (async () => {
        let localItems: CartItem[] = [];
        try {
          localItems = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        } catch {
          localItems = [];
        }

        try {
          const res = await fetch("/api/cart");
          const data = await res.json();
          const dbItems: CartItem[] = res.ok ? data.items : [];

          const merged = [...dbItems];
          for (const localItem of localItems) {
            const key = lineKeyBySlug(localItem.slug, !!localItem.stitching);
            const existing = merged.find((i) => lineKeyBySlug(i.slug, !!i.stitching) === key);
            if (existing) {
              existing.qty += localItem.qty;
            } else {
              merged.push(localItem);
            }
          }

          setItems(merged);
          hydrated.current = true;
          if (localItems.length > 0) {
            await syncCartToServer(merged);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          setItems(localItems);
          hydrated.current = true;
        }
        setMounted(true);
      })();
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (Array.isArray(stored)) setItems(stored);
      } catch {
        setItems([]);
      }
      hydrated.current = true;
      setMounted(true);
    }
  }, [status]);

  // Persist on every change, once initial hydration/merge is done.
  useEffect(() => {
    if (!mounted || !hydrated.current) return;
    if (status === "authenticated") {
      syncCartToServer(items);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, mounted, status]);

  function addItem(
    product: Product,
    qty = 1,
    stitching?: StitchingSelection,
    stitcherSlug?: string
  ) {
    setItems((prev) => {
      const key = lineKeyBySlug(product.slug, !!stitching);
      const existing = prev.find((i) => lineKeyBySlug(i.slug, !!i.stitching) === key);
      if (existing) {
        return prev.map((i) =>
          lineKeyBySlug(i.slug, !!i.stitching) === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0],
          price: product.price,
          qty,
          stitching,
          stitcherSlug: stitching
            ? (stitcherSlug ?? product.stitcher?.slug ?? "khyber-artisans")
            : undefined,
        },
      ];
    });
  }

  function addCustomItem(item: {
    id: string;
    slug: string;
    title: string;
    image: string;
    price: number;
    stitching?: StitchingSelection;
    stitcherSlug?: string;
  }) {
    setItems((prev) => [...prev, { ...item, qty: 1 }]);
  }

  function removeItem(id: string, stitched = false) {
    const key = lineKeyById(id, stitched);
    setItems((prev) => prev.filter((i) => lineKeyById(i.id, !!i.stitching) !== key));
  }

  function updateQty(id: string, qty: number, stitched = false) {
    const key = lineKeyById(id, stitched);
    setItems((prev) =>
      prev.map((i) =>
        lineKeyById(i.id, !!i.stitching) === key ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
  }

  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{ items, addItem, addCustomItem, removeItem, updateQty, clear, mounted }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function cartTotals(items: CartItem[]) {
  const fabricTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const stitchingTotal = items.reduce((sum, i) => sum + (i.stitching?.addOn ?? 0) * i.qty, 0);
  const subtotal = fabricTotal + stitchingTotal;
  const shipping = items.length === 0 ? 0 : 350;
  const total = subtotal + shipping;
  return { fabricTotal, stitchingTotal, subtotal, shipping, total };
}

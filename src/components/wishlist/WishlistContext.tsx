"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "@/data/products";

interface WishlistContextValue {
  slugs: string[];
  toggle: (product: Product) => void;
  isWishlisted: (slug: string) => boolean;
  mounted: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "fujrs-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Wishlist lives in the browser — there is no backend to sync it to yet.
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) setSlugs(stored);
    } catch {
      setSlugs([]);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs, mounted]);

  function toggle(product: Product) {
    setSlugs((prev) =>
      prev.includes(product.slug) ? prev.filter((s) => s !== product.slug) : [...prev, product.slug]
    );
  }

  function isWishlisted(slug: string) {
    return slugs.includes(slug);
  }

  return (
    <WishlistContext.Provider value={{ slugs, toggle, isWishlisted, mounted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

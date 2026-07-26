"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "@/components/providers/AuthProvider";

interface WishlistContextValue {
  slugs: string[];
  toggle: (product: Product) => void;
  isWishlisted: (slug: string) => boolean;
  mounted: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "fujrs-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Guests: load from localStorage. Signed-in users: load from the DB
  // (and merge in anything saved locally before they signed in).
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      (async () => {
        let localSlugs: string[] = [];
        try {
          localSlugs = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        } catch {
          localSlugs = [];
        }

        try {
          const res = await fetch("/api/wishlist");
          const data = await res.json();
          const dbSlugs: string[] = res.ok ? data.slugs : [];

          const merged = Array.from(new Set([...dbSlugs, ...localSlugs]));
          const toSync = merged.filter((s) => !dbSlugs.includes(s));
          for (const slug of toSync) {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productSlug: slug }),
            });
          }

          setSlugs(merged);
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          setSlugs(localSlugs);
        }
        setMounted(true);
      })();
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (Array.isArray(stored)) setSlugs(stored);
      } catch {
        setSlugs([]);
      }
      setMounted(true);
    }
  }, [status]);

  useEffect(() => {
    if (mounted && status !== "authenticated") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    }
  }, [slugs, mounted, status]);

  async function toggle(product: Product) {
    const wasWishlisted = slugs.includes(product.slug);
    setSlugs((prev) =>
      wasWishlisted ? prev.filter((s) => s !== product.slug) : [...prev, product.slug]
    );

    if (status === "authenticated") {
      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productSlug: product.slug }),
        });
      } catch {
        // Optimistic update already applied; a real retry/toast layer is
        // a reasonable next iteration, not needed for this pass.
      }
    }
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { canAccessDashboard } from "@/lib/auth/roles";

const navLinks = [
  { label: "MEN", href: "/men" },
  { label: "WOMEN", href: "/women" },
  { label: "NEW ARRIVALS", href: "/new-arrivals" },
  { label: "TAILORING", href: "/tailoring" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { session } = useAuth();
  const { items, mounted } = useCart();
  const { slugs, mounted: wishlistMounted } = useWishlist();

  const cartCount = mounted ? items.reduce((sum, i) => sum + i.qty, 0) : 0;
  const wishlistCount = wishlistMounted ? slugs.length : 0;
  const showDashboardLink = canAccessDashboard(session?.user.role);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <nav className="docked full-width top-0 sticky z-50 border-b border-outline-variant">
      <div className="absolute inset-0 -z-10 bg-surface/90 backdrop-blur-md" />
      <div className="flex flex-col items-center w-full px-gutter max-w-container-max mx-auto py-4">
        <div className="flex items-center justify-between w-full">
          {/* Branding */}
          <Link
            href="/"
            className="block py-2 font-display-lg text-headline-sm uppercase tracking-widest"
          >
            FUJRS
          </Link>

          {/* Nav Links (Desktop Only) */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
              >
                {link.label}
              </Link>
            ))}
            {showDashboardLink && (
              <Link
                href="/dashboard"
                className="text-marketplace-bronze hover:text-primary transition-colors duration-200 font-label-md text-label-md"
              >
                DASHBOARD
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="material-symbols-outlined hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90"
              onClick={() => setSearchOpen(true)}
            >
              search
            </button>
            <Link
              aria-label="Wishlist"
              href="/wishlist"
              className="material-symbols-outlined relative hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90"
            >
              favorite
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim text-[10px] font-medium text-primary">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              aria-label={session ? "My Account" : "Sign In"}
              href={session ? "/account" : "/login"}
              className="hidden sm:block hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90"
            >
              <span
                className="material-symbols-outlined"
                style={session ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                person
              </span>
            </Link>
            <Link
              aria-label="Shopping bag"
              href="/cart"
              className="material-symbols-outlined relative hover:text-tertiary-fixed-dim transition-all duration-300 scale-95 active:scale-90"
            >
              shopping_bag
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim text-[10px] font-medium text-primary">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              aria-label="Open menu"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-surface">
          <div className="max-w-container-max mx-auto px-gutter flex h-20 items-center justify-between border-b border-outline-variant">
            <form className="flex flex-1 items-center gap-4" onSubmit={submitSearch}>
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, fabrics, categories…"
                className="w-full border-none bg-transparent font-display-lg text-headline-sm placeholder:text-on-surface-variant focus:outline-none"
              />
            </form>
            <button
              aria-label="Close search"
              className="material-symbols-outlined"
              onClick={() => setSearchOpen(false)}
            >
              close
            </button>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-primary/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-5">
              <span className="font-display-lg text-headline-sm uppercase tracking-widest">
                FUJRS
              </span>
              <button
                aria-label="Close menu"
                className="material-symbols-outlined"
                onClick={() => setMobileOpen(false)}
              >
                close
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-outline-variant py-4 font-label-md text-label-md text-on-surface"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={session ? "/account" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="border-b border-outline-variant py-4 font-label-md text-label-md text-on-surface"
              >
                {session ? "MY ACCOUNT" : "ACCOUNT"}
              </Link>
              {showDashboardLink && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-outline-variant py-4 font-label-md text-label-md text-marketplace-bronze"
                >
                  DASHBOARD
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}

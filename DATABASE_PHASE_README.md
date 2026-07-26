# FUJRS — Backend Phase 2: Database

Persisted the parts of the app that genuinely benefit from surviving
across devices and sessions: **orders** and **wishlist**. Cart and
tailoring configuration deliberately stay on `localStorage` for now —
flagging that as a scope choice, not an oversight.

## What's persisted now

### Orders — fully real
- Checkout now **requires sign-in** (redirects to `/login?callbackUrl=/checkout`
  if you're not authenticated) — orders need an owner
- Placing an order writes a real `Order` + `OrderItem[]` to the database
- **`/checkout/confirmation`** is now a server component that fetches the
  real order by ID, with an ownership check (you can't view someone else's
  order by guessing the URL)
- **`/account`** shows your real order history, pulled straight from the
  database, with a link to view each one

### Wishlist — synced, not just persisted
- Signed-in: wishlist reads from and writes to the database
  (`WishlistItem`, unique per user+product)
- Signed-out: still works exactly as before, via `localStorage`
- **The nice part:** if you build a wishlist as a guest and then sign in,
  your local wishlist merges into your account wishlist automatically
  (and the local copy is cleared once merged, so there's no stale
  duplicate state)

### Dashboard — Admin view wired to real data
- Total Orders and Total Revenue are now live numbers from the database,
  via a new `/api/dashboard/stats` route
- Recent Orders table shows real orders, not mock rows
- Product count and tailoring-queue numbers are still placeholders —
  there's no product-management or tailoring-request table yet, and the
  view says so explicitly rather than faking those numbers too
- Vendor and Tailor dashboard views are unchanged (still mock) — there's
  no vendor/tailor account model, which was intentionally out of scope
  from the very first dashboard build

## What's still local-only (by choice, not oversight)

- **Cart** — still `localStorage`. Syncing an in-progress cart across
  devices is a smaller win than orders/wishlist and touches more surface
  area (merge conflicts on quantity, stitching selections, etc.) — good
  candidate for a focused follow-up rather than folding it into this pass
- **Tailoring configuration** (measurements/style choices) — same
  reasoning; `/account` links to it but doesn't claim it's synced

## Two real bugs found and fixed this phase

1. **A type-checking false-positive that pointed at a real modeling gap.**
   My verification-only Prisma type shim marked `order.items` as optional,
   which caused a build error in `/account`. The fix wasn't to paper over
   the error — it was to correct the shim to match how Prisma's real
   generated types behave (`items` is non-optional once you
   `include: { items: true }`). Worth being honest that a hand-rolled
   type shim can introduce its own false signals, and each one needs
   checking against how the real client actually behaves.
2. **`/api/dashboard/stats` was being statically prerendered at build
   time**, which meant Next tried to run a live database query *during
   the build* rather than per-request — and failed, because there's no
   database available at build time. Fixed with `export const dynamic =
   "force-dynamic"`, which is the correct fix regardless of my sandbox
   limitations: any route reading live, frequently-changing data should
   never be statically generated.

## Architecture notes

- `Order`/`OrderItem`/`WishlistItem` all reference products by their
  static `slug` (from `src/data/products.ts`), not a database foreign
  key — the catalog itself isn't in the database, so this is the correct
  join point until/unless products themselves become database-backed
- Prisma client (`src/lib/prisma.ts`) now instantiates lazily via a Proxy
  rather than at module-import time — this was originally a workaround
  for sandbox verification, but it's also just a more correct pattern in
  general (don't pay the connection-setup cost for routes that never end
  up calling the database)

## Setup

```bash
npm install
npm run db:push     # updates dev.db with the new Order/OrderItem/WishlistItem tables
npm run dev          # http://localhost:3000
```

If you already had a `dev.db` from the auth phase, `db:push` will add the
new tables without touching your existing `User` data.

## Sandbox verification notes

Same limitation as the auth phase: Prisma's engine binaries aren't
reachable from my build environment. I pushed the verification further
this time:

- Full production build passes (54/54 routes) using the lazy-Proxy Prisma
  client — this is what caught both real bugs above
- Directly tested the register endpoint's failure mode without a live
  engine: a clean `500`, not a crash — confirming the app degrades safely
- Verified `/account` redirects correctly (307) without even needing
  database access, since JWT sessions don't require a DB round-trip to
  validate

None of this is a substitute for you running it with real internet access
end-to-end, but it's a genuine attempt to verify as much as the sandbox
allows rather than asking you to take core logic on faith.

## Status

✅ Full production build: 54/54 routes, zero errors
✅ `tsc --noEmit` clean
✅ Every route smoke-tested — zero regressions
✅ Two real bugs found and fixed during this phase's own verification

## Next

Real payment gateway (checkout is still simulated), cart/tailoring-config
persistence if you want it, and Vendor/Tailor accounts if the dashboard's
other two roles should become real instead of mock.

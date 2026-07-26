# FUJRS — Backend Phase 4: Cart & Tailoring Config Persistence

The two things flagged as deliberately deferred in the database phase are
now done. Wishlist, cart, and saved bespoke tailoring configuration all
sync to your account.

## Cart — full sync with login-time merge

- Signed out: works exactly as before, via `localStorage`
- Signed in: reads from and writes to the database
  (`PUT /api/cart` does a full replace-sync — delete + recreate — which is
  simpler and more robust than reconciling individual row diffs for a
  cart this size)
- **Sign in with items already in your guest cart** and they merge into
  your account cart automatically — matching items (same product, same
  stitching selection) combine quantities rather than duplicating

## Tailoring configuration — one saved config per account

- Your most recent measurements + style selections from
  `/tailoring/configure` are saved to your account once you're signed in
- If you have a local guest config *and* sign in to an account that
  already has one saved, the account's saved config wins — it's the
  deliberately-saved cross-device one, not whatever happens to be sitting
  in the browser you're currently on
- `/account` links to `/tailoring/review` to see your latest saved spec

## A real bug found while building this (worth explaining, not just fixing)

My verification-only Prisma type shim was missing `createMany` and
`upsert` on the generic `Delegate` class — I'd only added the methods
earlier phases happened to use. The cart sync route (`createMany`) and
tailoring config route (`upsert`) both failed to type-check the moment I
wrote code that needed them. This is exactly the risk with a hand-rolled
shim: it only knows about what's been exercised so far, not the full
Prisma client surface. Fixed by adding both methods to match Prisma's
real API — worth flagging because it's a pattern that will keep
recurring: every phase that uses a Prisma method for the first time is a
chance for the shim to be caught out, which is by design a good thing
(it means the build is genuinely catching gaps rather than rubber-stamping).

## A design decision worth explaining: why full-replace sync for cart

Cart items don't have a stable client-side identity the way wishlist
entries do (a wishlist entry is just "this product, yes or no"; a cart
line has quantity, and potentially a unique stitching selection, and can
be added/removed/changed in many small steps). Rather than building
fine-grained create/update/delete-per-row API calls and keeping client
and server state precisely reconciled through every intermediate step, I
went with: whenever the cart changes, send the *entire current cart* to
the server, which deletes all existing rows for that user and recreates
them from the payload. For a cart with a handful of items, this is simpler,
harder to get subtly wrong, and fast enough not to matter. If a customer's
cart could realistically reach hundreds of items, incremental sync would
be worth the extra complexity — not the case here.

## Setup

```bash
npm install
npm run db:push     # adds CartItem and TailoringConfig tables
npm run dev
```

## Sandbox verification notes

Same pattern as every backend phase: Prisma's engine binaries aren't
reachable here, so I verify with the lazy-Proxy client + full production
build (which is what caught the shim gap above), plus targeted live
checks — `GET /api/cart` and `GET /api/tailoring-config` both correctly
return `401` without a session, confirming the auth gate runs before any
database access is attempted.

## Status

✅ Full production build: 54/54 routes, zero errors
✅ `tsc --noEmit` clean
✅ New API routes verified auth-gated (live test)
✅ Every other route smoke-tested — zero regressions
✅ One real shim gap found and fixed during this phase's own build

## What's left from the original roadmap

Vendor and Tailor dashboard accounts (still mock) — everything else
originally scoped (frontend, auth, database, payments) is now real.

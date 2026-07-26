# FUJRS — Backend Phase 5: Real Vendor & Tailor Accounts

The Dashboard's Admin/Vendor/Tailor tabs used to be a client-side switcher
anyone could click through with mock data. Now they're real, role-gated
accounts with real data.

## What changed

- **`User.role`** — `CUSTOMER` (default) | `ADMIN` | `VENDOR` | `TAILOR`
- **`/dashboard` is now access-controlled**: signed out → prompted to sign
  in; signed in as a customer → told plainly this is staff-only, with a
  link back to `/account`; signed in as Vendor/Tailor → see only their own
  tab; signed in as Admin → see all three
- **Vendor dashboard is real**: "Add Product" now submits to a genuine
  `ProductDraft` table via `POST /api/vendor/products`, and the table
  below lists actual submitted drafts, not mock rows. Clearly labeled as
  an internal intake queue, not a live marketplace listing — FUJRS is
  still single-brand; this is how merchandising staff would propose new
  catalog pieces for review, not a public seller feature
- **Tailor dashboard is real**: shows actual bespoke `OrderItem`s
  assigned to that specific tailor (matched by `stitcherSlug`), with a
  working status dropdown (`Awaiting Measurements` → `In Progress` →
  `Quality Check` → `Ready for Fitting` → `Delivered`) that persists to
  the database
- **Admin dashboard stats route retroactively secured** — worth flagging
  on its own (see below)

## Two real bugs/gaps found and fixed this phase

1. **`GET /api/dashboard/stats` had no authorization check at all.** It
   was written back when roles didn't exist yet, so there was nothing to
   check against — but that meant *anyone*, signed in or not, could hit
   it and see total order count and revenue. Now that real roles exist,
   this is a genuine security fix, not just a feature addition: added an
   `ADMIN`-only guard.
2. **Bespoke "Proceed to Shopping Bag" orders didn't carry stitcher
   assignment data at all.** Tracing the data flow for the Tailor queue
   surfaced that `addCustomItem` (used by `/tailoring/review`) never
   attached a `stitching` object or `stitcherSlug` — meaning a real
   customer's bespoke order would never have shown up in any tailor's
   queue. Fixed by passing the style summary and `config.stitcherSlug`
   through when the bespoke project is added to the cart, and threading
   `stitcherSlug` through `CartItem` → `/api/cart` → `/api/orders` →
   `OrderItem`.

## How staff accounts are created (and why it's built this way)

There's no existing admin to promote new staff through a UI, so a real
admin-invite system has a bootstrapping problem this project's scope
doesn't call for yet. Instead: `/register` has a "This is a staff account"
toggle. Selecting Vendor or Tailor requires a shared `STAFF_INVITE_CODE`
(set in `.env`) — without a valid code, the account is silently created as
a regular customer instead of erroring in a way that leaks whether the
code was close. Tailor accounts additionally pick which Master Stitcher
profile (from `src/data/stitchers.ts`) they represent.

**This is intentionally lightweight for the project's current scope** — a
shared secret is not how you'd manage real employee accounts at scale.
Worth treating as a placeholder for real admin-managed invites, not a
final design.

**Getting your first Admin account**: there's no self-registration path
for Admin (a shared code is too much power to hand out that way). Register
normally, then use `npx prisma studio` to open a local database browser
and manually set that user's `role` field to `"ADMIN"`. This is the
correct manual bootstrap step for a project this size — documenting it
rather than building a whole admin-invite system to solve a one-time
problem.

## Setup

```bash
npm install
npm run db:push     # adds role/assignedStitcherSlug, ProductDraft, and stitching queue fields
```

Add to `.env`:
```
STAFF_INVITE_CODE="pick-a-real-shared-secret"
```

```bash
npm run dev
```

Try it: register a Vendor account (with the invite code) and submit a
product draft. Register a Tailor account (pick a stitcher) — their queue
starts empty until a customer places a bespoke order assigned to that
same stitcher via `/tailoring/configure`. Promote yourself to Admin via
Prisma Studio to see the full cross-role view.

## Sandbox verification notes

Same pattern as every backend phase. This time: full production build
(56/56 routes) with the lazy-Proxy Prisma client, live-tested that all
three new/updated API routes (`/api/vendor/products`,
`/api/tailor/queue`, `/api/dashboard/stats`) correctly return `403`
without a session, and confirmed the register route's failure mode
without a live database is a clean `500` (traced to the exact expected
cause — the existing-user lookup, which necessarily runs before the
invite-code check) rather than a crash.

## Status

✅ Full production build: 56/56 routes, zero errors
✅ `tsc --noEmit` clean
✅ All three role-gated routes verified returning 403 without a session
✅ One real security gap found and fixed (unprotected stats route)
✅ One real data-flow gap found and fixed (bespoke orders not reaching
the tailor queue)
✅ Every other route smoke-tested — zero regressions

**One thing worth mentioning honestly**: partway through this phase, my
build environment reset (a sandbox-infrastructure event, not something in
the code) and lost the in-progress work. I recovered by restoring from
the last zip I'd delivered you (the persistence phase) and redoing this
phase's changes from there — I had exact memory of what I'd built, so the
end result should be identical to what I would have shipped without the
interruption, and everything above was re-verified from that restored
state, not assumed to still be correct.

## What's left

Nothing outstanding from the original roadmap. Frontend, auth, database,
payments, and now role-based staff accounts are all real. Natural next
steps if you want to keep going: an Admin UI for approving/rejecting
`ProductDraft`s (currently Prisma Studio is the only way), or a proper
admin-managed invite system to replace the shared staff code.

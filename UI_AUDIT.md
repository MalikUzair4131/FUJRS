# FUJRS — Frontend UI Audit (pre-backend checkpoint)

Read-only visual/UX pass across the storefront and staff dashboard, done
2026-07-27 ahead of the Supabase schema/backend build, followed by a fix
pass the same day. This is **not** a feature-gap doc — for missing
backend functionality (product CRUD, permission model, vendor affiliate
system, etc.) see [TASKS.md](./TASKS.md). This doc only covers UI that
looked unfinished, inconsistent, broken, or wrong on a real screen.

**Status: fix pass complete.** Everything below is marked ✅ Done, ⏭️
Deferred (explicit decision, not forgotten), or 🔲 Remaining. Nothing
currently reads as broken — what's left is either out of scope for a
frontend-only pass (needs backend) or was intentionally left alone.

> **Update 2026-07-29.** The backend (Supabase, Stripe, all API routes) was
> removed on purpose — see [README.md](./README.md). Three consequences for
> this document:
>
> - The "one manual Supabase step" for `profiles.address` (Sections 9 and
>   "What's left") is **moot** — saved addresses now persist to
>   `src/lib/local/profile.ts` and work with no setup.
> - Features that previously dead-ended now surface a **"coming soon" toast**
>   (`src/components/ui/Toast.tsx`) instead: card payments, promo codes,
>   password changes. This replaces the promo-code stub noted in Section 2.
> - Dashboard placeholder stats (Section 4) are unchanged, but every
>   dashboard now labels itself as sample data on screen.

---

## 1. ✅ Done — "transparent" mobile hamburger menu

**Root cause:** [Navbar.tsx](src/components/layout/Navbar.tsx) put
`backdrop-blur-md` directly on the `<nav>` element. Per the CSS spec,
`backdrop-filter` makes an element a **containing block** for its
`position: fixed` descendants — so the mobile drawer and search overlay
(both `fixed inset-0`, nested inside that same `<nav>`) were sizing
against the ~80px-tall navbar box instead of the viewport, collapsing
to a thin strip instead of covering the screen.

**Fix applied:** the blur is now on a separate `absolute inset-0 -z-10`
backdrop `<div>` behind the nav's content, and the `<nav>` itself no
longer carries `backdrop-filter` — so it's no longer a containing block
and the drawer/search overlay size against the full viewport again.
Verified via curl against the dev server that `<nav>` no longer has
`backdrop-blur-md` in its class list.

Also confirmed: the hamburger button's `lg:hidden` breakpoint (1024px)
is a deliberate choice, not a bug — left as-is.

## 2. Dead / non-functional UI

- ✅ **Promo Code "Apply" button** (cart + checkout) — now wired to a
  client-side stub: submitting shows "Promo codes aren't available yet
  — check back soon." instead of doing nothing silently.
- ✅ **Returns page dev-note copy** — the literal *"This is a
  frontend-only demo..."* string shown after a lookup attempt was
  replaced with normal client-facing copy pointing to concierge contact.
- ⏭️ **Footer social icons / Instagram link** (`href="#"`) — left as
  placeholders by explicit decision until real account URLs exist.

## 3. ✅ Done — mobile "Quick Add" unreachable

Quick-add-to-cart overlays across home/men/women/cart cross-sell were
hover-only (`opacity-0 group-hover:opacity-100`), invisible and
untappable on touch devices. Now visible by default and only
hover-gated at `md:` and above, with a `group-focus-within` fallback
for keyboard navigation:
- [NewArrivalsGrid.tsx](src/components/home/NewArrivalsGrid.tsx)
- [MenProductTile.tsx](src/components/product/MenProductTile.tsx)
- [WomenProductTile.tsx](src/components/product/WomenProductTile.tsx)
- [CompleteTheLook.tsx](src/components/product/CompleteTheLook.tsx)

## 4. Placeholder / stale content

- ✅ Hardcoded, mutually-contradicting seasonal labels ("Winter Edition
  2024" on home, "Spring Summer '24" on men, "Spring/Summer '24" on
  women) replaced with evergreen "This Season" across all three heroes.
- ✅ Static "New Collection" badge on every home new-arrivals tile now
  reads from `product.badge` when set, falling back to "New Arrival"
  (accurate, since the section is already filtered to real new arrivals).
- 🔲 **Dashboard placeholder stats** — `AdminView.tsx`'s "Active
  Products: 18" and "Pending Tailoring Requests: —" are still
  hardcoded/dead. Left alone deliberately: the page already
  self-discloses these as placeholders pending real product-management
  and tailoring-request tables, which is backend work out of scope for
  this pass (see TASKS.md Section 4.1).

## 5. ✅ Done — missing loading states

`cart`, `checkout`, and `wishlist` pages rendered blank (`return null`)
while client state hydrated. All three now render a proper loading
message instead. Verified via curl against the dev server — an
unhydrated `/cart` request now returns "Loading your bag…" in the HTML
instead of an empty body.

## 6. ✅ Done — accessibility gaps

- Icon-only cart quantity buttons now have `aria-label`s, matching the
  pattern already used in `PurchasePanel.tsx`.
- `<label>`/`<input>` associations (`htmlFor`/`id`) added across every
  form that was missing them: tailoring configure (garment type + all
  12 measurement fields), login, register (6 fields), contact (5
  fields), returns-exchanges, checkout (6 fields + promo code, with a
  `sr-only` label added where there wasn't a visible one).
- `role="img"` + `aria-label` added to decorative-but-content-bearing
  background-image `<div>`s that were missing it: atelier fabric
  swatches, the tailoring hero image, and the stitcher portrait image
  — now consistent with the pattern already used correctly elsewhere
  (`FeaturedCollectionsBento.tsx`, men/women hero images).

## 7. Two parallel design systems

**Decision made:** consolidate CTA buttons, links, and form-adjacent
controls onto the shared `Button`/`LinkButton` component
([Button.tsx](src/components/ui/Button.tsx)); **keep** the bespoke
editorial bento/hero layouts on home, men, women, and tailoring as-is
— those are intentional merchandising layouts, not just inconsistent
styling, and gutting them into the plain `ProductCard` grid would be a
visual redesign, not a consistency fix.

- ✅ Every hand-rolled primary/secondary CTA button or link across the
  storefront (~25 instances) now goes through `Button`/`LinkButton`:
  home hero, men, women, cart, checkout (all 3 steps), order
  confirmation, account, login, register, contact, terms,
  returns-exchanges, about, all of tailoring (`page`, `configure`,
  `review`, `stitchers`, `stitchers/[slug]`), and the product page's
  Add to Bag / Add to Wishlist buttons in `PurchasePanel.tsx`.
- ✅ Added a new `inverse` variant to `Button.tsx` (outline, blurred,
  white-on-dark) specifically for CTAs sitting on dark hero imagery —
  previously every such button invented its own one-off hover color
  (`hover:bg-tertiary-fixed-dim`, `hover:bg-on-primary`, etc.); now
  there's one consistent treatment.
- 🔲 A handful of CTAs were deliberately **not** migrated because they
  don't map cleanly onto an existing/reasonable `Button` variant
  without an unwanted color change — e.g. the light-gold-on-dark
  "Bespoke Stitching" CTA on the women's page promo band
  (`bg-tertiary-fixed-dim text-primary`) and the white-fill-on-dark
  "Start Your Design" button on the tailoring hero. These are one-off
  brand accents, not repeated patterns, so forcing them into `Button`
  would change their appearance rather than just their code path.
  Flagging in case you want a matching `Button` variant added later.
- ⏭️ **Editorial bento/hero layouts themselves** (home hero structure,
  men/women bento grids, `MenProductTile`/`WomenProductTile` visual
  treatment, tailoring page layout) — untouched by design, per the
  "consistency only" decision.

## 8. Auth pages / dashboard — no action needed

Confirmed already structurally sound: `AdminView.tsx`, `VendorView.tsx`,
`TailorView.tsx` share one consistent layout with proper loading/empty/
error states per fetch. No changes made here.

---

## What's left before backend work

1. Decide whether the two one-off CTAs flagged in Section 7 (women's
   promo band, tailoring hero) get a dedicated `Button` variant or stay
   custom — low priority, cosmetic only.
2. Dashboard placeholder stats (Section 4) resolve naturally once
   product-management and tailoring-request tables exist — no
   frontend action needed, just noting the dependency.
3. **One manual Supabase step**: add the `address` jsonb column to
   `profiles` (Section 9) so the saved-address settings feature
   actually persists — `alter table profiles add column address jsonb;`
   in the Supabase dashboard.
4. Real password-reset email delivery, real anonymous-auth guest
   checkout, and Section 9's Admin-side screens are all explicitly
   deferred to the backend/schema pass — see Section 9 for what's UI-only
   vs. fully wired today.
5. Everything else in this doc is done. `npm run typecheck` and
   `npm run lint` both pass with no new errors introduced by this pass
   (pre-existing `any`-type lint warnings in `services.ts`/
   `AuthProvider.tsx`/etc. are unrelated and untouched).

---

## 9. Missing screens — not a bug, not built yet

Checked 2026-07-27 by diffing every route under `src/app` against every
`href` referenced in the codebase, plus REQUIREMENTS.md Sections 3–5.
These are screens that don't exist at all, as opposed to Sections 1–8
above (which are about screens that exist but have UI problems).

### End-user side — ✅ all built 2026-07-27

- ✅ **Forgot / Reset Password** — [forgot-password/page.tsx](src/app/forgot-password/page.tsx)
  (request screen) + [reset-password/page.tsx](src/app/reset-password/page.tsx)
  (set-new-password screen), linked from `/login`. **UI only, per
  decision** — both show the real flow and client-side validation but
  don't call Supabase yet; the `TODO` comments in each file mark where
  `resetPasswordForEmail()` / `updateUser({password})` go once
  project email delivery is confirmed configured in the Supabase
  dashboard.
- ✅ **Account profile/settings** — new
  [account/settings/page.tsx](src/app/account/settings/page.tsx), linked
  from `/account`. Covers all four you asked for, and these are fully
  wired, not stubs:
  - Name → `customerService.updateName` (new) via
    [api/account/profile/route.ts](src/app/api/account/profile/route.ts),
    plus a matching Supabase Auth metadata update so the name shown
    elsewhere in the app (Navbar, etc.) stays in sync.
  - Email / Password → `AuthProvider.updateEmail`/`updatePassword`,
    both real Supabase Auth `updateUser()` calls (this reuses existing
    live infrastructure — Supabase Auth is already wired, unlike the
    schema).
  - Saved Address → `customerService.getAddress`/`updateAddress` via
    [api/account/address/route.ts](src/app/api/account/address/route.ts).
    **Needs one manual step**: this reads/writes a `profiles.address`
    (jsonb) column that doesn't exist in the live schema yet. Add it via
    the Supabase dashboard: `alter table profiles add column address
    jsonb;` — the code is ready and will work the moment that column
    exists; until then `getAddress` just returns `null` (empty form, no
    crash).
- ✅ **Order detail/tracking screen** — new
  [account/orders/[id]/page.tsx](src/app/account/orders/%5Bid%5D/page.tsx),
  linked from `/account`'s order list (previously pointed at the
  checkout confirmation page as a stand-in). Shows real data only — no
  invented shipping timeline. For stitched items it shows genuine
  per-item progress through `STITCHING_STATUSES`, the same status
  Tailors actually update from their dashboard. (Extracted that status
  list to [lib/stitchingStatus.ts](src/lib/stitchingStatus.ts) — it was
  previously duplicated verbatim in 3 places, which is exactly the
  magic-string duplication CLAUDE.md's conventions call out.)
- ✅ **Catalog-wide filter panel** — new
  [ProductFilterGrid.tsx](src/components/ui/ProductFilterGrid.tsx)
  (category/fabric/color/max-price + sort), wired into `/new-arrivals`
  and `/search` — the two pages already on the shared `ProductCard`
  system. Men/women's editorial bento layouts were left untouched, per
  the Section 7 scope decision.
- ✅ **Guest checkout** — checkout no longer redirects unauthenticated
  visitors to `/login`; they can fill in shipping/payment and reach
  "Place Order" same as a signed-in customer, with a "Checking out as
  guest — sign in for faster checkout" nudge. **Order submission itself
  still requires a real account** — `/api/orders` still calls
  `getCurrentAppUser()` per the security convention, so a true guest's
  "Place Order" click gets a clear "Guest checkout isn't available yet
  — sign in to complete this order" message with a sign-in link,
  instead of a silent failure. Real anonymous-session support (Supabase
  Auth's anonymous sign-in) is explicitly deferred to the backend pass,
  per your call — this is the UI half only.

### Admin / staff side (the bigger gap — see TASKS.md Section 4/5 for full detail)
- 🔲 **Product management** — no add/edit/remove-product screen;
  catalog is a static code file, not database-editable.
- 🔲 **Super Admin user management** — no screen to create/edit/
  deactivate staff accounts or assign permissions; staff self-register
  with a shared invite code today.
- 🔲 **Permission management UI** — no per-user Products/Orders/
  Stitching/Vendors/Reports toggles.
- 🔲 **Order detail/action screen** — Admin's Recent Orders table is
  read-only; no screen to open one order and update status, cancel, or
  refund it.
- 🔲 **Reports & Analytics** — 2 stat tiles today (orders, revenue); no
  dedicated reports screen.
- 🔲 **Real Vendor/affiliate dashboard** — spec wants trackable links,
  click/sale attribution, commission balance, payout requests. What
  exists is a product-idea submission form instead — a different
  feature that happens to share the "Vendor" role name.
- 🔲 **Vendor management (Admin side)** — no screen to set commission
  rates or approve payouts, since the affiliate system doesn't exist.

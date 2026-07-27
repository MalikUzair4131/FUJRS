# FUJRS — Premium Fashion & Bespoke Tailoring

A full-stack Next.js storefront for a single-brand fashion &
bespoke-tailoring business, rebuilt page-by-page from source HTML designs
and then extended with a real backend: auth, database persistence, Stripe
payments, and role-gated staff accounts.

The product requirements this is being built against are in
[REQUIREMENTS.md](./REQUIREMENTS.md); current status against that spec —
including where the build has diverged from it — is in
[TASKS.md](./TASKS.md).

## Stack

- **Framework**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Auth & database**: Supabase — Supabase Auth for accounts/sessions,
  Postgres tables via `src/lib/supabase/services.ts` for orders, cart,
  wishlist, tailoring configs, and product drafts. (Prisma/NextAuth were
  used in earlier build passes and are still referenced in some file names,
  but `src/lib/prisma.ts` is now a stub and the NextAuth route is empty —
  Supabase is what's actually live.)
- **Payments**: Stripe (PaymentElement for cards, Cash on Delivery as a
  non-Stripe option)
- API input validated with `zod`
- **Product catalog**: currently a static file (`src/data/products.ts`),
  not database-backed — see TASKS.md for what that blocks (admin product
  management)

## Marketplace → single-brand adaptations

The source designs were marketplace/multi-vendor patterns (seller badges,
"Sold by X Official," external designer credits, a "Marketplace" nav link).
Every instance was adapted to single-brand FUJRS, consistently across the
whole app:

- "Shop by Seller" → **"Our Ateliers"** (in-house specialty studios: Bridal
  Atelier, Prêt Studio, Menswear Guild)
- Individual artisan/seller credits → **Master Stitchers**, an internal
  FUJRS tailoring team with their own directory and profiles
- "Sold by [Brand] Official" / "Verified Seller" badges → "Sold by FUJRS" /
  dropped where purely marketplace-signaling
- Terms & Conditions' "Marketplace Seller Policies" → "Product Quality &
  Descriptions"
- Cart's seller-grouped sections → single "Sold by FUJRS" section

## Site structure (source → route mapping)

| Source design | FUJRS route |
|---|---|
| homepage | `/` |
| men's unstitched collections | `/men` |
| women's unstitched collections | `/women` |
| PDP (product detail) | `/products/[slug]` |
| the Atelier (custom stitching service) | `/tailoring` |
| bespoke measurements & style selection | `/tailoring/configure` |
| bespoke confirmation | `/tailoring/review` |
| discover master stitchers | `/tailoring/stitchers` |
| master stitcher profile | `/tailoring/stitchers/[slug]` |
| shopping bag | `/cart` |
| secure checkout | `/checkout` |
| order confirmation | `/checkout/confirmation` |
| about us | `/about` |
| contact us | `/contact` |
| returns & exchanges | `/returns-exchanges` |
| terms & conditions | `/terms` |
| account / dashboard (customer, admin, vendor, tailor) | `/account`, `/dashboard` |

## Architecture notes

- **Cart & tailoring config**: signed-out users get `localStorage`;
  signing in syncs to the database and merges any local guest data into the
  account (matching cart items combine quantities; a local tailoring config
  only wins if the account doesn't already have a saved one). Cart sync uses
  a full replace (`PUT /api/cart` deletes + recreates all rows) rather than
  per-row diffing — simpler and robust at this scale.
- **Wishlist**: same signed-out/signed-in + merge-on-login pattern as cart.
- **Orders**: require sign-in. Written to `Order` + `OrderItem[]`, referenced
  by product `slug` (the catalog itself isn't database-backed, so `slug` is
  the correct join key). `/checkout/confirmation` is a server component with
  an ownership check.
- **Payments**: card payments go through Stripe's `PaymentElement`; the
  server re-verifies the PaymentIntent (status + amount) against Stripe
  before writing an order — the client's claim that payment succeeded is
  never trusted on its own. Cash on Delivery skips Stripe entirely.
- **Roles**: a `role` field on the Supabase `profiles` table is
  `CUSTOMER` (default) | `ADMIN` | `VENDOR` | `TAILOR` — a single
  hardcoded field, not the granular per-user permission model
  REQUIREMENTS.md Section 4.2 calls for (see TASKS.md). `/dashboard` is
  access-controlled per role. Vendor/Tailor registration requires a shared
  `STAFF_INVITE_CODE`; there is no self-serve Admin signup — promote a user
  to Admin manually in the Supabase dashboard (`profiles` table).
- Today's "Vendor" role submits product drafts for Admin approval — it is
  not the affiliate/referral-link/commission system described in
  REQUIREMENTS.md Section 5, which hasn't been built yet.

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
```

Environment variables (`.env.local` locally; set in Vercel/host for
deployment):

```
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."                      # server-only
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STAFF_INVITE_CODE="pick-a-real-shared-secret"        # required for Vendor/Tailor registration
```

(`.env.example` also lists `DATABASE_URL`, `NEXTAUTH_SECRET`, and
`MONGODB_URI` — leftovers from earlier architecture passes that the running
app no longer reads. Safe to ignore/remove.)

Stripe test keys: https://dashboard.stripe.com/test/apikeys — test card
`4242 4242 4242 4242`, any future expiry, any 3-digit CVC. Full test-card
library (declines, 3D Secure, etc.): https://docs.stripe.com/testing

## Deployment (Vercel)

Required environment variables — set in Project → Settings → Environment
Variables:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STAFF_INVITE_CODE`

Notes:
- Use `npm ci` as the Install Command for deterministic installs; if you hit
  peer-dependency errors, use `npm ci --legacy-peer-deps`.
- Do not commit `.env` or secrets — use `.env.local` locally and keep it in
  `.gitignore`. Rotate any credential that's ever been exposed publicly, and
  use least-privilege DB users.
- Product images currently reference `lh3.googleusercontent.com` (a
  design-tool preview CDN, whitelisted in `next.config.mjs`). Migrate to your
  own asset storage (Vercel Blob, Cloudinary, S3) before relying on this in
  production — it isn't meant for long-term hosting.

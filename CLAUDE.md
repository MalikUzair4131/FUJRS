# FUJRS

Single-brand fashion & bespoke-tailoring storefront + staff dashboard. Full
product context is in [REQUIREMENTS.md](./REQUIREMENTS.md) and
[TASKS.md](./TASKS.md) (spec vs. what's actually built).

**This is a UI-only build, now moving to a backend.** There is still no
database, auth provider, or payment provider wired up — the app runs entirely
on browser storage. The UI/UX was finalised first so the schema could be
designed against the finished screens, which has now happened:

- [SCHEMA.md](./SCHEMA.md) — the proposed tables, with the reason for each
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) — Supabase CLI, env, migrations, and
  the ports/adapters split that keeps the backend swappable
- `supabase/migrations/` — the DDL, not yet applied

Do not re-add an ORM, an auth library, or a payment SDK unless that's
explicitly the task. **Supabase work is in scope now**, but only under the
architecture in BACKEND_SETUP.md §1: no `@supabase/*` import may appear outside
`src/lib/data/supabase/`, and no component may learn which backend is running.
The `local` adapter stays working so the app remains demoable without a
database.

## Stack

- **Next.js 15** (App Router), **React 18**, **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- No runtime dependencies beyond `next` / `react` / `react-dom`

## Layout

```
src/app/              Next.js App Router pages — no `api/` directory
src/components/       feature folders: auth, cart, dashboard, product,
                       tailoring, ui, providers, layout, home
src/lib/local/        browser-backed stores that stand in for the database:
                       orders.ts, profile.ts, catalog.ts, affiliate.ts,
                       referral.ts, payouts.ts
src/lib/auth/         roles.ts (AppRole + DEMO_ACCOUNTS), session.ts
                       (localStorage session), demoData.ts (dashboard
                       fixtures)
src/lib/              stitchingStatus.ts, orderStatus.ts, commission.ts,
                       measurements.ts — pure domain rules, no I/O, shared by
                       storefront and dashboard
src/data/             static catalog data (products.ts, stitchers.ts)
supabase/migrations/  schema DDL — written, not yet applied
```

## Commands

```bash
npm install
npm run dev         # http://localhost:3000 — no .env needed
npm run build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck    # tsc --noEmit
npx prettier --write .   # format
```

No test runner is configured.

## How the "backend" works today

- **Auth** is a localStorage session (`src/lib/auth/session.ts`). Signing in
  with one of the `DEMO_ACCOUNTS` emails (any password) yields that role;
  registering creates a browser-local customer account. Passwords are
  deliberately never stored — there is nothing to authenticate against.
- **Cart / wishlist / measurements / orders** all persist to localStorage.
  Orders go through `src/lib/local/orders.ts` — pages never touch
  `localStorage` directly, so swapping it for a real API client later is a
  one-file change. Keep it that way.
- **Dashboards** (Admin, Vendor, Tailor, Super Admin) render fixtures from
  `src/lib/auth/demoData.ts`. Actions update local state only, and each view
  says so on screen.
- **Payments**: Cash on Delivery is the only method that completes an order.
  Selecting card shows a "coming soon" toast and an inline notice.

## Conventions

- **Not-built-yet features**: show the real UI, then a "coming soon" toast
  via `useToast()` from `src/components/ui/Toast.tsx` — never a dead button
  that silently does nothing, and never fake success. Validation that can
  run client-side (password length, required fields) should still run.
- **Data access**: go through a module in `src/lib/local/`. Don't scatter
  `localStorage.getItem`/`setItem` calls across pages and components.
- **Roles**: `AppRole` is
  `"CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR" | "SUPER_ADMIN"`, defined in
  `src/lib/auth/roles.ts`. Check `session.user.role` explicitly — there's no
  permission-list abstraction (Section 4.2 of REQUIREMENTS.md calls for one;
  it doesn't exist, don't assume it does).
- **Client/server split**: anything reading a browser store must be
  `"use client"`. Prefer server components for purely static pages.
- Path alias `@/*` maps to `src/*`.

## Clean Code Rules

- **Output escaping / XSS**: this is React — JSX auto-escapes interpolated
  values, so keep it that way. Never use `dangerouslySetInnerHTML` on
  anything derived from user input (product descriptions, review text,
  contact-form fields, etc.); if rich text is ever needed, sanitize first.
- **No secrets in the client**: nothing in this build needs a credential.
  When the backend arrives, keys belong in `process.env` on the server —
  never a `NEXT_PUBLIC_*` var, never a string literal, and never with a
  real-looking fallback value.
- **Client-side validation is UX, not security**: the forms here validate
  for the user's benefit. When real API routes exist they must re-validate
  every payload server-side — the client check is not the boundary.
- **DRY**: shared logic belongs in one module under `src/lib/`, reused by
  every page that needs it — don't re-implement the same read/write in two
  places.
- **Single responsibility**: keep components focused on rendering. Pricing
  calculations, status-transition rules, and store reads/writes belong in a
  `lib/` helper, not inline in a page.
- **Clear naming**: camelCase in TS throughout. When the DB arrives it will
  be snake_case — translate at the store boundary, don't leak raw rows into
  components.
- **No magic numbers**: pricing, shipping thresholds, and status-string
  literals (e.g. `"Awaiting Measurements"`, `"Quality Check"`, `"CONFIRMED"`)
  come from `src/lib/stitchingStatus.ts` / `src/lib/orderStatus.ts` or a
  named constant — not repeated literals scattered across files.

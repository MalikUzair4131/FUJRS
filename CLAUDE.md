# FUJRS

Single-brand fashion & bespoke-tailoring storefront + staff dashboard. Full
product context is in [REQUIREMENTS.md](./REQUIREMENTS.md) and
[TASKS.md](./TASKS.md) (spec vs. what's actually built).

## Stack

- **Next.js 15** (App Router), **React 18**, **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Supabase** for auth (`@supabase/ssr`) and data (Postgres via
  `@supabase/supabase-js`) — this is the only live backend. Do not add
  Prisma, NextAuth, or any other ORM/auth library; earlier build passes
  used them and were fully migrated off — no trace of that should come back.
- **Stripe** (`stripe`, `@stripe/react-stripe-js`) for card payments; Cash
  on Delivery is a non-Stripe path
- **zod** for input validation

## Layout

```
src/app/              Next.js App Router pages
src/app/api/**/route.ts   API route handlers
src/components/       feature folders: auth, cart, checkout, dashboard,
                       product, tailoring, ui, providers, layout, home
src/lib/supabase/      client.ts (browser), server.ts (server client +
                       getAuthenticatedUser + AppRole type), services.ts
                       (all DB access — *Service objects, one per table)
src/lib/stripe.ts      lazy Stripe client (getStripe())
src/lib/auth.ts        getCurrentAppUser() — the auth check every API
                       route calls
src/data/              static catalog data (products.ts, stitchers.ts) —
                       NOT database-backed yet; this is a known gap, see
                       TASKS.md
```

No `middleware.ts` — auth is enforced per-route, not globally. Every
`route.ts` handler is responsible for its own `getCurrentAppUser()` check.

## Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck    # tsc --noEmit
npx prettier --write .   # format
```

There is no test runner configured and no `db:push`/migration script —
the Supabase schema is managed directly in the Supabase dashboard, not
via a local migration tool.

## Conventions

- **API routes**: every handler starts by calling `getCurrentAppUser()`
  from `@/lib/auth` and returning `401` if `!auth?.profile`, before doing
  anything else. See `src/app/api/cart/route.ts` for the reference pattern.
- **Validation**: define a `zod` schema per route/payload shape, `safeParse`
  the body, return `400` with `parsed.error.issues[0]?.message` on failure.
  Never trust a request body's shape without parsing it through zod first.
- **Data access**: never call Supabase directly from a component or route
  handler — go through the relevant `*Service` object in
  `src/lib/supabase/services.ts`. If a new table/query is needed, add a
  method there, don't inline a `.from(...)` call elsewhere.
- **Roles**: `AppRole` is `"CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR"`
  (`src/lib/supabase/server.ts`). Check `auth.profile.role` explicitly per
  route — there's no shared permission-list abstraction (Section 4.2 of
  REQUIREMENTS.md calls for one; it doesn't exist yet, don't assume it does).
- **Client/server split**: components that need interactivity are marked
  `"use client"` explicitly; prefer server components by default per
  App Router convention.
- Path alias `@/*` maps to `src/*`.

## Security & Clean Code Rules

- **No hardcoded secrets — env vars only.** Every credential
  (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STAFF_INVITE_CODE`,
  Supabase URL/anon key) must come from `process.env.X`, never a string
  literal, and never with a real-looking fallback value (`?? "sk_test_..."`).
  A missing env var should throw a clear error (see `src/lib/stripe.ts`'s
  `getStripe()`), not silently fall back to a working-looking default.
- **No SQL injection**: all data access goes through the Supabase
  JS client's query builder (`.eq()`, `.match()`, `.insert()`, etc.), which
  parameterizes values automatically. Never build a raw SQL string via
  concatenation/template-literal and never pass user input into `.rpc()`
  or a raw query without it going through the client's parameter binding.
- **Server-side input validation**: every API route validates its body
  with a `zod` schema before touching `services.ts` — a client-side check
  in a form is UX, not the security boundary. This includes numeric
  amounts (e.g. `orders` route: `price`/`total` are `.nonnegative()`,
  quantities `.int().positive()`).
- **Output escaping / XSS**: this is React — JSX auto-escapes interpolated
  values, so keep it that way. Never use `dangerouslySetInnerHTML` on
  anything derived from user input (product descriptions, review text,
  contact-form fields, etc.); if rich text is ever needed, sanitize
  server-side first.
- **Auth checks on every protected route**: every `route.ts` under
  `src/app/api/` must call `getCurrentAppUser()` and check `auth?.profile`
  (and `auth.profile.role` where the route is role-gated, e.g.
  `/api/admin/drafts` requiring `role === "ADMIN"`) before reading or
  writing anything. Don't rely on the frontend hiding a button as the
  access control — the API route is the actual boundary.
- **Payment integrity**: never trust a client-submitted "payment succeeded"
  flag or total. When Stripe is involved, re-verify the PaymentIntent
  status and amount server-side against Stripe's own API before writing an
  order (this is the existing pattern in `/api/orders` — keep it that way
  for any new payment-adjacent route).
- **Generic client-facing errors**: API responses return a short message
  (`{ error: "Unauthorized" }`, `{ error: "Invalid cart payload" }`) — never
  a raw exception message, stack trace, or Supabase/Postgres error string
  from an unexpected failure. Catch unexpected errors and return a generic
  `500` message; log the real error server-side only (`console.error`),
  don't forward it to the response body.
- **DRY**: shared data logic belongs in one `*Service` method in
  `services.ts`, reused by every route/component that needs it — don't
  re-implement the same Supabase query inline in two places.
- **Single responsibility**: keep API route handlers thin — parse, call one
  service method (or a couple of clearly sequenced ones), respond. Business
  logic (pricing calculations, status-transition rules) belongs in a
  `lib/` helper or the service layer, not spread across the route handler
  and the component that calls it.
- **Clear naming**: match the existing snake_case-in-DB /
  camelCase-in-TS convention — `services.ts`'s `mapOrderRow`/`mapOrderItemRow`
  helpers are the pattern for translating between them; don't leave raw
  snake_case Supabase rows leaking into components.
- **No magic numbers**: pricing, shipping thresholds, and status-string
  literals (e.g. `"Awaiting Measurements"`, `"Quality Check"`) should be
  named constants or a shared enum/union type, not repeated string/number
  literals scattered across routes and components.

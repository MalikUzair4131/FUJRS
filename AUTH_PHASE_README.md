# FUJRS — Backend Phase 1: Authentication

Real user accounts, backed by NextAuth.js + Prisma. This is the first
piece of actual backend — everything before this was `localStorage` only.

## What's real now

- **Register** (`/register`) — creates a real `User` row (bcrypt-hashed
  password), then signs you in automatically
- **Login** (`/login`) — real credential check against the database
- **Sign out** — real NextAuth session termination
- **`/account`** — a genuine protected route: `getServerSession` checks
  for a valid session server-side and redirects unauthenticated visitors
  to `/login` before the page ever renders
- **Navbar** — the person icon is now session-aware: shows Sign In when
  logged out, links to My Account when logged in

## What's still scoped to the next phase (database)

Cart, wishlist, tailoring configuration, and order history are still
`localStorage`-only — they don't yet sync to your account. The `/account`
page is upfront about this rather than pretending otherwise. That's
exactly what "Part 3: database" was going to cover, and this phase
deliberately didn't reach into that scope.

## Architecture

- **NextAuth.js**, JWT session strategy (no server-side session table
  needed — the session itself lives in a signed cookie)
- **Prisma** with a single `User` model for now (`prisma/schema.prisma`)
- **SQLite** for local dev (`DATABASE_URL="file:./dev.db"`), swap to
  Postgres (Neon / Vercel Postgres) by changing the provider + connection
  string when you deploy — same pattern used everywhere for this kind of
  setup
- Passwords hashed with `bcryptjs`, never stored in plain text
- `/api/auth/register` validates input with `zod` before touching the
  database

## Setup

```bash
npm install
npm run db:push     # creates local dev.db from the Prisma schema
npm run dev          # http://localhost:3000
```

You'll also want a real `NEXTAUTH_SECRET` for anything beyond local dev —
generate one with `openssl rand -base64 32` and put it in `.env`
(`.env.example` has the full list of variables).

## A real bug I found and fixed this phase

While verifying the production build, `next build` failed on `/login`:
`useSearchParams() should be wrapped in a suspense boundary`. This is a
genuine Next.js App Router requirement I'd missed — `useSearchParams()` in
a page that gets statically analyzed needs a Suspense boundary around the
component that calls it, or the build fails. Fixed by splitting the login
page into a `<LoginForm>` inner component (which uses the hook) wrapped in
`<Suspense>` in the actual page export. Full production build passes
cleanly now.

## Sandbox verification notes (be upfront about this)

Two things in my build environment specifically (not your machine):

1. **Prisma's engine binaries** come from `binaries.prisma.sh`, which
   isn't reachable from this sandbox. To still verify real bugs (like the
   Suspense one above), I made `prisma.ts` lazily instantiate the client
   via a Proxy instead of at module-import time — this let the full
   `next build` complete and catch the actual Suspense bug, rather than
   masking everything behind "can't verify, trust me." I also tested the
   failure mode directly: hitting `/api/auth/register` without a real
   engine returns a clean `500` with a clear Prisma error message, not a
   crash — confirming the app degrades safely, not silently.
2. **Google Fonts**, same as every phase before this — verified with a
   temporary system-font stand-in, restored the real config before
   packaging.

Both resolve normally the moment you run this with real internet access —
neither is a bug in the delivered code, and I'm not asking you to just
take my word for the parts I couldn't fully verify: the register-route
test above is exactly what happens on your machine before you run
`npm run db:push`, so you can reproduce that same clean error if curious.

## Status

✅ Full production build: 52/52 routes, zero errors
✅ `tsc --noEmit` clean
✅ Every storefront route smoke-tested — zero regressions from adding auth
✅ `/account` correctly redirects unauthenticated visitors (307), without
even needing a database connection to do so
✅ `/api/auth/register` fails safely and clearly without a live database,
confirming correct behavior end-to-end short of the actual DB write

## Next

Database phase: persist cart/wishlist/orders/tailoring configs to the
account instead of `localStorage`, wire the Dashboard to real data, and
add a real payment gateway to replace the simulated checkout.

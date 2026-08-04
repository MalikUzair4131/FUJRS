# FUJRS — Backend Setup (Supabase)

How to stand up the database, wire it to the finished UI, and keep it
swappable. Tables and column rationale live in [SCHEMA.md](./SCHEMA.md); this
doc is the mechanics.

**Status:** schema is live. `supabase init` and `link` are done, and all 10
migrations are applied to the linked project. **The app is not connected to it
yet** — it still runs entirely on `localStorage` and will keep working that way
until the adapters in §1 exist and `NEXT_PUBLIC_DATA_BACKEND` is flipped.

---

## The one decision that matters most

Everything else in this doc is routine. This isn't:

> **Make the data layer `async` before connecting Supabase, not during.**

Today's stores are synchronous — `listOrders()` returns `LocalOrder[]`
immediately. Supabase returns promises. If you swap storage and change the
call signature in the same step, every component that reads data changes
**twice**: once to await, once to handle loading and error states you can't
have today.

Do it in two passes instead:

1. **Pass 1 (no Supabase yet).** Make every store method `async`, still backed
   by `localStorage`. Components change once. Nothing else changes — the app
   behaves identically, and you can ship it.
2. **Pass 2.** Swap the adapter. **Zero component changes.**

Pass 1 is boring and safe. Skipping it is how a backend migration turns into a
frontend rewrite.

---

## 1. Architecture — ports and adapters

The requirement is that moving off Supabase later is cheap. That means
**nothing outside the data layer may know Supabase exists** — no imports, no
`PostgrestError`, no `.from("orders")` in a component.

```
src/lib/
  domain/            pure rules, no I/O — already exists in spirit:
                     orderStatus.ts, commission.ts, measurements.ts
  data/
    types.ts         domain shapes (Order, Product, StitchingRequest…)
    ports.ts         the interfaces — the contract
    local/           localStorage adapter (today's src/lib/local/)
    supabase/        Supabase adapter
    index.ts         picks one, exports it
```

A port is an ordinary TypeScript interface:

```ts
// src/lib/data/ports.ts
import type { Order, NewOrderInput } from "./types";
import type { OrderStatus } from "@/lib/orderStatus";

export interface OrderStore {
  list(userId?: string): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(input: NewOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
```

One file chooses the implementation:

```ts
// src/lib/data/index.ts
import type { OrderStore } from "./ports";
import { localOrders } from "./local/orders";
import { supabaseOrders } from "./supabase/orders";

const useSupabase = process.env.NEXT_PUBLIC_DATA_BACKEND === "supabase";

export const orders: OrderStore = useSupabase ? supabaseOrders : localOrders;
```

Components import `{ orders } from "@/lib/data"` and never learn which is
running. Swapping to a custom REST or GraphQL backend later means writing
`data/http/orders.ts` against the same interface — **no component changes at
all**. Keeping the `local` adapter alive is also what lets the demo keep
working without a database, which is worth preserving.

### The rules that make this hold

1. **No Supabase import outside `src/lib/data/supabase/`.** Worth enforcing:

   ```js
   // eslint.config.mjs — no-restricted-imports
   { patterns: [{ group: ["@supabase/*"],
                  message: "Supabase belongs in src/lib/data/supabase/ only." }] }
   ```

2. **Translate at the boundary.** The database is `snake_case`, the app is
   `camelCase` ([CLAUDE.md](./CLAUDE.md)). Adapters map row → domain object.
   A raw row must never reach a component.

3. **Adapters throw domain errors, not driver errors.** A component should
   never see a `PostgrestError`. Catch it, throw something meaningful — the
   pattern `CatalogStorageError` already uses.

4. **Domain rules stay pure.** `canTransition`, `calculateCommission`,
   `validatePayout` do no I/O and must not start.

### Three stores to extract first

Six stores already follow the pattern. Three hold `localStorage` inline in
React context and need extracting before any of this works:

- [CartContext.tsx:66-76](src/components/cart/CartContext.tsx#L66-L76)
- [WishlistContext.tsx:23-33](src/components/wishlist/WishlistContext.tsx#L23-L33)
- [TailoringContext.tsx:73-84](src/components/tailoring/TailoringContext.tsx#L73-L84)

The providers keep their exact public API — only the storage calls move out.

---

## 2. Install the CLI

```bash
brew install supabase/tap/supabase     # macOS
supabase --version
```

Not on macOS, or want it project-local: `npx supabase <command>` works for
everything below. Docker Desktop must be running for the local stack.

> The CLI changes fairly often. If a command below doesn't match, check
> `supabase <command> --help` rather than guessing.

---

## 3. Create the project

Two routes. Either is fine.

**Dashboard:** create the project at supabase.com, then copy its **reference
ID** from Project Settings → General.

**CLI:**

```bash
supabase login
supabase projects create fujrs --org-id <your-org-id> --region ap-south-1
```

`ap-south-1` (Mumbai) is the closest region to Pakistan — worth choosing
deliberately, since it's fixed after creation and directly affects latency for
your customers.

Then, in the repo:

```bash
supabase init          # creates supabase/config.toml
supabase link --project-ref <ref>
```

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

`.env.local` is already gitignored (`.env*.local`). **Never commit real keys.**

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser client key |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Server-only admin key |
| `NEXT_PUBLIC_DATA_BACKEND` | yes | `local` or `supabase` |

### About the two keys — read this properly

[CLAUDE.md](./CLAUDE.md) says credentials never belong in a `NEXT_PUBLIC_*`
var. Supabase is the one deliberate exception, and only under a specific
condition:

- **Anon key** is *designed* to ship to the browser. It carries no authority on
  its own. It is safe **only because Row Level Security decides what each
  request may read.** With RLS off, that key reads your whole database. It is
  not a secret, but it is only harmless when §6 is done.

- **Service role key bypasses RLS entirely.** It must never appear in a
  `NEXT_PUBLIC_*` var, in client code, in a component, or in a git commit. It
  belongs in server-side code only — route handlers, server actions, server
  components. If it ever leaks, rotate it immediately in the dashboard; it is a
  full database credential.

The `NEXT_PUBLIC_` prefix is not advice — Next.js inlines those values into the
JavaScript bundle at build time. Anything carrying it is public, permanently,
to anyone who opens devtools.

---

## 5. Migrations

Never edit the database by hand in the dashboard. Every change is a migration
file in git, so any environment can be rebuilt from scratch.

```bash
supabase migration new init_schema      # creates supabase/migrations/<ts>_init_schema.sql
```

Write the DDL from [SCHEMA.md](./SCHEMA.md), then:

```bash
supabase start        # local Postgres in Docker
supabase db reset     # wipe + replay every migration — do this often
```

`db reset` locally is how you find out a migration doesn't apply cleanly
*before* it reaches the shared database.

When it's right:

```bash
supabase db push      # apply to the linked remote
```

Suggested order, from SCHEMA.md §"Suggested build order":

All ten are applied to the linked project:

| Migration | Tables | Status |
|---|---|---|
| `init_schema` | extensions, enums, `users`, `addresses` | written |
| `products` | `products`, `product_images`, `product_variants` | written |
| `orders` | `orders`, `order_items`, `order_status_events` | written |
| `stitching` | `stitching_requests`, `stitching_reference_images` | written |
| `affiliate` | `affiliate_links`, `referral_clicks`, `commissions` | written |
| `rls` | policies for everything above | written |
| `permissions_payouts` | `role_permissions`, `payout_requests` | written |
| `auth_integration` | `auth.users` → `public.users` triggers, anonymous guests | written |
| `cart_wishlist` | `cart_items`, `wishlist_items` | written |
| `storage` | three buckets + object access policies | written |
| `payments` | `payments` | ⚠️ needs the provider decision |
| `payout_methods` | `payout_methods` + `payout_requests.method_id` | ⚠️ needs the bank-vs-wallet decision |
| `reviews` | `reviews` | deferred — no UI renders reviews yet |

**Applied 4 Aug 2026.** To rebuild from scratch or verify locally, run
`supabase start && supabase db reset`, which replays every migration
against a local Postgres.

`workshops` (SCHEMA.md §4) is intentionally absent: it only exists if stitching
is outsourced. Don't create it speculatively.

### Generated types

```bash
supabase gen types typescript --local > src/lib/data/supabase/database.types.ts
```

Regenerate after every migration. These types are for **adapters only** — they
describe database rows, not domain objects, and importing them into a component
breaks the whole point of §1.

---

## 6. Row Level Security — not optional

The anon key is in the browser. Without RLS, any visitor can read every table:
every vendor's earnings, every customer's address, every payout account.

**Enable RLS on every table.** A table with RLS off and a policy-less table are
opposite things — the first is wide open, the second is closed.

```sql
alter table orders enable row level security;

-- A customer sees only their own orders.
create policy "own orders" on orders
  for select using (auth.uid() = user_id);

-- Staff see all of them.
create policy "staff read orders" on orders
  for select using (
    exists (select 1 from users u
            where u.id = auth.uid()
              and u.role in ('ADMIN','SUPER_ADMIN'))
  );
```

Minimum policy set:

| Table | Rule |
|---|---|
| `orders`, `addresses` | owner reads own; Admin/Super Admin read all |
| `commissions`, `payout_requests` | vendor reads **own only**; Super Admin all |
| `payout_methods` | vendor reads own; Super Admin only across vendors — financial PII |
| `stitching_requests` | customer reads own; tailor reads assigned only |
| `products` | public read where `archived_at is null`; staff write |
| `referral_clicks` | **no client read at all** — server-side insert only |

Verify by querying with the anon key as an unauthenticated user and confirming
you get nothing back. Assume nothing here — test it.

---

## 7. Auth

`src/lib/auth/session.ts` is a `localStorage` stand-in with no passwords, by
design. Supabase Auth replaces it, and the same swap rule applies: session
access goes behind a port so a future custom backend can provide its own.

Two things that bite:

- **`auth.users` and your `users` table are different tables.** Supabase owns
  `auth.users`. Your `public.users` row holds `role`, `name`, commission
  fields. The `auth_integration` migration keeps them in step with triggers.
- **Role must live in the database, never the JWT alone.** RLS policies read
  `public.users.role`. A role claim a client can influence is not access
  control. The signup trigger hard-codes `CUSTOMER` and never reads a role out
  of user metadata — otherwise a self-assigned `SUPER_ADMIN` is one signup away.

The five demo accounts in `roles.ts` should stay working while
`NEXT_PUBLIC_DATA_BACKEND=local`, so the UI stays demoable without a database.

### Anonymous guests

Every first-time visitor is signed in anonymously on arrival:

```ts
await supabase.auth.signInAnonymously();
```

They get a real `auth.users` row with `is_anonymous = true` and a real uuid.
That uuid owns their cart, wishlist, measurements, and a guest-checkout order —
all RLS-scoped through `auth.uid()` exactly like a registered user.

**Registering updates that same row.** The email is set, `is_anonymous` flips
to false, and **the uuid does not change**:

```ts
await supabase.auth.updateUser({ email, password });
```

That stability is the entire point. Everything the guest did is already theirs,
so there is no cart-merge step on signup — which is where guest-to-user
conversion normally goes wrong and quietly drops the bag.

Enable it under **Authentication → Providers → Anonymous sign-ins** in the
dashboard, or `[auth] enable_anonymous_sign_ins = true` in `config.toml`.

Four things to get right:

- **It is unauthenticated user creation.** Anyone can call it in a loop and
  fill `auth.users`. Turn on CAPTCHA (Authentication → Settings → Bot and Abuse
  Protection) before going live, and rate-limit at the edge.
- **Clean them up.** Abandoned guest rows accumulate forever. Schedule a job to
  delete anonymous users with no cart and no order after ~30 days; there's an
  index on `users(created_at) where is_anonymous` for it.
- **Anonymous is not second-class.** Guests browse, hold a cart, and check out —
  don't gate those. Use `is_anonymous_user()` only where a durable account is
  genuinely required, e.g. leaving a review.
- **A guest can never be staff.** Enforced three ways: the trigger hard-codes
  the role, RLS revokes the `role` column from `authenticated`, and a check
  constraint holds regardless of how the row was written.

### Email is not the identity key

`src/lib/local/profile.ts` keys accounts by email, which is fine for a browser
store. In the database the key is `users.id`, and **an anonymous user has no
email at all** — that's why `users.email` is nullable with a partial unique
index. Adapters must key on id, not email.

---

## 8. Order of work

1. Extract the three contexts into the data layer (§1)
2. Make every store `async`, still on `localStorage` — **ship this**
3. Create the project, link it, fill `.env.local`
4. `db reset` until migrations 1–10 apply cleanly, then `db push`
5. Write RLS policies and verify with the anon key
6. Build Supabase adapters against the existing ports
7. Flip `NEXT_PUBLIC_DATA_BACKEND=supabase` in one environment and test
8. Re-validate every payload server-side

Step 8 is not optional. Every check in the UI today — commission bounds, payout
minimums, status transitions, measurement completeness — is UX. A client can
send any payload it likes, and RLS controls *rows*, not whether a value is
sane.

---

## 9. If you leave Supabase later

Because of §1, the work is bounded:

1. Write `src/lib/data/http/` implementing the same ports.
2. Point `src/lib/data/index.ts` at it.
3. Port the schema — the migrations are plain Postgres, not Supabase-specific.
4. Replace Supabase Auth behind the session port.
5. Re-implement RLS as server-side authorisation.

No component changes. Steps 4 and 5 are the real work, which is why both sit
behind their own boundary rather than being sprinkled through the app.

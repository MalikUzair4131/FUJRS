# FUJRS — Backend Phase 3: Real Payments (Stripe)

Checkout no longer simulates a charge — it uses Stripe's actual test-mode
payment flow.

## What changed

- **Card payments** now use Stripe's `PaymentElement`, embedded directly
  in step 2 of checkout (styled to match FUJRS: black primary color,
  square corners, Hanken Grotesk). No more raw card number/expiry/CVV
  inputs collected by our own code — Stripe's Elements handles that
  entirely, so card details never touch our server.
- **Cash on Delivery** is unchanged — still a simple selection, no
  payment processing needed.
- **Server-side verification**: when an order is submitted, the backend
  re-checks with Stripe directly that the PaymentIntent actually
  succeeded *and* that the amount matches the order total, before writing
  anything to the database. The client's word alone is never trusted for
  something as consequential as "did this payment go through."

## The flow now

1. **Step 1 — Shipping**: unchanged
2. **Step 2 — Payment**: choosing Card creates a Stripe PaymentIntent for
   the order total and shows the PaymentElement. Submitting it actually
   confirms the payment with Stripe right there — if it succeeds, you
   move to step 3; if it fails, you see Stripe's own error message and
   stay on step 2 to retry
3. **Step 3 — Review & Place Order**: for card orders, payment is already
   confirmed at this point — "Place Order" writes the order record (with
   the verified PaymentIntent ID attached) to the database. For COD
   orders, nothing was charged yet — this step just creates the order

## Setup

You'll need your own Stripe account (free, test mode requires no real
business verification):

```bash
npm install
npm run db:push
```

Then add to `.env`:
```
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

Both come from https://dashboard.stripe.com/test/apikeys — no real card
or business details needed for test mode.

```bash
npm run dev
```

Test card: `4242 4242 4242 4242`, any future expiry, any 3-digit CVC.
Stripe's test mode has a full library of other test cards for simulating
declines, insufficient funds, 3D Secure, etc. if you want to test failure
paths: https://docs.stripe.com/testing

**Without Stripe keys configured**, the Card option shows a clear message
explaining what's missing rather than pretending to work — Cash on
Delivery still functions normally either way, so checkout isn't fully
blocked by missing keys.

## Currency note

PKR isn't a Stripe zero-decimal currency, so amounts are sent in paisa
(PKR × 100), the same pattern as cents for USD. Whether your specific
Stripe account can settle in PKR depends on your account's country/
currency configuration — if PKR isn't available, this is a one-line
change to `currency: "pkr"` in `create-payment-intent/route.ts`.

## Architecture

- `src/lib/stripe.ts` — server-side Stripe client, same lazy-instantiation
  pattern as `prisma.ts` (doesn't construct the real client until first
  actually used)
- `POST /api/checkout/create-payment-intent` — authenticated, creates a
  PaymentIntent for the order total
- `POST /api/orders` — now verifies the PaymentIntent server-side before
  writing the order (see "What changed" above)
- `src/components/checkout/StripePaymentForm.tsx` — the embedded card
  form, using Stripe's Elements + PaymentElement

## Sandbox verification notes

`api.stripe.com` isn't reachable from my build environment (same category
as Prisma's engine binaries and Google Fonts before it), so I can't run an
actual test charge here. What I did verify:

- Full production build passes (54/54 routes, zero errors) with the real
  Stripe SDK imported and used throughout — this means the code is
  correctly typed and structured, not just "looks right"
- `POST /api/checkout/create-payment-intent` correctly returns `401`
  before ever attempting to reach Stripe, when called without a session —
  confirming the auth gate runs first
- Confirmed by code review (not guesswork) that `getStripe()` throws a
  clear, specific error — "STRIPE_SECRET_KEY is not set..." — when keys
  are missing, rather than crashing opaquely

This is a real gap in what I can personally confirm versus previous
phases — I want to be direct about that rather than implying I tested a
live charge. You'll want to run through an actual test-mode payment
yourself once you add your keys, and I'd treat that as the real
confirmation this works end to end, not my having built it.

## Status

✅ Full production build: 54/54 routes, zero errors
✅ `tsc --noEmit` clean
✅ Payment intent route correctly auth-gated (verified live)
✅ Every other route smoke-tested — zero regressions
⚠️ Actual Stripe charge flow not verified end-to-end in this sandbox
(explained above) — please test with your own test-mode keys

## Next

Nothing left that was explicitly on the original roadmap except cart/
tailoring-config persistence and Vendor/Tailor accounts, both previously
flagged as deliberately deferred. Let me know which (if either) you want
next, or if there's something else you'd rather prioritize.

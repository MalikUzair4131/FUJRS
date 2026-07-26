import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// Lazily constructed for the same reason as prisma.ts: importing this
// module (e.g. during Next's build-time route analysis) shouldn't force
// a real Stripe client to spin up before real keys exist.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to .env to enable card payments."
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}

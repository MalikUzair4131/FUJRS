import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  total: z.number().positive(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    // PKR is a 2-decimal currency for Stripe — amount is in the smallest
    // unit (paisa), same pattern as cents for USD.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsed.data.total * 100),
      currency: "pkr",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not initialize payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

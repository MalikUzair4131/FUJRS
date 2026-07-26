import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const orderItemSchema = z.object({
  productSlug: z.string(),
  title: z.string(),
  image: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
  stitchingLabel: z.string().optional(),
  stitchingAddOn: z.number().nonnegative().optional(),
  stitcherSlug: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  fabricTotal: z.number().nonnegative(),
  stitchingTotal: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative(),
  total: z.number().nonnegative(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  paymentMethod: z.enum(["card", "cod"]),
  stripePaymentIntentId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to place an order." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order payload" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Never trust the client's word that payment succeeded — verify with
  // Stripe directly before writing the order.
  if (data.paymentMethod === "card") {
    if (!data.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Missing payment confirmation for a card order." },
        { status: 400 }
      );
    }
    try {
      const stripe = getStripe();
      const intent = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);
      const expectedAmount = Math.round(data.total * 100);
      if (intent.status !== "succeeded") {
        return NextResponse.json(
          { error: "Payment has not completed successfully." },
          { status: 402 }
        );
      }
      if (intent.amount !== expectedAmount) {
        return NextResponse.json(
          { error: "Payment amount does not match order total." },
          { status: 402 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not verify payment.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "CONFIRMED",
      fabricTotal: data.fabricTotal,
      stitchingTotal: data.stitchingTotal,
      shipping: data.shipping,
      total: data.total,
      firstName: data.firstName,
      lastName: data.lastName,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      paymentMethod: data.paymentMethod,
      stripePaymentIntentId: data.stripePaymentIntentId,
      items: {
        create: data.items.map((item) => ({
          productSlug: item.productSlug,
          title: item.title,
          image: item.image,
          price: item.price,
          qty: item.qty,
          stitchingLabel: item.stitchingLabel,
          stitchingAddOn: item.stitchingAddOn,
          stitcherSlug: item.stitcherSlug,
          stitchingStatus: item.stitchingLabel ? "Awaiting Measurements" : undefined,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

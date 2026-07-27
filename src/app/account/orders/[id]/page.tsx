import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth";
import { orderService } from "@/lib/supabase/services";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentAppUser();
  if (!auth?.profile) redirect(`/login?callbackUrl=/account/orders/${id}`);

  const order = await orderService.getById(id, auth.profile.id);
  if (!order) redirect("/account");

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <Link
        href="/account"
        className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
      >
        ← Back to Account
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
            Order #{order.id.slice(-8).toUpperCase()}
          </p>
          <h1 className="mt-2 font-display text-headline-md">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
        </div>
        <span className="border border-primary px-4 py-2 font-label-sm uppercase tracking-widest">
          {order.status}
        </span>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="md:col-span-7 space-y-6">
          {order.items.map(
            (item: {
              id: string;
              image: string;
              title: string;
              qty: number;
              price: number;
              stitchingLabel: string | null;
              stitchingStatus: string | null;
            }) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 border border-outline-variant p-6 sm:flex-row"
              >
                <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-surface-container sm:w-28">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm">{item.title}</h3>
                      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant uppercase">
                        Qty {item.qty}
                      </p>
                    </div>
                    <p className="font-body-md text-body-md">
                      PKR {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>

                  {item.stitchingLabel && (
                    <div className="mt-4 border-t border-outline-variant/30 pt-4">
                      <p className="mb-3 font-label-sm text-label-sm uppercase text-on-surface-variant">
                        Bespoke Stitching — {item.stitchingLabel}
                      </p>
                      <ol className="flex flex-wrap gap-2">
                        {STITCHING_STATUSES.map((stage, i) => {
                          const currentIndex = STITCHING_STATUSES.indexOf(
                            (item.stitchingStatus as (typeof STITCHING_STATUSES)[number]) ??
                              STITCHING_STATUSES[0]
                          );
                          const reached = i <= currentIndex;
                          return (
                            <li
                              key={stage}
                              className={`font-label-sm text-label-sm px-3 py-1.5 uppercase tracking-wide ${
                                reached
                                  ? "bg-primary text-on-primary"
                                  : "border border-outline-variant text-on-surface-variant"
                              }`}
                            >
                              {stage}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div className="md:col-span-5 space-y-6">
          <div className="border border-outline-variant p-8">
            <h2 className="font-headline-sm text-headline-sm mb-6">Order Total</h2>
            <div className="space-y-3">
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                <span>Fabric Total</span>
                <span>PKR {order.fabricTotal.toLocaleString()}</span>
              </div>
              {order.stitchingTotal > 0 && (
                <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                  <span>Stitching Total</span>
                  <span>PKR {order.stitchingTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-label-md text-label-md text-on-surface-variant border-b border-outline-variant pb-3">
                <span>Shipping</span>
                <span>PKR {order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-headline-sm text-headline-sm pt-1">
                <span>Total</span>
                <span>PKR {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border border-outline-variant p-8">
            <h2 className="font-headline-sm text-headline-sm mb-6">Shipping To</h2>
            <p className="font-body-md text-body-md">
              {order.firstName} {order.lastName}
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {order.street}
              <br />
              {order.city}, {order.postalCode}
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-outline-variant pt-6">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                Payment Method
              </span>
              <span className="font-label-md text-label-md">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

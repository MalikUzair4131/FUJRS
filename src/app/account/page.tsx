import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth";
import { orderService } from "@/lib/supabase/services";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AccountPage() {
  const auth = await getCurrentAppUser();
  if (!auth?.profile) {
    redirect("/login?callbackUrl=/account");
  }

  const orders = await orderService.listByUser(auth.profile.id);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
            My Account
          </p>
          <h1 className="mt-2 font-display text-headline-md">
            Welcome back, {auth.profile.name}
          </h1>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-outline-variant p-10">
          <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant mb-6">
            Order History
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                receipt_long
              </span>
              <p className="mt-4 font-body text-body-md text-on-surface-variant">
                You haven&apos;t placed an order yet.
              </p>
              <Link
                href="/new-arrivals"
                className="mt-6 inline-block bg-primary text-on-primary px-10 py-4 font-body text-label-md uppercase tracking-widest hover:bg-marketplace-bronze transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {orders.map((order: { id: string; createdAt: string; items: Array<unknown>; total: number; status: string }) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-6">
                  <div>
                    <p className="font-body text-body-md">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="font-label-sm text-on-surface-variant mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items.length}{" "}
                      item{order.items.length === 1 ? "" : "s"} · {order.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-label-md">PKR {order.total.toLocaleString()}</p>
                    <Link
                      href={`/checkout/confirmation?orderId=${order.id}`}
                      className="font-label-sm uppercase tracking-widest text-marketplace-bronze underline underline-offset-4"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-body text-label-md uppercase tracking-widest text-on-surface-variant mb-6">
            Profile
          </h2>
          <div className="border border-outline-variant p-6 space-y-4">
            <div>
              <p className="font-label-sm uppercase text-on-surface-variant">Name</p>
              <p className="font-body text-body-md">{auth.profile.name}</p>
            </div>
            <div>
              <p className="font-label-sm uppercase text-on-surface-variant">Email</p>
              <p className="font-body text-body-md">{auth.profile.email}</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            <li>
              <Link href="/wishlist" className="font-body text-body-md hover:text-marketplace-bronze">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/tailoring/review" className="font-body text-body-md hover:text-marketplace-bronze">
                Latest Bespoke Specification
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="font-body text-body-md hover:text-marketplace-bronze">
                Internal Dashboard
              </Link>
            </li>
          </ul>
          <p className="mt-8 font-label-sm text-on-surface-variant leading-relaxed">
            Your wishlist, bag, and saved Atelier measurements all sync to
            your account now — sign in on another device and they&apos;ll
            be right where you left them.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart, cartTotals } from "@/components/cart/CartContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { items, clear, mounted } = useCart();
  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fabricTotal, stitchingTotal, shipping, total } = cartTotals(items);

  useEffect(() => {
    if (mounted && items.length === 0) router.replace("/cart");
  }, [mounted, items.length, router]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/checkout");
  }, [status, router]);

  if (!mounted || items.length === 0 || status === "loading" || status === "unauthenticated") {
    return null;
  }

  const inputClass = "w-full bg-transparent border border-primary p-4 text-body-md focus:outline-none";
  const labelClass = "font-label-sm text-label-sm block mb-2";

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  function goToReviewCod(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(3);
  }

  function onPaymentSuccess(paymentIntentId: string) {
    setStripePaymentIntentId(paymentIntentId);
    setError(null);
    setStep(3);
  }

  async function placeOrder() {
    setPlacing(true);
    setError(null);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          productSlug: item.slug,
          title: item.title,
          image: item.image,
          price: item.price,
          qty: item.qty,
          stitchingLabel: item.stitching?.label,
          stitchingAddOn: item.stitching?.addOn,
          stitcherSlug: item.stitcherSlug,
        })),
        fabricTotal,
        stitchingTotal,
        shipping,
        total,
        firstName,
        lastName,
        street,
        city,
        postalCode,
        paymentMethod,
        stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      }),
    });

    const data = await res.json();
    setPlacing(false);

    if (!res.ok) {
      setError(data.error ?? "Could not place order. Please try again.");
      return;
    }

    clear();
    router.push(`/checkout/confirmation?orderId=${data.order.id}`);
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "1. Shipping Details" },
    { n: 2, label: "2. Payment Method" },
    { n: 3, label: "3. Review & Place Order" },
  ];

  return (
    <main className="pt-12 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <nav className="flex items-center gap-8 mb-12 border-b border-outline-variant/30 pb-4 overflow-x-auto">
            {steps.map((s) => (
              <button
                key={s.n}
                onClick={() => s.n < step && setStep(s.n)}
                className={`font-label-md text-label-md pb-4 whitespace-nowrap transition-all ${
                  step === s.n
                    ? "text-primary border-b-2 border-primary"
                    : step > s.n
                    ? "text-primary/60"
                    : "text-on-surface-variant/40"
                }`}
              >
                {s.label.toUpperCase()}
              </button>
            ))}
          </nav>

          {step === 1 && (
            <form onSubmit={goToPayment} className="space-y-10">
              <div>
                <h2 className="font-headline-sm text-headline-sm mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className={labelClass}>EMAIL ADDRESS</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm mb-6">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>FIRST NAME</label>
                    <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>LAST NAME</label>
                    <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-full">
                    <label className={labelClass}>STREET ADDRESS</label>
                    <input
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={inputClass}
                      placeholder="House number and street name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>CITY</label>
                    <input required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>POSTAL CODE</label>
                    <input required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:bg-on-surface-variant transition-colors"
              >
                Continue to Payment
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <h2 className="font-headline-sm text-headline-sm mb-6">Select Payment Method</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between border border-primary p-6 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="w-5 h-5"
                    />
                    <span className="font-label-md text-label-md uppercase">Credit / Debit Card</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 bg-surface-variant flex items-center justify-center text-[10px] font-bold">VISA</div>
                    <div className="w-8 h-5 bg-surface-variant flex items-center justify-center text-[10px] font-bold">MC</div>
                  </div>
                </label>

                {paymentMethod === "card" && (
                  <div className="border border-primary bg-surface-container-low p-8">
                    <StripePaymentForm total={total} onSuccess={onPaymentSuccess} />
                    <p className="mt-4 text-label-sm text-on-surface-variant">
                      Test mode: use card number 4242 4242 4242 4242, any
                      future expiry, any CVC.
                    </p>
                  </div>
                )}

                <label className="flex items-center border border-primary/20 p-6 cursor-pointer hover:border-primary transition-colors">
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-5 h-5"
                    />
                    <span className="font-label-md text-label-md uppercase">Cash on Delivery (Pakistan Only)</span>
                  </div>
                </label>
              </div>

              {error && <p className="text-error font-label-sm">{error}</p>}

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-12 py-5 border border-primary font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                >
                  Back to Shipping
                </button>
                {paymentMethod === "cod" && (
                  <button
                    type="button"
                    onClick={goToReviewCod}
                    className="px-12 py-5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:bg-on-surface-variant transition-colors"
                  >
                    Review Order
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12">
              <div>
                <h2 className="font-headline-sm text-headline-sm mb-8">Review Your Selection</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.stitching ? "stitched" : "plain"}`}
                      className="border border-primary p-8 bg-surface-container-lowest"
                    >
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-32 aspect-[4/5] bg-surface-variant overflow-hidden shrink-0 relative">
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-label-md text-label-md uppercase">{item.title}</h3>
                              {item.stitching && (
                                <p className="font-body-md text-text-muted mt-1">
                                  Stitching: <span className="text-marketplace-bronze font-semibold">{item.stitching.label}</span>
                                </p>
                              )}
                            </div>
                            <p className="font-label-md text-label-md">
                              PKR {((item.price + (item.stitching?.addOn ?? 0)) * item.qty).toLocaleString()}
                            </p>
                          </div>
                          <p className="font-label-sm text-text-muted uppercase">Qty {item.qty}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-label-md text-label-md uppercase">Shipping To</h4>
                    <button onClick={() => setStep(1)} className="text-label-sm underline">
                      EDIT
                    </button>
                  </div>
                  <p className="font-body-md text-text-muted">
                    {firstName} {lastName}
                    <br />
                    {street}
                    <br />
                    {city}, {postalCode}
                    <br />
                    Pakistan
                  </p>
                </div>
                <div className="p-6 border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-label-md text-label-md uppercase">Payment</h4>
                    <button onClick={() => setStep(2)} className="text-label-sm underline">
                      EDIT
                    </button>
                  </div>
                  <p className="font-body-md text-text-muted">
                    {paymentMethod === "card" ? "Card payment confirmed" : "Cash on Delivery"}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <p className="font-body-md text-text-muted mb-8 text-center md:text-left italic">
                  By clicking &ldquo;Place Order&rdquo;, you agree to our{" "}
                  <a href="/terms" className="underline">
                    Terms of Service
                  </a>{" "}
                  and confirm that all custom measurements provided are accurate.
                </p>
                {error && <p className="text-error font-label-sm mb-4">{error}</p>}
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-12 py-5 border border-primary font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                  >
                    Back to Payment
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="flex-grow py-5 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:bg-on-surface-variant transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    <span>{placing ? "Placing Order…" : "Place Order"}</span>
                    <span className="material-symbols-outlined">lock</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Summary */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-32 space-y-8">
            <div className="bg-white border border-primary/10 p-8">
              <h3 className="font-headline-sm text-headline-sm mb-8">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-body-md">
                  <span className="text-text-muted">
                    Subtotal ({items.length} item{items.length === 1 ? "" : "s"})
                  </span>
                  <span>PKR {fabricTotal.toLocaleString()}</span>
                </div>
                {stitchingTotal > 0 && (
                  <div className="flex justify-between font-body-md">
                    <span className="text-text-muted">Stitching &amp; Customization</span>
                    <span className="text-marketplace-bronze">+ PKR {stitchingTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-body-md">
                  <span className="text-text-muted">Shipping</span>
                  <span>PKR {shipping.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-primary pt-6 flex justify-between items-end mb-8">
                <span className="font-label-md text-label-md uppercase">Total Payable</span>
                <span className="font-headline-sm text-headline-sm">PKR {total.toLocaleString()}</span>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-transparent border-b border-primary/20 py-3 pr-20 font-label-sm focus:border-primary transition-colors uppercase outline-none"
                  placeholder="PROMO CODE"
                  type="text"
                />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 font-label-sm text-label-sm uppercase hover:opacity-70">
                  Apply
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-4">
              {[
                { icon: "verified_user", title: "Secure Checkout", body: "256-bit SSL encrypted connection" },
                { icon: "local_shipping", title: "Insured Delivery", body: "Tracked shipping nationwide" },
                { icon: "support_agent", title: "Concierge Support", body: "Available 24/7 for stitching assistance" },
              ].map((badge) => (
                <div key={badge.title} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{badge.icon}</span>
                  </div>
                  <div>
                    <h5 className="font-label-md text-label-md uppercase">{badge.title}</h5>
                    <p className="text-label-sm text-text-muted">{badge.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

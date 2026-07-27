"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#000000",
    colorBackground: "#ffffff",
    colorText: "#1a1c1c",
    fontFamily: "var(--font-hanken), sans-serif",
    borderRadius: "0px",
    spacingUnit: "4px",
  },
};

function InnerForm({
  onSuccess,
  total,
}: {
  onSuccess: (paymentIntentId: string) => void;
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your card details.");
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setProcessing(false);

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Payment did not complete. Please try again.");
    }
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-error font-label-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary text-on-primary py-5 font-label-md text-label-md uppercase tracking-widest hover:bg-marketplace-bronze transition-colors disabled:opacity-60"
      >
        {processing ? "Confirming Payment…" : `Pay PKR ${total.toLocaleString()} & Continue`}
      </button>
    </form>
  );
}

export function StripePaymentForm({
  total,
  onSuccess,
}: {
  total: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error ?? "Could not initialize payment.");
      })
      .catch(() => !cancelled && setError("Could not initialize payment."));
    return () => {
      cancelled = true;
    };
  }, [total]);

  if (!publishableKey) {
    return (
      <div className="border border-error/40 bg-error/5 p-6">
        <p className="font-label-sm text-error">
          Card payments aren&apos;t configured yet — add <code>STRIPE_SECRET_KEY</code> and{" "}
          <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your <code>.env</code> to enable them
          (Stripe test keys work fine for development). Cash on Delivery is available in the
          meantime.
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="font-label-sm text-error">{error}</p>;
  }

  if (!clientSecret) {
    return <p className="font-body text-body-md text-on-surface-variant">Loading payment form…</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <InnerForm total={total} onSuccess={onSuccess} />
    </Elements>
  );
}

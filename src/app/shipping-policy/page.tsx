const rates = [
  { method: "Standard Shipping", cost: "PKR 350", eta: "4–6 business days" },
  { method: "Express Shipping", cost: "PKR 900", eta: "1–2 business days" },
  { method: "Free Shipping", cost: "Free", eta: "On orders over PKR 15,000 (standard speed)" },
];

export default function ShippingPolicyPage() {
  return (
    <div className="container-luxe py-16">
      <p className="label-caps text-gold">Policy</p>
      <h1 className="mt-2 font-display text-headline-md">Shipping Policy</h1>

      <div className="mt-10 max-w-2xl space-y-10">
        <div>
          <h2 className="font-display text-headline-sm">Rates &amp; Timelines</h2>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Delivery Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rates.map((rate) => (
                  <tr key={rate.method}>
                    <td className="px-4 py-3">{rate.method}</td>
                    <td className="px-4 py-3">{rate.cost}</td>
                    <td className="px-4 py-3">{rate.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-display text-headline-sm">Custom &amp; Tailored Orders</h2>
          <p className="mt-3 text-body-md text-text-muted">
            Made-to-measure pieces from The Atelier require an additional 7–10 business days for
            stitching before shipping begins. You&apos;ll be able to track fabric, stitching, and
            delivery milestones separately once your order is placed.
          </p>
        </div>

        <div>
          <h2 className="font-display text-headline-sm">Order Tracking</h2>
          <p className="mt-3 text-body-md text-text-muted">
            Once your order ships, you&apos;ll receive a tracking link by email and SMS. Order
            tracking inside your FUJRS account is coming with the account/backend part of this
            build.
          </p>
        </div>
      </div>
    </div>
  );
}

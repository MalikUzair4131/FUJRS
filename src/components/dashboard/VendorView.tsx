"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DEMO_PAYOUTS, DEMO_REFERRED_SALES, DEMO_VENDORS } from "@/lib/auth/demoData";
import {
  DEFAULT_COMMISSION,
  calculateCommission,
  formatCommissionRate,
  type CommissionRate,
} from "@/lib/commission";
import {
  addLink,
  buildReferralUrl,
  listLinks,
  referralCodeFor,
  removeLink,
  type AffiliateLink,
} from "@/lib/local/affiliate";
import { products } from "@/data/products";

type Section = "OVERVIEW" | "LINKS" | "EARNINGS";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "LINKS", label: "Get Links" },
  { id: "EARNINGS", label: "Earnings" },
];

const PKR = (amount: number) => `PKR ${amount.toLocaleString()}`;

/**
 * The vendor is an affiliate marketer: they take a tracked link for any piece
 * in the catalogue, promote it wherever they like, and earn commission when it
 * sells. They never add or price products — a Super Admin sets their rate.
 */
export function VendorView() {
  const { session } = useAuth();
  const { toast } = useToast();

  const [section, setSection] = useState<Section>("OVERVIEW");
  const [links, setLinks] = useState<AffiliateLink[] | null>(null);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("");

  const email = session?.user.email ?? "";
  const referralCode = useMemo(() => (email ? referralCodeFor(email) : ""), [email]);

  // The rate is the Super Admin's to set; a vendor without a fixture falls back
  // to the programme default rather than showing nothing.
  const commission: CommissionRate = useMemo(
    () => DEMO_VENDORS.find((v) => v.email === email)?.commission ?? DEFAULT_COMMISSION,
    [email]
  );

  const performance = useMemo(() => DEMO_VENDORS.find((v) => v.email === email), [email]);

  const refresh = useCallback(() => {
    if (email) setLinks(listLinks(email));
  }, [email]);

  useEffect(refresh, [refresh]);
  useEffect(() => setOrigin(window.location.origin), []);

  async function copy(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage, "success");
    } catch {
      toast("Your browser blocked the copy — select the text and copy it manually.", "info");
    }
  }

  function handleCopyLink(product: { slug: string; title: string; price: number }) {
    addLink(email, product);
    refresh();
    void copy(
      buildReferralUrl(origin, product.slug, referralCode),
      `Link for “${product.title}” copied.`
    );
  }

  function handleCopyDetails(product: (typeof products)[number]) {
    const details = [
      product.title,
      `${PKR(product.price)} · ${product.fabric}`,
      "",
      product.description,
      "",
      buildReferralUrl(origin, product.slug, referralCode),
    ].join("\n");
    addLink(email, product);
    refresh();
    void copy(details, `Details for “${product.title}” copied.`);
  }

  function handleRemoveLink(link: AffiliateLink) {
    removeLink(email, link.id);
    refresh();
    toast(`Removed “${link.productTitle}” from your links.`, "info");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query]);

  const stats = [
    { label: "Your Commission", value: formatCommissionRate(commission) },
    { label: "Link Clicks", value: performance ? performance.clicks.toLocaleString() : "—" },
    { label: "Sales Referred", value: performance ? performance.sales.toLocaleString() : "—" },
    { label: "Earned To Date", value: performance ? PKR(performance.earned) : "—" },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest">
        Sample data — clicks, sales and payouts need a backend before they&apos;re real.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border border-outline-variant p-1 w-fit">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-6 py-2.5 label-caps ${
              section === s.id ? "bg-primary text-on-primary" : "text-on-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "OVERVIEW" && (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border border-border-subtle p-6">
                <p className="text-label-sm uppercase text-text-muted">{stat.label}</p>
                <p className="mt-2 font-display text-headline-sm">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">Your Referral Code</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="font-display text-headline-sm tracking-widest">{referralCode || "—"}</p>
              <Button
                variant="secondary"
                onClick={() => void copy(referralCode, "Referral code copied.")}
              >
                Copy Code
              </Button>
            </div>
            <p className="mt-4 max-w-prose text-body-md text-text-muted">
              Every link you take carries this code. When someone buys through it, the sale is
              credited to you and you earn {formatCommissionRate(commission)} of it. Your rate is
              set by FUJRS — you can see it here but not change it.
            </p>
          </div>

          <h2 className="mt-10 font-display text-headline-sm">Recent Referred Sales</h2>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Sale</th>
                  <th className="px-4 py-3 font-medium">You Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {DEMO_REFERRED_SALES.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3">{sale.product}</td>
                    <td className="px-4 py-3 text-text-muted">
                      #{sale.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{sale.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{PKR(sale.salePrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-marketplace-bronze">
                      {PKR(calculateCommission(sale.salePrice, commission))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "LINKS" && (
        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-headline-sm">Get a Link</h2>
              <p className="mt-1 max-w-prose text-label-sm text-marketplace-bronze">
                Pick any piece from the catalogue. Copying takes the link and adds it to your list
                below.
              </p>
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full max-w-xs border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 border border-border-subtle p-6 text-body-md text-text-muted">
              Nothing matches “{query}”.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <article key={product.id} className="flex flex-col border border-border-subtle">
                  <div className="relative aspect-[3/4] bg-surface-container-low">
                    <Image
                      src={product.images[0]}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="font-display text-headline-sm leading-tight">{product.title}</h3>
                    <p className="text-label-sm text-text-muted">
                      {product.fabric} · {product.category}
                    </p>
                    <p className="mt-2 text-body-md">{PKR(product.price)}</p>
                    <p className="text-label-sm text-marketplace-bronze">
                      You earn {PKR(calculateCommission(product.price, commission))}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        className="px-5 py-2.5"
                        onClick={() => handleCopyLink(product)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-5 py-2.5"
                        onClick={() => handleCopyDetails(product)}
                      >
                        Copy Details
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <h2 className="mt-12 font-display text-headline-sm">Your Links</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Saved on this device. Per-link click and sale tracking arrives with the backend.
          </p>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">You Earn</th>
                  <th className="px-4 py-3 font-medium">Taken</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {!links && (
                  <tr>
                    <td className="px-4 py-6 text-text-muted" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                )}
                {links?.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-text-muted" colSpan={5}>
                      You haven&apos;t taken a link yet.
                    </td>
                  </tr>
                )}
                {links?.map((link) => (
                  <tr key={link.id}>
                    <td className="px-4 py-3">{link.productTitle}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{PKR(link.productPrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-marketplace-bronze">
                      {PKR(calculateCommission(link.productPrice, commission))}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{link.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            void copy(
                              buildReferralUrl(origin, link.productSlug, referralCode),
                              "Link copied."
                            )
                          }
                          className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleRemoveLink(link)}
                          className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-error hover:text-error"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "EARNINGS" && (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Earned To Date</p>
              <p className="mt-2 font-display text-headline-sm">
                {performance ? PKR(performance.earned) : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Pending Payout</p>
              <p className="mt-2 font-display text-headline-sm">
                {performance ? PKR(performance.pendingPayout) : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Your Rate</p>
              <p className="mt-2 font-display text-headline-sm">
                {formatCommissionRate(commission)}
              </p>
            </div>
          </div>

          <h2 className="mt-10 font-display text-headline-sm">Payout History</h2>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {DEMO_PAYOUTS.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-4 py-3">{payout.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{PKR(payout.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-label-sm uppercase text-text-muted">
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border border-border-subtle p-6">
            <h3 className="font-display text-headline-sm">How your commission works</h3>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body-md text-text-muted">
              <li>
                FUJRS sets your rate — {formatCommissionRate(commission)} on every referred sale.
              </li>
              <li>
                You always share the piece at its real FUJRS price; you don&apos;t set prices.
              </li>
              <li>A sale counts once the order is confirmed and the return window has closed.</li>
              <li>Payouts are issued monthly against your pending balance.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

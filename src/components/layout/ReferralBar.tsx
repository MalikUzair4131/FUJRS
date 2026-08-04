"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { REFERRAL_PARAM } from "@/lib/local/affiliate";
import {
  ATTRIBUTION_WINDOW_DAYS,
  captureReferral,
  getReferral,
  type CapturedReferral,
} from "@/lib/local/referral";

/**
 * Catches the `?ref=` on a vendor's link anywhere on the site and tells the
 * shopper their visit is credited. Sitewide rather than product-only so a
 * referral survives browsing away from the piece that was shared.
 */
export function ReferralBar() {
  const searchParams = useSearchParams();
  const [referral, setReferral] = useState<CapturedReferral | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const code = searchParams.get(REFERRAL_PARAM);

  useEffect(() => {
    // A fresh code in the URL wins; otherwise fall back to one captured earlier.
    const landingSlug = window.location.pathname.startsWith("/products/")
      ? (window.location.pathname.split("/")[2] ?? null)
      : null;

    const captured = code ? captureReferral(code, landingSlug) : null;
    setReferral(captured ?? getReferral());
    if (captured) setDismissed(false);
  }, [code]);

  if (!referral || dismissed) return null;

  return (
    <div className="border-b border-border-subtle bg-surface-container-low">
      <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-3 px-gutter py-3">
        <p className="text-label-sm text-on-surface-variant">
          You&apos;re shopping through a FUJRS partner —{" "}
          <span className="uppercase tracking-widest text-marketplace-bronze">{referral.code}</span>
          . Anything you order in the next {ATTRIBUTION_WINDOW_DAYS} days is credited to them, at
          the same price you&apos;d pay otherwise.
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Hide partner notice"
          className="shrink-0 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary"
        >
          Hide
        </button>
      </div>
    </div>
  );
}

# FUJRS — Faithful Rebuild, Phase 3: Product Detail Page

Rebuilt from `silk_embroidered_unstitched_pdp_detail_view` — a data-driven
PDP template so it works for all 18 products, with the source's flagship
product (Aurelian Gold Unstitched Silk) getting the full rich treatment
exactly as designed.

## What's in this phase

- **Editorial gallery** — matches source exactly: two images side-by-side +
  one full-width below, when a product has 3+ images (Aurelian Gold does).
  Falls back to a clean single large image for products with fewer photos.
- **Purchase panel** — price + SKU, quantity, Add to Bag, Add to Wishlist
  (now wired to the real wishlist), share button.
- **Bespoke Stitching module** — the toggle is now fully functional: switch
  it on, the add-on price appears, and it's carried through to the cart as
  its own line item (cart/checkout now understand stitched vs. unstitched
  lines separately, with correct totals).
- **Fabric Specifications / Heritage Story / Shipping & Returns** — native
  `<details>` accordion matching source markup exactly, populated from real
  product data with sensible fallbacks for products that don't have a full
  spec sheet.
- **Complete the Look** — added the 4 real accessory products from source
  (Antique Gold Zardozi Khussa, Mughal Pearl Chandbalis, Gilded Silk Frame
  Clutch, Cream Needlework Pashmina) as real, purchasable products; every
  PDP shows same-category pieces first, falling back to these accessories.

## Marketplace adaptation

Source badged this product's seller as **"Khyber Artisans"** with a
"Verified Seller" tag and a "View Store" link (marketplace pattern). Per
your exclusion, this is now an **internal FUJRS master tailor credit**
("Khyber Artisans — FUJRS Atelier") linking to `/tailoring/stitchers/
khyber-artisans` — a placeholder for now, fully built out in **Phase 4**
(Master Stitchers directory + profile), which is exactly where this was
always headed anyway.

## One data discrepancy I caught and resolved

Your Women's PLP file listed "Aurelian Gold Unstitched Silk" at **PKR
28,500**; the dedicated PDP file lists the same product at **PKR 48,500**
with a full spec sheet (SKU, embroidery detail, dupatta info). I treated
the PDP — the more detailed, single-purpose source — as authoritative and
updated the price sitewide. Flagging this rather than silently picking one.

## Run it locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Status

✅ `next build` compiles and prerenders all 42 routes (18 products × PDP
included) with zero errors
✅ `tsc --noEmit` clean
✅ Smoke-tested the flagship PDP and a generic-fallback PDP on a production
server — real source copy confirmed rendering ("Bespoke Stitching",
"48,500", "Khyber Artisans", "Complete the Look"), no console/server errors

**Sandbox-only caveats (unchanged):** Google Fonts unreachable here —
verified with a temporary stand-in, restored real config before packaging.

## Next phase

**Phase 4 — Tailoring flow + Master Stitchers**, converting
`the_atelier_custom_stitching_service`, `bespoke_stitching_measurements_style_selection`,
`bespoke_stitching_confirmation_elan_fabrics`, `discover_master_stitchers_the_atelier`,
and `master_stitcher_profile_khyber_artisans` — including finally building out
the `/tailoring/stitchers` routes this phase linked to.

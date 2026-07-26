# FUJRS — Faithful Rebuild, Phase 2: Men & Women + Smoothness Pass

## Men's Atelier (`/men`)

Rebuilt from `men_s_unstitched_collections_elan_fabrics`: cinematic hero
("The Men's Atelier"), horizontal fabric-tab filters (All Fabrics/Egyptian
Cotton/Latha/Karandi/Wash & Wear — now functional, filtering the real
catalog), an asymmetrical bento product grid (1 large + 4 small, real
names/prices/meters: Supreme Egyptian Giza 87 PKR 14,500, Indigo Latha
Reserve PKR 8,900, etc.), the "Masterful Tailoring" CTA linking to
`/tailoring`, and "The Fabric Guide" 3-card section.

## Women's Jardin Edit (`/women`)

Rebuilt from `women_s_unstitched_collections_elan_fabrics`: hero (adapted
"The Jardin de Élégance" → **"The Jardin Edit"**, since the original
directly referenced the old brand name), sticky filter bar (Lawn/Chiffon/
Silk/Net, functional), asymmetrical product grid (Aurelian Gold Unstitched
Silk PKR 28,500, Noir Elegance Lawn, Celestial Blue Chiffon, Olive Tilla
Embroidery, Ivory Pearl Net), a dark "Bespoke Stitching" CTA linking to
`/tailoring`, and a "Shop by Fabric" mosaic.

## Marketplace adaptations (same principle as Phase 1)

Both source pages badge products as "Sold by [X] Official" / "Verified
Seller" / had a "Marketplace" nav link and a "Sold By: Elan Direct /
Marketplace Sellers" filter with an external brand list (Sana Safinaz,
Maria B., Hussain Rehar, etc.). Per your exclusion:
- "Sold by ELAN Official" → **"Sold by FUJRS"**
- "Verified Seller" badges → dropped (kept non-marketplace badges like
  "Best Seller", "Official Store", "Premium Collection", "Limited Edition")
- The generic PLP's "Sold By" and "Brand" filters (external designer
  search) → not carried over; category/fabric filtering is real-brand
  appropriate instead

## Smoothness / animation pass (your feedback)

- **`Reveal`** — new reusable scroll-reveal wrapper (IntersectionObserver +
  CSS transition, no extra dependencies). Applied to every homepage section
  below the hero, and to every section on the new Men's/Women's pages.
- **`RouteProgress`** — a thin top progress bar during page navigation, so
  route changes feel more responsive.
- Verified hover/transition durations are consistent across new components
  (`duration-300`/`duration-700` matching source patterns).

## Run it locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Status

✅ `next build` compiles and prerenders all 37 routes (15 products × PDP +
all pages) with zero errors
✅ `tsc --noEmit` clean
✅ Smoke-tested `/men`, `/women`, and PDPs on a production server — real
source copy confirmed rendering, no console/server errors

**Sandbox-only caveats (unchanged):** Google Fonts unreachable here —
verified with a temporary stand-in, restored real config before packaging.

## Next phase

**Phase 3 — Product Detail Page**, converting
`silk_embroidered_unstitched_pdp_detail_view` (gallery, fabric spec
breakdown, "Complete the Look," Bespoke Stitching toggle).

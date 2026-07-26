# FUJRS — Faithful Rebuild, Phase 6: About, Contact, Returns, Terms

The last 4 source files, converted. This closes out the source-to-Next.js
conversion — every page that had a matching source file is now built from
it.

## About Us (`/about`)

Rebuilt from `about_us_elan_fabrics`: hero ("Threads of Heritage"), intro
statement, "The Heritage" bento (large image + pull-quote card), "Artisanal
Excellence" 3-column craft showcase (Zardozi Hand-Work, Natural Indigo
Dyeing, Hand-Loomed Purity), dark "Our Commitment" section (Sustainable
Sourcing / Fair Trade Ethics / Authenticity Guaranteed), and the "Wear the
Story" CTA.

## Contact Us (`/contact`)

Rebuilt from `contact_us_elan_fabrics`: hero, General Inquiry form (now
functional — shows a confirmation state on submit), Flagship Studio info
card + map image, Wholesale/Press secondary inquiry cards, atmospheric
closing image. Email addresses updated from `elanfabrics.com` to
`fujrs.com` to match the brand.

## Returns & Exchanges (`/returns-exchanges`)

Rebuilt from `returns_exchanges_elan_co.`: hero, policy highlights bento
(14-Day Guarantee, Hassle-Free Pickup, Ready-to-Wear vs. Custom Stitched
comparison), a functional "Initiate Your Return" order-lookup form (honest
placeholder response since there's no backend yet), the 4-step process
guide, a working FAQ accordion, and the closing visual CTA.

## Terms & Conditions (`/terms`)

Rebuilt from `terms_conditions_elan_fabrics`, with one adaptation: source
had a **"Marketplace Seller Policies"** section (vetting independent
vendors, seller-set shipping timelines, buyer/seller dispute mediation) —
replaced with **"Product Quality & Descriptions"**, covering the
equivalent ground for a single-brand store (FUJRS sources and fulfills
everything directly). Introduction/Custom Stitching/Intellectual
Property/Governing Law sections carried over as-is.

## Marketplace adaptations (consistent with Phases 1-5)

- Terms: "Marketplace Seller Policies" → "Product Quality & Descriptions"
  (detailed above)
- Footer links referencing "Sell With Us" / "Marketplace" in these source
  files — not carried over (shared Footer already excludes these)

## This completes the source conversion

Every one of your 17 source screens now has a corresponding, functioning
FUJRS page:

| Source | FUJRS Route |
|---|---|
| homepage_elan_co. | `/` |
| men_s_unstitched_collections | `/men` |
| women_s_unstitched_collections | `/women` |
| silk_embroidered_unstitched_pdp | `/products/[slug]` |
| the_atelier_custom_stitching_service | `/tailoring` |
| bespoke_stitching_measurements_style_selection | `/tailoring/configure` |
| bespoke_stitching_confirmation | `/tailoring/review` |
| discover_master_stitchers | `/tailoring/stitchers` |
| master_stitcher_profile_khyber_artisans | `/tailoring/stitchers/[slug]` |
| shopping_bag | `/cart` |
| secure_checkout | `/checkout` |
| order_confirmation | `/checkout/confirmation` |
| about_us | `/about` |
| contact_us | `/contact` |
| returns_exchanges | `/returns-exchanges` |
| terms_conditions | `/terms` |

(`unstitched_collections_plp` informed the shared product-grid patterns
used across `/men`, `/women`, `/new-arrivals`, and `/search`.)

## Run it locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Status

✅ `next build` compiles and prerenders all 50 routes with zero errors
✅ `tsc --noEmit` clean
✅ Smoke-tested all 4 pages on a production server — real source copy
confirmed rendering, no console/server errors

**Sandbox-only caveats (unchanged):** Google Fonts unreachable here —
verified with a temporary stand-in, restored real config before packaging.

## Next phase

**Phase 7 — full site-wide QA pass**: re-check every route across all 6
phases together in one pass (broken links, consistency, edge cases) before
calling the frontend done and moving to backend/database work.

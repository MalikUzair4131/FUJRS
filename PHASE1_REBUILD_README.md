# FUJRS — Faithful Rebuild, Phase 1: Navbar, Footer, Homepage

You were right to push on this — the earlier drop used your color/type
tokens but I'd written new layouts and copy instead of converting your
actual source HTML. This phase fixes that for the foundational pieces.

## What changed vs. the previous drop

- **`tailwind.config.ts`** — replaced with the *exact* token set from your
  source's embedded config (every color, font alias, spacing/radius value),
  so classes copied straight from your HTML work without translation.
- **Navbar** — rebuilt to match the source homepage nav exactly: same
  classes, same "FUJRS" wordmark treatment, same MEN/WOMEN/NEW
  ARRIVALS/TAILORING links, same icon set. Added a mobile drawer and search
  overlay since the source crop didn't show mobile nav but the site needs
  one.
- **Footer** — rebuilt to match source exactly: "Threads of Heritage..."
  copy, Client Care / Collections / Contact columns, same address/phone/
  email, same copyright line.
- **Homepage** — every section rebuilt from your actual source markup and
  copy: Hero ("FUJRS UNSTITCHED"), Featured Collections bento, New Arrivals
  grid (real product names/prices/images: Emerald Silk Unstitched Set PKR
  45,000, Midnight Zardozi Velvet PKR 62,500, Blush Pearl Organza PKR
  38,000, Ivory Karandi Suiting PKR 12,900), Custom Stitching promo,
  Instagram gallery, Newsletter ("THE INNER CIRCLE").

## The one section I adapted, per your call

Source homepage had a "Shop by Seller" / "The Marketplace" section
(Hussain Rehar, Sana Safinaz, Republic Mens — each with "Enter Storefront"
links). Per your explicit marketplace exclusion, I rebuilt this as **"Our
Ateliers"** — same exact visual layout (3-column bordered cards, circular
badge, verified icon, fabric swatches, CTA) but reframed as three in-house
FUJRS specialty studios (Bridal Atelier, Prêt Studio, Menswear Guild)
linking to `/women`, `/men` instead of external seller storefronts.

Similarly, the New Arrivals product cards in source were each credited to
an external designer (Faraz Manan, Elan, Zara Shahjahan, Ismail Farid) —
also a marketplace signal. Dropped those credit lines, kept everything
else about each product exactly as-is.

## Images — one thing to know

The source design used Google's Stitch preview CDN
(`lh3.googleusercontent.com`) for every image. I kept these exact URLs for
fidelity and whitelisted the domain in `next.config.mjs`, but this host is
meant for design-tool previews, not guaranteed long-term production
hosting. Worth migrating to your own asset storage (Vercel Blob,
Cloudinary, S3) before this goes live — flagging now rather than letting
images silently break later.

## Not yet converted (upcoming phases)

Everything else still uses my earlier, non-source-faithful build:
Men/Women PLP, PDP, Tailoring flow, Cart/Checkout, About/Contact/Returns/
Terms, Master Stitchers pages. Per the phase plan — these come next, each
with their own zip to review before I continue.

## Run it locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Status

✅ `next build` compiles and prerenders all 24 routes with zero errors
✅ `tsc --noEmit` clean
✅ Smoke-tested homepage + key routes on a production server — real source
copy confirmed rendering ("FUJRS UNSTITCHED", "Our Ateliers", "THE INNER
CIRCLE"), no console/server errors

**Sandbox-only caveat (unchanged):** Google Fonts unreachable from this
build environment — verified with a temporary system-font stand-in,
restored the real `next/font/google` config before packaging.

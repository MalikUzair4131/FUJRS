# FUJRS — Task Status (vs. REQUIREMENTS.md)

Gap analysis of the current codebase against [REQUIREMENTS.md](./REQUIREMENTS.md)
Section 7's Phase 1 scope. Verified directly against the code on
2026-07-27, not against old build-log narration.

> **Update 2026-07-29 — the backend was removed on purpose.** The project is
> now a UI-only build: no Supabase, no Stripe, no API routes, no database.
> Everything below that describes server behaviour ("live from the database",
> "Supabase tables", "Stripe re-verification") describes what *used to be
> wired up* and is being kept as the reference for rebuilding it. The
> decision was to finalise UI/UX first and design the schema against the
> finished screens. See [README.md](./README.md) for how the app runs today.
>
> What this changes in the assessment below: every ✅ that depended on the
> server is now "UI complete, persistence pending" — the screens, flows, and
> states are all there and demoable against browser-local storage. The ❌ /
> not-built items are unchanged; they were never built.

**Headline gap: the biggest structural mismatch is Section 5.** The spec's
"Vendor" is an affiliate/referral seller (trackable links, per-sale
commission, wallet, payouts). What's built under the `VENDOR` role today is
a *product-draft submission* flow (a vendor proposes a new catalog item for
Admin approval) — a different feature entirely. None of the affiliate
mechanics exist yet.

**Also worth flagging: the auth/data stack has changed since earlier build
notes.** The app now runs on Supabase (Supabase Auth + Postgres tables via
`src/lib/supabase/services.ts`), not Prisma/NextAuth/SQLite — `src/lib/prisma.ts`
is a stub (`export const prisma = null`) and the NextAuth route
(`src/app/api/auth/[...nextauth]/route.ts`) is empty. `README.md` reflects
the current Supabase-based architecture.

## 3.1 Standard Shopping — done
- [x] Product catalog, categories, search, cart, checkout, order confirmation
- [x] PDP: images, description, price, stock, add to cart
- [x] Order history for registered customers (`/account`)
- [x] Payment integration — Stripe (card) + Cash on Delivery
- [ ] Filters by size/color/fabric on the catalog — category/fabric filtering exists per collection page; not confirmed as a unified filter set across the full catalog
- Note: the catalog itself (`src/data/products.ts`) is a static file, not a database table — `productService` in `services.ts` (Supabase-backed) exists but is effectively unused (1 reference vs. 17 for the static file)

## 3.2 Custom Stitching Service — mostly done
- [x] Customer submits measurements (12 fields, guided panel), fabric/style choices at `/tailoring/configure`
- [x] Live pricing (base + neckline/sleeve/hemline add-ons)
- [x] Distinct status flow, separate from standard orders: `Awaiting Measurements → In Progress → Quality Check → Ready for Fitting → Delivered` (naming differs from the spec's suggested Submitted/Confirmed/In Progress/Ready/Shipped — functionally equivalent, worth confirming the exact stage names with the client)
- [x] Status visible to the customer (`/tailoring/review`) and to the assigned Tailor role (`/dashboard`, `/api/tailor/queue`)
- [ ] Reference-image upload during stitching request submission — an `/api/uploads` route exists (Supabase Storage) but is not confirmed wired into the `/tailoring/configure` form

## 4.1/4.2 Admin Dashboard & Permission Model — not built as specified
- [x] Orders: view (Admin dashboard shows live order stats + recent orders)
- [x] Stitching queue: view + update status (Tailor role)
- [ ] **Product management (add/edit/remove products, images, pricing, stock)** — no admin UI exists; catalog is a static code file, not database-editable. The only product-adjacent admin action is approving/rejecting vendor-submitted drafts (`AdminView.tsx`, `/api/admin/drafts`)
- [ ] **Granular permission model (Products/Orders/Stitching/Vendors/Reports toggles)** — does not exist. Access control today is a single hardcoded `role` field (`CUSTOMER | ADMIN | VENDOR | TAILOR`) with no `Permission`/`UserPermission` tables and no per-user permission assignment
- [ ] **Super Admin user & permission management UI** — does not exist. There's no "Super Admin" role distinct from `ADMIN`, and no in-app way to create/deactivate dashboard users. New staff accounts self-register with a shared `STAFF_INVITE_CODE`, then the first Admin is promoted manually via direct database access — the opposite of the spec's "Super Admin creates every dashboard user"
- [ ] Orders: cancel/refund actions — not found
- [ ] Reports & Analytics beyond the two live stats (orders count, revenue) — not built

## 5. Vendor / Affiliate System — not built as specified
- [ ] Vendor view of trackable links per product — does not exist
- [ ] Click/sale attribution via link tracking or referral code — does not exist
- [ ] Commission calculation (flat/percentage) — does not exist
- [ ] Vendor wallet/balance — does not exist
- [ ] Payout request flow — does not exist
- What exists instead under `VENDOR` role: submit a new product idea (`ProductDraft`: title, price, fabric, category, gender, description) for Admin approval — useful for a merchandising-intake feature, but doesn't satisfy Section 5 at all

## 6. Data Model — gaps vs. spec
Present (as Supabase tables, per `services.ts`): `profiles` (User equivalent,
with `role` and `assigned_stitcher_slug`), `products`, `categories`,
`orders` / `order_items` (with `stitching_*` fields covering the
StitchingRequest concept), `cart_items`, `wishlist_items`,
`tailoring_configs`, `product_drafts`, `reviews`.

Missing entirely: `Permission`, `UserPermission`, `VendorLink`,
`Commission`, `VendorWallet`. `StitchingRequest` isn't a separate table —
it's fields on `order_items`, which is workable but means a stitching
request only exists once it's part of an order, not as its own
pre-order entity.

## 7. Phase 1 scope — overall status
- [x] Storefront: browse, product detail, cart, checkout, standard orders
- [x] Custom stitching request flow (submission + status tracking)
- [~] Admin dashboard: order management and stitching queue are real; **product management is not built**
- [ ] Super Admin user & permission management — not built
- [ ] Vendor dashboard: product links, click/sale tracking, commission balance — not built (a different vendor feature exists instead)

## 8. Open questions — still unanswered
Per REQUIREMENTS.md Section 8, none of these appear to have a recorded
decision in the codebase yet:
- [ ] Which payment methods beyond Stripe card + COD (bank transfer, JazzCash/Easypaisa)?
- [ ] Commission structure — flat vs. percentage, and whether it varies by product/vendor
- [ ] Vendor link model — per-product link vs. one general referral code
- [ ] Who fulfills stitching orders operationally (affects Tailor-role dashboard fields — currently assumes in-house Master Stitchers)
- [ ] Vendor payout method and minimum threshold
- [ ] Final hosting/domain and brand assets (logo, palette, fonts) — current build uses a placeholder-sourced palette/font set and `lh3.googleusercontent.com` images

## Suggested next build priorities
1. Decide Section 8 open questions — several (vendor link model, commission structure) block starting the affiliate system at all.
2. Build the real Vendor/Affiliate system (Section 5) — currently the largest gap between spec and code.
3. Build a real permission model (Section 4.2) and Super Admin user management (Section 4.1) — the dashboard's access control is still role-hardcoded, not the granular per-user model the spec calls for.
4. Build admin product CRUD — move the catalog off the static data file and into an editable database table.

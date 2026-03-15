# Task Plan: WooCommerce Product Types

**Branch**: `003-product-types`  
**Spec**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)

---

## Phase 1 – Setup & Baseline

- [ ] T001 Confirm `003-product-types` branch is checked out and `pnpm test:int` passes on the current codebase as a baseline
- [ ] T002 Read `.agent/rules/fields.md`, `.agent/rules/hooks.md`, and `.agent/rules/collections.md` to surface any field or hook patterns required

---

## Phase 2 – Schema: Products Collection

### Goal

Extend the `Products` collection with `productType`, `isVirtual`, `isDownloadable`, and all associated conditional field groups.

### Implementation Tasks

- [ ] T003 [P] Add `productType` select field (sidebar, default `simple`) to `src/collections/Products/index.ts`
- [ ] T004 [P] Add `isVirtual` and `isDownloadable` checkbox fields (sidebar, conditional on `productType ∈ {simple, variable}`) to `src/collections/Products/index.ts`
- [ ] T005 Add **Shipping tab** fields (SKU, weight, dimensions group, shippingClass select) to `src/collections/Products/index.ts`, shown when `!isVirtual && productType ∈ {simple, variable}`
- [ ] T006 Add **Grouped Products tab** fields (child `grouped Products` relationship) shown when `productType === 'grouped'`
- [ ] T007 Add **External Product tab** fields (`externalUrl` required text, `externalButtonText` text with default "Buy Now") shown when `productType === 'external'`
- [ ] T008 Add **Downloads tab** fields (`downloadableFiles` array with file upload + name, `downloadLimit`, `downloadExpiry`) shown when `isDownloadable === true`
- [ ] T009 Run `pnpm payload migrate:create --name add-product-types` and commit the generated migration file
- [ ] T010 Run `pnpm generate:types` and verify `src/payload-types.ts` reflects new fields; fix any TypeScript errors

---

## Phase 3 – Media Access Control

### Goal

Ensure downloadable media files cannot be accessed directly without a valid download token.

### Implementation Tasks

- [ ] T011 Extend `src/collections/Media.ts` access control: Add a field or tag that marks media as "downloadable". Unauthenticated requests for download-tagged media return 403. Authenticated admin/owner access is unaffected.
- [ ] T012 Write integration test in `tests/int/downloads.int.spec.ts` asserting that unauthenticated GET to a download-tagged media URL returns 403

---

## Phase 4 – Download Token Utilities & API Route

### Goal

Implement server-side HMAC token generation, verification, and a streaming download endpoint.

### Implementation Tasks

- [ ] T013 Create `src/utilities/downloads/signToken.ts` — generates an HMAC-SHA256 token encoding `{orderId, productId, fileId, usageCount, expiresAt}` using `PAYLOAD_SECRET` as key
- [ ] T014 Create `src/utilities/downloads/verifyToken.ts` — decodes and verifies the HMAC, checks expiry and usage limit, returns decoded payload or throws
- [ ] T015 Create `src/app/api/downloads/[token]/route.ts` — verifies token, increments usage count on the Order, fetches the R2 object, and streams it to the response with appropriate `Content-Disposition` headers
- [ ] T016 Write integration tests in `tests/int/downloads.int.spec.ts` for: valid token streams file, expired token returns 410, over-limit token returns 410, tampered token returns 401

---

## Phase 5 – Order Hook: Download Link Email

### Goal

After a Paystack webhook confirms an order as paid, generate download tokens for any downloadable products and email them to the customer.

### Implementation Tasks

- [ ] T017 Extend existing order status change hook (or create `src/hooks/afterChangeOrderStatus.ts`) to detect `status === 'paid'` and iterate over order line items
- [ ] T018 For each line item that references a product with `isDownloadable === true`, call `signToken` for each file and collect the resulting `/api/downloads/[token]` URLs
- [ ] T019 Send a download delivery email via the existing email utility containing the product name and download links
- [ ] T020 Write an integration test in `tests/int/downloads.int.spec.ts` asserting the hook dispatches an email with the correct download URLs when order status changes to `paid`

---

## Phase 6 – Storefront Rendering

### Goal

Each product type renders correctly on the storefront product detail page and in listing pages.

### Implementation Tasks

- [ ] T021 [P] Update `src/app/(app)/shop/[slug]/page.tsx` to branch on `productType`:
  - `external`: render `<ExternalProductButton>` instead of "Add to Cart"
  - `grouped`: render `<GroupedProductList>`
  - `simple/variable`: existing rendering (with optional virtual flag for checkout exclusion)
- [ ] T022 [P] Create `src/components/ExternalProductButton/index.tsx` — renders an `<a target="_blank">` button using `externalUrl` and `externalButtonText`
- [ ] T023 [P] Create `src/components/GroupedProductList/index.tsx` — renders a grid/list of child product cards, each with its own "Add to Cart" action
- [ ] T024 Create `src/components/DownloadsList/index.tsx` — renders download links on the post-purchase confirm-order page for downloadable product orders

---

## Phase 7 – Virtual Product: Checkout Step Logic

### Goal

Omit the shipping step during checkout when all cart items are virtual.

### Implementation Tasks

- [ ] T025 Add an `isVirtual` flag check in the checkout flow (`src/app/(app)/checkout/page.tsx` or the checkout context provider): if all cart items have `isVirtual === true`, skip rendering the shipping address + shipping method sections
- [ ] T026 Write an integration test asserting that a cart containing only virtual products returns a checkout config with `requiresShipping: false`

---

## Phase 8 – Seed Data

### Goal

Seed one example of each product type for demos and test runs.

### Implementation Tasks

- [ ] T027 Create `src/endpoints/seed/product-simple.ts` — a basic physical product (hat or book) with SKU, weight, and dimensions
- [ ] T028 Update `src/endpoints/seed/product-tshirt.ts` if needed to ensure `productType: 'variable'` is explicitly set
- [ ] T029 Create `src/endpoints/seed/product-grouped.ts` — references the hat and tshirt as children
- [ ] T030 Create `src/endpoints/seed/product-external.ts` — an affiliate product with external URL to a demo page
- [ ] T031 Create `src/endpoints/seed/product-virtual.ts` — a consultation/service product with `isVirtual: true`
- [ ] T032 Create `src/endpoints/seed/product-download.ts` — an eBook product with `isDownloadable: true` and a seeded PDF media entry
- [ ] T033 Update `src/endpoints/seed/index.ts` to include new seed products in the seeding routine

---

## Phase 9 – Integration Tests

### Goal

All product type behaviour is covered by Vitest integration tests.

### Implementation Tasks

- [ ] T034 Create `tests/int/product-types.int.spec.ts` — test cases:
  - `productType` field defaults to `simple`
  - `externalUrl` is required when `productType === 'external'`
  - `groupedProducts` relationship is accepted when `productType === 'grouped'`
  - `isVirtual` and `isDownloadable` are booleans and only valid on `simple`/`variable`
  - `downloadableFiles` array is required when `isDownloadable === true`
- [ ] T035 Extend `tests/int/products.int.spec.ts` to add filter tests for `productType`

---

## Phase 10 – E2E Tests

### Goal

Key storefront scenarios are covered by Playwright E2E tests.

### Implementation Tasks

- [ ] T036 Create `tests/e2e/product-types.e2e.spec.ts` with scenarios:
  - External product page shows link-out button, no cart interaction
  - Grouped product page shows child product cards with individual add-to-cart
  - Virtual-only cart checkout skips shipping step
  - Simple product add-to-cart flows normally through shipping step

---

## Phase 11 – Polish & Quality Gates

- [ ] T037 Run `pnpm run lint` and `pnpm generate:types` with zero errors
- [ ] T038 Run `pnpm test:int` — all tests pass
- [ ] T039 Run `pnpm test:e2e` — all E2E tests pass
- [ ] T040 Run seeding routine and verify all six product types appear on the storefront
- [ ] T041 Git commit and push `003-product-types` branch to origin

---

## Dependencies & Story Order

1. Phase 1 (Setup) → all others
2. Phase 2 (Schema) must complete before Phases 3–6 (downstream features depend on new fields)
3. Phase 3 & 4 (Media access + download API) can run in parallel with Phase 5 (Storefront)
4. Phase 7 (Virtual checkout) and Phase 6 (Storefront) can proceed in parallel
5. Phase 8 (Seed) follows Schema but can partially overlap with Storefront work
6. Phases 9–10 (Tests) follow their respective implementation phases

## Parallel Execution Opportunities

- [P] T003 + T004 (productType + modifiers) simultaneously
- [P] T005 + T006 + T007 + T008 (tab field groups) once T003 is merged
- [P] T021 + T022 + T023 (storefront rendering) in parallel
- [P] T013 + T014 (sign/verify token utilities) simultaneously

# Implementation Plan: WooCommerce Product Types

**Branch**: `003-product-types` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the Payload CMS `Products` collection with a `productType` discriminator (simple, variable, grouped, external) plus two boolean modifier flags (`isVirtual`, `isDownloadable`) that unlock additional field groups. The existing `enableVariants` / `variantTypes` / `variants` system is preserved; selecting `variable` as the product type automatically activates it. New field groups are added for: shipping metadata (SKU, weight, dimensions), grouped product child-product references, external URL + button label, and downloadable files (file upload, limit, expiry). Storefront behaviour adapts per type: external products replace the cart button with a link-out; virtual-only carts skip the shipping checkout step; downloadable orders trigger a post-payment hook that emails signed, token-based download links to the customer. All six product type configurations will be represented in the seed data and covered by Vitest integration tests and Playwright E2E tests before merge.

---

## Technical Context

**Language/Version**: TypeScript targeting Cloudflare Workers (Node.js-compatible subset)  
**Primary Dependencies**: Next.js 15, Payload CMS 3.x (`@payloadcms/plugin-ecommerce`), `@opennextjs/cloudflare`, Cloudflare D1/R2  
**Testing**: Vitest integration (`pnpm test:int`) + Playwright E2E (`pnpm test:e2e`)  
**Target Platform**: Cloudflare Workers (server), modern browsers (client)  
**Performance Goals**: Worker CPU < 50ms per request; no heavy synchronous processing in hooks  
**Constraints**: No new external services introduced; download link generation must run within Worker CPU budgets; all schema changes must include D1 migrations

---

## Constitution Check

- **Cloudflare-First Delivery**: No new heavy dependencies. Download token generation uses the Web Crypto API (available in Workers). Signed URL validation is a lightweight JWT-style operation well within the 50ms CPU budget.
- **Schema & Types Stay in Lockstep**: Every new field added to the `Products` collection is followed by `pnpm payload migrate:create` + `pnpm generate:types`. Types are committed alongside the schema change.
- **Commerce Flows Stay Tested**: New virtual/downloadable checkout logic is covered by Vitest integration tests. Storefront rendering of grouped and external types is covered by Playwright.
- **Composable CMS Blocks**: No new blocks needed. Product type–specific UI is rendered via conditional field display in the existing product detail page.
- **Secrets and Environments Are Controlled**: No new secrets required. Download token signing key reuses `PAYLOAD_SECRET` via a keyed HMAC derivation.

_Post-design review_: All constitution gates satisfied; no exceptions requested.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-product-types/
├── spec.md            # Feature specification
├── plan.md            # This file
├── data-model.md      # Field-level schema definitions
├── contracts/         # API contracts for download endpoint
└── tasks.md           # Task breakdown
```

### Source Code Changes

```text
src/
├── collections/Products/
│   └── index.ts               # Add productType, isVirtual, isDownloadable, shipping, grouped, external, downloads fields
├── collections/Media.ts       # Access control: block unauthenticated access to download-purposed media
├── components/
│   ├── ExternalProductButton/ # New: renders link-out CTA for external products
│   ├── GroupedProductList/    # New: renders child product cards inside grouped product page
│   └── DownloadsList/         # New: post-purchase download links display
├── app/(app)/shop/[slug]/
│   └── page.tsx               # Conditional rendering based on productType
├── hooks/
│   └── afterChangeOrderStatus.ts  # Existing or new: triggers download email on paid status
├── utilities/
│   └── downloads/
│       ├── signToken.ts       # HMAC token generation for download links
│       └── verifyToken.ts     # HMAC token verification
├── app/api/downloads/
│   └── route.ts               # New: /api/downloads/[token] — verifies token, streams file
└── endpoints/seed/
    ├── product-simple.ts       # New seed: physical simple product
    ├── product-grouped.ts      # New seed: grouped product
    ├── product-external.ts     # New seed: affiliate product
    ├── product-virtual.ts      # New seed: virtual service
    └── product-download.ts     # New seed: downloadable digital good

tests/
├── int/
│   ├── products.int.spec.ts     # Extend: productType field, virtual/external exclusions
│   ├── product-types.int.spec.ts # New: type-specific field validation tests
│   └── downloads.int.spec.ts    # New: token sign/verify, access control
└── e2e/
    └── product-types.e2e.spec.ts # New: grouped add-to-cart, external link-out, virtual checkout skip
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | _N/A_      | _N/A_                                |

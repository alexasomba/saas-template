# Implementation Plan: Payload 3.62.1 to 3.79.0 Adoption

**Branch**: `002-payload-3-79-adoption` | **Date**: 2026-03-09

## Summary

Adopt the highest-value Payload CMS improvements introduced between `3.62.1` and `3.79.0` without destabilizing the storefront, checkout, or admin customizations. The immediate focus is editor UX and admin operations: Lexical block thumbnails/icons, import/export limits and policy, deterministic slug generation, and regression coverage for draft/version flows. The second phase reviews areas where the repo may now be over-customized relative to core Payload improvements, especially ecommerce guest cart behavior, live preview wiring, and the bespoke admin dashboard.

## Technical Context

**Language/Version**: TypeScript on Node.js >= 20.9  
**Primary Dependencies**: Next.js 15.4, Payload CMS 3.79, `@payloadcms/plugin-ecommerce`, `@payloadcms/plugin-import-export`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-r2`  
**Storage**: Cloudflare D1 (SQLite API surface), Cloudflare R2 for media  
**Testing**: Vitest integration suite and Playwright e2e suite  
**Target Platform**: Cloudflare Workers + Payload admin under App Router  
**Constraints**: Preserve current access-control patterns, avoid regressions in checkout, maintain existing Cloudflare bindings, do not overwrite user work already present on the current branch

## Scope

### In Scope

- Add Lexical block visuals for custom editor blocks
- Tighten import/export configuration with operational limits
- Standardize custom slug generation across page-like collections
- Add regression coverage for editor/versioning and import/export-sensitive flows
- Review ecommerce overrides against newer guest-cart capabilities
- Review R2 upload capabilities and live preview integration
- Plan migration from `beforeDashboard` to modular dashboard widgets

### Out of Scope

- Full localization rollout
- Rewriting the CRM plugin unless a clear simplification falls out of the review
- Payment provider migration or Paystack adapter redesign
- Large storefront redesign unrelated to Payload upgrade adoption

## Repo Impact Areas

### Editor and Content Modeling

- `src/blocks/`
- `src/collections/Pages/index.ts`
- `src/collections/Posts/index.ts`
- `src/collections/Products/index.ts`
- `src/collections/Categories.ts`

### Admin and Operations

- `src/plugins/index.ts`
- `src/components/BeforeDashboard/index.tsx`
- `src/components/Dashboard/`
- `src/app/(payload)/admin/importMap.js`

### Commerce and Preview

- `src/collections/Carts/index.ts`
- `src/collections/Orders/index.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/checkout/account/route.ts`
- `src/utilities/generatePreviewPath.ts`

### Verification

- `tests/int/`
- `tests/e2e/`

## Workstreams

### WS1: Lexical and Editor UX

**Goal**: Make block-driven editing faster and clearer for non-technical editors.

**Tasks**

- Add `icon` and `thumbnail` metadata to custom Lexical blocks where supported
- Audit which blocks are used inside block fields versus Lexical `BlocksFeature`
- Add light regression coverage for editor configuration changes where practical

**Primary Files**

- `src/blocks/Banner/config.ts`
- `src/blocks/Code/config.ts`
- `src/blocks/MediaBlock/config.ts`
- `src/collections/Posts/index.ts`

**Acceptance Criteria**

- Custom Lexical blocks display distinct visuals in the editor picker
- Editors can still insert and render those blocks without import map regressions
- No changes break live preview or block rendering

### WS2: Import/Export Hardening

**Goal**: Make bulk admin data operations safer and more predictable.

**Tasks**

- Define export/import limits per collection in the import/export plugin config
- Decide which collections should remain export-only, importable, or excluded
- Document the policy for large or sensitive collections

**Primary Files**

- `src/plugins/index.ts`
- `src/app/(payload)/admin/importMap.js`

**Acceptance Criteria**

- High-volume collections have explicit limits
- Sensitive collections are not accidentally opened for unsafe bulk import/export
- Admin import/export screens still load correctly after config changes

### WS3: Slug Strategy

**Goal**: Standardize URL generation for content and commerce documents.

**Tasks**

- Introduce a shared slugify helper for page-like collections
- Apply it to pages, posts, categories, and products
- Define behavior for punctuation, repeated separators, and casing

**Primary Files**

- `src/collections/Pages/index.ts`
- `src/collections/Posts/index.ts`
- `src/collections/Categories.ts`
- `src/collections/Products/index.ts`
- `src/utilities/toKebabCase.ts`

**Acceptance Criteria**

- New and updated documents produce deterministic slugs
- Existing routes remain valid or have a documented migration/redirect plan
- Slug behavior is covered by targeted tests

### WS4: Regression Coverage for Upgraded Payload Behavior

**Goal**: Lock down the areas most likely to regress after relying on newer Payload behavior.

**Tasks**

- Add integration coverage for draft/versioning-sensitive collections
- Add coverage for import/export configuration decisions where feasible
- Add e2e smoke coverage for key editorial or admin-adjacent flows if practical

**Primary Files**

- `tests/int/`
- `tests/e2e/`

**Acceptance Criteria**

- Draft-enabled collections have at least one regression test around read/write lifecycle
- Slug generation is exercised in tests
- Any new import/export config has a verification note or test path

### WS5: Ecommerce Review and Simplification

**Goal**: Determine whether custom cart and checkout code can be reduced now that Payload ecommerce has improved guest-cart support.

**Tasks**

- Compare current cart/account flow to core ecommerce guest-cart capabilities
- Identify redundant overrides in carts, orders, and checkout handlers
- Simplify only where behavior is demonstrably equivalent

**Primary Files**

- `src/plugins/index.ts`
- `src/collections/Carts/index.ts`
- `src/collections/Orders/index.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/checkout/account/route.ts`

**Acceptance Criteria**

- Any removed custom logic is replaced by tested core behavior
- Guest checkout, account conversion, and order creation still work end to end
- No security regressions around Local API access or ownership checks

### WS6: Preview, Storage, and Dashboard Modernization

**Goal**: Align custom integrations with newer admin capabilities.

**Tasks**

- Review R2 multipart upload support and decide whether config changes are needed
- Reassess preview plumbing for richer live-preview handling
- Design the migration path from `beforeDashboard` to modular dashboard widgets

**Primary Files**

- `src/payload.config.ts`
- `src/collections/Media.ts`
- `src/utilities/generatePreviewPath.ts`
- `src/components/BeforeDashboard/index.tsx`
- `src/components/Dashboard/`

**Acceptance Criteria**

- A clear decision is documented for R2 multipart uploads
- Preview behavior remains correct for pages, posts, and products
- Dashboard migration has a defined target architecture before implementation starts

## Delivery Order

1. WS1 Lexical and Editor UX
2. WS2 Import/Export Hardening
3. WS3 Slug Strategy
4. WS4 Regression Coverage
5. WS5 Ecommerce Review and Simplification
6. WS6 Preview, Storage, and Dashboard Modernization

## Risks

- Slug changes can break existing storefront URLs if applied without redirects
- Import/export expansion can expose sensitive collections to accidental bulk actions
- Ecommerce cleanup can regress guest checkout if plugin behavior does not fully match existing custom flows
- Dashboard migration can create admin UI churn without measurable product value if done too early

## Recommended Rollout

- Ship WS1 to WS4 first as one upgrade-value tranche
- Treat WS5 as a review with selective simplification, not a rewrite
- Implement WS6 dashboard work only after the earlier workstreams are stable

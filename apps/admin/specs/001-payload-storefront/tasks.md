# Task Plan: Cloudflare Payload Storefront

**Branch**: `001-payload-storefront`  
**Spec**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)

---

## Phase 1 – Setup

- [x] T001 Confirm Stripe, preview, and payload secrets exist in `.env.local` per quickstart instructions
- [x] T002 Verify Cloudflare bindings (`D1`, `R2`) in `wrangler.jsonc` and sync IDs with Cloudflare dashboard
- [ ] T003 Create feature branch config in `.specify` memory if additional constitution notes emerge during implementation

## Phase 2 – Foundational Infrastructure

- [x] T004 Audit `src/plugins/index.ts` to ensure ecommerce plugin configuration already supports guest checkout and optional account invite
- [x] T005 Review `src/providers/index.tsx` to confirm ecommerce provider wiring exposes Stripe publishable key for client usage
- [x] T006 Validate `tests/int` and `tests/e2e` harness run with seeded data (`pnpm test:int`, `pnpm test:e2e`) as baseline
- [x] T007 Inspect `src/collections/Products/index.ts` and related variant logic to understand current inventory guard behaviors
- [x] T008 Audit preview handler in `src/app/(app)/next/preview/route.ts` (and related utilities) to enforce `PREVIEW_SECRET` validation and capture regression coverage or manual validation steps in `quickstart.md`

## Phase 3 – User Story 1: Shopper Completes Purchase (Priority P1)

### Goal

Enable first-time visitors to browse products, add items to cart, complete guest checkout, and optionally create an account post-purchase without friction.

### Independent Test Criteria

- Complete add-to-cart through checkout in <3 minutes using seeded catalog; order logs show successful payment intent.
- Confirmation screen offers account creation option without blocking order success.

### Tests (Run/extend as needed)

- `pnpm test:int` focusing on cart/order integration specs.
- `pnpm test:e2e` scenario covering guest checkout.

#### Implementation Tasks

- [x] T009 [P] [US1] Update `src/components/Cart/EditItemQuantityButton.tsx` and `src/components/Cart/DeleteItemButton.tsx` to respect latest cart API contract responses
- [x] T010 [P] [US1] Ensure `src/components/Cart/` components display stock errors when cart API returns 409
- [x] T011 [US1] Extend `src/app/(app)/checkout/page.tsx` to capture guest contact + shipping details and submit to `/api/checkout`
- [x] T012 [US1] Implement optional account invite banner on `src/app/(app)/checkout/confirm-order/page.tsx` with CTA targeting the account conversion form
- [x] T013 [P] [US1] Implement `/api/checkout/account` handler to validate invite tokens, create user records, and associate newly created accounts with completed orders
- [x] T014 [US1] Update `src/components/checkout/ConfirmOrder.tsx` (and related success UI) to submit the invite form to `/api/checkout/account`, handling success, duplicate, and invalid token responses
- [x] T015 [P] [US1] Wire `/api/checkout` handler (likely `src/app/api/checkout/route.ts` or similar) to create orders, transactions, and invite token when payment succeeds
- [x] T016 [P] [US1] Extend `tests/int/api.int.spec.ts` to cover guest checkout (happy path, inventory failure) and `/api/checkout/account` token validation (success + error)
- [x] T017 [P] [US1] Add integration or contract coverage ensuring `/api/products` (or equivalent) enforces catalog filters/search aligned with FR-010 for products
- [ ] T018 [US1] Expand `tests/e2e/frontend.e2e.spec.ts` with flow: discover product (category/search) → add to cart → checkout as guest → submit account conversion
- [ ] T019 [US1] Document guest checkout, confirmation route, and account conversion flow (including `/api/checkout/account`) in `README.md` or dedicated onboarding notes

## Phase 4 – User Story 2: Marketer Publishes Landing Page (Priority P2)

### Goal

Allow authenticated editors to assemble marketing pages using block library, preview drafts, and schedule publication with navigation updates.

### Independent Test Criteria

- Editor publishes a landing page containing hero, content, CTA blocks; page renders on storefront with header/footer navigation reflecting new slug.

### Tests

- Manual CMS publish flow + targeted vitest for page hooks if modified.

#### Implementation Tasks

- [ ] T020 [P] [US2] Confirm block configs in `src/blocks/` cover required hero/content/CTA compositions; add missing configs if gaps exist
- [ ] T021 [P] [US2] Update `src/blocks/RenderBlocks.tsx` if new block variants introduced for marketer needs
- [ ] T022 [US2] Ensure `src/collections/Pages/index.ts` scheduling + preview configuration align with marketer workflow (adjust hooks if necessary)
- [ ] T023 [US2] Verify navigation propagation: update `src/globals/Header.ts` / `Footer.ts` seeding logic to include new landing page slug when published
- [ ] T024 [US2] Add documentation snippet in `quickstart.md` guiding marketers through preview + publish flow

## Phase 5 – User Story 3: Reader Explores Editorial Content (Priority P3)

### Goal

Visitors can browse blog index, filter by category, view posts with rich media, and follow related content suggestions.

### Independent Test Criteria

- Reader filters blog by category and sees relevant posts with hero/media; related posts provide working navigation.

### Tests

- Extend Playwright coverage for blog filter if necessary; rely on existing search plugin integration.

#### Implementation Tasks

- [ ] T025 [P] [US3] Review `src/app/(app)/posts/` route to ensure category filters use payload search overrides; adjust query or UI as needed
- [ ] T026 [P] [US3] Confirm `src/components/CollectionArchive` or related blog components render hero/media and related posts; patch missing data wiring
- [ ] T027 [US3] Adjust `src/endpoints/seed` blog seeding to guarantee categories + related posts align with acceptance scenarios
- [ ] T028 [US3] Update tests/e2e scenario to cover blog category filter and related post navigation (add new Playwright step if missing)

## Phase 6 – Polish & Cross-Cutting

- [ ] T029 Run `pnpm lint` and `pnpm test` ensuring zero failures
- [ ] T030 Update `CHANGELOG.md` or release notes detailing storefront + CMS improvements
- [ ] T031 Verify Cloudflare deployment using `pnpm run deploy` against staging (dry run), then review Stripe dashboard metrics and Cloudflare request logs for checkout health; document results in PR
- [ ] T032 Prepare rollout checklist referencing Constitution gates, recording evidence of tests, telemetry review, and secret validation
- [ ] T033 Validate `/next/seed` still rebuilds products, posts, navigation, and account-invite artifacts after checkout changes; capture command output for the rollout checklist and adjust seed data or docs if discrepancies appear

---

## Dependencies & Story Order

1. Setup (Phase 1) → Foundational (Phase 2)
2. US1 (Phase 3) depends on foundational tasks and establishes checkout infrastructure
3. US2 (Phase 4) can run after foundational; independent of US1 except shared navigation updates
4. US3 (Phase 5) depends on foundational data integrity and seeding
5. Polish (Phase 6) follows completion of stories

## Parallel Execution Opportunities

- [P] T009 with T010 (cart UI adjustments) once API shape known
- [P] T015 with T016 (checkout API + token coverage) coordinated between backend and QA engineer
- [P] T020 with T021 (block configuration + renderer updates)
- [P] T025 with T026 (blog filter + component wiring)

## Implementation Strategy

1. Deliver MVP by completing User Story 1 (guest checkout) end-to-end with automated coverage.
2. Roll in marketer landing capabilities (User Story 2) leveraging existing block system.
3. Finish editorial browsing enhancements (User Story 3) to round out content experience.
4. Close with polish tasks ensuring deployment readiness, storing `/next/seed` evidence, reviewing telemetry, and final documentation.

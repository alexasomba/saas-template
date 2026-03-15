# Task Plan: Product Add-ons & Subscriptions (004-addons-subscriptions)

**Branch**: `004-addons-subscriptions` (from `003-product-types`)
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1 – Setup

- [ ] T001 Confirm `004-addons-subscriptions` is branched from `003-product-types` and `pnpm test:int` baseline passes
- [ ] T002 Read `.agent/rules/collections.md` and `.agent/rules/fields.md` for any updated patterns

---

## Phase 2 – Add-on Block Configs

- [ ] T003 [P] Create `src/blocks/addons/MultipleChoiceAddon/config.ts` — `displayAs`, `options[]` with per-option price/label/hidden, `required`, `priceType`, `price`
- [ ] T004 [P] Create `src/blocks/addons/CheckboxesAddon/config.ts` — options with default checked, per-option price
- [ ] T005 [P] Create `src/blocks/addons/ShortTextAddon/config.ts` — restriction enum, placeholder, maxLength, priceType, price
- [ ] T006 [P] Create `src/blocks/addons/LongTextAddon/config.ts` — placeholder, maxLength, priceType, price
- [ ] T007 [P] Create `src/blocks/addons/FileUploadAddon/config.ts` — required only (no price on upload itself)
- [ ] T008 [P] Create `src/blocks/addons/CustomerPriceAddon/config.ts` — prefilledPrice, minPrice, maxPrice
- [ ] T009 [P] Create `src/blocks/addons/QuantityAddon/config.ts` — prefilledQty, minQty, maxQty, priceType, price
- [ ] T010 [P] Create `src/blocks/addons/DatePickerAddon/config.ts` — priceType, price
- [ ] T011 Create `src/blocks/addons/index.ts` barrel export for all 8 configs

---

## Phase 3 – ProductAddons Collection (Global Groups)

- [ ] T012 Create `src/collections/ProductAddons/index.ts` — fields: `name`, `categories` (relationship hasMany), `displayOrder` (number, default 10), `excludeFromProducts` (relationship hasMany), `fields` (blocks using all 8 addon block configs)
- [ ] T013 Register `ProductAddons` in `src/payload.config.ts` (collections array)
- [ ] T014 Run `pnpm payload migrate:create --name add-product-addons` and commit migration file

---

## Phase 4 – Products: Add-ons Tab & Subscription Fields

- [ ] T015 Add **Add-ons tab** to `src/collections/Products/index.ts`:
  - `excludeGlobalAddons` checkbox
  - `addons` blocks field using the 8 addon block configs
- [ ] T016 Add `isSubscription` checkbox to Products sidebar (condition: `productType ∈ {simple, variable}`)
- [ ] T017 Add **Subscription tab** to `src/collections/Products/index.ts` (condition: `isSubscription === true`):
  - `subscriptionPrice`, `subscriptionPriceNGN`, `period` select, `interval`, `trialDays`, `signUpFee`, `signUpFeeNGN`, `expiryLength`
- [x] T018 Run `pnpm generate:types` and fix any TypeScript errors

---

## Phase 5 – Cart & Order Items: addonSelections

- [x] T019 Add `addonSelections` array to cart `items` sub-fields: `{ fieldId, label, value, priceAdjustment, priceAdjustmentNGN }`
- [x] T020 Add same `addonSelections` array to order `items` sub-fields
- [x] T021 Run `pnpm payload migrate:create --name add-addon-selections` and commit

---

## Phase 6 – Subscriptions Collection

- [x] T022 Create `src/collections/Subscriptions/index.ts` with all fields from data-model.md § 4
- [x] T023 Register `Subscriptions` in `src/payload.config.ts`
- [x] T024 Run `pnpm payload migrate:create --name add-subscriptions` and commit migration

---

## Phase 7 – Order Hook: Create Subscription on Payment

- [x] T025 Extend `src/hooks/afterChangeOrderStatus.ts` (or create it):
  - On `status === 'paid'`, loop over order line items
  - For subscription products: extract `authorization_code` + `customer_code` from transaction's Paystack metadata
  - Compute `nextPaymentDate` (accounting for `trialDays`)
  - Compute `endDate` if `expiryLength > 0`
  - `payload.create({ collection: 'subscriptions', data: { ... } })`
- [ ] T026 Write integration test: hook creates a Subscriptions record with correct `nextPaymentDate` on order paid

---

## Phase 8 – Cron: Renewal Processor

- [x] T027 Create `src/app/api/cron/subscriptions/route.ts`:
  - Verify `Authorization: Bearer ${CRON_SECRET}` header
  - Query active subscriptions due for renewal
  - Call Paystack `POST /transaction/charge_authorization` per due subscription
  - On success: `payload.create` renewal Order, advance `nextPaymentDate`
  - On failure: increment `failedPaymentCount`; if ≥ 2 → set `on-hold`, send email
- [x] T028 Add `CRON_SECRET` to `wrangler.jsonc` env and `.env.example`
- [x] T029 Register Cloudflare Cron Trigger in `wrangler.jsonc`: `"crons": ["0 6 * * *"]`

---

## Phase 9 – Storefront: Subscription Price Label

- [x] T030 Update `src/app/(app)/shop/[slug]/page.tsx` to show recurring price label when `product.isSubscription === true` (e.g. "₦15,000 / month")

---

## Phase 10 – Storefront: Account Subscriptions Page

- [x] T031 Create `src/app/(app)/account/subscriptions/page.tsx` — authenticated, lists customer's subscriptions with status badge, amount, period, nextPaymentDate, and Cancel button
- [x] T032 Create `src/app/api/subscriptions/[id]/cancel/route.ts` — authenticated, ownership check, sets `status: 'cancelled'`

---

## Phase 11 – Seed Data

- [x] T033 Create `src/endpoints/seed/product-subscription.ts` — "Newsletter Pro Monthly" with `isSubscription: true`, `period: 'month'`, `interval: 1`, `trialDays: 7`, `subscriptionPrice: 2500`
- [x] T034 Update `src/endpoints/seed/product-tshirt.ts` to add per-product add-ons: "Custom Print Text" (ShortText) + "Gift Wrap" (Checkboxes, flat fee $3)
- [x] T035 Wire new seed product into `src/endpoints/seed/index.ts`

---

## Phase 12 – Integration Tests

- [x] T036 Create `tests/int/addons.int.spec.ts`:
  - Global add-on category scoping logic
  - `excludeGlobalAddons: true` prevents global group application
  - Price adjustment calculation: flat / quantity_based / percentage
- [x] T037 Create `tests/int/subscriptions.int.spec.ts`:
  - Record created with correct `nextPaymentDate` after paid order
  - `trialDays > 0` delays first nextPaymentDate
  - Cron processor logic: advance date on success, set on-hold after 2 failures

---

## Phase 13 – E2E Tests

- [x] T038 Create `tests/e2e/addons.e2e.spec.ts`:
  - Product page renders add-on fields
  - Required field blocks Add to Cart
  - Price updates live
- [x] T039 Create `tests/e2e/subscriptions.e2e.spec.ts`:
  - Subscription product shows recurring label
  - Cancel from account page updates status

---

## Phase 14 – Polish & Quality Gates

- [x] T040 `pnpm run lint` — zero errors
- [x] T041 `pnpm generate:types && npx tsc --noEmit` — zero errors
- [x] T042 `pnpm test:int` — all tests pass
- [x] T043 `pnpm test:e2e` — all E2E tests pass
- [x] T044 Git commit and push `004-addons-subscriptions` to origin

---

## Dependencies & Order

1. Phase 2 (Block configs) → Phase 3 (ProductAddons collection) + Phase 4 (Products tabs)
2. Phase 3+4 → Phase 5 (Cart/Order items)
3. Phase 6 (Subscriptions collection) can run alongside Phases 3–5
4. Phase 7 (Order hook) depends on Phase 6
5. Phase 8 (Cron) depends on Phase 6
6. Phases 9–10 (Storefront) and Phase 11 (Seed) can run after Phases 4 and 6
7. Phases 12–13 (Tests) follow their respective implementation phases
8. Phase 14 (Polish) is always last

## Parallel Opportunities

- [P] T003–T010 all add-on block configs can be written simultaneously
- [P] T012 (ProductAddons collection) + T015–T017 (Products tabs) after blocks are done
- [P] T019 (Cart addon selections) + T022 (Subscriptions collection)
- [P] T031 (Account page) + T032 (Cancel API route)

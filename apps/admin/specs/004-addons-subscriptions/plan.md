# Implementation Plan: Product Add-ons & Subscriptions (004-addons-subscriptions)

## Overview

Two features extending the Payload ecommerce stack:

1. **Product Add-ons** — configurable per-product options (text, dropdowns, checkboxes, file upload, date picker, etc.) that optionally adjust price. Supports global groups (scoped by category) and per-product overrides.

2. **Subscriptions** — recurring billing on `simple`/`variable` products using Paystack authorization reuse. A Cloudflare Cron Trigger processes renewals daily without an external job queue.

This branch builds on `003-product-types` (the `productType` discriminator and related schema are already present).

---

## Proposed Changes

### Add-ons: Block Configs

#### [NEW] src/blocks/addons/ (directory)

Eight add-on field block definitions used by both the `ProductAddons` collection and the per-product `addons` array:

- `MultipleChoiceAddon/config.ts`
- `CheckboxesAddon/config.ts`
- `ShortTextAddon/config.ts`
- `LongTextAddon/config.ts`
- `FileUploadAddon/config.ts`
- `CustomerPriceAddon/config.ts`
- `QuantityAddon/config.ts`
- `DatePickerAddon/config.ts`

Each exports a `Block` config reusable in both the `ProductAddons` collection and the Products `addons` tab.

---

### Add-ons: Global Groups Collection

#### [NEW] src/collections/ProductAddons/index.ts

Fields: `name`, `categories` (relationship, hasMany), `displayOrder` (number, default 10), `excludeFromProducts` (relationship, hasMany), `fields` (blocks from above).

---

### Add-ons: Products Extension

#### [MODIFY] src/collections/Products/index.ts

New **Add-ons tab**:

- `excludeGlobalAddons` checkbox
- `addons` blocks field using the same 8 block configs

---

### Add-ons: Cart & Order Items

#### [MODIFY] src/collections/Carts.ts (or equivalent)

Add `addonSelections` group to each item in the `items` array:

```
addonSelections?: { fieldId, label, value, priceAdjustment, priceAdjustmentNGN }[]
```

#### [MODIFY] src/collections/Orders.ts

Same `addonSelections` extension on order line items.

---

### Subscriptions: Products Extension

#### [MODIFY] src/collections/Products/index.ts

- `isSubscription` checkbox (sidebar, condition: `productType ∈ {simple, variable}`)
- **Subscription tab** (condition: `isSubscription === true`):
  `subscriptionPrice`, `subscriptionPriceNGN`, `period`, `interval`, `trialDays`, `signUpFee`, `signUpFeeNGN`, `expiryLength`

---

### Subscriptions: Collection

#### [NEW] src/collections/Subscriptions/index.ts

Fields: `customer`, `product`, `variant`, `order`, `status`, `period`, `interval`, `nextPaymentDate`, `endDate`, `trialEndDate`, `subscriptionPrice`, `subscriptionPriceNGN`, `currency`, `paystackAuthCode`, `paystackCustomerCode`, `paystackEmail`, `failedPaymentCount`, `lastFailedAt`, `renewalOrders`.

---

### Subscriptions: Order Hook

#### [MODIFY or NEW] src/hooks/afterChangeOrderStatus.ts

On `status === 'paid'`:

- Check each line item's product for `isSubscription === true`
- Extract `authorization_code` and `customer_code` from the Paystack webhook payload stored on the transaction
- Create a `Subscriptions` record with status `active` and computed `nextPaymentDate`

---

### Subscriptions: Cron Renewal Processor

#### [NEW] src/app/api/cron/subscriptions/route.ts

- Protected by `CRON_SECRET` header check
- Queries all `Subscriptions` where `status: active AND nextPaymentDate ≤ now`
- For each: calls Paystack `/transaction/charge_authorization`, creates renewal Order on success, advances `nextPaymentDate`
- On failure: increments `failedPaymentCount`; at ≥ 2 failures sets `on-hold` and emails customer

#### [MODIFY] wrangler.jsonc

Register the cron trigger: `"0 6 * * *"` → `src/app/api/cron/subscriptions/route.ts`

---

### Subscriptions: Storefront

#### [NEW] src/app/(app)/account/subscriptions/page.tsx

Lists a customer's subscriptions with status badge, next payment date, and a "Cancel" button.

#### [NEW] src/app/api/subscriptions/[id]/cancel/route.ts

Authenticated endpoint (customer must own the subscription) that sets status to `cancelled`.

---

### Seed Data

#### [NEW] src/endpoints/seed/product-subscription.ts

A monthly subscription product (e.g. "Newsletter Pro — Monthly") with `isSubscription: true`, `period: 'month'`, `interval: 1`, `trialDays: 7`.

#### [NEW] src/endpoints/seed/product-addon-tshirt.ts (or extend existing)

Update the tshirt seed to include per-product add-ons: a "Custom Print Text" short text add-on and an optional "Gift Wrap" checkbox.

#### [MODIFY] src/endpoints/seed/index.ts

Wire in new seed products.

---

### Migrations

- `pnpm payload migrate:create --name add-product-addons` — `ProductAddons` collection + `addons` tab on Products
- `pnpm payload migrate:create --name add-subscriptions` — `Subscriptions` collection + subscription fields on Products + `addonSelections` on Carts/Orders

---

### Tests

#### [NEW] tests/int/addons.int.spec.ts

- Global add-on group resolves to correct products (respects category and exclusion)
- Per-product add-on with `excludeGlobalAddons: true` does not inherit global groups
- `addonSelections` price adjustment logic (flat / quantity_based / percentage)
- Required field validation blocks add-to-cart

#### [NEW] tests/int/subscriptions.int.spec.ts

- Subscription record created with correct `nextPaymentDate` after order paid
- Trial period: `nextPaymentDate = now + trialDays`
- Sign-up fee included in first payment
- Cron processor advances `nextPaymentDate` on successful reuse charge
- Cron processor sets `on-hold` after 2 consecutive failures

#### [NEW] tests/e2e/addons.e2e.spec.ts

- Product page renders add-on fields; required field blocks cart action
- Price updates live as options are selected

#### [NEW] tests/e2e/subscriptions.e2e.spec.ts

- Subscription product page shows recurring price label
- Account subscriptions page lists active subscription after purchase
- Cancel action updates status and removes from active list

---

## Verification Plan

### Automated Tests

```bash
pnpm test:int   # addons.int.spec.ts + subscriptions.int.spec.ts
pnpm test:e2e   # addons.e2e.spec.ts + subscriptions.e2e.spec.ts
pnpm generate:types && npx tsc --noEmit
```

### Manual Verification

1. Create a global add-on group in admin → verify it renders on product pages in its category
2. Create a subscription product → verify the recurring price label appears on storefront
3. Run a test checkout of a subscription product using Paystack test mode → verify Subscriptions record created in admin
4. Manually invoke the cron endpoint with test data → verify renewal order created and `nextPaymentDate` advanced
5. Cancel a subscription from `/account/subscriptions` → verify status changes and no further renewal occurs

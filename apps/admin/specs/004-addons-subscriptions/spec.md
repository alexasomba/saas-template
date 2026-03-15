# Feature Specification: Product Add-ons & Subscriptions (004)

**Branch**: `004-addons-subscriptions`  
**Date**: 2026-03-10  
**Status**: Draft

---

## Overview

Two complementary features that extend the ecommerce product model:

1. **Product Add-ons** — allow merchants to attach configurable, optionally-priced options to products (e.g. gift wrapping, engraving text, custom size). Supports both global add-ons (applied across categories) and per-product overrides.

2. **Subscriptions** — allow merchants to sell products with automatic recurring billing. Customers are charged at a set interval; Paystack stored authorizations are used for fully automatic renewals without the customer re-entering payment details.

---

## User Stories

### US-001 — Merchant creates a global add-on group

> **As a** store admin,  
> **I want to** create a set of add-on fields once and apply them across a product category,  
> **so that** I don't have to repeat the configuration on every individual product.

**Acceptance Criteria:**

- Admin can create a global add-on group under a dedicated "Add-ons" section with a name, optional category filter, display order, and one or more add-on fields
- Fields support: Multiple Choice (dropdown/radio/image), Checkboxes, Short Text, Long Text, File Upload, Customer Defined Price, Quantity, Date Picker
- Each field can be required or optional
- Price adjustments can be: flat fee, quantity-based, or percentage of product price

### US-002 — Merchant creates per-product add-ons

> **As a** store admin,  
> **I want to** add unique options to a specific product,  
> **so that** niche customizations don't pollute global add-ons.

**Acceptance Criteria:**

- Add-ons tab on individual product with the same field types as global
- Option to opt out of global add-ons for that product (`excludeGlobalAddons: true`)
- Add-ons are stored on the Product document, not a separate collection

### US-003 — Shopper configures add-ons before adding to cart

> **As a** shopper,  
> **I want to** select or fill in add-on options on the product page,  
> **so that** my item is customized exactly how I want it.

**Acceptance Criteria:**

- All applicable add-on fields render below the product description, above "Add to Cart"
- Required add-ons block "Add to Cart" until completed
- Price adjustments show live, updating the displayed total
- Selected add-on data is stored on the cart line item

### US-004 — Merchant creates a subscription product

> **As a** store admin,  
> **I want to** mark a product as a recurring subscription,  
> **so that** customers are automatically charged at the defined interval.

**Acceptance Criteria:**

- `isSubscription` checkbox on Simple/Variable products (sidebar)
- When checked, Subscription tab reveals: price, period (day/week/month/year), interval, trial days, sign-up fee, expiry length
- Product page shows the subscription price and period prominently (e.g. "$25 / month")

### US-005 — Shopper subscribes and pays automatically

> **As a** shopper,  
> **I want to** purchase a subscription once and have renewals charged automatically,  
> **so that** I don't have to remember to pay each period.

**Acceptance Criteria:**

- First payment captures Paystack authorization code and stores it on the Subscription record
- A Subscription record is created in `active` status after successful first payment
- Renewals run automatically on `nextPaymentDate` using stored authorization
- Shopper receives a renewal receipt email on each successful charge
- On failed renewal, subscription moves to `on-hold` and shopper receives a failed payment email

### US-006 — Shopper manages their subscriptions

> **As a** shopper,  
> **I want to** view and cancel my active subscriptions in my account,  
> **so that** I stay in control of my recurring charges.

**Acceptance Criteria:**

- My Account page shows a "Subscriptions" section listing all subscriptions with status badge
- Shopper can cancel an active subscription (moves to `cancelled`, no further renewal)
- Shopper can see next payment date and amount

### US-007 — Merchant manages subscriptions from admin

> **As a** store admin,  
> **I want to** view, pause, and cancel subscriptions in the Payload admin,  
> **so that** I can handle customer support requests.

**Acceptance Criteria:**

- Subscriptions collection in admin with list view (status, customer, product, nextPaymentDate)
- Admin can manually change status to `on-hold`, `cancelled`, or `active`
- Admin can manually trigger a renewal charge

---

## Functional Requirements

| ID     | Requirement                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | A `ProductAddons` collection stores global add-on groups with name, categories, displayOrder, and a `fields` array of typed blocks                                  |
| FR-002 | Products gain an `addons` array tab with the same block types, plus `excludeGlobalAddons` boolean                                                                   |
| FR-003 | Add-on blocks support all 8 field types from WooCommerce: MultipleChoice, Checkboxes, ShortText, LongText, FileUpload, CustomerPrice, Quantity, DatePicker          |
| FR-004 | Each add-on option has `priceType` (flat/quantity_based/percentage) and `price` number                                                                              |
| FR-005 | Add-on selections are stored on cart `items` and order `items` as structured JSON                                                                                   |
| FR-006 | Products gain `isSubscription` checkbox (sidebar, Simple/Variable only)                                                                                             |
| FR-007 | When `isSubscription: true`, a Subscription tab reveals: `subscriptionPrice`, `period`, `interval`, `trialDays`, `signUpFee`, `expiryLength`                        |
| FR-008 | A `Subscriptions` collection tracks per-customer agreements with: `status`, `product`, `customer`, `paystackAuthCode`, `nextPaymentDate`, `endDate`, `trialEndDate` |
| FR-009 | On order `paid`, if any item is a subscription product, create a Subscription record and store the Paystack `authorization_code`                                    |
| FR-010 | A Cloudflare Cron Trigger fires daily to process due subscriptions: charge via Paystack reuse endpoint, update `nextPaymentDate`, send renewal email                |
| FR-011 | On failed renewal, mark subscription `on-hold`, send failed payment email (retry once after 3 days)                                                                 |
| FR-012 | Shoppers can cancel subscriptions via `/account/subscriptions` route                                                                                                |
| FR-013 | Cart line items with add-ons serialize choices as `addonSelections: [{fieldId, label, value, priceAdjustment}]`                                                     |
| FR-014 | Order confirmation and receipts include itemized add-on selections and prices                                                                                       |

---

## Key Entities

### New Collections

- **`ProductAddons`** — global add-on groups (per category or store-wide)
- **`Subscriptions`** — per-customer subscription agreements

### Modified Collections

- **`Products`** — add `isSubscription`, subscription fields tab, `addons` array tab, `excludeGlobalAddons`
- **`Carts`** — cart `items` extended to store `addonSelections`
- **`Orders`** — order `items` extended to store `addonSelections`

---

## Assumptions

1. Paystack authorization codes are reusable for future charges via `/transaction/charge_authorization`
2. Cloudflare Cron Triggers (Workers scheduled events) are used for daily renewal processing — no external job queue needed
3. Subscription prices are stored in the same dual-currency model (USD + NGN) as regular products
4. Add-on file uploads will go to Cloudflare R2 (same as product media)
5. Global add-ons apply to all products unless a product has `excludeGlobalAddons: true`
6. Add-ons defined on a variable product apply to all variations (per WooCommerce behaviour)
7. First subscription payment goes through the normal Paystack checkout flow; subsequent renewals use charge reuse

---

## Edge Cases

- Trial period: do not charge on first payment if `trialDays > 0`; set `nextPaymentDate = now + trialDays`
- Sign-up fee: charge `signUpFee + subscriptionPrice` on first payment (or `signUpFee` only if trial)
- Expiry: if `expiryLength > 0`, set `endDate = now + expiryLength * period`; cancel automatically on expiry
- Add-on "Customer Defined Price": validate that value is within optional min/max range before add-to-cart
- Multiple subscription products in a single cart — create one Subscription record per subscription line item
- External/Grouped products cannot be subscriptions

---

## Success Criteria

| ID     | Metric                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| SC-001 | Admin can create a global add-on group and see it rendered on a product page in the storefront                           |
| SC-002 | Add-on selections flow through cart → order → receipt email with correct price adjustments                               |
| SC-003 | A subscription product checkout results in a `Subscriptions` record with status `active` and a stored `paystackAuthCode` |
| SC-004 | The daily cron job triggers a Paystack charge reuse for a due subscription and updates `nextPaymentDate`                 |
| SC-005 | A shopper can cancel a subscription from `/account/subscriptions` and no further charges occur                           |

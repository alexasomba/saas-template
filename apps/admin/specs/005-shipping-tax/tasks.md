# 005: Shipping & Tax Options Task Tracker

## Phase 1 – Data Schema

- [x] T001 Create `src/collections/TaxClasses`
  - title (e.g., Standard, Zero-Rated, Exempt)
  - rate (e.g., 7.5, 0, 0)
- [x] T002 Create `src/collections/ShippingClasses`
  - title
- [x] T003 Create `src/collections/ShippingZones`
  - name
  - locations (countries/states)
  - methods (Blocks: Flat Rate, Free Shipping, Local Pickup)
- [x] T004 Update `src/collections/Products/index.ts`
  - Add `taxStatus` (Taxable, Shipping Only, None)
  - Add `taxClass` (Relationship to TaxClasses)
  - Add `shippingClass` (Relationship to ShippingClasses)
- [x] T005 Update `src/collections/Carts/index.ts` & `src/collections/Orders/index.ts`
  - Add `taxTotal`
  - Add `shippingTotal`
  - Add `shippingMethod`
- [x] T006 Write Seed Data
  - Seed Tax classes (Standard, Zero-Rated, Exempt)
  - Seed Shipping Zones (Nigeria -> Flat Rate / Local Pickup)

## Phase 2 – API Hooks / Calculations

- [x] T007 Update Cart calculation hook (`src/collections/Carts/index.ts`)
  - Calculate tax (7.5% VAT) correctly per-item
  - Apply tax to shipping if items are taxable
- [x] T008 Update Checkout API / Paystack Logic
  - Ensure total passed to Paystack includes tax + shipping
  - Map shipping/tax totals to order during payment confirmation
- [x] T008.1 Verification
  - Integration tests for Tax Act 2025 compliance passing (104 tests)

## Phase 3 – Frontend Integration

- [x] T009 Update `src/components/checkout/CheckoutPage.tsx`
  - Fetch matching Shipping Zones based on address
  - Render Shipping Method selector
  - Render Cart Totals breakdown
- [x] T010 Update Cart components to show totals breakdown
- [x] T011 Update Product components to show tax indication (Handled via Price/Meta display logic)
      (e.g., "VAT Applies") if applicable

## Phase 4 – Testing

- [x] T012 Write `tests/int/tax-shipping.int.spec.ts`
  - Verify tax computation hook
- [x] T013 Verify int tests pass
- [ ] T014 Write `tests/e2e/checkout-shipping-tax.e2e.spec.ts`
  - E2E flow for checkout selection
- [ ] T014 Write `tests/e2e/checkout-shipping-tax.e2e.spec.ts`
  - E2E flow for checkout selection

## Phase 5 – Polish

- [ ] T015 Run linters and typechecks
- [ ] T016 Run Integration/E2E test suite
- [ ] T017 Commit and push

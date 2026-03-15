# 005: Shipping & Tax Options Implementation Plan

This plan outlines the architecture and steps required to implement WooCommerce-style Shipping and robust Tax configurations compliant with the Nigeria Tax Act of 2025.

## 1. Data Model Changes

### 1.1 `TaxClasses` Collection

Create a new collection to define tax classes, rates, and calculations.

- `title` (Text, required): Name of the class (e.g., "Standard", "Zero-Rated").
- `rate` (Number): Percentage (e.g., 7.5).
- Seed data will configure Standard (7.5%), Zero-Rated (0%), and Exempt (0%).

### 1.2 `ShippingClasses` Collection

Create a new collection so products can be categorized heavily, fragile etc.

- `title` (Text, required): Name of the class.

### 1.3 `ShippingZones` Collection

Create a new collection for shipping areas and their rules.

- `name` (Text): e.g., "Lagos", "Rest of Nigeria".
- `countries`, `states` (Select/Array): regions covered by the zone.
- `methods` (Block/Array):
  - `Flat Rate`: `cost`, `taxStatus` (Taxable/None).
  - `Free Shipping`: `requires` (Minimum Order Amount), `minAmount`.
  - `Local Pickup`: `cost`, `taxStatus`.

### 1.4 Product Schema Updates

Update `src/collections/Products/index.ts`:

- **Taxation Tab**:
  - `taxStatus` (Select: Taxable, Shipping Only, None)
  - `taxClass` (Relationship to `TaxClasses`)
- **Shipping Tab**:
  - `weight`, `dimensions` (length, width, height)
  - `shippingClass` (Relationship to `ShippingClasses`)

## 2. API & Logic Updates

### 2.1 Cart Calculation Hooks

Update the cart beforeChange hooks to accurately calculate totals including tax and shipping.

- Calculate subtotal (sum of item prices + addons).
- Evaluate applicable shipping zones and methods based on the customer's provided `address` in the cart. Let the user select the desired shipping method.
- Apply tax depending on `taxStatus` and `taxClass`. Use Nigeria Tax Act formulas:
  - Exclusive prices: `Tax = Line Price * 0.075`
  - Inclusive prices: `Tax = Line Price - (Line Price / 1.075)`
- Add `taxTotal` and `shippingTotal` to the Cart/Order schemas.
- Ensure the Paystack integration passes the correct grand total.

## 3. Frontend Implementation

### 3.1 Cart & Checkout UI

- Add shipping options selection in the checkout flow.
- Display breakdown: Subtotal, Shipping, Tax, Total.
- If no shipping zone matches, display "No shipping options available for your location".

### 3.2 Product Page

- Show tax status (e.g. "includes 7.5% VAT").

## 4. Testing

### 4.1 Integration Tests

- Validating the cart successfully computes 7.5% tax.
- Validating zero-rated products do not accrue tax.
- Validating flat rate shipping is applied correctly based on state matching.

### 4.2 E2E Tests

- Cart/ Checkout successfully renders shipping selections and final payload logic accurately sums up values to Paystack.

# 005: Shipping & Tax Options

## Overview

Implement WooCommerce-style core shipping options and robust Tax configurations compliant with the Nigeria Tax Act of 2025. This allows the storefront to properly calculate taxes and handle various shipping logic (Flat Rate, Free Shipping, Local Pickup).

## Requirements

### Tax Configuration (Nigeria Tax Act 2025)

- Standard VAT rate in Nigeria is 7.5%.
- Tax calculation logic:
  - If prices exclude tax: `Tax = Line Price * 0.075`
  - If prices include tax: `Tax = Line Price - (Line Price / 1.075)`
- Add a new robust `Taxes` (or `TaxClasses`) collection or expand store settings to define Tax classes. We need:
  - `Standard` (7.5%)
  - `Zero-Rated` (0% - exports, certain medicines, agricultural inputs)
  - `Exempt` (0% - medical services, education, basic food)
- The product schema must include `taxStatus` (Taxable, None) and `taxClass` (Standard, Zero-Rated, Exempt).

### Shipping Configuration

- Implement a `ShippingZones` collection representing regions and their methods.
  - A Zone can contain multiple Methods.
- Implement methods:
  - **Flat Rate**: Fixed cost per order (with optional shipping class modifiers).
  - **Free Shipping**: Enabled under certain conditions (e.g. minimum spend amount).
  - **Local Pickup**: Free or small fee.
- Add `shippingClass` to the `Products` collection to allow specific rates for certain types of items (e.g., Heavy items).

## Expected Behavior

- Cart calculations automatically apply taxes based on product configuration and store settings.
- During checkout, shipping methods are presented based on the customer's shipping address matching the configured zones.
- Cart totals are accurately summed `Subtotal + Shipping + Tax = Total`, supporting Paystack payments.

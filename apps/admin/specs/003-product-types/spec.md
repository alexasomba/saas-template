# Feature Specification: WooCommerce Product Types

**Feature Branch**: `003-product-types`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: Incorporate WooCommerce product types: Simple (physical), Variable (options like size/color), Grouped (collections), External/Affiliate (sold elsewhere), Virtual (non-shipping services), and Downloadable (digital goods).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Shopper Buys a Simple Physical Product (P1)

A shopper lands on a product page, sees price, stock status, and shipping info, adds the item to the cart, and completes checkout with normal shipping and payment.

**Why this priority**: Simple products are the baseline; every other type derives from or builds upon them.

**Independent Test**: Create a seeded simple product and confirm the shopper can add it to the cart and navigate through checkout to payment without error.

**Acceptance Scenarios**:

1. **Given** a published simple product with stock > 0, **When** a shopper views the product page, **Then** they see price, description, gallery images, and an "Add to Cart" button.
2. **Given** the shopper adds a simple product to the cart, **When** they proceed through checkout, **Then** the shipping step is presented and the order completes.
3. **Given** a simple product with zero inventory, **When** a shopper views the page, **Then** the "Add to Cart" button is disabled and a "Out of stock" message appears.

---

### User Story 2 — Shopper Selects a Variant (P1)

A shopper chooses color and size for a variable product, sees a per-variant price update, and adds the chosen combination to the cart.

**Why this priority**: The existing variable product infrastructure is already in place; the task is to ensure it continues working under the unified product type system.

**Acceptance Scenarios**:

1. **Given** a variable product with size and color options, **When** the shopper selects a combination, **Then** the price, SKU, and stock status update to reflect that specific variant.
2. **Given** a variant is out of stock, **When** the shopper selects it, **Then** it is shown as unavailable and cannot be added to the cart.

---

### User Story 3 — Shopper Explores a Grouped Product (P2)

A shopper opens a "Collection" product page that showcases multiple related child products, and can add any individual child item to the cart from that single page.

**Why this priority**: Grouped products increase average order value by surfacing related items together without friction.

**Acceptance Scenarios**:

1. **Given** a grouped product referencing three child products, **When** the shopper views it, **Then** each child product is displayed with its own image, price, and "Add to Cart" option.
2. **Given** the shopper clicks "Add to Cart" for a child product within the group, **When** the action completes, **Then** only that child product appears in the cart, not the parent group.

---

### User Story 4 — Shopper Clicks Through an Affiliate Product (P2)

A shopper views a product listing that is fulfilled on an external site. Clicking the product's action button redirects them to the third-party URL in a new tab; no cart interaction occurs.

**Acceptance Scenarios**:

1. **Given** an external product with a configured URL, **When** the shopper opens the product page, **Then** there is no "Add to Cart" button and instead a customisable action button (e.g. "Buy Now") is shown.
2. **Given** the shopper clicks the action button, **When** the navigation resolves, **Then** the external URL opens in a new browser tab and the store's cart remains unchanged.

---

### User Story 5 — Shopper Purchases a Virtual Service (P2)

A shopper buys a service (e.g. a consultation or a membership) that is virtual — no physical delivery required. The checkout omits the shipping address and method steps.

**Acceptance Scenarios**:

1. **Given** a cart containing only virtual products, **When** the shopper proceeds to checkout, **Then** the shipping address and shipping method steps are skipped entirely.
2. **Given** a mixed cart with virtual and physical products, **When** the shopper proceeds, **Then** the shipping step is presented as normal.

---

### User Story 6 — Shopper Downloads a Digital Product (P3)

A shopper purchases a downloadable product (e.g. an eBook or a template pack). After payment confirmation, they receive an email with time-limited download links.

**Acceptance Scenarios**:

1. **Given** a downloadable product was purchased, **When** the order is confirmed as paid, **Then** the customer receives an email containing download links for each file associated with the product.
2. **Given** a download link has been accessed the maximum permitted number of times or has expired, **When** the customer attempts to use it, **Then** the link returns an appropriate error message and the customer is directed to contact support.
3. **Given** an unauthenticated visitor guesses a media file URL for a downloadable product, **When** they attempt direct access, **Then** the server denies the request.

---

### Edge Cases

- A grouped product's child product is deleted — the grouped product page must still render and skip the missing child gracefully.
- A downloadable product has both a download limit of 1 and an expiry of 0 days — the download must be available immediately after purchase but consumed on first access.
- A shopper with an all-virtual cart applies a coupon code — shipping-related discounts should not apply and must not error.
- An external product URL is left blank by a content editor — the admin must reject the save rather than publish a broken product.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Products MUST support a `productType` field with values: `simple`, `variable`, `grouped`, `external`.
- **FR-002**: Products MUST support two boolean modifier flags — `isVirtual` and `isDownloadable` — applicable on top of `simple` and `variable` product types.
- **FR-003**: Simple products MUST expose shipping metadata fields (SKU, weight, length, width, height, shipping class) that are hidden when `isVirtual` is enabled.
- **FR-004**: Variable products MUST continue to use the existing variant system (`enableVariants`, `variantTypes`, `variantOptions`) and be functionally equivalent to setting `productType = variable` with `enableVariants = true`.
- **FR-005**: Grouped products MUST allow editors to link child products via a relationship field; the storefront MUST render each child product card inline with individual add-to-cart capability.
- **FR-006**: External/Affiliate products MUST store an external URL and configurable button label; the storefront MUST render a link-out button rather than the standard cart button, and the product MUST be excluded from cart and checkout flows.
- **FR-007**: When `isVirtual` is true, the product MUST be excluded from shipping calculations; checkout MUST skip the shipping step when all cart items are virtual.
- **FR-008**: When `isDownloadable` is true, editors MUST be able to attach one or more files (via media upload), and set per-product download limits and expiry durations. After order payment is confirmed, the system MUST email download links to the customer.
- **FR-009**: Direct unauthenticated access to media files used as downloadable product attachments MUST be blocked at the access control layer.
- **FR-010**: All product type UI and admin fields MUST use conditional show/hide so that only relevant fields are shown for each type.
- **FR-011**: Seed data MUST include at least one example of each of the six product type configurations (simple, variable, grouped, external, virtual, downloadable).

### Key Entities _(include if feature involves data)_

- **Product**: Extended with `productType` (select), `isVirtual` (boolean), `isDownloadable` (boolean), shipping group (SKU, weight, dimensions, shipping class), grouped product references, external URL + button label, and downloadable files group (files array, limit, expiry).
- **DownloadFile**: Sub-entity within the downloadable product group; references a media upload and belongs to a product.
- **Order**: No schema change required; existing `status` transitions trigger download link generation.
- **Media**: Download-purposed media items require access control enforcement to block unauthenticated direct fetches.

---

## Assumptions

- The `@payloadcms/plugin-ecommerce` variable product infrastructure (variants, variantOptions, variantTypes) is retained unchanged; `productType = variable` is a UI label on top of `enableVariants = true`.
- Paystack remains the payment processor. Download link emails are sent via the existing email provider after a Paystack webhook confirms payment.
- Shipping cost calculation is handled externally or is a flat rate; this feature does not introduce dynamic shipping rate APIs.
- The existing `Media` collection will be reused for downloadable file attachments.
- Download links will be time-limited and signed URLs generated by a server-side hook; the exact signing mechanism adapts to the Cloudflare Workers runtime.
- Grouped products do not have their own price or stock; all pricing and inventory belong to their child products.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the six product type configurations (simple, variable, grouped, external, virtual, downloadable) render correctly on the storefront and pass automated integration tests before merge.
- **SC-002**: Checkout omits the shipping step for all-virtual carts in 100% of automated test runs.
- **SC-003**: Within 5 minutes of a paid order containing a downloadable product, the customer receives an email with working download links — verified during UAT with a test order.
- **SC-004**: Zero unauthenticated direct requests to downloadable media files return HTTP 200 — validated by an access-control integration test.
- **SC-005**: The seeding routine populates one product of each type and the storefront renders all six without manual intervention.

---

## Clarifications

### Session 2026-03-10

- Q: Should `productType = variable` auto-set `enableVariants = true`, or remain a separate toggle? → A: `productType` select drives the UI; selecting `variable` automatically sets `enableVariants = true`. A hook or admin component handles the sync.
- Q: Should download links be stored in the Order document or generated on-demand? → A: Links are generated on-demand at access time using a signed URL approach (token stored in Order), so no plaintext URLs are persisted.

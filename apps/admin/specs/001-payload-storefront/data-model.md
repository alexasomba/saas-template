# Data Model: Cloudflare Payload Storefront

## Entities

### Product

- **Fields**: id, title (required), slug (unique), description (rich text), enableVariants (boolean), priceInUSD (integer cents), gallery (array of image + optional variant option), meta (SEO fields), categories (relationship IDs), relatedProducts (relationship IDs).
- **Relationships**:
  - `categories[]` → Category (many-to-many)
  - `variants[]` → Variant (one-to-many)
  - `relatedProducts[]` → Product (self-relation; exclude self)
- **Validation Rules**: title required; slug unique; gallery requires at least one image; relatedProducts must exclude the current product id.
- **State**: `_status` (draft/published) managed by Payload versions.

### Variant

- **Fields**: id, product (required), variantOptions[] (required), price (optional override), inventory (integer, defaults to product level), sku, status (active/inactive).
- **Relationships**:
  - `product` → Product (many variants per product)
  - `variantOptions[]` → VariantOption (many-to-many)
- **Validation Rules**: at least one variant option; inventory must be ≥ 0; inactive variants excluded from carts.
- **State Transitions**: active ↔ inactive; inventory decremented on order completion, incremented on refund/seed.

### VariantOption

- **Fields**: id, label, value, variantType (required).
- **Relationships**: `variantType` → VariantType.
- **Validation Rules**: value unique per variant type; label required.

### VariantType

- **Fields**: id, name (internal), label (display).
- **Relationships**: `options[]` ← VariantOption (one-to-many).
- **Validation Rules**: name unique; label required.

### Category

- **Fields**: id, title, slug.
- **Relationships**: `products[]` ← Product.
- **Validation Rules**: slug unique across categories; title required.

### Page

- **Fields**: id, title, slug (unique), layout[] (block selection), meta (SEO), hero, publishDate, preview configuration.
- **Relationships**: layout blocks may reference Media or Forms; navigation references stored in Globals.
- **Validation Rules**: slug unique; layout must include at least one block; blocks must use registered block types.
- **State**: draft/published; supports scheduled publication.

### Post

- **Fields**: id, title, slug, heroImage, categories[], author (User), relatedPosts[], content blocks, publishDate.
- **Relationships**:
  - `categories[]` → Category
  - `author` → User
  - `relatedPosts[]` → Post
- **Validation Rules**: slug unique; author required for published posts; related posts should not include self.
- **State**: draft/published; schedule supported.

### Cart

- **Fields**: id, customer (optional), currency, items[], subtotal, createdAt, updatedAt, purchasedAt (nullable).
- **Relationships**:
  - `customer` → User (optional guest checkouts store email later in order)
  - `items[].product` → Product
  - `items[].variant` → Variant
- **Validation Rules**: items require product; variant must belong to product; inventory checked ≥ quantity.
- **State Transitions**: open → completed (on purchasedAt set) → archived (after order creation or TTL); open carts older than threshold treated as abandoned.

### Order

- **Fields**: id, amount, currency, customer (optional for guest), items[], shippingAddress, status (`processing`, `completed`, `cancelled`), transactions[].
- **Relationships**:
  - `customer` → User (nullable for guest orders)
  - `items[].product` → Product
  - `transactions[]` → Transaction
- **Validation Rules**: amount must equal sum of item totals; status transitions limited to allowed set (processing → completed/cancelled).
- **State Transitions**: `processing` (created) → `completed` (payment confirmed) or `cancelled` (refund/void).

### Transaction

- **Fields**: id, status (`pending`, `succeeded`, `failed`), paymentMethod (Stripe), customer (User or guest reference), billingAddress, stripe metadata (customerID, paymentIntentID), amount, currency.
- **Relationships**:
  - `customer` → User (optional for guest orders)
- **Validation Rules**: amount must be positive; paymentIntentID required for Stripe transactions.
- **State Transitions**: pending → succeeded/failed; succeeded linked to orders.

### Globals: Header & Footer

- **Fields**: navItems[] (link blocks), social links, metadata.
- **Relationships**: nav link references may target Page/Post/Product documents.
- **Validation Rules**: navItems require label + URL or reference; references must resolve.

### User (Customer/Admin)

- **Fields**: id, email (unique), password (hashed), name, roles[], addresses[], saved payment data (optional future), guest flag (false default).
- **Relationships**:
  - `addresses[]` → Address
  - `orders[]` ← Order
- **Validation Rules**: email unique; guest orders may be created without linking to an existing user; role enforcement for admin features.

### Address

- **Fields**: id, customer, firstName, lastName, phone, address lines, city, state, postalCode, country.
- **Relationships**: `customer` → User; used by Orders/Transactions.
- **Validation Rules**: required fields depend on country; postalCode must match locale format.

## Derived/Supporting Concepts

- **Preview Sessions**: Guarded by `PREVIEW_SECRET` and authenticated user; no persistent storage beyond session tokens.
- **Seeding Tasks**: Idempotent seed endpoint truncates collections/globals and rebuilds demo data; must run within Worker execution limit.
- **Search Index Entries**: Managed by search plugin; reuse existing collection overrides for posts/products.

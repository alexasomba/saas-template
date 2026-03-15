# Data Model: Product Add-ons & Subscriptions (004)

---

## 1. `ProductAddons` Collection (NEW)

Global add-on groups, configurable per product category.

```typescript
{
  name: string                    // internal label, not shown to customers
  categories: Category[]          // optional category scope; empty = all products
  displayOrder: number            // lower = displayed higher
  excludeFromProductIds: Product[] // explicit product exclusions

  fields: AddonFieldBlock[]       // array of typed blocks (see Add-on Block Types below)
}
```

---

## 2. Products Collection — New Fields (MODIFY)

### Sidebar additions

```typescript
isSubscription: boolean; // condition: productType ∈ {simple, variable}
```

### Add-ons Tab (new tab, before SEO)

```typescript
excludeGlobalAddons: boolean      // if true, global add-on groups don't apply
addons: AddonFieldBlock[]         // per-product add-on fields (same blocks as global)
```

### Subscription Tab (new tab, condition: isSubscription === true)

```typescript
subscription: {
  subscriptionPrice: number; // recurring price in cents (USD)
  subscriptionPriceNGN: number; // recurring price in kobo (NGN)
  period: "day" | "week" | "month" | "year";
  interval: number; // e.g. 2 = every 2 periods (default: 1)
  trialDays: number; // 0 = no trial
  signUpFee: number; // one-time upfront fee (USD cents)
  signUpFeeNGN: number;
  expiryLength: number; // 0 = never expires; n = n periods
}
```

---

## 3. Add-on Field Block Types

All blocks share these base fields:

```typescript
{
  type: AddonFieldType            // discriminator
  label: string
  description?: string
  required: boolean
  priceType: 'flat' | 'quantity_based' | 'percentage'
  price: number                   // 0 = free; negative = discount
}
```

### Block: `multipleChoice`

```typescript
displayAs: 'dropdown' | 'radio' | 'images'
defaultOption?: string
options: {
  label: string
  price?: number
  priceType?: 'flat' | 'quantity_based' | 'percentage'
  image?: Media                   // only when displayAs === 'images'
  hidden: boolean
}[]
```

### Block: `checkboxes`

```typescript
options: {
  label: string
  price?: number
  priceType?: 'flat' | 'quantity_based' | 'percentage'
  defaultChecked: boolean
  hidden: boolean
}[]
```

### Block: `shortText`

```typescript
restriction: 'any' | 'letters' | 'numbers' | 'alphanumeric' | 'email'
placeholder?: string
maxLength?: number
priceType: 'flat' | 'quantity_based' | 'percentage'
price?: number
```

### Block: `longText`

```typescript
placeholder?: string
maxLength?: number
priceType: 'flat' | 'quantity_based' | 'percentage'
price?: number
```

### Block: `fileUpload`

```typescript
// inherits base fields only
// uploaded file stored in R2 under /addon-uploads/{orderId}/{fieldId}
```

### Block: `customerPrice`

```typescript
prefilledPrice?: number
minPrice?: number
maxPrice?: number
```

### Block: `quantity`

```typescript
prefilledQuantity?: number
minQuantity?: number
maxQuantity?: number
priceType: 'flat' | 'quantity_based' | 'percentage'
price?: number
```

### Block: `datePicker`

```typescript
priceType: 'flat' | 'quantity_based' | 'percentage'
price?: number
```

---

## 4. `Subscriptions` Collection (NEW)

Tracks one subscription agreement per customer × product (or variant).

```typescript
{
  customer: User                 // relationship
  product: Product               // relationship
  variant?: Variant              // relationship, if from a variable product
  order: Order                   // originating order
  status: 'active' | 'on-hold' | 'cancelled' | 'expired'

  // Billing schedule
  period: 'day' | 'week' | 'month' | 'year'
  interval: number
  nextPaymentDate: Date
  endDate?: Date                 // null = never
  trialEndDate?: Date

  // Pricing (snapshot at time of subscription)
  subscriptionPrice: number
  subscriptionPriceNGN: number
  currency: 'USD' | 'NGN'

  // Paystack
  paystackAuthCode: string       // authorization_code from first payment
  paystackCustomerCode: string   // customer_code from first payment
  paystackEmail: string          // email used at time of first payment

  // Failure tracking
  failedPaymentCount: number     // reset to 0 on successful renewal
  lastFailedAt?: Date

  // Renewal history
  renewalOrders: Order[]         // orders created by automatic renewals
}
```

---

## 5. Cart & Order Items — Extended Fields (MODIFY)

`addonSelections` field added to `items` array on both `Carts` and `Orders`:

```typescript
addonSelections?: {
  fieldId: string               // ID of the addon block
  label: string                 // human-readable field label
  value: string                 // selected value / entered text
  priceAdjustment: number       // resolved price delta in cents
  priceAdjustmentNGN: number
}[]
```

---

## 6. Cron Processing Flow

```
Cloudflare Cron Trigger: 0 6 * * *   (daily at 06:00 UTC)
  ↓
Query Subscriptions where:
  status = 'active'
  nextPaymentDate ≤ now
  ↓
For each due subscription:
  POST /transaction/charge_authorization  (Paystack)
    authorization_code: sub.paystackAuthCode
    email: sub.paystackEmail
    amount: subscriptionPrice (in kobo/cents)
  ↓
  SUCCESS → create renewal Order, advance nextPaymentDate, send receipt email
  FAILURE → increment failedPaymentCount
            if count ≥ 2 → set status = 'on-hold', send failed payment email
            else → schedule retry in 3 days
```

---

## 7. Compatibility Matrix

| Feature               | Simple | Variable | Grouped | External |
| --------------------- | ------ | -------- | ------- | -------- |
| Add-ons (per-product) | ✅     | ✅       | ❌      | ❌       |
| Global Add-ons        | ✅     | ✅       | ❌      | ❌       |
| isSubscription        | ✅     | ✅       | ❌      | ❌       |

# Data Model: WooCommerce Product Types

**Branch**: `003-product-types` | **Spec**: [spec.md](./spec.md)

---

## Products Collection — New & Modified Fields

All fields below are additions to the existing `ProductsCollection` override in `src/collections/Products/index.ts`.

### Sidebar Fields (always visible)

```ts
// Discriminator — primary product type
{
  name: 'productType',
  type: 'select',
  defaultValue: 'simple',
  required: true,
  options: [
    { label: 'Simple',             value: 'simple' },
    { label: 'Variable',           value: 'variable' },
    { label: 'Grouped',            value: 'grouped' },
    { label: 'External/Affiliate', value: 'external' },
  ],
  admin: { position: 'sidebar' },
},

// Modifiers — stack on Simple or Variable
{
  name: 'isVirtual',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: 'No shipping required. Checkout skips shipping step when all cart items are virtual.',
    condition: (data) => ['simple', 'variable'].includes(data?.productType),
  },
},
{
  name: 'isDownloadable',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: 'Customer receives download links after purchase.',
    condition: (data) => ['simple', 'variable'].includes(data?.productType),
  },
},
```

---

### Tab: "Shipping" (Simple & Variable physical products)

Condition: `productType !== 'grouped' && productType !== 'external' && !isVirtual`

```ts
{
  label: 'Shipping',
  fields: [
    { name: 'sku', label: 'SKU', type: 'text' },
    {
      name: 'weight',
      label: 'Weight (kg)',
      type: 'number',
      min: 0,
      admin: { step: 0.001 },
    },
    {
      name: 'dimensions',
      type: 'group',
      fields: [
        { name: 'length', type: 'number', min: 0 },
        { name: 'width',  type: 'number', min: 0 },
        { name: 'height', type: 'number', min: 0 },
      ],
      admin: { description: 'Dimensions in cm.' },
    },
    {
      name: 'shippingClass',
      type: 'select',
      options: [
        { label: 'Standard',     value: 'standard' },
        { label: 'Express',      value: 'express' },
        { label: 'Freight',      value: 'freight' },
        { label: 'Local Pickup', value: 'local-pickup' },
      ],
    },
  ],
},
```

---

### Tab: "Grouped Products"

Condition: `productType === 'grouped'`

```ts
{
  label: 'Grouped Products',
  fields: [
    {
      name: 'groupedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Select the individual products to display on this grouped product page.',
        condition: (data) => data?.productType === 'grouped',
      },
      filterOptions: ({ id }) => ({
        and: [
          { id: { not_equals: id } },
          { productType: { not_equals: 'grouped' } },
        ],
      }),
    },
  ],
},
```

---

### Tab: "External Product"

Condition: `productType === 'external'`

```ts
{
  label: 'External Product',
  fields: [
    {
      name: 'externalUrl',
      label: 'External URL',
      type: 'text',
      required: true,
      admin: {
        condition: (data) => data?.productType === 'external',
        description: 'Full URL to the product on the external site.',
      },
    },
    {
      name: 'externalButtonText',
      label: 'Button Text',
      type: 'text',
      defaultValue: 'Buy Now',
      admin: {
        condition: (data) => data?.productType === 'external',
      },
    },
  ],
},
```

---

### Tab: "Downloads"

Condition: `isDownloadable === true`

```ts
{
  label: 'Downloads',
  fields: [
    {
      name: 'downloadableFiles',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', required: true, label: 'File Name' },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
      admin: {
        condition: (data) => data?.isDownloadable === true,
      },
    },
    {
      name: 'downloadLimit',
      type: 'number',
      defaultValue: -1,
      admin: {
        description: 'Max downloads per order. -1 = unlimited.',
        condition: (data) => data?.isDownloadable === true,
      },
    },
    {
      name: 'downloadExpiry',
      type: 'number',
      defaultValue: -1,
      admin: {
        description: 'Days before download link expires. -1 = never.',
        condition: (data) => data?.isDownloadable === true,
      },
    },
  ],
},
```

---

## Download Token Schema

Tokens are HMAC-SHA256 signed JWT-like payloads stored in the Order document's `downloadTokens` array (no schema migration needed on Order if encoded inline). The token payload encodes:

```json
{
  "orderId": "string",
  "productId": "string",
  "fileId": "string",
  "usageCount": 0,
  "expiresAt": "ISO 8601 timestamp | null"
}
```

The `/api/downloads/[token]` endpoint verifies the HMAC, checks expiry and usage, and streams the R2 file.

---

## Compatibility Matrix

| productType | isVirtual  | isDownloadable |  Ships?   | Has Variants | External URL | Downloads Tab |
| ----------- | :--------: | :------------: | :-------: | :----------: | :----------: | :-----------: |
| simple      |   false    |     false      |    ✅     |      ❌      |      ❌      |      ❌       |
| simple      |    true    |     false      |    ❌     |      ❌      |      ❌      |      ❌       |
| simple      | false/true |      true      |    opt    |      ❌      |      ❌      |      ✅       |
| variable    |    any     |      any       |    opt    |      ✅      |      ❌      |      opt      |
| grouped     |     —      |       —        | per child |      ❌      |      ❌      |      ❌       |
| external    |     —      |       —        |    ❌     |      ❌      |      ✅      |      ❌       |

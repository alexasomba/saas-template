# Payload Cloudflare Ecommerce Starter

This repository combines Payload's full-featured ecommerce template with a Cloudflare Workers deployment target. You get the Payload admin app, a production-ready Next.js storefront, Paystack checkout, and Cloudflare-first infrastructure (Workers, D1, and R2) in a single codebase.

> **Cloudflare plan:** the bundle currently requires the Workers Paid plan because of size limits.

## What's Inside

- Payload CMS 3.x running on Cloudflare Workers via `@opennextjs/cloudflare`
- D1 (SQLite) database adapter + Payload migrations
- R2-backed media storage
- Complete ecommerce feature set (products, variants, carts, orders, transactions)
- Paystack-powered checkout (server + client adapters pre-configured)
- Layout builder pages, SEO plugin, on-demand revalidation, live preview
- Tailwind CSS v4, shadcn/ui primitives, and theme providers
- Playwright end-to-end tests and Vitest integration tests

## Prerequisites

- Node.js ≥ 20.9 or 18.20.2 (respecting `package.json` engines)
- pnpm ≥ 9
- Cloudflare account with D1 database and R2 bucket provisioned
- Paystack keys for checkout

## Local Development

1. Install dependencies and copy the env template:

```bash
pnpm install
cp .env.example .env
```

2. Populate `.env` with at least:

- `PAYLOAD_SECRET`
- `PAYLOAD_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SERVER_URL`
- `PREVIEW_SECRET`
- Paystack keys (`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`)

3. Authenticate Wrangler (one time):

```bash
pnpm wrangler login
```

4. Start the dev server with Cloudflare bindings emulated:

```bash
pnpm dev
```

5. Visit `http://localhost:8787` and follow the on-screen prompts to create the first admin user.

### Seeding Demo Data

- From the admin dashboard, use the “Seed Database” button (Before Dashboard card), _or_
- Call `POST /next/seed` while authenticated as an admin.

Seeding clears existing documents and creates demo products, pages, addresses, and a test customer (`customer@example.com` / `password`).

## Cloudflare Deployment

1. Ensure migrations exist whenever the schema changes:

```bash
pnpm payload migrate:create
```

2. Deploy via Wrangler (runs migrations, build, and upload):

```bash
pnpm run deploy
```

3. Provision production secrets in Cloudflare (`wrangler secret put ...`) for every variable listed in `.env.example` and map the D1 / R2 bindings in `wrangler.jsonc`.

### Environment Bindings

- **D1** – `cloudflare.env.D1` used by the Payload adapter
- **R2** – `cloudflare.env.R2` used by the media storage plugin
- **Paystack / URL config** – available through `process.env` (set them as Cloudflare secrets or vars)

## Scripts

| Command                       | Description                         |
| ----------------------------- | ----------------------------------- |
| `pnpm dev`                    | Start Next.js + Wrangler dev server |
| `pnpm build`                  | Build the Next.js app               |
| `pnpm start`                  | Serve the production build locally  |
| `pnpm test:int`               | Run Vitest integration suite        |
| `pnpm test:e2e`               | Run Playwright e2e suite            |
| `pnpm test`                   | Run both test suites                |
| `pnpm payload migrate:create` | Generate migration files            |
| `pnpm payload migrate`        | Apply pending migrations            |
| `pnpm run deploy`             | Build and deploy to Cloudflare      |

## Paystack Checkout Setup

The ecommerce plugin is configured with a custom Paystack adapter:

1. Obtain your API keys from the [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).
2. Store the keys as Cloudflare secrets (`PAYSTACK_SECRET_KEY`) and expose the public key (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`).
3. Paystack webhooks can be configured by adding an endpoint to the adapter if needed.

## Testing

```bash
pnpm test:int   # Vitest (API surface)
pnpm test:e2e   # Playwright (storefront flows)
```

Both suites are configured for CI and can be executed together via `pnpm test`.

## Troubleshooting

- **Bundle size limits** – Workers paid plans support the larger Next.js build produced by Payload.
- **GraphQL limits** – Workerd still has known GraphQL streaming issues (see [cloudflare/workerd#5175](https://github.com/cloudflare/workerd/issues/5175)).
- **Missing env vars** – The storefront heavily relies on `NEXT_PUBLIC_SERVER_URL`; ensure it matches the public origin.

## Support

Questions? Join the [Payload Discord](https://discord.com/invite/payload) or open a discussion on [GitHub](https://github.com/payloadcms/payload/discussions).

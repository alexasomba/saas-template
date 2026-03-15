# Quickstart: Cloudflare Payload Storefront

## Prerequisites

- Node.js ≥ 20.9 (or 18.20.2 for Cloudflare parity)
- pnpm ≥ 9
- Cloudflare account with D1 database and R2 bucket bound to the project
- Stripe test keys (secret + publishable + webhook signing secret)

## Environment Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment template and populate required secrets:
   ```bash
   cp .env.example .env.local
   ```
   Required keys:
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`
   - `PREVIEW_SECRET`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOKS_SIGNING_SECRET`
3. Authenticate with Cloudflare Wrangler (one time per machine):
   ```bash
   pnpm wrangler login
   ```

## Local Development

- Start the integrated Next.js + Payload dev server:
  ```bash
  pnpm dev
  ```
- If the `.next` cache causes worker binding issues, use the safe variant:
  ```bash
  pnpm devsafe
  ```
- Seed demo content via Payload admin (Before Dashboard "Seed Database" button) or:
  ```bash
  curl -X POST http://localhost:8787/next/seed -H "Authorization: Bearer <admin token>"
  ```

## Schema Changes

1. Adjust collection/global definitions under `src/collections` or `src/globals`.
2. Generate a migration:
   ```bash
   pnpm payload migrate:create
   ```
3. Run migrations locally:
   ```bash
   pnpm payload migrate
   ```
4. Regenerate types and Cloudflare bindings:
   ```bash
   pnpm generate:types
   ```
5. Commit schema files, migrations, and regenerated outputs together.

## Testing

- Run Vitest integration suite:
  ```bash
  pnpm test:int
  ```
- Run Playwright end-to-end suite (spawns dev server automatically):
  ```bash
  pnpm test:e2e
  ```
- For full coverage locally:
  ```bash
  pnpm test
  ```

## Deployment

1. Ensure Cloudflare secrets and bindings match `.env.example` values.
2. Deploy database migrations and worker bundle:
   ```bash
   pnpm run deploy
   ```
3. Target non-production environments by setting `CLOUDFLARE_ENV` before running deploy/preview commands.
4. Verify storefront health, checkout flow, and admin access post-deploy.

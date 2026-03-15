# Research Log: Cloudflare Payload Storefront

## Decision 1: Guest Checkout with Optional Accounts

- **Decision**: Allow shoppers to complete checkout as guests and present optional account creation on the confirmation view.
- **Rationale**: Reduces friction for first-time buyers while still enabling loyalty flows; aligns with ecommerce best practices that prioritize conversion.
- **Alternatives Considered**:
  - Require account sign-in before payment — rejected due to added friction and higher abandonment risk.
  - Skip account creation entirely — rejected because we still need a path for repeat customers to manage orders.

## Decision 2: Cloudflare Worker Compatibility Guardrails

- **Decision**: Keep server logic within Cloudflare Worker limits by relying on `@opennextjs/cloudflare`, avoiding Node-exclusive APIs, and documenting CPU/memory hotspots for follow-up profiling.
- **Rationale**: Ensures parity between preview and production Workers and prevents runtime failures from unsupported APIs.
- **Alternatives Considered**:
  - Introduce separate Node-based adapters for heavy logic — rejected because it complicates deployment and violates Cloudflare-first principle.

## Decision 3: Schema, Migrations, and Type Sync Process

- **Decision**: Any Payload schema adjustments will include `pnpm payload migrate:create`, commit migrations, run `pnpm generate:types`, and update Cloudflare binding types in the same change set.
- **Rationale**: Keeps D1 schema, Payload admin, and generated TypeScript definitions aligned, preventing runtime drift.
- **Alternatives Considered**:
  - Manual SQL changes without Payload migrations — rejected; risks mismatch and breaks constitution rules.

## Decision 4: Test Coverage Strategy

- **Decision**: Extend Vitest integration tests for cart mutations and guest checkout logic, and add Playwright flows covering add-to-cart → checkout → optional account invite.
- **Rationale**: Commerce flows are revenue critical; automated regression aligns with “Commerce Flows Stay Tested.”
- **Alternatives Considered**:
  - Rely solely on manual QA — rejected due to regression risk and constitution requirements.

## Decision 5: Secrets and Environment Configuration Review

- **Decision**: Continue using existing Stripe and preview secrets; document provisioning steps in quickstart and verify Cloudflare secret bindings before rollout.
- **Rationale**: Maintains secure handling practices and avoids leaking credentials while keeping dev setup reproducible.
- **Alternatives Considered**:
  - Introduce new secret formats or storage providers — rejected as unnecessary for current scope.

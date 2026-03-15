# Implementation Plan: Cloudflare Payload Storefront

**Branch**: `001-payload-storefront` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-payload-storefront/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a Cloudflare Workers–hosted Payload CMS storefront that supports guest-friendly checkout, CMS-authored landing pages, and editorial browsing while reusing the upstream ecommerce templates. Implementation will align Next.js 15 + Payload 3.62 integrations, Stripe payments, and block-based page composition so that commerce, marketing, and content flows ship together with Cloudflare-ready configurations. Checkout confirmation lives at `src/app/(app)/checkout/confirm-order/page.tsx`, and will host the optional account conversion form backed by `/api/checkout/account`. Final polish includes re-running the `/next/seed` routine (capturing command output for evidence) and reviewing Stripe dashboard metrics plus Cloudflare logs to prove FR-009 still repopulates catalog, content, and navigation while checkout telemetry stays healthy.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript targeting Node.js ≥ 20.9 (Cloudflare-compatible)  
**Primary Dependencies**: Next.js 15.4, Payload CMS 3.62 (+ ecommerce, SEO, search plugins), Stripe SDKs, @opennextjs/cloudflare  
**Storage**: Cloudflare D1 (SQLite) for data, Cloudflare R2 for media assets  
**Testing**: Vitest integration suite (`pnpm test:int`) and Playwright e2e suite (`pnpm test:e2e`)  
**Target Platform**: Cloudflare Workers (server) and modern web browsers (client)  
**Project Type**: Web application (Next.js storefront + Payload admin)  
**Performance Goals**: 90% of shoppers complete checkout in <3 minutes; 85% of users find content within 3 clicks/search; initial page render <= 2s on median broadband  
**Constraints**: Worker CPU time < 50ms per request burst, bundle size within Workers paid limits, memory budget < 128MB per request, Stripe secrets must be available  
**Scale/Scope**: Seeded catalog + blog ready for demos; sized for 10k monthly sessions with Stripe-backed transactions

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Cloudflare-First Delivery**: Reuse `@opennextjs/cloudflare` bundling, screen any new dependencies for Worker compatibility, and profile checkout endpoints to keep CPU < 50 ms. Heavy transforms (search indexing, seed) remain async/background or client-side to avoid Worker limits.
- **Schema & Types Stay in Lockstep**: Any collection/global tweaks (e.g., navigation metadata) will include Payload migrations plus regenerated `src/payload-types.ts` via `pnpm generate:types`; migrations will annotate data backfill expectations inside tasks.
- **Commerce Flows Stay Tested**: Extend Vitest specs for cart mutation + guest checkout permutations and Playwright flows for add-to-cart → guest checkout → optional account invitation. Commit run artifacts or CI links with the implementation PR.
- **Composable CMS Blocks**: Extend only the block registry in `src/blocks/RenderBlocks.tsx`, supply configs under `src/blocks/<Block>/`, and wire additional context through `src/providers/index.tsx` to keep admin live preview aligned.
- **Secrets and Environments Are Controlled**: Stick with the existing Stripe + preview secrets, enumerate them in quickstart, and confirm Cloudflare secret bindings (Workers + preview) before rollout. Document local `.env.local` expectations and fallback UX when secrets are missing.

_Post-design review_: All constitution gates remain satisfied; no exceptions requested.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
│   ├── (app)/        # Storefront routes, checkout, preview handlers
│   └── (payload)/    # Payload admin shell
├── blocks/           # CMS block configs + React components
├── collections/      # Payload collection configs (products, pages, posts, etc.)
├── components/       # Storefront UI pieces (cart, product, layout)
├── endpoints/        # Seed + other server endpoints
├── globals/          # Header/footer configs
├── plugins/          # Payload plugin overrides (ecommerce, SEO, search)
├── providers/        # React providers including ecommerce + theme
└── utilities/        # Shared helpers (URL management, role checks)

tests/
├── e2e/              # Playwright storefront flows
└── int/              # Vitest integration specs exercising Payload APIs
```

**Structure Decision**: Single Next.js/Payload monorepo where storefront, admin, and Payload config coexist under `src/`; testing split between Playwright (`tests/e2e`) and Vitest (`tests/int`). Future work will modify only the directories listed above.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | _N/A_      | _N/A_                                |

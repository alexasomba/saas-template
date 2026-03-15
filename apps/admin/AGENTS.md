# GEMINI.md - Payload Cloudflare Ecommerce Storefront

This document serves as the primary instructional context for Gemini CLI interactions within this repository. It defines the project's architecture, development standards, and operational protocols.

## Foundational Mandates (CRITICAL)

The documentation in `.agent/rules/` contains the absolute source of truth for Payload CMS patterns in this project. You MUST adhere to these rules for every code modification.

### Core Reference Files:

- **`payload-overview.md`**: High-level architecture and core concepts.
- **`security-critical.mdc`**: Critical security patterns (Local API access, Transactions, Hook loops).
- **`collections.md` / `fields.md`**: Collection and field configuration patterns.
- **`access-control.md`**: Permission and RBAC patterns.
- **`hooks.md`**: Lifecycle hook recipes.
- **`plugin-development.md`**: Guidelines for creating and modifying Payload plugins.

## Project Overview

This is a **Payload CMS 3.x + Next.js 15** ecommerce application optimized for **Cloudflare Workers**. It uses Cloudflare D1 for the SQLite database and Cloudflare R2 for media storage. The project integrates a complete ecommerce suite including products, variants, carts, orders, and Paystack checkout.

### Core Tech Stack

- **CMS:** Payload 3.x (Lexical Editor, D1 Adapter, R2 Storage)
- **Frontend:** Next.js 15 (App Router, Tailwind CSS v4, shadcn/ui)
- **Database:** Cloudflare D1 (SQLite)
- **Media Storage:** Cloudflare R2
- **Infrastructure:** Cloudflare Workers (via `@opennextjs/cloudflare`)
- **Payments:** Paystack (primary)
- **Testing:** Playwright (E2E), Vitest (Integration)

## Directory Structure

```text
src/
├── app/
│   ├── (app)/        # Storefront routes, checkout, preview handlers
│   └── (payload)/    # Payload admin panel routes
├── access/           # Reusable access control functions
├── blocks/           # CMS block configurations + React components
├── collections/      # Payload collection schemas (Products, Users, etc.)
├── components/       # Storefront UI components (cart, product, layout)
├── globals/          # Payload global schemas (Header, Footer)
├── hooks/            # Lifecycle hooks for collections/globals
├── plugins/          # Payload plugin configurations and overrides
├── providers/        # React context providers
└── utilities/        # Shared helpers (URL management, role checks)
tests/
├── e2e/              # Playwright storefront flows
└── int/              # Vitest integration tests for Payload APIs
specs/                # Feature specifications and implementation plans
```

## Critical Development Commands

### Environment Setup

- `pnpm install` - Install dependencies.
- `cp .env.example .env` - Set up environment variables.
- `pnpm wrangler login` - Authenticate with Cloudflare.

### Development & Testing

- `pnpm dev` - Start local development with Cloudflare bindings emulated.
- `pnpm test:int` - Run Vitest integration tests (API & CMS logic).
- `pnpm test:e2e` - Run Playwright E2E tests (Storefront flows).
- `pnpm test` - Run both test suites.
- `pnpm exec lefthook run pre-commit` - Manually run pre-commit hooks.

### Git Hooks (Lefthook)

The project uses `lefthook` for git hooks. Pre-commit hooks include:

- **Linting**: Runs `lint-staged` (Prettier + ESLint).
- **Type-checking**: Runs `generate:types` followed by `tsc --noEmit`.
- **Integration Tests**: Runs `pnpm run test:int` for all staged code changes.

### Database & Types

- `pnpm payload migrate:create` - Create a new migration after schema changes.
- `pnpm payload migrate` - Apply pending migrations.
- `pnpm generate:types` - Regenerate `src/payload-types.ts` and Cloudflare types.
- `pnpm generate:importmap` - Regenerate Payload's import map for custom components.

### Deployment

- `pnpm run deploy` - Build and deploy to Cloudflare (runs migrations, build, and upload).

## Engineering Standards

### 1. Payload & TypeScript

- **Always Use Types**: Import types from `@/payload-types` for all CMS-related data.
- **Type Generation**: Run `pnpm generate:types` immediately after modifying any collection or global.
- **Migration Safety**: Schema changes MUST be accompanied by a migration (`pnpm payload migrate:create`).

### 2. Security & Access Control

- **Local API Access**: When using `payload.find` or similar Local API methods with a `user` context, ALWAYS set `overrideAccess: false` to enforce permissions.
- **Transaction Safety**: ALWAYS pass the `req` object to nested operations in hooks to maintain atomicity.
- **RBAC**: Use the `checkRole` utility. Available roles: `admin`, `editor`, `author`, `contributor`, `customer`, `subscriber`.
- **Field Access**: Use boolean-only access for fields. Query constraints are for collection-level access.

### 3. Frontend Development

- **Next.js 15**: Use App Router patterns. Prefer Server Components for data fetching.
- **Styling**: Use Tailwind CSS v4 and shadcn/ui. Stick to CSS variables defined in `src/cssVariables.js` and global styles.
- **Live Preview**: Ensure new blocks support live preview by registering them in `src/blocks/RenderBlocks.tsx`.

### 4. Testing Protocols

- **Reproduce First**: Before fixing a bug, create a reproduction case in `tests/int` or `tests/e2e`.
- **Regression Testing**: All new features must include corresponding tests in either Vitest (for logic) or Playwright (for UI flows).

### 5. Feature Development Workflow

- **Branching Strategy**: For EVERY new feature or bug fix, create and check out a NEW branch from the main branch. Never work directly on the main branch.
- **Test-Driven Development (TDD)**: ALWAYS use TDD. Write failing tests first to define the expected behavior, then implement the feature until the tests pass. Ensure both integration tests (`tests/int`) and E2E tests (`tests/e2e`) are considered.

## Cloudflare Specifics

- **Wrangler Proxy**: Local development emulates D1 and R2 using `getPlatformProxy`.
- **CPU Limits**: Keep Worker CPU time < 50ms. Avoid heavy processing during request cycles.
- **Secrets**: Store sensitive keys (Paystack, Payload Secret) as Cloudflare secrets (`wrangler secret put`).

## Deployment Checklist

1. Ensure all schema changes have migrations.
2. Run `pnpm generate:types` and verify no type errors (`tsc --noEmit`).
3. Run `pnpm test` to ensure all logic and flows pass.
4. Run `pnpm run deploy` to push to Cloudflare.

## 🚨 Session Close Protocol (Landing the Plane)

Before completing any task or ending a session, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

### MANDATORY WORKFLOW:

1. **Run Quality Gates**: Verify with `lint`, `typecheck`, or `build` as needed (e.g., `pnpm run lint`, `pnpm run test`).
2. **Git Workflow & PUSH TO REMOTE**:
   ```bash
   git status
   git add .
   git commit -m "feat/fix: describe changes"
   git pull --rebase
   git push
   ```
3. **Clean up**: Clear stashes, prune remote branches.
4. **Verify**: Ensure `git status` shows the local branch is "up to date with origin" and all changes are committed AND pushed.
5. **Hand off**: Provide a brief context summary for the next session.

### CRITICAL RULES:

- **Work is NOT complete until `git push` succeeds.** NEVER stop before pushing—that leaves work stranded locally.
- **Proactive Push**: NEVER say "ready to push when you are"—YOU must push autonomously.
- **Fail-Safe**: If push fails, resolve conflicts or errors and retry until it succeeds.

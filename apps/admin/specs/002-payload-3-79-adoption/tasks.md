# Task Plan: Payload 3.62.1 to 3.79.0 Adoption

**Branch**: `002-payload-3-79-adoption`  
**Plan**: [plan.md](./plan.md)

## Phase 1 - Editor and Admin Quick Wins

- [x] T001 Add Lexical block icons/thumbnails for `Banner`, `Code`, and `MediaBlock`
- [x] T002 Verify block picker visuals in collections using Lexical `BlocksFeature`
- [x] T003 Configure collection-specific import/export limits in `src/plugins/index.ts`
- [x] T004 Document which collections are export-only, importable, or excluded
- [x] T005 Introduce a shared slugify helper and wire it into pages, posts, categories, and products
- [x] T006 Add integration tests covering slug generation edge cases

## Phase 2 - Regression Coverage

- [x] T007 Add integration coverage for draft/version flows on `pages` and `posts`
- [x] T008 Add verification coverage for import/export config changes or admin smoke notes if direct automated coverage is not feasible
- [x] T009 Run targeted tests for block rendering, previews, and slug behavior

## Phase 3 - Commerce Review

- [x] T010 Audit current cart, order, and guest-account logic against newer ecommerce guest-cart support
- [x] T011 Remove or simplify only the custom ecommerce code proven redundant by the audit
- [x] T012 Add regression coverage for guest checkout and account conversion after any simplification

## Phase 4 - Preview, Storage, and Dashboard

- [x] T013 Review `storage-r2` multipart upload support and capture a go/no-go decision
- [x] T014 Review preview plumbing for pages, posts, and products and update `generatePreviewPath` or collection preview config only if needed
- [x] T015 Design modular dashboard widget replacements for the current `beforeDashboard` implementation
- [x] T016 Implement dashboard migration only after the widget design is approved and lower-risk work is complete

## Dependency Notes

- T001 to T006 should land before any dashboard or ecommerce refactor work
- T010 to T012 are gated on understanding whether core ecommerce behavior can actually replace custom logic
- T016 should be treated as a separate implementation tranche even if T015 completes now

## Definition of Done

- Editor UX improvements are visible in admin
- Import/export behavior is explicitly bounded
- Slugs are deterministic and tested
- Regression coverage exists for the upgraded behaviors this repo now depends on
- Any ecommerce simplification is backed by tests
- Dashboard modernization has either shipped safely or been split into a clearly scoped follow-up

## Implementation Notes

- The ecommerce audit concluded that Payload's guest-cart support can be adopted explicitly, but the custom Paystack checkout and guest-to-account conversion flow still owns behavior that the plugin does not replace end to end.
- `storage-r2` client uploads were enabled as the practical adoption of multipart upload support.
- Preview support was corrected for posts by expanding `generatePreviewPath`.
- Dashboard cards were migrated to Payload dashboard widgets while retaining a lightweight intro section via `beforeDashboard`.

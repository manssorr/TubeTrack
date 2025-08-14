## TubeTrack Improvement Plan

This folder contains an actionable, commit-scoped plan to address identified issues, tech debt, and design problems. Each task is designed to be its own commit with clear scope, todos, tests, and acceptance criteria.

### Guiding principles

- Keep client bundles browser-only (no server/DB code in client).
- One source of truth for app state; explicit persistence layer.
- Validate persisted data with schemas and provide migrations.
- Private keys stay server-side; API access goes through backend with caching/throttling.
- Small, reviewable commits; tests accompany changes.

### Task list (sequence)

1. 01-split-shared-schema: Split shared schemas from server DB schema
2. 02-server-hardening: Error handling, host binding, logging
3. 03-tailwind-alignment: Align Tailwind version/plugins and ESM imports
4. 04-state-consolidation: Single source of truth for playlists/settings
5. 05-youtube-proxy-and-pagination: Server proxy + playlist pagination
6. 06-storage-validation-and-migrations: Zod validation + versioned migrations
7. 07-player-control-architecture: Centralize player control, remove DOM postMessage
8. 08-dev-assets-and-fonts: Dev-only banners and font footprint reduction
9. 09-tests-and-ci: Add test infra (Vitest + Playwright) and CI
10. 10-dep-trim-and-cleanup: Remove unused deps; tidy configs

See `tasks/*` for details on each.

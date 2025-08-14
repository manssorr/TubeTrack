## 09 — Tests and CI

Plan:

- Add Vitest for unit tests and Playwright for e2e.
- Add GitHub Actions workflow for PR validation (typecheck, unit, e2e smoke optional).

Todos:

- [ ] Add `vitest` + `@testing-library/react` + `jsdom` and configure.
- [ ] Add `playwright` with a smoke test: load home, add a small playlist (mock server), verify UI updates.
- [ ] Add `npm run test`, `npm run test:e2e` scripts.
- [ ] Add `.github/workflows/ci.yml` with typecheck + unit tests on PR.

Tests:

- Unit: cover `youtube.ts` utils, `useProgressTracker`, analytics calculations.
- E2E: smoke only to start, expandable later.

Acceptance criteria:

- CI green on PRs; unit tests pass locally.

## 10 — Dependency trim and cleanup

Plan:

- Remove unused heavy deps: `passport`, `express-session`, `connect-pg-simple`, `ws`, `drizzle-orm` (if server storage remains in-memory), `next-themes` (unused).
- Keep minimal deps needed for current feature set.

Todos:

- [ ] Audit imports to confirm unused packages.
- [ ] Remove from `package.json` and lockfile; run install.
- [ ] Verify server/client start and build.

Tests:

- CI: typecheck + unit tests still pass; app runs.

Acceptance criteria:

- Smaller install/build footprint; no runtime errors from removed deps.

## 08 — Dev assets and fonts

Problem: Dev-only Replit banner shipped to prod; very large font list inflates payload.

Plan:
- Inject dev banner only in development (Vite dev middleware already handles index transform; keep in dev only).
- Reduce Google Fonts to minimal families/weights actually used.

Todos:
- [x] Remove dev banner from `index.html` (leave comment).
- [ ] Trim font list in `index.html` to 1–2 families and required weights.

Tests:
- Visual smoke: Fonts load; layout consistent.

Acceptance criteria:
- No dev banner in prod; reduced font requests.


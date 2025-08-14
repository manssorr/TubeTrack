## 02 — Server hardening

Scope: Ensure server stability and deployability.

Todos:
- [x] Error middleware: stop rethrowing after response; log instead.
- [x] Host binding: allow `HOST` env; default to `0.0.0.0`.
- [ ] Replace `res.json` monkeypatch logging with structured request logging for `/api/*` routes only.
- [ ] Add healthcheck route test.

Tests:
- Unit: Supertest for `/api/health` returns 200 with `{status:"ok"}`.
- Unit: Error handler returns JSON and does not crash process (simulate route throwing error).

Acceptance criteria:
- Server runs in production on `0.0.0.0`.
- Errors are logged and do not crash process.


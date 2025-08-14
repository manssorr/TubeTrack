## 03 — Tailwind alignment (v3 config with ESM plugins)

Problem: Config mixed v4 plugin and CommonJS requires in ESM.

Todos:
- [x] Import plugins via ESM (`tailwindcss-animate`, `@tailwindcss/typography`).
- [ ] Remove `@tailwindcss/vite` if staying on Tailwind v3; keep PostCSS/Vite defaults.
- [ ] Alternatively, upgrade fully to Tailwind v4 (out of scope for now).

Tests:
- Unit: Tailwind builds without errors (`vite build`).
- Visual smoke: App styles render correctly in dev.

Acceptance criteria:
- No Tailwind plugin/runtime errors; styles intact.


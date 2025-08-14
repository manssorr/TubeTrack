## 04 — State consolidation (single source of truth)

Problem: `useProgressTracker` (localStorage) and `useLocalStorage` (IndexedDB + localStorage) duplicate playlist/settings state; `Home` has independent `userSettings`.

Plan:

- Make `useProgressTracker` the single source of truth for app state.
- Encapsulate persistence (IndexedDB + localStorage backup) behind one persistence module used in `useProgressTracker`.
- Remove `useLocalStorage` from `Home`; expose playlist operations via `useProgressTracker`.
- Ensure `settings` live in `progressData.settings` only.

Todos:

- [ ] Create `client/src/lib/persistence.ts` that writes/reads playlists and settings from IndexedDB and keeps a localStorage backup.
- [ ] Refactor `useProgressTracker` to depend on `persistence.ts` and drop internal localStorage write timers.
- [ ] Replace `useLocalStorage` usages in `Home` with `useProgressTracker` methods; remove `userSettings` local state in favor of `updateSettings`.
- [ ] Update `PlaylistManager` props to use `progressData.playlists` and callbacks from `useProgressTracker`.

Tests:

- Unit: Reducer-like tests for `useProgressTracker` logic (add/update/delete playlist, update video progress, set current video).
- E2E: Adding a playlist persists across reload; toggling favorite persists; settings changes persist.

Acceptance criteria:

- One canonical state; no drift between IndexedDB and memory; app behavior unchanged.

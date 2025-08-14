## 06 — Storage validation and migrations

Problem: Persisted data not validated against schema; defaults may drift; no versioning.

Plan:

- Validate persisted data via zod on load.
- Introduce `schemaVersion` in persisted root; add migration steps for older versions.

Todos:

- [x] Validate `loadProgressData` via `progressDataSchema.parse`.
- [ ] Add `schemaVersion` to `ProgressData` (zod + type) and default to `1`.
- [ ] Add `migrate(data)` utility that detects version and transforms to the latest.
- [ ] Apply migration before `parse` in `loadProgressData`.

Tests:

- Unit: Migration transforms older shapes (e.g., `notes` string to structured array) and sets defaults.

Acceptance criteria:

- App gracefully loads older data and upgrades it without user action.

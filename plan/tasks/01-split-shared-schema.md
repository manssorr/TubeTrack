## 01 — Split shared schemas from server DB schema

Problem: `shared/schema.ts` mixes Drizzle (server-only) with zod schemas shared by client. This leaks server code to the client.

Plan:
- Create `shared/types.ts` with zod-only schemas and types used by the client.
- Move Drizzle tables into `server/db/schema.ts` (server-only import path).
- Update imports across client to use `@shared/types`.
- Ensure build excludes server DB code from client bundle.

Todos:
- [ ] Create `shared/types.ts` and move zod schemas (`videoSchema`, `playlistSchema`, `userSettingsSchema`, `progressDataSchema`, and derived types) into it.
- [ ] Create `server/db/schema.ts` for Drizzle `users` table and related types.
- [ ] Update `server/storage.ts` to import `User`, `InsertUser` from server DB schema.
- [ ] Update client imports to use `@shared/types` instead of `@shared/schema`.
- [ ] Adjust tsconfig `paths` if needed to point `@shared/*` to zod-only files when building client.

Tests:
- Unit: Type-only compile check via `tsc --noEmit` for client (no Drizzle in client bundle).
- E2E smoke: App starts (`npm run dev`) and user can load the home screen.

Acceptance criteria:
- Client build contains no Drizzle imports.
- App compiles and runs with the same behavior.


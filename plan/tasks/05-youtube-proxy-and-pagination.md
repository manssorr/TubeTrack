## 05 — YouTube proxy and pagination

Problem: Client exposes API key; no pagination; brittle errors.

Plan:
- Implement server route `/api/youtube/playlist/:id` that fetches playlist details and paginates items, then fetches video details in chunks. Keep API key server-side.
- Update client `fetchPlaylistInfo` to call server endpoint.

Todos:
- [ ] Add server env var `YOUTUBE_API_KEY` and load it with `process.env`.
- [ ] Create `server/routes/youtube.ts` with proxy logic (pagination via `nextPageToken`).
- [ ] Wire route into `server/routes.ts` (prefix `/api/youtube`).
- [ ] Update client `client/src/lib/youtube.ts` to call `/api/youtube/playlist/:id` and remove direct key usage.
- [ ] Add basic rate limiting or caching in server (simple LRU or per-IP window).

Tests:
- Unit (server): paginate multiple pages; assemble all videos; handle errors.
- E2E: Large playlist (>50) loads fully in UI; client bundle does not reference the key.

Acceptance criteria:
- API key not present in client bundle; large playlists load fully.


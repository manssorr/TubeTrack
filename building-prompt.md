### TubeTrack build-from-scratch prompt

```text
You are an expert full-stack engineer. Build “TubeTrack” from scratch: a YouTube learning progress tracker that helps users import playlists, watch videos, take markdown notes with timestamps, track progress automatically, and view analytics. Use a modern, maintainable stack with strong typing, good UX, and a fast dev experience. Deliver a production-ready monorepo with client, server, and shared types.

Follow this exactly:
- Use TypeScript everywhere, strict mode.
- Frontend: React 18 + Vite + TailwindCSS + shadcn/ui + TanStack Query v5.
- Backend: Node + Express + TypeScript.
- Validation: zod shared between client and server in a `shared/` package.
- Data fetching: server-side proxy for YouTube Data API v3; handle pagination; cache minimally; rate-limit.
- Local storage: store the user’s playlists, notes, preferences, and progress locally with versioned schema + migrations.
- Testing: Vitest + React Testing Library for client; Vitest + supertest for server; basic e2e strategy description.
- CI: GitHub Actions for type-check, lint, test, build.
- Developer UX: scripts for dev, build, lint, test; fast hot reload; helpful errors.

High-level goals
- Users paste a YouTube playlist URL/ID; TubeTrack imports playlist items (title, duration, thumbnails, channel) via server proxy and stores them locally.
- Users can browse a collapsible list of videos; search, sort, and filter by completion.
- Clicking a video loads a player with the YouTube IFrame API; TubeTrack tracks watch progress automatically (based on time watched), supports manual checkoff, and persists playback rate/position.
- Users write markdown notes with fenced code blocks, inline timestamps (e.g., [12:34]), and tags. Clicking a timestamp seeks the video.
- Analytics dashboard shows watch time, completion rate, streak, per-tag stats, and estimated time to finish a playlist.
- Polished UX with responsive layout and mobile-friendly controls; dark/light themes; keyboard shortcuts for the player.

Non-goals
- No user accounts or cloud persistence in v1.
- No downloading videos or scraping; only official YouTube Data API.

Repository structure
- Monorepo with three packages:
  - `client/`: React app
  - `server/`: Express app
  - `shared/`: shared zod schemas and TypeScript types

Directory layout
- Root
  - `client/`
    - `index.html`
    - `src/`
      - `main.tsx`
      - `App.tsx`
      - `index.css`
      - `pages/`
        - `home.tsx`
        - `not-found.tsx`
      - `components/`
        - `AppHeader.tsx`
        - `PlaylistManager.tsx` (input + list of imported playlists; add/remove; import status)
        - `CollapsibleVideoList.tsx` (grouping, search/filter/sort, progress indicators)
        - `VideoList.tsx` (flat list view with metrics)
        - `VideoPlayer.tsx` (YouTube IFrame embed + events + error handling)
        - `VideoPlayerModes.tsx` (theater/minimal modes)
        - `VideoControlPanel.tsx` (speed, A/B loop, seek, next/prev, shortcuts)
        - `MarkdownNotesPanel.tsx` (markdown editor with autosave, timestamp link handling)
        - `NotesPanel.tsx` + `NotePanelWithItems.tsx` (shared abstractions)
        - `AnalyticsDashboard.tsx` (cards and charts for metrics)
        - `HelpWiki.tsx` (how-to, shortcuts)
        - `ThemeProvider.tsx`
        - `ui/` (shadcn/ui components generated)
      - `hooks/`
        - `useYouTubePlayer.ts` (IFrame API wrapper; events; ready; error; seek; rate)
        - `useProgressTracker.ts` (derive completion, time watched, persist intervals)
        - `useLocalStorage.ts` (namespaced keys, versioning, migrations)
        - `useAnalytics.ts` (aggregate metrics from progress + notes)
        - `use-mobile.tsx`
        - `use-toast.ts`
      - `lib/`
        - `youtube.ts` (client to server proxy; query functions with TanStack Query)
        - `storage.ts` (typed accessors to LS/IDB with schema + migrations)
        - `localDb.ts` (optional IDB wrapper if needed; otherwise LS only)
        - `queryClient.ts`
        - `utils.ts`
      - `types/`
        - `index.ts` (re-exports shared types)
  - `server/`
    - `index.ts` (Express server bootstrap)
    - `routes.ts` (YouTube proxy routes, health)
    - `storage.ts` (optional in-memory cache)
    - `vite.ts` (optional proxy integration for local dev)
  - `shared/`
    - `schema.ts` (zod schemas and TS types)
  - `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `vite.config.ts`, `drizzle.config.ts` (placeholder if DB later), `.env.example`, `.github/workflows/ci.yml`, `README.md`

Tech choices and versions
- Node 20+, pnpm or npm.
- React 18, Vite 5, TypeScript 5.4+, Tailwind 3.4+, shadcn/ui, class-variance-authority.
- TanStack Query v5, zod, react-markdown + remark-gfm, prismjs (optional) for code highlight.
- Express 4, axios, cors, helmet, rate-limiter-flexible, zod, dotenv.
- Vitest, @testing-library/react, jsdom, supertest, eslint, prettier.

Environment variables (.env)
- SERVER:
  - PORT=5174
  - YOUTUBE_API_KEY=your_api_key_here
  - CORS_ORIGIN=http://localhost:5173
  - RATE_LIMIT_POINTS=100
  - RATE_LIMIT_DURATION=60
- CLIENT:
  - VITE_API_URL=http://localhost:5174

Shared data model (zod + types in `shared/schema.ts`)
- Playlist:
  - id (string; YouTube playlist ID)
  - title, channelTitle, itemCount
  - importedAt (ISO string)
- Video:
  - id (string; YouTube video ID)
  - playlistId (string)
  - title, channelTitle, durationSec (number), thumbnails (object), position (number)
- Progress:
  - videoId
  - watchedSeconds (number)
  - lastPositionSeconds (number)
  - completion (0..1)
  - completedAt? (ISO string)
  - lastWatchedAt (ISO string)
- Note:
  - id (uuid)
  - videoId
  - content (markdown string)
  - timestamps: array of { seconds: number; label?: string }
  - tags: string[]
  - updatedAt (ISO string), createdAt (ISO string)
- Settings:
  - theme: "light" | "dark" | "system"
  - playerRate: number
  - playerMode: "default" | "theater" | "minimal"
  - keyboardShortcuts: boolean
- AppState (root persisted object):
  - version (number)
  - playlists: Record<playlistId, Playlist>
  - videos: Record<videoId, Video>
  - progress: Record<videoId, Progress>
  - notes: Record<noteId, Note>
  - settings: Settings

Local storage and migrations
- Namespaced key: "tubetrack:state"
- Versioned schema with `currentVersion` number.
- On load:
  - parse JSON; validate with zod; if version < currentVersion, run stepwise migrations.
  - If invalid, fallback to clean initial state and show toast “Local data reset due to schema change”.
- Provide utility helpers:
  - `getState()`, `setState(partial)`, `update<K extends keyof AppState>(key, updater)`.
  - `withPersist(fn)` to write-through with debounce (e.g., 500ms) for notes/progress.
- Optional: index by playlistId for faster filtering in-memory.

Server API (Express)
- GET `/api/health` -> { ok: true }
- GET `/api/youtube/playlist/:playlistId/items?cursor=<pageToken>&pageSize=50`
  - Calls YouTube Data API `playlistItems.list` with pagination (`pageToken`) and returns:
    - items: Array<{ videoId, title, channelTitle, position, thumbnails }>
    - cursor: nextPageToken | null
    - total: from playlist contentDetails if available
- GET `/api/youtube/video/:videoId` -> minimal metadata for single video
- Rate-limit by IP; CORS only to configured origin; Helmet enabled; timeouts and error normalization.
- Never expose raw API key to client.

Client data fetching
- Use TanStack Query:
  - `usePlaylistItems(playlistId)` with infinite query for pagination
  - `useVideo(videoId)`
  - mutations to “import playlist” that fetch all pages progressively and persist locally (show progress UI)
- Cache times short (e.g., 5 minutes); dedupe requests; abort on unmount.

Core features and flows
1) Import playlist
  - User pastes URL or ID; validate and extract playlistId.
  - Start import: fetch pages until done or user cancels; show a progress bar with counts.
  - Normalize into `videos` and `playlists`; update `AppState`.
2) Browse videos
  - Collapsible by sections (e.g., blocks of 10 by `position`), or by completion status; search by title; filters: completed, in-progress, not-started.
3) Watch video
  - Load `VideoPlayer` with YouTube IFrame API; bind onReady, onStateChange, onError.
  - Track watch progress:
    - Poll currentTime every 1s when playing; accumulate unique watched seconds.
    - Save `lastPositionSeconds` every 5s; persist on pause/end/unmount.
    - Mark complete if completion >= 0.9 or on `ENDED`.
  - Controls: play/pause, seek ±5/10s, rate 0.25–2x, next/prev, A/B loop (optional), keyboard shortcuts (space, j/k/l, ,/. for frame step optional).
4) Take notes
  - Markdown editor (left) + preview (right) or a single editor with preview toggle.
  - Clicking “Add timestamp” inserts `[mm:ss]` at current player time.
  - Clicking timestamps in preview seeks the video.
  - Autosave notes per video with debounce; tags extracted from `#tags`.
5) Analytics
  - Aggregate:
    - Total watched time, per-day streak (days with >N minutes), completion rate per playlist, average rate, top tags by frequency.
    - Estimate time to complete: sum((1 - completion) * durationSec / playerRate).
  - Visualize with cards and simple charts (shadcn/ui + lightweight chart lib).
6) Settings
  - Theme switcher; default player rate; player mode; keyboard shortcuts toggle.

UI and UX details
- `AppHeader`: app title, theme toggle, quick search, link to Help.
- `PlaylistManager`: input, validation, import button, list of playlists, delete with confirm.
- `CollapsibleVideoList`: sections, sticky header, progress bars, small duration, badges for tags if present in notes.
- `VideoPlayer`: responsive 16:9; toolbar overlay on hover; error message with retry; remember rate/mode.
- `MarkdownNotesPanel`: editor with monospace font; toolbar (bold, code, timestamp); autosave toast; preview with syntax highlighting.
- `AnalyticsDashboard`: `Progress` and `Badge` components; simple charts; empty states with CTA.
- Mobile: stacked layout; big buttons for controls; swipe between list and player.

Key components and hooks (contracts)
- `useYouTubePlayer(videoId: string, opts?: { rate?: number }) -> { ref, api, state }`
  - `ref` to attach to `<div>`; `api` with `play`, `pause`, `seek(seconds)`, `setRate(n)`; `state` with `ready`, `playing`, `currentTime`, `duration`.
- `useProgressTracker(videoId: string) -> { progress, markComplete(), updateFromPlayer(tick) }`
- `useLocalStorage<T>(key: string, schema: ZodSchema<T>, version: number, migrations: Record<number, (old) => T>)`
- `useAnalytics()` returns computed metrics for dashboards.
- `lib/youtube.ts` exports functions that hit server endpoints; all return zod-validated data.

Validation and error handling
- Validate all external inputs with zod on server and client.
- Catch YouTube quota errors and show a helpful message with retry; don’t crash.
- Toasts for important events (import started/completed, autosave success, schema reset).

Testing
- Client:
  - Render `PlaylistManager`; paste playlist URL; ensure `extractPlaylistId` works and import mutation starts.
  - `VideoPlayer` mock IFrame API; ensure time polling updates progress.
  - `MarkdownNotesPanel` autosave debounce test; timestamp click seeks player (mock).
- Server:
  - `/api/health` returns ok.
  - `/api/youtube/playlist/:id` returns normalized items; paginates with cursor.
  - Rate limit returns 429 after threshold.
- Include minimal e2e plan description (e.g., Playwright) without full setup.

CI/CD
- GitHub Actions:
  - Install deps, cache, type-check, lint, test, build client and server.
  - On main push and PRs.

Security and performance
- Helmet, CORS, rate limiting; environment-based logging; never expose API key to client.
- Avoid excessive re-renders with memoization; use React Query for caching.
- Debounce expensive handlers (search, notes saving, resize).

Initial implementation steps (milestones)
1) Bootstrap monorepo; configure TypeScript, lint, prettier, Tailwind, shadcn/ui.
2) Implement `shared/schema.ts` with zod types.
3) Implement server with `/api/health` and YouTube proxy endpoints; env + rate limit + CORS + error middleware.
4) Implement client shell: routing, theme provider, header.
5) `PlaylistManager` with playlist import flow using infinite query, normalizing into local state.
6) `CollapsibleVideoList` and `VideoList` with filters/search/progress badges.
7) `VideoPlayer` + `useYouTubePlayer` + progress syncing + controls + keyboard shortcuts.
8) `MarkdownNotesPanel` with autosave, timestamps, preview.
9) `AnalyticsDashboard` minimal metrics and charts.
10) Tests, CI, README with usage and environment setup.

Acceptance criteria
- Import a large playlist (200+ videos) with paginated fetching and see them in the list with durations and positions.
- Watch a video; progress increases; reloading preserves `lastPositionSeconds`, playback rate, and theme; completion auto-marks at end or 90% watched.
- Add notes with timestamps; clicking timestamps seeks; tags display as badges in list.
- Analytics shows total watched time, completion rate, and per-day streak.
- Server never leaks API key; rate limiting functional; CORS locked to local origin.
- All core pages are mobile-friendly; light/dark themes persist.
- All schemas validated; client/server type-safe; tests pass; CI green.

README must include
- Project overview and screenshots/gifs
- Setup (Node version, how to get a YouTube API key)
- .env configuration
- Scripts:
  - `dev`: run client and server concurrently with proxy
  - `build`: build client and server
  - `test`: run tests
  - `lint`: lint
- Known limitations and future work

Deliverables
- Complete repository as specified, ready to `npm run dev`.
- Minimal seed instructions: paste a known playlist to test (e.g., free course playlist).
- Clear, commented code where it improves readability; consistent style.

If anything is truly unclear or blocked (e.g., API quota), make pragmatic defaults and continue. Otherwise, do not pause for approval; deliver the full implementation per spec.
```

### Optional: example API contracts and helper signatures

```ts
// shared/schema.ts (excerpt)
import {z} from "zod";

export const Thumbnail = z.object({
	url: z.string().url(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
});

export const Playlist = z.object({
	id: z.string(),
	title: z.string(),
	channelTitle: z.string().optional().default(""),
	itemCount: z.number().int().nonnegative().optional().default(0),
	importedAt: z.string(),
});

export const Video = z.object({
	id: z.string(),
	playlistId: z.string(),
	title: z.string(),
	channelTitle: z.string().optional().default(""),
	durationSec: z.number().int().nonnegative(),
	thumbnails: z.record(Thumbnail).optional().default({}),
	position: z.number().int().nonnegative(),
});

export const Progress = z.object({
	videoId: z.string(),
	watchedSeconds: z.number().nonnegative(),
	lastPositionSeconds: z.number().nonnegative(),
	completion: z.number().min(0).max(1),
	lastWatchedAt: z.string(),
	completedAt: z.string().optional(),
});

export const Note = z.object({
	id: z.string().uuid(),
	videoId: z.string(),
	content: z.string(),
	timestamps: z.array(
		z.object({seconds: z.number().nonnegative(), label: z.string().optional()})
	),
	tags: z.array(z.string()),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const Settings = z.object({
	theme: z.enum(["light", "dark", "system"]).default("system"),
	playerRate: z.number().min(0.25).max(2).default(1),
	playerMode: z.enum(["default", "theater", "minimal"]).default("default"),
	keyboardShortcuts: z.boolean().default(true),
});

export const AppState = z.object({
	version: z.number().int().nonnegative(),
	playlists: z.record(Playlist),
	videos: z.record(Video),
	progress: z.record(Progress),
	notes: z.record(Note),
	settings: Settings,
});

export type TPlaylist = z.infer<typeof Playlist>;
export type TVideo = z.infer<typeof Video>;
export type TProgress = z.infer<typeof Progress>;
export type TNote = z.infer<typeof Note>;
export type TSettings = z.infer<typeof Settings>;
export type TAppState = z.infer<typeof AppState>;
```

```ts
// server/routes.ts (excerpt)
import express from "express";
import axios from "axios";
import {z} from "zod";

const router = express.Router();

const qpSchema = z.object({
	cursor: z.string().optional(),
	pageSize: z.coerce.number().min(1).max(50).default(50),
});

router.get("/health", (_req, res) => res.json({ok: true}));

router.get("/youtube/playlist/:playlistId/items", async (req, res, next) => {
	try {
		const {playlistId} = req.params;
		const {cursor, pageSize} = qpSchema.parse(req.query);

		// Call YouTube Data API v3 playlistItems.list
		const resp = await axios.get(
			"https://www.googleapis.com/youtube/v3/playlistItems",
			{
				params: {
					part: "snippet,contentDetails",
					playlistId,
					maxResults: pageSize,
					pageToken: cursor,
					key: process.env.YOUTUBE_API_KEY,
				},
				timeout: 12_000,
			}
		);

		const items = (resp.data.items || []).map((it: any) => ({
			videoId: it.contentDetails?.videoId,
			title: it.snippet?.title,
			channelTitle:
				it.snippet?.videoOwnerChannelTitle ?? it.snippet?.channelTitle,
			position: it.snippet?.position ?? 0,
			thumbnails: it.snippet?.thumbnails ?? {},
		}));

		res.json({
			items,
			cursor: resp.data.nextPageToken ?? null,
			total: resp.data.pageInfo?.totalResults ?? undefined,
		});
	} catch (err) {
		next(err);
	}
});

export default router;
```

```ts
// client/src/lib/youtube.ts (excerpt)
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {z} from "zod";

const PlaylistItemsResp = z.object({
	items: z.array(
		z.object({
			videoId: z.string(),
			title: z.string(),
			channelTitle: z.string().optional(),
			position: z.number().int(),
			thumbnails: z.record(z.any()).optional(),
		})
	),
	cursor: z.string().nullable(),
	total: z.number().int().optional(),
});

export function usePlaylistItems(playlistId: string) {
	return useInfiniteQuery({
		queryKey: ["playlistItems", playlistId],
		queryFn: async ({pageParam}) => {
			const res = await fetch(
				`${
					import.meta.env.VITE_API_URL
				}/api/youtube/playlist/${playlistId}/items?cursor=${pageParam ?? ""}`
			);
			const json = await res.json();
			return PlaylistItemsResp.parse(json);
		},
		initialPageParam: "",
		getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
	});
}
```

### Quick usage

- Copy the prompt block at the top into your AI agent to scaffold and implement the repo.
- Use the example code snippets to align schemas and API signatures.

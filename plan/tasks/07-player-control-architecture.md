## 07 — Player control architecture

Problem: Notes panel controls player via DOM `postMessage` and `'*'` origin, bypassing hook/context.

Plan:

- Expose player controls (seekTo, play, pause, getCurrentTime) via context/provider created by `useYouTubePlayer`.
- Consume controls in `MarkdownNotesPanel` to jump to timestamps.

Todos:

- [ ] Create `PlayerContext` with control methods and current time.
- [ ] Provide context from `VideoPlayer` around children that need it.
- [ ] Replace DOM `postMessage` in `MarkdownNotesPanel` with context `seekTo(seconds)`.

Tests:

- Unit: Context provides stable methods; seeking updates position.
- E2E: Clicking timestamp jumps reliably; keyboard shortcuts continue to work.

Acceptance criteria:

- No direct DOM postMessage; player controls via context/props only.

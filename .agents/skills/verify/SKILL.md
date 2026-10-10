---
name: verify
description: Launch and drive Infinitunes (the Next.js 16 music web app in apps/web, Bun monorepo) in a real browser to prove behavior. Use it to exercise signup and login, browse and search, the player and queue, favorites, playlists, library, settings and responsive or accessibility checks (390, 1280, 1920, 200% zoom, forced colors). Needs Docker or OrbStack for Postgres and live internet for JioSaavn.
disable-model-invocation: true
---

# Verify Infinitunes

> [!IMPORTANT]
> **Manual trigger only.** Never run this from commit, push, PR creation, poteto-mode or any ship gate. Run it only when explicitly asked.
> `.claude/skills/verify` is a symlink to this directory (`.agents/skills/verify`); there is one copy.

Surface: web UI at `apps/web`. Driver: the **T3 inbuilt browser tools** (`mcp__t3-code__preview_*`). If they are not available in the session, or `preview_*` calls answer "No preview automation host" repeatedly, fall back to `chrome-devtools-axi` (`open`, `snapshot`, `click`, `fill`, `eval`, `resize`, `screenshot`; named session via `CHROME_DEVTOOLS_AXI_SESSION`).

Issues found are recorded once in [docs/archive/verification-issues.md](../../../docs/archive/verification-issues.md) (older) or the dated record under `docs/verification/` (newer). Feature files link to them instead of repeating them. The feature map is [features/README.md](features/README.md).

## Prerequisites

- Bun `1.4.2`, never npm. Run heavy commands through `heavy` when the repo's rules ask for it.
- Docker daemon (OrbStack: `orb start`) for Postgres. Do **not** use `bun run db:up` for a verification run: it starts the shared `local-platforms` stack on fixed ports that other checkouts reuse.
- Outbound internet: browse, search, entity pages and playback are live JioSaavn calls. Without it public pages 500.
- A `JIOSAAVN_DES_KEY`. The main checkout's `.env.local` has one; copy that file (see Launch). Without it `download_url` is empty and playback breaks.
- Never use: a production database, real OAuth credentials, outgoing email (leave `RESEND_API_KEY` unset), a shared browser profile.

## Launch

Pick a free app port (not 3000; other workers use their own) and a free Postgres port. Below, `PORT=3102`, `PGPORT=5442`; substitute yours.

```
# 1. isolated Postgres, uniquely named so cleanup removes only it
docker run -d --name verify-$PORT-pg -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=verify \
  -p 127.0.0.1:$PGPORT:5432 postgres:18.6-alpine

# 2. env: copy the main checkout's .env.local, then override. Next reads apps/web/.env.local;
#    the db scripts read the repo-root .env.local, so write both.
cp <main-checkout>/.env.local .env.local
#    set DATABASE_URL=postgres://postgres:pw@127.0.0.1:$PGPORT/verify
#        AUTH_URL=http://localhost:$PORT   NEXT_PUBLIC_APP_URL=http://localhost:$PORT
#        ENABLE_RATE_LIMITING=false; remove RESEND_API_KEY and SKIP_ENV_VALIDATION
cp .env.local apps/web/.env.local         # both files are gitignored

# 3. migrate, then start the dev server (Node, legacy OpenSSL for des-ecb)
bun run db:migrate
cd apps/web && NODE_OPTIONS=--openssl-legacy-provider nohup bunx next dev -p $PORT \
  > /tmp/verify-$PORT-dev.log 2>&1 < /dev/null & disown
```

Ready when `curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/login` prints `200` (the first compile takes a few seconds). macOS has no `setsid`; the `& disown` is what keeps the server alive across tool calls. Find its PID with `lsof -nP -iTCP:$PORT -sTCP:LISTEN`.

`AUTH_URL` and `NEXT_PUBLIC_APP_URL` must equal the origin the browser uses: the `/api/trpc` origin check in `apps/web/proxy.ts` and Better Auth derive from them. After a code edit Turbopack can serve a stale route bundle; if behavior contradicts the source, stop the server, `rm -rf apps/web/.next`, restart.

## Doctor (read-only)

```
lsof -nP -iTCP:$PORT -sTCP:LISTEN                       # the PID you started
docker ps --filter name=verify-$PORT-pg --format '{{.Status}}'
curl -s -o /dev/null -w 'login %{http_code}\n' http://localhost:$PORT/login            # 200
curl -s -o /dev/null -w 'me %{http_code} %{redirect_url}\n' http://localhost:$PORT/me   # 307 to /login as guest
curl -s -o /dev/null -w 'home %{http_code}\n' http://localhost:$PORT/                   # 200 needs live upstream
tail -5 /tmp/verify-$PORT-dev.log
```

Worth driving only if login is 200 and `/me` redirects as a guest. If the T3 tab shows `chrome-error://` or `Failed to fetch` toasts, the dev server died (another worker's cleanup can kill it): restart it and sign in again, because the browser's cookies may be gone.

## Drive

Load the tools first: `ToolSearch select:mcp__t3-code__preview_open,mcp__t3-code__preview_snapshot,mcp__t3-code__preview_click,mcp__t3-code__preview_type,mcp__t3-code__preview_evaluate,mcp__t3-code__preview_resize,mcp__t3-code__preview_set_appearance,mcp__t3-code__preview_navigate,mcp__t3-code__preview_wait_for,mcp__t3-code__t3_preview_close`. Open your own tab with `preview_open` and `reuseExistingTab=false`; pass the returned `tabId` on every call when other agents share the session.

Recipes that worked on this app:

- **Read state with `preview_evaluate`, not `preview_snapshot`.** A snapshot returns about 20 KB of network entries and accessibility tree. Use `preview_snapshot` with `save=true` only to produce a screenshot (it returns a path under `~/.t3/userdata/browser-artifacts/`).
- **Signup and login by form.** `preview_type` with `locator=role=textbox[name='Email']`, `Password`, `Confirm password` (signup only), then `preview_click` on `role=button[name='Sign Up']` or `role=button[name='Login with Email']`. Signup signs in and lands on `/`. The password needs upper, lower, digit and symbol (`Verify5Pass!x` works).
- **Locators are Playwright selectors**, e.g. `button[aria-label="Like"] >> nth=1`. A `role=button[name='Play']` locator was rejected as "invalid (24 characters)"; use the CSS-with-aria form.
- **Stable handles:** aria-labels `Play`, `Pause`, `Like`, `Previous`, `Next`, `Volume`, `More options`, `Open queue`, `Open player`, `Toggle Sidebar`; slider parts `[data-slot=slider]` and `[data-slot=slider-thumb]`; the hidden `input[type=range]` holds the value (`value` seconds, `max` duration). Logout is `role=button[name='Logout']` on `/me`. Toasts are `[data-sonner-toast]`.
- **Viewports:** `preview_resize` with `mode=freeform`. 200% zoom is approximated as a half-size viewport (1280x800 at 200% is 640x400 CSS px); the device pixel ratio does not change. Light and dark: `preview_set_appearance`. These tools do not emulate touch; a 390 width is layout only.
- **Layout check** (after navigation settles): `({iw:innerWidth, over:document.documentElement.scrollWidth-innerWidth, h1:document.querySelectorAll('h1').length})`. Elements inside the tab strips (`nav.w-max`) overflow on purpose.
- **Iframes do not work** for multi-page sweeps: the app refuses framing (`contentDocument` is null). Navigate per page.
- **Seek.** `preview_click` at x,y on the player track (y about 722 at 1280x800, full width) seeks. `preview_drag` timed out on the moving thumb. For a drag, dispatch `pointerdown` on `[data-slot=slider-thumb]`, then `pointermove` on `document`, then `pointerup` from `preview_evaluate`, reading `input[type=range].value` after each step; it tracks the pointer and playback continues. Label that run a synthetic pointer drag.
- **Forced colors, or any media feature the T3 tools cannot set:** [scripts/cdp-media.mjs](scripts/cdp-media.mjs), e.g.
  `node .agents/skills/verify/scripts/cdp-media.mjs http://localhost:$PORT /me/liked-songs 390 844 light forced out.png user@example.test 'Password!1'`
  It starts its own throwaway headless Chrome, signs in over the Better Auth API, emulates the media (`light|dark`, `forced|none`), saves a PNG, prints a JSON probe (`forced`, `iw`, `over`, `h1`, body colors) and deletes its profile. Needs Chrome at `/Applications/Google Chrome.app` or `CHROME_BIN`.

Non-browser drives:

```
bun run fmt:check && bun run lint && bun run type-check && bun run test
curl -s -i -X POST http://localhost:$PORT/api/trpc/user.getUserPlaylists -H 'origin: http://evil.example'   # 403
```

## Evidence

Write a dated record `docs/verification/<run-id>.md` plus a folder `docs/verification/<run-id>/` of small screenshots (downscale with `sips -Z 500 in.png --out out.png`; keep each under about 60 KB). Capture the action, the resulting state and the side effect:

- Exercise the real user path (forms, clicks), not setters or test-only endpoints.
- Check DB side effects: `docker exec verify-$PORT-pg psql -U postgres -d verify -c 'select email from "user"'`; `infinitunes_favorite` has one row per user with `songs` as an array; also `infinitunes_playlist`.
- JioSaavn is live and unmocked. OAuth stops at the provider redirect without real credentials. Passkeys need a real origin and authenticator and cannot be driven here.
- Say what was measured (DOM) and what was seen by eye. A check that was not run stays "not covered".
- Update the `Last live proof:` line of the feature file you exercised, with date and record path.

Evidence lives in the repo under `docs/verification/`; cleanup never touches it.

## Cleanup

Remove only what this run created, never by process name.

```
kill <pid from lsof>                              # the dev server you started
docker rm -f verify-$PORT-pg                      # only your container
rm -f .env.local apps/web/.env.local              # the copies you made; keep the main checkout's
rm -rf apps/web/.next
```

Close your tab with `t3_preview_close`. Confirm `lsof -nP -iTCP:$PORT -sTCP:LISTEN` and `docker ps --filter name=verify-$PORT-pg` are empty, `git status` shows no stray env files, and `docs/verification/<run-id>/` still exists.

## Helpers

- [scripts/cdp-media.mjs](scripts/cdp-media.mjs): CDP capture with forced-colors and color-scheme emulation (usage above).

## Sharp edges seen while driving

- Row-level `Like` buttons are hidden below the `md` breakpoint (zero size at 640 wide); only the header Like and the row menu remain. Like at 1280 when you need a favorite.
- The dev build shows a breakpoint badge (`xs`, `sm`, `xl`) bottom right and the Next dev-tools button; ignore them in screenshots.
- On Node 24, `new Request(nextRequest, ...)` threw `Cannot read private member #state` in `withTrustedClientIp`, 500-ing every `/api/auth/*` call under `next dev`. It now builds the copy from `url`, `method` and `body` (`apps/web/lib/client-ip.ts`). If auth 500s again, read the dev log first.

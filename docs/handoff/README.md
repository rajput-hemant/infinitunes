# Phase 3 handoff (performance, PPR, a11y, PWA, OG)

State at the end of this session: branch `task/ui-mockups`, all gates green
(fmt, lint 0 warnings, type-check, bun test, test:mocked, test:dom, next build)
and `bun run budget` passing. Stopped at the owner's request: no new tasks
after the current usage window.

## Done this phase

| Area      | Change                                                                                                                                                                                                                                                                 | Result                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Login     | One artist at a time (crossfading spotlight) instead of a 12-image grid                                                                                                                                                                                                | 1 image loaded up front instead of 12                                                                                            |
| Glass     | Softer rims (`--g-rim-k` 0.6 light / 0.3 dark), thinner settings selection rings                                                                                                                                                                                       | Owner: borders were too contrasty                                                                                                |
| Glass     | Detail artwork wash moved into the viewport-wide ambient layer, crossfades between pages; glass sidebar toggle                                                                                                                                                         | No hard edge at the sidebar; glass refracts colour                                                                               |
| Bundle    | zod/env out of `config/site.ts`, auth client lazy on sign-out, playlist form lazy                                                                                                                                                                                      | `/` 528 to 431 KB gz, `/browse` 525 to 412, `/login` 411 to 378, not-found 360 to 279                                            |
| Fonts     | Noto Devanagari not preloaded, Cal Sans woff2                                                                                                                                                                                                                          | 4 preloads / 242 KB to 2 / 93 KB                                                                                                 |
| Caching   | `Cache-Control` for `/images`, `/fonts`, icons (1 day + SWR)                                                                                                                                                                                                           | was `max-age=0`                                                                                                                  |
| Errors    | show/episode bad tokens -> not-found, `?page=` coercion, `global-error.tsx`, `(auth)` loading/error, `/search` loading                                                                                                                                                 | no crashes on the audited bad inputs                                                                                             |
| Flicker   | Hydration mismatches fixed (lens registry wrote styles before hydration; theme-dependent settings text)                                                                                                                                                                | 0 hydration errors, 0 console errors/warnings on 8 routes x 2 themes (prod)                                                      |
| LCP       | Hero, detail cover, first catalog row eager + `fetchPriority="high"`; 150px thumbs                                                                                                                                                                                     | LCP warnings gone in dev                                                                                                         |
| Dev noise | Social providers only when configured, `data-scroll-behavior`                                                                                                                                                                                                          | dev console clean except the PPR diagnostic                                                                                      |
| PPR       | `(root)` layout is synchronous; session, library and sidebar state are islands (`ViewerProvider`, theme-script step). Artist tabs are child routes; list pages, search results and `/me` keep their frame and suspend only the fetched part. `instant = false` is gone | Static shells: 32 of 37 empty before, 0 of 40 empty now (table below); artist tab switch keeps header and tab row mounted, CLS 0 |
| CI        | `scripts/check-budget.ts` (ported from the portfolio), reads `.next/diagnostics/route-bundle-stats.json` because PPR shells are empty; CI step after build                                                                                                             | ratchet ceilings, warn-only shared-chunk guard                                                                                   |

## Queued, not started (priority order)

1. **PPR restructure: done in `fix/ppr`, the rest is below.** See "PPR restructure" for what changed, the measured shells and what still blocks a fuller shell.
2. **Contrast on the artwork wash (serious a11y).** Light mode album/artist/playlist/show muted text 1.7 to 3.0:1; home hero; browse tiles. See `a11y-pwa-og-seo-audit.md` A1.
3. **OG image route.** Artist 500 (octet-stream), label 400 (host allowlist), 0.85 to 1 MB cards, no cache headers, Arabic title crash, `&amp;` not decoded in the route.
4. **SEO plumbing.** `app/robots.ts`, `app/sitemap.ts`, canonical, twitter tags, noindex on auth/me/settings/search, titles for search, JSON-LD.
5. **Landmarks and semantics.** `<main>` on auth and not-found, search trigger label, heading order, row button names, alt="".
6. **Caching (G7).** `cacheLife` expire > revalidate (serve stale on outage), library readers out of the `"use server"` file and `cache()`d, real invalidation for recently played.
7. **Defer (G8).** Glass runtime, Base UI popups, Toaster, `home-greeting.tsx` static auth client import.
8. **Focus/overlays.** Expanded player aria-modal + trap, languages popover, user menu focus.
9. **PWA.** Maskable icons, opaque apple-icon, manifest id/scope/shortcuts/screenshots; offline fallback (judgment).
10. **Forced colors, touch targets, reflow.** Slider tracks, 44px coarse hit areas, appearance swatch row.
11. **Glass performance** (`glass-perf-audit.md`, measured on ea06da4): backdrop-filter itself is the desktop cost (album draw ms/frame: lens 37, frost 28, solid 22, none 13); the viewport wash is the biggest lever (32 to 18 ms with it off). Do first: drop backdrop-filter on closed/offscreen surfaces (closed phone queue still has a 366x448 lens), make the player rAF loop run only while playing (`components/player.tsx` ~141-150, 60 Hz idle), stop lens rebuilds during the phone tab-bar morph (22-34 per scroll, `lens-registry.ts` `schedule()`). Then judgment: pre-baked cheap wash, device-hint and frame-budget lens to frost downgrade, removing the frost-to-lens swap-in pop 350-700 ms after first paint.
12. **Lower budget ceilings** in `scripts/check-budget.ts` to the new measured values and flip the shared-chunk guard to `error` (zod is out of the shell now).

## PPR restructure (fix/ppr)

Rules and sharp edges are in `AGENTS.md` ("Shell structure"). Summary of the structure:

- `(root)/layout.tsx` no longer awaits anything. `getViewer()` (`lib/viewer.ts`, memoized per request) is handed un-awaited to `ViewerProvider`; the sidebar library, phone tab bar, user menu, Log in button and player are small client islands in `components/viewer.tsx`, each behind its own `<Suspense>` with a same-shape fallback (the Log in button reserves its width so the toolbar does not slide). `Navbar` is synchronous: the catalog mega menu is cached, the language picker reads its cookie when it opens.
- The sidebar's saved state is a `SIDEBAR_STEP` in `lib/theme-script.ts`; `styles/globals.css` holds the collapsed gutter until `AppSidebarProvider` hydrates, so a collapsed sidebar never slides.
- `usePathname`/`useSearchParams`/`useParams` consumers use `PathnameBoundary`/`SearchParamsBoundary`, so routes with request-time params prerender their chrome. Content fetched for a query string sits in `KeyedByParams` (a new `?lang=` shows the grid skeleton at once).
- Artist: `artist/[name]/[token]/{page,songs,albums,bio}` under a layout that streams header, tab row and shelves behind their own boundaries; only the tab panel suspends. Old `<name>-songs|-albums|-bio` URLs (JioSaavn's own artist links all end in `-songs`) 308 in `proxy.ts` (`lib/artist-route.ts`), `getHref` links the tab routes directly.
- Search results moved under `search/(results)` so the title and type chips live in a layout above `[type]`; the Songs and Albums panels of the artist page no longer show each other's cached list.
- List pages (album, playlist, radio, show, chart, artist, browse) render the heading in the shell and put the fetched part in `Suspense`; their `loading.tsx` files are gone. `/me/(layout-a)` streams only the profile header. Auth pages render their forms in the shell and stream `SignedInRedirect`.

Static shell HTML bytes in `.next/server/app` (`next build`, before at 88e6c58, after at the head of this branch). 0 means the whole document was postponed:

| Route                                                          | Before | After                                     |
| -------------------------------------------------------------- | ------ | ----------------------------------------- |
| `/`                                                            | 0      | 399,247                                   |
| `/browse`, `/chart`, `/artist` (data cached, in the shell)     | 0      | 98,669 / 124,353 / 142,005                |
| `/album`, `/playlist`, `/radio`, `/show`, `/search`            | 0      | 101,203 to 106,783                        |
| `/privacy`, `/terms`                                           | 0      | 88,436 / 88,487                           |
| `/artist/[name]/[token]` (+ `/songs`, `/albums`, `/bio`)       | 0      | 96,624 (91,580 to 96,906)                 |
| album, playlist, song, show, label, episode, mix, radio detail | 0      | 62,299 to 109,371                         |
| `/search/[type]/[query]`                                       | 0      | 82,115                                    |
| `/me`, `/me/*`, `/me/playlist/[id]`                            | 0      | 81,751 to 118,067                         |
| `/settings`, `/settings/appearance`, `/settings/preferences`   | 0      | 101,949 to 143,097                        |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`     | 11,477 | 10,739 to 13,030 (forms now in the shell) |

Empty shells: 32 of 37 before, 0 of 40 now. Entity-page shells are the chrome plus a skeleton (nothing on them is known before the params), the others carry real content. `bun run budget` passes with every ceiling kept (largest move: `/artist/[name]/[token]` was 440 KB gzip and is 419 to 434 KB across its four tab routes; `/` 423 to 424).

### What still blocks a fuller shell

- Entity pages (album, playlist, song, show, label, episode, mix, radio detail), `/me/*`, `/settings*` are whole-page data and keep a route `loading.tsx` with a skeleton that mirrors the page; only their secondary lists are separate boundaries. Header and tracks share one entity fetch, so splitting them would not stream anything earlier.
- `SongList` and `DetailsHeader` are server components that read the viewer (cookies), so every page that renders one is dynamic at that point. A client variant over `useViewer()` could let cached lists join a shell, at the cost of like and playlist state arriving after the rows.
- `cacheLife` still has `expire` equal to `revalidate` (backlog G7): after ten idle minutes the next visitor waits for a full render instead of a stale shell.
- `megaMenuOrEmpty` swallows a failed build-time fetch, so a shell built while the upstream is down bakes an empty menu until the next revalidation (3600 s).
- `partialPrefetching: true` and `<Link prefetch>` (true) loop requests on 16.3.6 with the `@modal/[...catchAll]` slot (see `AGENTS.md`); revisit when Next is upgraded or the modal slot changes. Tab links use the default prefetch, which already ships each tab's skeleton, so a tab click paints the panel skeleton at once and the panel arrives after one cached server render (about 50 to 70 ms locally).
- `(root)/loading.tsx` still wraps every page, so large boundaries (home, long lists) are outlined by React as a hidden segment plus a `$RC` swap in the shell; a visitor can in theory see the skeleton for a frame on a slow parse. Short static pages (`/terms`, `/privacy`) then move their footer when the swap lands (measured 0.095 CLS at 390 px on some warm loads, 0 on others). Removing the root `loading.tsx` needs a boundary on every page that is not fully cached.
- Cold-cache CLS on the song page (about 0.14 once per cold start): secondary shelves that resolve to nothing collapse their skeleton.
- Signed-in visitors see the toolbar capsules move right by the width of the Log in button once the session resolves (a signed-out visitor sees none).
- Dev only: React logs a missing-key warning from `OuterLayoutRouter` on fully static pages because of Next's devtools wrapper around `(root)/template.tsx`; production builds are clean (0 console output on 24 routes at 1440 dark and 390 light).

## Notes for the next session

- Model rule from the owner: Haiku for mechanical work, Sonnet for judgment and all reviews, Opus advisor only. Always pass the model explicitly.
- Sandbox: `bun run build` fails here (proxy); build with `SKIP_ENV_VALIDATION=true NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=... bunx next build`. Server processes are titled `next-server (v16.x)`; `pgrep -x next-server` never matches.
- Don't run `next dev` and `next start` from the same checkout at once.
- Signing in on a port other than the one in `wp9env.sh`: also set `BETTER_AUTH_URL` (it beats `AUTH_URL`) and `NEXT_PUBLIC_APP_URL`, plus an `AUTH_SECRET`, or Better Auth answers `INVALID_ORIGIN`.

# Phase 3 handoff (performance, PPR, a11y, PWA, OG)

State at the end of this session: branch `task/ui-mockups`, all gates green
(fmt, lint 0 warnings, type-check, bun test, test:mocked, test:dom, next build)
and `bun run budget` passing. Stopped at the owner's request: no new tasks
after the current usage window.

## Done this phase

| Area      | Change                                                                                                                                                     | Result                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Login     | One artist at a time (crossfading spotlight) instead of a 12-image grid                                                                                    | 1 image loaded up front instead of 12                                                 |
| Glass     | Softer rims (`--g-rim-k` 0.6 light / 0.3 dark), thinner settings selection rings                                                                           | Owner: borders were too contrasty                                                     |
| Glass     | Detail artwork wash moved into the viewport-wide ambient layer, crossfades between pages; glass sidebar toggle                                             | No hard edge at the sidebar; glass refracts colour                                    |
| Bundle    | zod/env out of `config/site.ts`, auth client lazy on sign-out, playlist form lazy                                                                          | `/` 528 to 431 KB gz, `/browse` 525 to 412, `/login` 411 to 378, not-found 360 to 279 |
| Fonts     | Noto Devanagari not preloaded, Cal Sans woff2                                                                                                              | 4 preloads / 242 KB to 2 / 93 KB                                                      |
| Caching   | `Cache-Control` for `/images`, `/fonts`, icons (1 day + SWR)                                                                                               | was `max-age=0`                                                                       |
| Errors    | show/episode bad tokens -> not-found, `?page=` coercion, `global-error.tsx`, `(auth)` loading/error, `/search` loading                                     | no crashes on the audited bad inputs                                                  |
| Flicker   | Hydration mismatches fixed (lens registry wrote styles before hydration; theme-dependent settings text)                                                    | 0 hydration errors, 0 console errors/warnings on 8 routes x 2 themes (prod)           |
| LCP       | Hero, detail cover, first catalog row eager + `fetchPriority="high"`; 150px thumbs                                                                         | LCP warnings gone in dev                                                              |
| Dev noise | Social providers only when configured, `data-scroll-behavior`                                                                                              | dev console clean except the PPR diagnostic                                           |
| CI        | `scripts/check-budget.ts` (ported from the portfolio), reads `.next/diagnostics/route-bundle-stats.json` because PPR shells are empty; CI step after build | ratchet ceilings, warn-only shared-chunk guard                                        |

## Queued, not started (priority order)

1. **PPR restructure (biggest win).** Every (root)/(auth) static shell is still 0 bytes: `app/(root)/layout.tsx` awaits `getUser()` (headers) and `cookies()` before any Suspense; auth pages call `redirectIfSignedIn()` at the top. Plan in `perf-audit.md` (G9 a-d): client library store hydrated in Suspense, user islands in navbar/sidebar, sidebar collapsed state via a pre-paint step in `lib/theme-script.ts`, auth redirect as a Suspense child, searchParams lists in Suspense, then delete `instant = false`. The dev "runtime data outside Suspense" diagnostic disappears with it.
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

## Notes for the next session

- Model rule from the owner: Haiku for mechanical work, Sonnet for judgment and all reviews, Opus advisor only. Always pass the model explicitly.
- Sandbox: `bun run build` fails here (proxy); build with `SKIP_ENV_VALIDATION=true NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=... bunx next build`. Server processes are titled `next-server (v16.x)`; `pgrep -x next-server` never matches.
- Don't run `next dev` and `next start` from the same checkout at once.

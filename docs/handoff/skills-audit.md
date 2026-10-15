# Audit against the React and Next.js agent skills

Read-only audit of the monorepo against these skills:

- `vercel-labs/agent-skills` @ 063bee9: react-best-practices, composition-patterns, react-view-transitions and web-design-guidelines.
- `vercel/next.js` `skills/` @ fb20d9a: bundle-optimizer, cache-components and partial-prefetching.
- shadcn.

`next-best-practices` is retired upstream in favour of the bundled `next/dist/docs`.

## Baseline (measured)

- **First-load JS:** shared 271 KB gz. Catalog/detail routes are 404-434 KB, `/me` 466-479 KB, `/settings` 539 KB.
- **React Compiler:** on; 387 functions compiled, 13 bail-outs (all `try/finally` or `import()`).
- **Type hygiene:** no `any`, `@ts-ignore` or `@ts-expect-error`. Two `as unknown as` remain, both in the lazy Proxy wrappers.
- **Client data stack:** TanStack Query + tRPC client + superjson cost about 43 KB gz on every route.
- **Payloads:** a raw upstream song is about 3.5 KB of JSON, which ends up in the RSC payload once per song row.

## Work packages (value first)

| WP  | Scope                                                                                                                                                                                                                                                                                                         | Expected impact                                     | Risk                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------- |
| 1   | Home greeting reads `useViewer()` instead of the Better Auth client (`home-greeting.tsx:3`); debounce search queries (`search-menu.tsx:67`, `mobile-search.tsx:30`); `Shelf` scroll state stops re-rendering (`slider/shelf.tsx:28`); Umami script only with a site id, inside `<body>` (`app/layout.tsx:51`) | -16 KB gz on `/`, 3-5x fewer search requests        | low                  |
| 2   | Lazy `RenamePlaylistDialog` (`playlist-manage-menu.tsx:31`); optional `zod/mini` for client schemas                                                                                                                                                                                                           | -53 KB gz on `/me` pages; -15 KB on auth/settings   | low / medium         |
| 3   | **Done.** Defer the toolbar popups (Drawer, Menu, NavigationMenu, search dialog, floating-ui) until intent; start the glass runtime on idle                                                                                                                                                                   | -45 to 65 KB gz on every route                      | medium (lens timing) |
| 4   | **Done.** Scope React Query/tRPC to the list and search subtrees; vanilla tRPC client for imperative calls                                                                                                                                                                                                    | -25 to 30 KB gz on routes without lists             | medium               |
| 5   | DONE (song data in the RSC flight -64 to -66%, whole flight -5 to -19%): slim row model for song lists instead of the raw upstream object (`song-list-row.tsx`, `more-button.tsx`)                                                                                                                            | about 50-65% smaller RSC payload on song-list pages | medium               |
| 6   | Data layer, in four parts below                                                                                                                                                                                                                                                                               | resilience, fewer DB reads                          | low to medium        |
| 7   | Lint every package in CI with `--deny-warnings` and the `nextjs` plugin. Add `verbatimModuleSyntax`, `noImplicitOverride` and `noFallthroughCasesInSwitch`. Run `next typegen` before `tsc`. Parallelise `test-isolated` and clean up the knip config                                                         | CI catches more                                     | low                  |
| 8   | DONE (catalog 365, detail 425, search 380, account 380, auth 360, modal 365, not-found 255; fonts 2 / 100KB): ratchet the budget ceilings to about 5% above actuals, again after WP1-4                                                                                                                        | regressions fail CI                                 | low                  |
| 9   | Replace `forwardRef` (`glass-surface.tsx:45`, `main-nav.tsx:122`); hoist the 13 compiler bail-outs' `try/finally` into helpers; focus ring on the auth Close link                                                                                                                                             | cleaner React 19 code                               | low                  |
| 10  | DONE: OG route hoists its `readFile` calls and gets rate limited; limiter only on `/api` and documents; CSP reporting endpoint or enforce                                                                                                                                                                     | per-request IO, abuse surface                       | low / owner call     |
| 11  | `robots.ts`, `sitemap.ts`, canonical URLs, `noindex` on `/me`, `/settings` and auth; metadata for search and the artist tab routes                                                                                                                                                                            | SEO                                                 | low                  |
| 12  | DONE (no observer left in morph code; see commit): Measure the body-wide `MutationObserver` in `morph-source.tsx`; prefer declarative `<ViewTransition name>` pairs where unique                                                                                                                              | perf during streaming                               | low                  |

**WP6 in detail:**

- **`cacheLife` expiry:** `cacheLife` uses `expire = revalidate`, so there is no stale-on-error (`lib/cached-api.ts:25`). Lengthen `expire`, except for the media-bearing song and playlist payloads.
- **Dead invalidation:** `updateTag("user_playlists" | "user_favorites")` invalidates nothing, because no reader uses those tags.
- **Reads exposed as server actions:** `lib/db/queries.ts` makes its reads public server actions, and `/me/*` runs them twice. Make them `server-only` + `cache()` and keep `"use server"` for mutations.
- **Unbounded fan-out:** `LikedCollection` fans out over every saved token without a cap.

## WP3 and WP4 result (measured with `bun run budget`)

- **WP3:** the search palette, language picker (Popover and Drawer), user menu (dropdown, sheet, shortcuts dialog), Music mega menu and create-playlist dialog are chunks loaded on intent; the glass engine starts on idle (about 100-200 ms after `load`, lens maps about 300 ms later; frost and lens are pixel-identical on the toolbar in a full-page screenshot).
- **WP4:** no root Query/tRPC React provider; `lib/trpc/vanilla.ts` for imperative calls, `QueryScope` for lists, search and lyrics. `@trpc/react-query` is no longer used.
- **Result:** list-less catalog routes (`/browse`, `/privacy`, `/terms`) 407.6 to 315.9 KB gz (-91.7); `/`, `/chart`, `/artist` -82; `/me/*` list-less -82; `/settings` -70.5; list routes (`/album`, `/playlist`, `/radio`, `/show`) -71; detail routes -47 (song-row "more" menu and drawer come back with the page); search results and artist songs/albums -36; auth and not-found -31 (query and glass only).
- **After the WP5 merge:** the song-row `more-button-*` menu and drawer and the add-to-playlist dialog are deferred on intent too (shell trigger + `*-popup.tsx` chunk). Net on `/album/[name]`, `/song`: -36 to -41 KB gz vs the original (WP5 client row code adds back about 6); `/me/liked-songs` -87, `/search/[type]/[query]` -77, `/radio/[name]` -84.
- **Left:** sidebar Tooltip and Sheet (inside `ui/sidebar`), Sonner and the footer theme toggle are still in the shared chunks.

## Owner decisions (not code-only)

- **DB pool:** `max: 1` (`packages/db/src/client.ts:7`). Raising it depends on the hosting pooler.
- **Better Auth `session.cookieCache`:** saves a DB read per signed-in render. Revocation then lags by the cache TTL.
- **Image optimizer:** `images.unoptimized: true` stays unless paying for Vercel image optimisation.
- **CSP:** enforce it, and choose where violation reports go.

## Agrees with AGENTS.md (no change)

- No `<Link prefetch>`.
- `proxy.ts` naming.
- Hash-based CSP.
- Lazy `db` and `auth`.
- shadcn files read-only.
- React Compiler on.
- `cache()` metadata dedupe.
- Server actions delegate auth to `protectedProcedure`.

## Status

- **WP11 done** (branch `audit/wp11`). `app/robots.ts` (AI-crawler block kept from the old `public/robots.txt`, `Disallow: /api/`, sitemap line) replaces the static file. `app/sitemap.ts` lists 10 static and catalog listing pages, no entity pages, no DB or upstream calls. `siteUrl()` gives one origin for canonical, `og:url` and `metadataBase`. `pageMetadata` sets `alternates.canonical`. `noindex` on `/me` (new `me/layout.tsx`), `/settings`, the four auth pages and their modal intercepts. Search results and `/search` have titles and canonicals, and each artist tab (songs, albums, bio) has its own title and canonical.
- **Measured on a production build** (`next start`, `NEXT_PUBLIC_APP_URL` unset). Before: no canonical on any route, `og:url` `http://localhost:3910` on every page, artist tabs titled with the artist name and listener count, search results with the root title, no robots meta, `/robots.txt` without a sitemap line, no sitemap. After: canonical and `og:url` `https://infinitunes.rajputhemant.me/...` on home, album, artist overview and tabs, search, `/search`; `noindex` on `/settings`, `/login`, `/signup` (and `/me` through its redirect); `/robots.txt` and `/sitemap.xml` 200 and prerendered. Route table unchanged apart from the two static files; `bun run budget` moves by at most 0.6 KB gz per route, framework share unchanged at 271.5 KB.
- **Not verified live:** `/me` as a signed-in user (no local Postgres in this worktree, so sign-up returns 500). The `noindex` there comes from `me/layout.tsx`, covered by a unit test.

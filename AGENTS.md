# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Monorepo layout

- `@infinitunes/types` is a pure leaf package (zero runtime deps). `User` is NOT
  re-exported from it; import `type { User }` from `@infinitunes/auth`, or from
  `apps/web/lib/auth.ts` which re-exports it for app components.
- `bcryptjs` is imported only by `packages/auth`, `packages/db` and `packages/trpc`
  (it ships its own types; `@types/bcryptjs` is not needed). `apps/web` no longer
  imports it. `postgres` and `pg` are unused in app source (provided by `@infinitunes/db`).
- `@infinitunes/ui` (`packages/ui`) is web-only (DOM, Tailwind v4, Base UI,
  `next-themes`); never import it from a React Native or Expo app - mobile
  components belong in a separate package, not a wrapper around these.
  See `packages/ui/README.md`.
- Server data fetching in `apps/web` calls `api.<router>.<procedure>` directly via
  `import { api } from "~/lib/trpc/server"`; `apps/web/lib/jiosaavn-api.ts` has been deleted.
- User database operations live in `packages/trpc/src/router/user.ts`; the
  `apps/web` query and action modules are thin Next.js wrappers for those
  procedures and own cache invalidation or redirects.

Knip is installed for manual dead-code analysis; do not apply its findings automatically.

Bun workspaces + Turborepo. The Next.js app is `@infinitunes/web` at `apps/web`
(`~/*` → `apps/web/*`, e.g. `~/lib/utils`; there is no `src` dir). Run all gates from the repo root:
`bun run fmt:check`, `bun run lint` (Oxlint), `bun run type-check`,
`bun run test` (runs plain tests, then `test:mocked` for process-isolated `mock.module` suites,
then `test:dom` for happy-dom tests), `bun run build`.
DB scripts (`db:generate|migrate|drop|push|pull|studio|check`) forward to
`@infinitunes/db` via `bun run --filter`. Single canonical `bun.lock` at root.

## Build / delivery sharp edges

- Cache Components are enabled. `apps/web/lib/cached-api.ts` owns the catalog
  `use cache` boundary, injected into both tRPC callers; the shared transport
  stays Next-independent and needs no `transpilePackages`. Endpoint, normalized
  query, language, version and timeout form the cache arguments.
  `REVALIDATE_SECONDS` sets revalidate and hard expiry (600s for media-bearing
  details, 3600s for menus/footer/same-year); failures are thrown, with upstream
  classification preserved across the serialized error boundary.
- Shell structure (no `instant = false` anywhere): every `(root)`/`(auth)` route
  prerenders a non-empty static shell (layout chrome, headings, skeletons). Rules
  that keep it that way:
  - `(root)/layout.tsx` is synchronous and reads no request data. The session and
    the user's library are `getViewer()` (`lib/viewer.ts`, memoized per request),
    passed un-awaited to `ViewerProvider`; client islands in `components/viewer.tsx`
    (`ViewerSidebar`, `ViewerMobileNav`, `ViewerUserMenu`, `ViewerSignedOut`,
    `ViewerPlayer`) resolve it with `use()` behind their own `<Suspense>`. Server
    components that need the user (`SongList`, `DetailsHeader`) call `getViewer()`.
    Never `await` it, `cookies()` or `headers()` in a layout body.
  - `usePathname`, `useParams`, `useSearchParams` and `useSelectedLayoutSegment`
    suspend while a route with request-time params (or any query string) is
    prerendered. Wrap query/path-aware UI in `PathnameBoundary` /
    `SearchParamsBoundary` (`components/*-boundary.tsx`): the shell gets the same
    UI with `null`, the real value streams in. Content fetched for a query string
    goes in `KeyedByParams`, so a new `?lang=` shows its skeleton at once instead of
    holding the old list (and the old URL) until the data lands.
  - The sidebar's saved open/closed state is applied before first paint: the
    `SIDEBAR_STEP` in `lib/theme-script.ts` sets `<html data-sidebar="collapsed">`
    from the `sidebar_state` cookie, `styles/globals.css` holds the collapsed gutter
    until `AppSidebarProvider` hydrates (it then sets `data-sidebar-ready`).
  - Tabs are child routes, not state in a slug: artist tabs are
    `artist/[name]/[token]/{page,songs,albums,bio}` under a layout that keeps the
    header, tab row and shelves mounted (`lib/artist-route.ts`); search results
    live in a `search/(results)` group whose layout keeps the title and type chips.
    Old `<name>-songs` artist URLs (and JioSaavn's own links) are 308-redirected in
    `proxy.ts`; `getHref` already links the tab routes.
  - Entity pages (album, playlist, song, show, label, episode, mix, radio detail,
    `/me/*` pages, settings) are whole-page data: they keep a route `loading.tsx`
    with a skeleton that mirrors the page, and Suspense only for secondary lists.
    Catalog list pages put the heading in the shell and the fetched grid in
    `Suspense`; they have no `loading.tsx`.
  - Do not use `<Link prefetch>` (true) or `partialPrefetching`: on 16.3.6 with the
    `@modal/[...catchAll]` slot, `prefetch={true}` made the client re-request the
    modal catch-all segment of every visible link endlessly (hundreds of requests a
    second), and `partialPrefetching: true` looped `/_tree` requests. Default
    `<Link>` prefetch already puts each tab's skeleton in the client.
  - Dev only: with `(root)/template.tsx` and a fully static page, React logs
    `Each child in a list should have a unique "key" prop ... OuterLayoutRouter`
    (Next's devtools segment wrapper around the template is created unvalidated).
    It does not exist in production builds; it hid before only because the layout
    blocked the whole route.
- Env validation (`apps/web/lib/env.ts`) runs at build time and fails
  without real vars. Use `SKIP_ENV_VALIDATION=true` for source-compilation only.
- Turbo filters env vars: any build/runtime var (incl. `SKIP_ENV_VALIDATION`)
  must be listed in `turbo.json` `globalEnv` or `globalPassThroughEnv` to reach `next build`.
- Turbo `outputs` are package-relative; the web build output is `.next/**`.
- `@next/env` and `postcss` are deliberately exact-pinned (kept in step with the Next.js and Tailwind toolchain); loosen only after checking both.
- Docker is local-dev only (`docker-compose.yml` for Postgres/Redis); there is no
  production image, standalone output or `IS_DOCKER` flag. Production is Vercel.
- `packages/trpc/src/lib/download.ts`'s `createDownloadLinks` needs `JIOSAAVN_DES_KEY`
  in `turbo.json` `globalEnv` or every song's
  `download_url` silently comes back empty under `bun run dev`/`build`, which crashes
  the player (empty Howler src). Every song array a router returns must be mapped
  through `withDownloadUrl` (`packages/trpc/src/router/utils.ts`) before reaching
  the client, not just the song-details/podcast-episode endpoints.
- `des-ecb` (used by `createDownloadLinks`) is unsupported by plain Node's default
  OpenSSL 3 build (`next dev` runs under Node even when invoked via `bun run dev`), but
  works under Bun's own crypto. Locally reproduce with `NODE_OPTIONS=--openssl-legacy-provider`;
  don't add that flag to the repo, it's a local-verification workaround only.
- `apps/web/app/api/og/route.tsx` runs on the default Node runtime (Edge is
  deprecated in Next 16). Its font must be loaded with `readFile` from
  `node:fs/promises`, not `fetch()` - undici rejects the `file:` URL that
  `new URL(..., import.meta.url)` resolves to under Node.
- Better Auth's own limiter must not read `x-forwarded-for`. `createAuth` takes
  `ipAddressHeaders`; the web app passes only `x-infinitunes-client-ip`, which
  `app/api/auth/[...all]/route.ts` overwrites via `withTrustedClientIp` (same
  `TRUSTED_PROXY` logic as `proxy.ts`). A non-IP key (`untrusted`) makes Better
  Auth use one shared per-path bucket.
- `getUser()` in `apps/web/lib/auth.ts` swallows only Better Auth's
  no-secret-configured `BetterAuthError` (and only outside a validated
  production env), so a checkout with no `AUTH_SECRET` renders logged-out
  instead of 500-ing every route. Don't widen that catch.
- The root layout (`apps/web/app/layout.tsx`) must stay static: no `cookies()`,
  `headers()` or CSP nonce (a nonce forces dynamic rendering and defeats Cache
  Components). CSP is hash-based (`lib/csp.ts`). Anything that must apply before
  first paint (light/dark, the saved appearance from the `theme-config` cookie's
  derived `html` field, the docked-queue and collapsed-sidebar flags) goes in a step of
  `THEME_BOOTSTRAP_SCRIPT` (`lib/theme-script.ts`), whose hash follows
  automatically. `ThemeConfigProvider` reads the cookie in the browser.
- Tailwind v4's automatic content scanning only covers `apps/web`. Utility
  classes/theme vars used exclusively inside `packages/ui/src` (e.g.
  `bg-sidebar`, `bg-popover`, `bg-card`) get tree-shaken out of the compiled
  CSS unless `apps/web/styles/globals.css` declares
  `@source '../../../packages/ui/src';`. If a new workspace package ships
  components consumed by `apps/web`, add its source dir the same way.
- A workspace package's `index.ts` must not `export *` a pure ambient `.d.ts`
  file (only `declare global`/`declare module`, no runtime exports). `tsc`
  tolerates it, but Next.js's Turbopack bundler cannot resolve it as a module
  and fails the whole build with `Module not found` on every consumer (this is
  what broke `@infinitunes/types` imports repo-wide, not any specific named
  export). If a package needs ambient globals visible to consumers, prefer
  listing the `.d.ts` file directly in the consumer's own `tsconfig.json`
  `include`/`files`, not a barrel re-export.

## packages/trpc raw-passthrough shape (resolved)

Catalog procedures in `packages/trpc/src/router/` (everything except `user.ts`)
return raw untransformed JioSaavn JSON from `api()` (`packages/trpc/src/lib/api.ts`).
The only transformation is `withDownloadUrl` (`packages/trpc/src/router/utils.ts`),
which decrypts `more_info.encrypted_media_url` into `download_url` and needs
`JIOSAAVN_DES_KEY`. `user.ts` is the authenticated database router, not an
upstream passthrough. Read upstream fields with `isRecord`, `hasIdentity`, and
`mapDownloadUrls` in that utils module, then assert the procedure's declared
output type once. Do not reintroduce `as unknown as` to poke at a payload.
`TRPCContext.session` (`packages/trpc/src/trpc.ts`) is a session or
`() => Promise<session>`. The RSC caller passes `getSession`
(`apps/web/lib/trpc/server.ts`) so public procedures skip the lookup; the fetch
adapter awaits it. Only `protectedProcedure` resolves it.
`@infinitunes/types` (`packages/types/src/*.ts`) now describes that true raw
shape end to end (`title`/`perma_url`/`explicit_content` strings, nested
`more_info`, camelCase module container keys like `songsBysameArtists`,
`currentlyTrending`), verified against both the `jiosaavn-api` project's
`*Request` reference types and live upstream curls. Notable raw-shape quirks
that are easy to get wrong again:

- Entities embedded in an `artistMap`/`similarArtists` list (`ArtistMini`,
  `SimilarArtist`) use `name`, not `title`, like `Artist`/`Label` themselves -
  only song/album/playlist/show/episode top-level objects use `title`.
- `ShowDetails.type` is `"show"` (verified live), not `"season"`; its episodes are keyed
  by the numeric `id` plus `more_info.season_number`, never the perma token
  (`isShowDetails` in `apps/web/components/details-header/details-header-items.ts`).
  Artist and Label also lack a plain `id`/`type` (`artistId`/`labelId`), see `getKind`/`getId`.
- `Quality` (image/download URLs) is a plain templated string, never the
  `{quality,link}[]` array shape some earlier normalized types assumed.
- `TopShows.trendingPodcasts` is an array of `{items, module}` groups, not a
  single `{data, title, subtitle}` object.
- Procedures declare their raw shape with `.output(z.custom<T>())` against a
  `@infinitunes/types` type, so `apps/web` call sites must not re-cast. If you add
  an output type to a procedure, delete the `as unknown as` at its callers in the
  same change; `artist.songs`/`artist.albums` remain output-less on purpose (their
  call sites read a different shape than the router returns); `show.episodes` now
  declares `Episode[]`, and `song.items` is the typed mixed song/episode procedure
  (CD-11). `z.custom` performs no runtime validation - it is a type declaration only.
- Secondary lists (recommendations, trending, same-year, top-songs, top searches)
  return `[]` when upstream is empty; only a missing primary entity throws
  `NOT_FOUND`. Pages `Promise.all` these, so throwing on empty fails the render.
- Before trusting any procedure's shape against its declared type, verify
  live (curl the upstream `__call` from `endpoints.ts` via
  `packages/trpc/src/lib/api.ts`'s `BASE_URL`) rather than assuming a type is
  accurate - the `jiosaavn-api` reference project's own types are sometimes
  stale vs. the live API (e.g. its `AllSearchRequest` album/song items say
  `url`, live data says `perma_url`).
- A `data.pages` value from `useInfiniteQuery` is one array per fetched page
  (`T[][]`), not a flat `T[]` - `apps/web/.../episode-list.tsx` had a bare
  `data.pages as Episode[]` cast (should be `.flat()`) that silently treated
  a whole page-array as a single episode object; grep for `data.pages as` if
  a `SongList`/`SongListClient` consumer throws on an undefined nested field
  that the type says is required.

## Next.js 16 edge middleware lives in `apps/web/proxy.ts` (not `middleware.ts`)

Next 16 renamed the root middleware file to `proxy.ts` with an exported
`proxy` function; `middleware.ts`/`middleware` is the legacy name. This repo
uses the current convention, and it is wired up - `next build` prints
`ƒ Proxy (Middleware)` and a live `next start` returns 403 on a cross-origin
`/api/trpc` request and 307s `/me` to `/login`. Do not "fix" it by renaming to
`middleware.ts`; audits that assume the pre-16 convention flag this as a false
critical. See `node_modules/next/dist/build/templates/middleware.js` (`isProxy`)
for the resolution rule.

## `@infinitunes/db` exports a lazy `db`, `apps/web/lib/auth.ts` exports a lazy `auth`

`packages/db/src/db.ts` exports `db` as a Proxy over `getDb()`, and `apps/web/lib/auth.ts`
exports `auth` as a Proxy over `getAuth()`, so importing `@infinitunes/db` or `apps/web/lib/auth.ts`
never connects or initializes Better Auth at module-evaluation time. This is required because
Next.js evaluates layouts and routes (which import `getUser` / `auth`) while collecting page data,
and `SKIP_ENV_VALIDATION=true` only skips schema validation in `@infinitunes/env` - it does not
supply `DATABASE_URL`. Keep initialization lazy; eager evaluation at module scope breaks
`SKIP_ENV_VALIDATION=true bun run build`.

## Shared local database

`user` and `better_auth_*` are shared with the Lipi app in one local Postgres
(`docs/local-development.md`, "Shared database with Lipi"). Keep the baseline
migration idempotent (`IF NOT EXISTS`), never drop or require `user.name` /
`user.password` (Lipi writes them), and keep the non-production session cookie
prefix distinct (`apps/web/lib/session-cookie.ts`, used by Better Auth and
`proxy.ts`). Opt-in DB tests need `TEST_MIGRATION_DATABASE_URL` (a disposable
admin URL).

## Media URL shapes (playback / artwork)

Both are single strings, and both carry a _replaceable_ token - the recurring
bug is appending to them instead of substituting:

- `download_url` is one comma-separated string, one entry per bitrate in
  `QUALITIES_MAP` order (`packages/types/src/misc.ts`). Consumers must split
  and index it, never hand it to a player whole - see
  `getDownloadLink`/`packages/types/src/media.ts` and
  `apps/web/components/download-button.tsx`.
  The decrypted URL already ends in a bitrate (`_96`/`_160`); `createDownloadLinks`
  must strip it before appending, because the CDN 404s on `..._96_320.mp4`.
- `download_url` is only populated when `withDownloadUrl` ran with a valid
  `JIOSAAVN_DES_KEY` (see above); without it the field stays `undefined`, and
  `getDownloadLink` returns `""`. Never pass that empty string to `load()` in
  `apps/web/components/player.tsx`: Howl's constructor early-returns on an empty
  src (leaving `_sounds` undefined) and react-use-audio-player's `getSnapshotFromHowl`
  then throws `Cannot read properties of undefined (reading 'length')` inside the
  play effect. Guard on a falsy `audioSrc` and `toast` instead of calling `load()`.
- The CDN 404s a `_320` link for songs flagged `more_info["320kbps"] === "false"`.
  `getDownloadCandidates`/`maxQualityOf` (`packages/types/src/media.ts`) cap the
  request, and `use-track-playback.ts` steps down a bitrate on each Howl load error
  (then toasts once and skips). Never pick a link by raw index.
- Images embed a resolution token with _either_ separator: `-500x500.jpg` for
  song/album/playlist artwork, `_150x150.jpg` for artist and some CDN paths.
  Resizing regexes must accept both (`getImageSrc`/`withSize` in
  `packages/types/src/media.ts`).
- Raw titles/subtitles are still HTML-encoded (`&amp;`), so anything putting
  them in a URL must `decode()` then percent-encode, or trailing query params
  get truncated - that is what `ogImageUrl` exists for.

Verify these against live data, not fixtures: a decrypted link should answer
`206 audio/mp4` to `curl -o /dev/null -w '%{http_code} %{content_type}' -r 0-1`.

## View transitions (`app/(root)/template.tsx`, `styles/motion.css`)

- One `<ViewTransition default="vt-page">` in the (root) template triggers a transition for every
  navigation, tab/search-type switch and skeleton reveal. It must stay a trigger only: motion.css sets
  `view-transition-name: none !important` on `[data-vt-page]`, so the root snapshot (viewport sized)
  crossfades. Naming the page snapshots the whole document height and lifts it out of the root, and
  naming shell pieces (sidebar, toolbar, player) makes the glass lose its backdrop (measured: toolbar
  diff mean 44 vs about 2). Never add `view-transition-name` to the shell or the page wrapper.
- Browser back/forward never starts a view transition: React skips popstate commits. Directional
  slides are not possible without naming the page, so there are none.
- The artwork morph: `MorphSource` names the clicked card's art; `MorphSkeleton` (loading skeleton) and
  `MorphArt` (real header art) claim that name inside the transition's commit (`morph-state.ts`).
  Do not name destination artwork statically or via an observer: that raced the commit.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## React and Next.js Best Practices

- **Server vs Client Components**: Layouts and pages should remain Server Components where possible to fetch data and cookies efficiently. Isolate user interactivity (clicks, menus, forms) into dedicated Client Components with `"use client"`.
- **Sidebar Layout Hierarchy**: Keep `<Navbar />` in the content column above `<main>` (the `SidebarInset`), within `<SidebarProvider>`, so the layout stays horizontal and the page has one `main` landmark.
- **Component Imports**: Do not create local component files under `apps/web/components/ui`. Always reference the monorepo package `@infinitunes/ui/components/<name>` and exports in `packages/ui/package.json`.
- **shadcn/ui is read-only**: Do not modify shadcn/ui components (`packages/ui/src/components`). Apply customizations in application components, wrappers, or composition instead.
- **No barrel files in `apps/web/components`**: import from the source file
  (`~/components/slider/slider-card`), never a directory `index.ts`. Barrels were
  removed for tree-shaking/trace reasons; don't reintroduce them.
- **Per-request dedup**: when `generateMetadata` and the page body need the same
  fetch, wrap the fetcher in `cache()` from `"react"` at module scope and call it
  from both, with identical arguments (see the `song`/`album`/`show` detail pages).
- **Avoid `Date.now()` in layout bodies**: a bare `Date.now()` in a layout body
  trips the react-purity lint; use a module-level helper (see `dailyArtistImage()`).

## Zod 4 API

The project uses Zod ^4.6.5. Key differences from Zod 3:

- `z.string()` no longer accepts `required_error` / `invalid_type_error`. Use `error` instead (e.g. `z.string({ error: "..." })`).
- `message` is deprecated; `error` is the replacement.
- `z.preprocess` signature accepts `(arg, ctx) => result` (second `ctx` param is new; single-arg callbacks still work).
- `z.discriminatedUnion`, `.min()`, `.max()`, `.regex()`, `.refine()` APIs are unchanged.
- See `apps/web/lib/env.ts` and `apps/web/lib/validations.ts` for usage examples.

## Shared constants across the monorepo

- `@infinitunes/auth` exports shared Zod auth
  validation schemas (`emailSchema`, `passwordSchema`, `loginSchema` (email-only),
  `signUpSchema`, `resetPasswordSchema`) from `packages/auth/src/schemas.ts`
  (subpath `@infinitunes/auth/schemas`). There is no username schema, plugin,
  or client helper; the legacy `username`/`displayUsername` DB columns were
  dropped by migration `0005_drop_username`. Passkey support comes from the maintained
  `@better-auth/passkey` package (server `passkey()`, client `passkeyClient()`),
  backed by the app-specific `infinitunes_passkey` table. The main
  `@infinitunes/auth` barrel pulls server-only `createAuth` (Better Auth, DB, bcrypt) into the graph, so client
  components must import these via `./schemas`, never from `@infinitunes/auth`.
- `createAuth` in `packages/auth/src/auth.ts` is platform-agnostic: it ships only
  the `passkey` plugin (RP "Infinitunes", per-app `infinitunes_passkey` table)
  and takes extra plugins via `createAuth(db, { plugins })`.
  The web app injects `nextCookies()` at its call site (`apps/web/lib/auth.ts`) -
  nothing under `@infinitunes/auth` may import `better-auth/next-js`. `createAuth`
  passes `secret`/`baseURL` into Better Auth (`BETTER_AUTH_*` wins over `AUTH_*`)
  and never writes `process.env`. The client factory `createAuthClient({ baseURL })`
  in `packages/auth/src/auth-client.ts` defaults to same-origin when passed nothing.
- `@infinitunes/types` is the single source of truth for shared value lists: `LANGUAGES`
  (derive `Lang` from it), `QUALITIES_MAP`, and `parseToken` (the perma-url token extractor used
  by both `apps/web` and `packages/trpc`; don't hand-roll another copy).
- Test layout: `apps/web/tests/` (plain), `apps/web/tests/mocked/` (process-isolated
  `mock.module` suites), `apps/web/tests/dom/` (happy-dom behavior tests).
  Skill/feature docs in `.agents/skills/verify/` and `.agents/skills/verify/features/` cite these.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Colour-mode switches (`lib/theme/mode.ts`)

Switch the mode through `useThemeMode().setMode`, never next-themes' `setTheme` directly. `setTheme`
applies the `dark` class in an effect after render, and every colour transition then eases through the
old colours. `switchThemeMode` sets the class inside the click and holds transitions off for two
frames with `data-theme-switching` (rule in `styles/globals.css`). Don't add `disableTransitionOnChange`
to `ThemeProvider`: its cleanup reads `getComputedStyle` inside the click's microtask, which stalls the
handler.

## Liquid Glass lens sharp edge

Chromium resolves a `backdrop-filter: url(#...)` filter's user space against the element's ink overflow (outer
`box-shadow` reach), not its border box, and clips that overflow to the viewport. `apps/web/components/glass/lens-registry.ts`
offsets the filter by `inkOverflowOrigin(boxShadow, {x: rect.left, y: rect.top})` (`apps/web/lib/glass/shadow-overflow.ts`):
the shadow reach, capped by the surface's distance from the viewport's left/top edge (a menu 48px from the top has
origin y 48, not 57; ignoring the cap left a crisp strip at its bottom). The origin is re-read on `animationend`,
`transitionend` and window resize because anchored popups settle after they register. Verify with an feFlood
filter or a high-contrast stripe layer behind the popup, using full-page screenshots (`clip:` screenshots drop
backdrop filters). Under `forced-colors: active` the runtime picks `frost` and CSS drops every glass backdrop-filter.
See `docs/design-system/glass.md`.

## Liquid glass model and the accent

Glass is the CodePen displacement-map model (`docs/design-system/glass.md`, "The model"); `GlassTuning` and its
ranges, defaults and presets live in `apps/web/lib/glass/tuning.ts`. There is no accent picker and no ambient colour
field: the primary token is neutral, and while `glassTuning.tint` is above 0 it derives from `tintColor` (so the accent
is the tint). A `::before` layer cannot multiply its own `backdrop-filter` result, so under the lens the SVG filter
multiplies the refracted backdrop and the CSS layer fades out via `--g-lens-tint`; the layer is only the frost fallback.

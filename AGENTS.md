# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Monorepo layout

- `@infinitunes/types` is a pure leaf package (zero runtime deps). `User` is NOT
  re-exported from it; import `type { User }` from `@infinitunes/auth`, or from
  `apps/web/lib/auth.ts` which re-exports it for app components.
- In `apps/web/package.json`, `bcryptjs` and `@types/bcryptjs`
  are NOT redundant duplicates of workspace deps: `apps/web/lib/actions.ts`
  imports `bcryptjs` directly, and Bun does not hoist sibling-workspace deps far
  enough for `tsc` to resolve them. Don't "dedupe" these away - type-check
  breaks. `postgres` and `pg`, by contrast, are unused in app source (provided
  by `@infinitunes/db`) and are safe to drop.
- Server data fetching in `apps/web` calls `api.<router>.<procedure>` directly via
  `import { api } from "~/lib/trpc/server"`; `apps/web/lib/jiosaavn-api.ts` has been deleted.

Bun workspaces + Turborepo. The Next.js app is `@infinitunes/web` at `apps/web`
(`~/*` → `apps/web/*`, e.g. `~/lib/utils`; there is no `src` dir). Run all gates from the repo root:
`bun run fmt:check`, `bun run lint` (Oxlint), `bun run type-check`,
`bun run test` (`bun test --pass-with-no-tests`), `bun run build`.
DB scripts (`db:generate|migrate|drop|push|pull|studio|check`) forward to
`@infinitunes/db` via `bun run --filter`. Single canonical `bun.lock` at root.

## Build / delivery sharp edges

- Env validation (`apps/web/lib/env.ts`) runs at build time and fails
  without real vars. Use `SKIP_ENV_VALIDATION=true` for source-compilation only.
- Turbo filters env vars: any build/runtime var (incl. `SKIP_ENV_VALIDATION`)
  must be listed in `turbo.json` `globalPassThroughEnv` to reach `next build`.
- Turbo `outputs` are package-relative; the web build output is `.next/**`.
- Docker uses `apps/web` standalone output, which nests the server at
  `apps/web/.next/standalone/apps/web/server.js` (entrypoint `node apps/web/server.js`).
  `next.config.ts` sets `outputFileTracingRoot` to the repo root when `IS_DOCKER`.
- `packages/trpc/src/lib/download.ts`'s `createDownloadLinks` needs `JIOSAAVN_DES_KEY`
  in `turbo.json` `globalPassThroughEnv` (alongside `JIOSAAVN_API_URL`) or every song's
  `download_url` silently comes back empty under `bun run dev`/`build`, which crashes
  the player (empty Howler src). Every song array a router returns must be mapped
  through `withDownloadUrl` (`packages/trpc/src/router/utils.ts`) before reaching
  the client, not just the song-details/podcast-episode endpoints.
- `des-ecb` (used by `createDownloadLinks`) is unsupported by plain Node's default
  OpenSSL 3 build (`next dev` runs under Node even when invoked via `bun run dev`), but
  works under Bun's own crypto. Locally reproduce with `NODE_OPTIONS=--openssl-legacy-provider`;
  don't add that flag to the repo, it's a local-verification workaround only.
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

Every `@infinitunes/trpc` procedure (`packages/trpc/src/router/*.ts`) does
`return api(endpoints...)` unmodified - raw untransformed JioSaavn JSON - with
the single documented exception of `withDownloadUrl` (decrypts
`more_info.encrypted_media_url` into `download_url`, needs `JIOSAAVN_DES_KEY`).
`@infinitunes/types` (`packages/types/src/*.ts`) now describes that true raw
shape end to end (`title`/`perma_url`/`explicit_content` strings, nested
`more_info`, camelCase module container keys like `songsBysameArtists`,
`currentlyTrending`), verified against both the `jiosaavn-api` project's
`*Request` reference types and live upstream curls. Notable raw-shape quirks
that are easy to get wrong again:

- Entities embedded in an `artistMap`/`similarArtists` list (`ArtistMini`,
  `SimilarArtist`) use `name`, not `title`, like `Artist`/`Label` themselves -
  only song/album/playlist/show/episode top-level objects use `title`.
- `ShowDetails.type` is the literal `"season"`, not `"show"` - the show detail
  page's own UI/routing concept of "this is a show" has to be derived
  separately (see `apps/web/components/details-header/details-header.tsx`'s
  `getKind`/`getId` handling of `Label` and `Artist`, which also lack a plain
  `id`/`type` field and use `labelId`/`artistId` instead).
- `Quality` (image/download URLs) is a plain templated string, never the
  `{quality,link}[]` array shape some earlier normalized types assumed.
- `TopShows.trendingPodcasts` is an array of `{items, module}` groups, not a
  single `{data, title, subtitle}` object.
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

## Media URL shapes (playback / artwork)

Both are single strings, and both carry a _replaceable_ token - the recurring
bug is appending to them instead of substituting:

- `download_url` is one comma-separated string, one entry per bitrate in
  `QUALITIES_MAP` order (`packages/types/src/misc.ts`). Consumers must split
  and index it, never hand it to a player whole - see
  `getDownloadLink`/`~/lib/utils` and `apps/web/components/download-button.tsx`.
  The decrypted URL already ends in a bitrate (`_96`/`_160`); `createDownloadLinks`
  must strip it before appending, because the CDN 404s on `..._96_320.mp4`.
- `download_url` is only populated when `withDownloadUrl` ran with a valid
  `JIOSAAVN_DES_KEY` (see above); without it the field stays `undefined`, and
  `getDownloadLink` returns `""`. Never pass that empty string to `load()` in
  `apps/web/components/player.tsx`: Howl's constructor early-returns on an empty
  src (leaving `_sounds` undefined) and react-use-audio-player's `getSnapshotFromHowl`
  then throws `Cannot read properties of undefined (reading 'length')` inside the
  play effect. Guard on a falsy `audioSrc` and `toast` instead of calling `load()`.
- Images embed a resolution token with _either_ separator: `-500x500.jpg` for
  song/album/playlist artwork, `_150x150.jpg` for artist and some CDN paths.
  Resizing regexes must accept both (`getImageSrc`/`withSize` in `~/lib/utils`).
- Raw titles/subtitles are still HTML-encoded (`&amp;`), so anything putting
  them in a URL must `decode()` then percent-encode, or trailing query params
  get truncated - that is what `ogImageUrl` exists for.

Verify these against live data, not fixtures: a decrypted link should answer
`206 audio/mp4` to `curl -o /dev/null -w '%{http_code} %{content_type}' -r 0-1`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## React and Next.js Best Practices

- **Server vs Client Components**: Layouts and pages should remain Server Components where possible to fetch data and cookies efficiently. Isolate user interactivity (clicks, menus, forms) into dedicated Client Components with `"use client"`.
- **Sidebar Layout Hierarchy**: Always nest `<Navbar />` inside `<SidebarInset>` above `<main>` within `<SidebarProvider>` to avoid breaking the horizontal layout.
- **Component Imports**: Do not create local component files under `apps/web/components/ui`. Always reference the monorepo package `@infinitunes/ui/components/<name>` and exports in `packages/ui/package.json`.
- **No barrel files in `apps/web/components`**: import from the source file
  (`~/components/slider/slider-card`), never a directory `index.ts`. Barrels were
  removed for tree-shaking/trace reasons; don't reintroduce them.
- **Per-request dedup**: when `generateMetadata` and the page body need the same
  fetch, wrap the fetcher in `cache()` from `"react"` at module scope and call it
  from both, with identical arguments (see the `song`/`album`/`show` detail pages).

## Zod 4 API

The project uses Zod ^4.4.3. Key differences from Zod 3:

- `z.string()` no longer accepts `required_error` / `invalid_type_error`. Use `error` instead (e.g. `z.string({ error: "..." })`).
- `message` is deprecated; `error` is the replacement.
- `z.preprocess` signature accepts `(arg, ctx) => result` (second `ctx` param is new; single-arg callbacks still work).
- `z.discriminatedUnion`, `.min()`, `.max()`, `.regex()`, `.refine()` APIs are unchanged.
- See `apps/web/lib/env.ts` and `apps/web/lib/validations.ts` for usage examples.

## Shared constants across the monorepo

- `@infinitunes/auth` exports `USERNAME_REGEX` / `USERNAME_MIN_LENGTH` / `USERNAME_MAX_LENGTH`
  from `packages/auth/src/constants.ts`. The main `@infinitunes/auth` barrel pulls server-only
  `createAuth` (Better Auth, DB, bcrypt) into the graph, so client components must import these via
  the `./constants` subpath (`@infinitunes/auth/constants`), never from `@infinitunes/auth`.
- `@infinitunes/types` is the single source of truth for shared value lists: `LANGUAGES`
  (derive `Lang` from it), `QUALITIES_MAP`, and `parseToken` (the perma-url token extractor used
  by both `apps/web` and `packages/trpc`; don't hand-roll another copy).

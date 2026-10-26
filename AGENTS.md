# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Monorepo layout

- `@infinitunes/types` is a pure leaf package (zero runtime deps). `User` is NOT
  re-exported from it; import `type { User }` from `@infinitunes/auth`, or from
  `apps/web/lib/auth.ts` which re-exports it for app components.
- `@infinitunes/core` (`packages/core`) holds platform-agnostic app logic shared by web and
  mobile, one subpath export per module (no barrel): error mapping (`error-code`,
  `user-message`), `entity-route` (the app paths both apps share, parsed from perma URLs),
  `queue-position`, `playback-order` (next/prev/shuffle/repeat rules), `favorites` (likable
  types, copy), `optimistic-owner`, `liked-songs` (chunked detail fetching),
  `artist-pagination`, `greeting`, `recent-searches`, `validations` (zod forms), and `react/*`
  hooks and stores that need only `react` (`optimistic-favorite`, `optimistic-playlists`,
  `position-store`, `use-playhead`, `use-track-playback`, `use-radio-refill`,
  `use-debounced-value`). Upstream-shape readers shared by both apps (launch data, search
  items, languages, cards, `plainText`, `isExplicit`) live in `@infinitunes/types`. Each app keeps only its
  glue (toasts or the mobile failure snackbar, audio engine, mutations). Raw-shape test payloads live in
  `@infinitunes/types/fixtures`. It must not import `next/*`, the DOM or `@infinitunes/ui`
  (`.oxlintrc.json` bans DOM globals in `packages/core/src`); its DOM hook tests live in
  `packages/core/tests/dom` (`bun run test:dom`), and `type-check` covers `src` and `tests`.
- `bcryptjs` is imported only by `packages/auth`, `packages/db` and `packages/trpc`
  (it ships its own types; `@types/bcryptjs` is not needed). `apps/web` no longer
  imports it. `postgres` and `pg` are unused in app source (provided by `@infinitunes/db`).
- `@infinitunes/ui` (`packages/ui`) is web-only (DOM, Tailwind v4, Base UI,
  `next-themes`); never import it from a React Native or Expo app - mobile
  components belong in a separate package, not a wrapper around these.
  See `packages/ui/README.md`.
- Server data fetching in `apps/web` calls `api.<router>.<procedure>` directly via
  `import { api } from "~/lib/trpc/server"`; `apps/web/lib/jiosaavn-api.ts` has been deleted.
- An email change never writes the `user` row from tRPC: `user.requestEmailChange` calls `ctx.requestEmailChange` (web: Better Auth `changeEmail` in `apps/web/lib/auth.ts`), which mails a link to the new address; `user.updateUser` is name-only.
- User database operations live in `packages/trpc/src/router/user.ts`; the
  `apps/web` query and action modules are thin Next.js wrappers for those
  procedures and own cache invalidation or redirects.

Knip is installed for manual dead-code analysis; do not apply its findings automatically.

Bun workspaces + Turborepo. The Next.js app is `@infinitunes/web` at `apps/web`
(`~/*` → `apps/web/*`, e.g. `~/lib/utils`; there is no `src` dir). Run all gates from the repo root:
`bun run fmt:check`, `bun run lint` (Oxlint), `bun run type-check`,
`bun run test` (runs plain tests, then `test:isolated`, one process per file for the `mock.module`,
happy-dom and router suites (`scripts/test-isolated.ts`), then `test:mobile`, the app's Jest), `bun run build`.
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
    header, tab row and shelves mounted (`@infinitunes/core/entity-route`); search results
    live in a `search/(results)` group whose layout keeps the title and type chips.
    Old `<name>-songs` artist URLs (and JioSaavn's own links) are 308-redirected in
    `proxy.ts`; `getHref` already links the tab routes. Labels follow the same frame:
    `label/[name]/[token]/{page,albums}` (Songs is the bare route), no `loading.tsx`.
  - `/settings` is one page (sections Account, Appearance, Playback, Security; the old
    `/settings/appearance` and `/settings/preferences` 308 to `#appearance` / `#playback`
    from `next.config.ts`, list in `lib/legacy-redirects.ts`). Its shell, rail, search and
    appearance cards prerender; account, playback and security stream in behind skeletons
    (`settings-skeletons.tsx`), so it has no `loading.tsx`. The search works through
    `SettingsRow`/`SettingsBlock` (`data-settings-row`, hidden by `useSettingsMatch`) and
    CSS `:has()` on cards and sections; give every new control a `SettingsRow` with keywords.
    The profile form and passkey UI are `next/dynamic` (`account-lazy.tsx`) to stay out of
    first-load JS.
  - Entity pages (album, playlist, song, show, episode, mix, radio detail,
    `/me/*` pages) are whole-page data: they keep a route `loading.tsx`
    with a skeleton that mirrors the page, and Suspense only for secondary lists.
    Artist and label tab frames (above) use a layout with Suspense instead.
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
- First-load JS rules (budget in `scripts/check-budget.ts`, run `bun run budget`):
  - No TanStack Query or tRPC React provider at the root. Imperative calls (play, radio, surprise,
    player refill) use the vanilla client `trpc` from `~/lib/trpc/vanilla`; only infinite lists,
    search and lyrics wrap themselves in `QueryScope` (`components/query-scope.tsx`) and pass
    `trpc.x.y.query` as `queryFn`. Never import `@tanstack/react-query` from a component the shell
    or a list-less route renders.
  - Toolbar popups (search palette, language picker, user menu, Music mega menu, create-playlist
    dialog, the per-row "more" menu and drawer) are a closed shell trigger plus a lazy chunk (`hooks/use-deferred.ts`): hover, focus,
    pointer down, Ctrl/Cmd+K or an arrow key start the import; click before it lands opens it on
    arrival (`defaultOpen`). The shell trigger must render the same classes and ARIA as the real
    one (share the class/props module, see `language-trigger.tsx`; `tests/dom/deferred-popups.test.tsx`
    pins nav). Do not import `Dialog`/`Drawer`/`Popover`/`DropdownMenu`/`NavigationMenu` statically
    from anything the layout renders.
  - The glass engine (`start-glass-runtime`, lens registry) is its own chunk, started on idle by
    `GlassRuntime` (or by the first popup intent). Register surfaces through `whenGlassRuns` /
    `registerWhenReady` in `components/glass/glass-loader.ts`; never import `lens-registry` or
    `start-glass-runtime` statically from shell code. Surfaces show the frosted fallback until then.
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
- `createDownloadLinks` decrypts with `crypto-js`, not `node:crypto`: Node's OpenSSL 3
  has no `des-ecb` (`next dev`/`start` run under Node even via `bun run`), so no
  `--openssl-legacy-provider` is needed. Don't switch it back.
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

## apps/mobile (`@infinitunes/mobile`, Expo SDK 58)

- Layout (`~/*` → `apps/mobile/src/*`): `app/` holds thin route files only (Expo Router, typed routes);
  `features/<name>/` holds one area's screens and hooks and never imports another feature; anything two
  features use lives in `components/` (`ui/` primitives, `detail/` the entity-screen frame, `form/` the form
  kit), `lib/` (clients, `preferences`, `share`, `download`, `use-infinite-list`, `use-pending`, `meta`),
  `playback/` (player, `play-collection`, `radio`), `user-data/` (session, favorites, every playlist write),
  `navigation/` (`entityHref`, stack options, header actions, player dock) or `theme/` (tokens, `appearance`).
- Tabs (`app/(tabs)/_layout.tsx`): Home, Radio, Library, Search. iOS Search is the system search tab
  (separate trailing circle in both expanded and collapsed states, last in JSX): expo-router's `role="search"`
  reaches react-native-screens only as `ios.systemItem` (the magnifier, a plain tab in the pill on iOS 27); the
  `UISearchTab` (separate trailing glass circle, header field in the bar) needs
  `unstable_nativeProps={{ ios: { role: "search", automaticallyActivatesSearch: true } }}` (26.1+);
  below that the field stays under the large title (`hideWhenScrolling: false`). Android has Search as a
  fourth tab (`md="search"` in its navigation bar, Material 3 search bar at root). Each is a route group with its own `Stack` (`tabStackOptions`); a new tab needs a
  `NativeTabs.Trigger` with an `sf` and an `md` icon. On iOS 26 the mini player is the bar's
  `NativeTabs.BottomAccessory` (`AccessoryMiniPlayer`; `usePlacement()` `inline` drops Next) and the bar
  minimizes on scroll down. New Playlist is the Library Playlists `SectionHeader`'s "New" action; `/create`
  links open `/create-playlist` (`+native-intent`).
  Settings is not a tab: the root screens' `headerRight` is `TopLevelActions` (`navigation/top-level-actions`:
  Settings, the avatar or Sign In), which push onto the current tab. Languages is in Settings
  only, not the header. On iOS 26 `useTopLevelHeaderOptions(title)` puts the page title at the top left (a custom
  header item, no large title) and Settings and Profile as native buttons sharing one glass capsule at the right. Android's
  Search tab hides the app bar for its own M3 search bar (`features/search/search-header.android.tsx`: a
  visible Back in every state, clear while there is text; the native field sat after the toolbar's 72dp inset)
  and autofocuses it (Back goes Home). The auth stack's iOS root gets Close (`authHeaderOptions`); Android shows no bar title.
- Routes are the web's paths (`@infinitunes/core/entity-route`): detail screens, `search` and the account
  screens (`settings`, `profile`, `password`, `delete-account`) live once in `(tabs)/(home,search,library,radio)/`
  (entities as `<type>/[name]/[token]`, `show/[name]/[season]/[token]` and `artist/[name]/[token]/{index,[tab]}`, `song/[name]/[token]/{index,credits}` (mobile-only Credits screen, `creditsHref`; the song screen shows no credits inline, "View Credits" is in `SongMenu` and the song header menu);
  the season or tab only selects what opens, switching stays in the screen, whose header scrolls in the one
  list), so they open in the current tab and a web link with the app's scheme lands on them (a cold link in
  Home's stack). `+native-intent` maps legacy `<name>-songs` artist links and sends `/search?q=` (Siri,
  Assistant) to the Search tab, `/(tabs)/(search)/search` (a bare `/search` is ambiguous across the tab stacks). Lists are
  `/album`, `/artist`, `/playlist`, `/show`, `/chart`, `/browse` in `(home)` and `/radio` in `(radio)`. Link with
  `entityHref(type, perma_url)`, never a hand-built path (`entityRoute` reads only the type's own section,
  `SECTIONS`, at exact arity: anything else is `undefined`, an unpressable item); open from handlers with
  `useOpenEntity()` (it closes the player and sheets first). `/player` is `dangerouslySingular`. Sheets are
  native `formSheet` routes (`/languages`, `/create-playlist`; Android draws no header there, so the
  route renders `SheetHeader`, and a sheet's empty state uses `EmptyState placement="top"`: content lays out at the
  largest detent) or `@expo/ui`'s `BottomSheet`. Scroll
  containers are `ScreenScrollView` (or a list with `contentInsetAdjustmentBehavior="automatic"` and
  `playerDockInset` bottom padding), or large titles and the floating mini-player overlap content. Route-tree
  tests (`navigation/routes.test.tsx`): every tab renders at once, so query inside the selected one, and sign in
  before `renderRouter` (an `act` with no root mounted breaks it for the rest of the file).
- Playback: one expo-audio `AudioPlayer` (`playback/audio-engine.ts`; not `AudioPlaylist`, which reports no load
  error, so no bitrate step-down) driven by `PlaybackController` (root layout) from `playerStore`. Screens only
  call actions (`playAll`/`shuffleAll`/`playFrom` in `playback/play-collection.ts`, `playNext`, `addToQueue`,
  `startSeededRadio(radioSeedOf(rows))`, `playEntity(type, url)` for a card's item) and read slices with `usePlayer(selector)`, `usePlaybackStatus`,
  `usePlaybackPosition`; `togglePlayback`/`seekTo` in `playback/transport.ts`. The lock screen gets metadata,
  play/pause, scrubbing and next/previous: `patches/expo-audio` (applied by `scripts/apply-patches.ts` on `postinstall`,
  as bun's `patchedDependencies` fails on the isolated layout) makes the single player report the lock screen,
  headset and Bluetooth buttons as a `remoteCommand` event (`nextTrack`/`previousTrack`), which the controller maps to
  `skipToNext`/`skipToPrevious`; the options set `showNextTrack`/`showPreviousTrack` (they replace the seek buttons).
  Native status includes `bufferedTime` in seconds (iOS loaded range end, Android buffered position), refreshed while paused/loading for player buffering tracks.
  Android's buttons are player commands (`COMMAND_SEEK_TO_NEXT`/`PREVIOUS`), not custom session commands (One UI
  drops those), and the injected session metadata carries the duration (else the notification's bar stays empty).
  `apps/mobile/package.json` `expo.autolinking.buildFromSource: ["expo-audio"]` is required: SDK 58 links a prebuilt
  AAR (`local-maven-repo`) that ignores the patched Kotlin. Native code: needs a rebuild, and an expo-audio upgrade
  must regenerate the patch (diff a pristine `npm pack` against the patched copy, excluding `android/build`). expo-audio sets `error` on
  one status event only (the next one, often in the same JS task, says `null`) and nothing guarantees a
  rendered status between `replace` and the next failure, so the controller latches each load's error/loaded
  from its listener; never feed `useAudioPlayerStatus().error`/`isLoaded` to `useTrackPlayback`.
  Each native `replace` increments `sourceGeneration`; status events carry it at emission. Route
  JS replacements through `replaceSource` and filter status with `isCurrentSource`, since an event
  emitted before replacement can reach JS afterward. Remote commands are global queue intent and
  are never source-gated. This needs the patched native binary on both platforms.
- Frequently played songs cache in `Paths.cache/frequent-songs`, separate from explicit downloads.
  `lib/song-cache.ts` persists its index and counts with zustand + `persistedStorage`: two listens
  with at least half the song heard qualify (seeks do not count), enabled by default. The 500 MiB
  cap evicts least recently played files; Stream quality controls downloads. The controller selects
  a matching local source and evicts/retries streaming at the same bitrate on local load errors,
  preserving the shared bitrate ladder. Storage settings clear only this directory and reset counts.
  `infinitunes://action/clear-cache` clears it and lands on Home. It is one
  of the four launcher shortcuts on both platforms; Library remains Android Assistant-only.
- Player wash (D3, Now Playing and the Android dock): seed from `react-native-image-colors`, palette and AA check in
  `lib/artwork-colors.ts`; no seed or a contrast miss is `null`, the D1 tokens. Lay content on it with `OnWash`/`WashText`.
- Notifications: the media notification / lock screen is expo-audio's own (Android Media3 foreground service, iOS Now
  Playing; no custom code or icon), activated once (`setActiveForLockScreen`, which rebuilds the Android session) and then
  fed by `updateLockScreenMetadata`. Local notifications (`expo-notifications`, no push, `enableRemoteNotifications: false`)
  live in `lib/notifications.ts`: the Downloads channel, the `brand` teal accent (repeated in `app.config.ts`) and
  `ensureNotificationPermission`, the one place that asks (first download only; once, never again after a denial; `asked`
  is set after the prompt resolves). Playback never asks: Android 13+ exempts media-session notifications from
  `POST_NOTIFICATIONS`. The channel is created before asking only because apps targeting API <= 32 need it first.
- Entity screens are `DetailFrame` (skeleton, NOT_FOUND or `null` data as not found, retry, native header with
  Share via `detailHeaderOptions`) or `DetailScreen` (that frame around one refreshable scroll view; with `list` the page's own `TrackListPage` FlashList is that view, so album, playlist and mix rows are virtualized); a hook
  that finds nothing returns `null` from `select`. Spread `useDetailScrollProps()` (`components/detail/detail-scroll.tsx`)
  on every detail scroll view: on Android it swaps the app bar to `card` with the title once the header art
  scrolls under it. `EntityHeader` takes `onPlay`, optional `onShuffle`, `like`,
  `eyebrow` (the kind and year, "Album · 2026"), `subtitle` (the credit), `meta` (counts, duration, plays),
  `explicit` (`isExplicit` from `@infinitunes/types`: upstream sends "0"/"1"), `verified`, `onSubtitlePress` (a sole artist: the credit becomes an underlined link) and `menu`
  (`{ rows, radio?, extra? }`: play next, queue, add all to a playlist, radio, download all) and `like`. The `menu` and the
  favourite (a first "Like <name>" entry; signed out it asks to sign in) are not in the
  header: `DetailMenu` registers its entries with `DetailFrame`, whose `detailHeaderOptions` puts Share + a native
  `menu` item (a real `UIMenu`) in `unstable_headerRightItems` on iOS 26 (one glass capsule), and Share + a `more_vert`
  `NativeMenu` in `headerRight` elsewhere. The action row is Apple Music's: centred Shuffle, Play, Download (download all songs,
  works signed out): Play is the solid capsule hugging icon and label (`Button roomy`), the two circles are equal on a
  `translucentFill` that shows the wash through. The header sits on a wash of the artwork colour (`usePlayerColors` + `OnWash`, from
  `features/player`, fading to the page background; no seed or a contrast miss is no wash) and the art is 248pt.
  Compact UI: a symbol alone replaces icon-plus-text wherever it is unambiguous (`IconButton` `variant`
  `filled`/`tonal`, `large` for a screen's Play; keep the label); text stays on submits and empty-state actions.
  Skeletons must mirror the loaded layout (`EntityHeaderSkeleton` `shuffle`/`like`/`subtitle`/`meta` match the
  header; overlay skeleton on loaded page to check). Loading marks are `Spinner` (Compose M3E `LoadingIndicator` on Android). Menus are `NativeMenu` entries that carry their action
  (`addToPlaylistEntry`, which ends with New Playlist, the `/create-playlist` sheet; `playRadioEntry`);
  `SongMenu` is the track's (a row's is `SongMenuButton`: Android mounts it on the first press; iOS `MenuView.show()` is a no-op, so iOS rows keep one each). Long detail text (a show's or episode's description) is `Description`
  (`components/detail`, three lines plus Read More); a list's one-of-many order is an `OptionMenu`, not a second
  `SegmentedTabs` (the artist's "Sort by"). Every titled group starts with `SectionHeader` (`title`, optional text `action`;
  it carries the 16/8 rhythm, sections add no padding). Every row is `ListRow` (artwork, icon or track-number
  leading, at most two trailing 48pt controls or `{ chevron: true }`; `checked` makes it a checkbox, `selected`/`paused`
  the current track; without `href`/`onPress` it is a labelled view whose picture alone dims); `SongRow` (`toSongRow`
  row or queue entry, `removal`, `leading="index"` for albums: `TrackList numbered`, which also shows the length;
  `DetailSkeleton numbered` matches) and `MediaRow` (`href` or
  `onPress`) are built on it, `EntityListItem`s feed a screen's one `FlashList`; on iOS a row that navigates
  shows a disclosure chevron, and a paged list ends with `EndOfList` (`components/end-of-list.tsx`). Cards: `MediaCard`/`Shelf`
  (`toCardItem` items, `seeAllHref`, `onItemPress`, `variant="hero"` for home's M3 hero carousel: one
  `useHeroWidth()` card leaving a 56dp peek, snapping per card, the only card with `CardPlayButton` and an
  `eyebrow(item)`), `QuickPickTile` for tiles, `GridCell columns` for each cell of a card `FlashList`; grids
  take `{ columns, width }` from `useGrid("picks" | "browse" | "cards")` (`GRID_COLUMNS` per `useWindowClass()`,
  compact/medium/expanded at 600/840, widths floored to a device pixel; never a fixed count; Jest defaults to a 390pt phone). Headers, forms and settings cap at
  `max-w-readable` (`sizes.readable`), centred. Press feedback that moves is
  `usePressScale` (`lib/use-press-scale`: a Reanimated sink-and-spring on an `Animated.View` around the art or tile). Filter chips are `ChipRow` (`tabs` when they switch the content below, as search's do). A card's long press and screen reader actions offer
  the menu's entries (`useCardMenuEntries`: Play, Shuffle, Play Next, Add to Queue, Add to Playlist, Favourite, Share; songs: `useSongMenuEntries`, a
  Favourite/Share `quick` group first) through `CardLink`, `SongContextLink` (song rows) and `QueueRow`, all on `components/context-menu.tsx`:
  iOS is `ContextLink` (the link's own `Link.Menu` plus `Link.Preview` with children: the compact opaque `ContextPreview`, explicitly sized,
  never the destination's live screen, which floated transparent over the page; a song row's tap plays via `preventDefault`), Android
  `LongPressMenu` mounts a `NativeMenu` on the first long press; never wrap each item in a `MenuView` (one native host per item). The system
  lifts and snapshots the link's trigger view, so it must be the whole row and paint an opaque background (`QueueRow`'s `LiftableRow`).
  `ExplicitBadge accessible={false}` inside a row or card whose label already says "Explicit".
  Stations open `/radio/<name>/<token>`. Artwork goes through `Artwork` with a `size` token (edge, radius and
  resolution: 150px while it covers the edge's physical pixels, `PixelRatio`, else 500px; capped by the Image
  quality preference, so soft art on a device is usually that setting, not the code). Pull to refresh is
  `PullToRefresh` (`components/ui/refresh-control.tsx`): it owns `refreshing` for its own pull, so never feed a
  query's `isRefetching` to a `RefreshControl` (a focus refetch would pin the spinner open), and it colours
  Android's spinner (`primary` on `card`). `useInfiniteList` pages by number (`firstPage`, `enabled`, items flattened and deduped; an
  empty page always ends the list, whatever upstream's `last_page`/`total` say). Forms show a server refusal
  as `FormError` and move focus to it with `useFocusOnRefusal`.
- Now Playing (`features/player/full-player.tsx`) is a `transparentModal` page, Apple Music's model: a grabber,
  drag down outside a list to close (`useDismissPan`; not the native stack's vertical swipe, which also starts on
  sideways drags), swipe the art, the title or the mini player sideways for next/previous (`useSwipeable`, with
  `nextTrack`/`previousTrack` screen reader actions). Lyrics and Up next are views of it, not routes:
  `?view=lyrics|queue` (`router.setParams`; the `/queue` link maps there in `+native-intent`). They fly the art into
  a compact header; the queue view keeps the wash (`OnWash` recolours token-toned `Text` through `TextInkContext`; iOS system colours ignore NativeWind vars) and moves shuffle/repeat to pills.
- Player sharp edges: Now Playing's art is expo-image with a `CROSSFADE_MS` cross-dissolve, not `Artwork`
  (its `recyclingKey` drops the old picture). expo-symbols has no replace transition and replays an
  `animationSpec` on every prop update, so set one only briefly (`useGlyphBounce`). react-native-screens gives
  Android form sheets 0 corners: the root layout sets `sheetCornerRadius` to `radii.xl` there.
- Haptics fire only through `lib/haptics.ts` (intent-named: `tap`, `selection`, `toggle`, `confirm`, `reject`, `longPress`, `dragStart`, `commit`; iOS `expo-haptics` generators, Android `performAndroidHapticsAsync`), never `expo-haptics` directly. Buttons, icon buttons, chips, Android segments/switches, pull to refresh, swipe commit, drag, likes, playlist writes and `showFailure`/`FormError` already fire; native iOS controls (UISwitch, segmented control, tabs, menus) tick themselves, so add none there; plain row navigation and scrolling stay silent. Jest mocks `expo-haptics` globally (`test/setup.ts`).
- Failures, never successes, show in the one `FailureSnackbar` (root layout; M3 snackbar on Android, a glass
  banner in a `FullWindowOverlay` on iOS so it covers modals): `showFailure(message, action?)` or
  `.catch(reportFailure(fallback))` from `lib/failure.ts`, usable outside React. `reportFailure` shows the
  server's `userMessage` only for coded tRPC errors (network errors get the fallback). No `catch {}` that
  swallows a failure the listener caused; a play superseded by a newer one stays quiet (`isCurrent()`).
- Writes follow the web's optimistic overlays: `LikeButton`/`useFavoriteToggle` and every playlist write in
  `user-data/playlists.ts` (create, rename, delete, add, remove, move; removals and moves take the server's
  copy from `useServerPlaylistDetails`); failures roll back and report, signed out they `promptSignIn` (to `/login`).
  Per-user queries key on `userQueryKey(procedureKey, userId)` so one account's cache never shows for the
  next (`getUserFavorites` has no row for a new user: return a value, a query may not resolve `undefined`);
  per-user lists that are not `user.*` procedures key under `LIBRARY_QUERY_KEY`, which sign-out
  (`forgetUserData`) drops with `user.*`.
  Persist client state with zustand `persist` + `persistedStorage` (SQLite kv-store, synchronous reads so
  stores hydrate before the first render), never secrets.
- Native look per platform: `NativeTabs` and headers keep the system surfaces (glass on iOS 26, Material You on
  Android) and set no background colours; the only colour is the listener's accent, as `NativeTabs`'
  `tintColor`/`indicatorColor` (`app/(tabs)/_layout.tsx`), plus Android's detail app bar, which
  `useDetailScrollProps` tints to `card` on scroll. Platform differences go in `.ios.tsx`/`.tsx` pairs or `Platform.select`, never in screens. Style
  with semantic classes (`bg-card`, `text-muted-foreground`; iOS maps them to UIKit system colours, Android 12+
  to Material You roles at runtime: `DynamicColorRoot` sets them as NativeWind `vars()` on a root view in
  `providers/app-providers.tsx`; never css-interop internals), colour JS props from
  `usePalette()`/`useTokenColor()` or `useTheme().colors`, text via `Text` `variant`/`tone`. Sizes come from
  `theme/tokens.ts` (`space`, `radii`, `art`, `iconSize`, `sizes`, `textStyles`), never literals. NativeWind's
  rem is 14, so `theme.spacing` is closed to `spacingScale` (`0`, `px`, `*-1 2 3 4 6 8 12`, the named `sizes`)
  plus `full`: any other spacing class compiles to nothing and NativeWind drops it silently, so
  `theme/spacing.test.ts` scans the sources and fails on one. Icons take `iconSize` names only.
- Android is Material 3 Expressive at YouTube Music density (spec and mockup: `docs/design/android-m3-expressive/`).
  Its tokens are the android branches in `theme/tokens.ts` (`radii` 4/8/12/16/28, `emphasizedWeights` behind
  `Text emphasized`, a no-op on iOS; `sizes.seam`) and the springs in `theme/motion.ts` (Compose's
  `MotionScheme.expressive()`, `damping` as a coefficient; iOS's `iosPressRelease` lives there too). Android-only
  looks: `Button` and filled/tonal `IconButton` (40dp container + slop, 56dp `large`; corners morph full to `sm`
  while pressed), `ListRow`'s current track (tonal container; the `Equalizer` mark is both platforms'), the outlined `FormField`, the Top Result card, `segmented-tabs.android.tsx` (connected button group), `ChipRow` (8dp filter chips with a check),
  the dock's filled play circle and Now Playing's paused-square/playing-circle play button, Settings as a segmented
  list. One UI resolves `onSurfaceVariant` to `onSurface`; `withDynamicRoles` fades `muted-foreground` then (keep it).
  The top app bar is `surface`; a detail screen's bar shows its title only once the header art has scrolled
  under it. The design details (type, shape, components) are the spec's, keep it current. Adding a `.android.tsx` beside
  an existing module needs its importers touched (or Metro restarted) before a running dev client picks it up.
- Accessibility: every tappable control is at least `sizes.touch` (48; `IconButton`, `Button`, `MenuTrigger` for a
  `NativeMenu`'s face, `DragHandle`, `FormLink` for a form's text link) or reaches it with `hitSlop` (`CHIP_HIT_SLOP`,
  `TEXT_BUTTON_HIT_SLOP`). Android drops a touch outside a parent's bounds (an `overflow: hidden` view's own, else
  its children's frames, never their slop) before its children, so slop on a wrapped or clipped child never
  fires: the pressable must be the outermost view (`Button`, `IconButton`; `Button` takes a layout `style`, no
  class, for that reason). A native
  menu hit-tests its child's bounds, so its trigger needs the full height, not slop (`OptionMenu`). Rows and
  fields use `min-h-*` so Dynamic Type grows them (cap text with `maxFontSizeMultiplier` only in fixed-height chrome, the
  mini player). An item without a screen is a labelled `View`, never a disabled `Pressable`. Custom pressables set role,
  label and state; a drag has `ReorderActions`, the scrubber `increment`/`decrement`. `announce()` (`lib/announce.ios.ts`)
  speaks results VoiceOver cannot see (likes, a new field error). Reanimated CSS animations ignore reduce motion: gate them with
  `useReducedMotion`. `iosSystemColors` leaves out `muted-foreground` and `destructive` (3.1-3.6:1 on light iOS
  surfaces); `tokens.test.ts` pins AA for every text pair, on the palettes and on generated Material You schemes.
- Data: `useQuery(trpc.<router>.<proc>.queryOptions(input))` from `~/lib/trpc`; imperative calls use
  `trpcClient`. The query client skips retries for NOT_FOUND, BAD_REQUEST, FORBIDDEN, UNAUTHORIZED and
  TOO_MANY_REQUESTS (`shouldRetry`), so hooks set no `retry`; `getErrorCode` names the proxy's own code-less
  403/429 answers FORBIDDEN/TOO_MANY_REQUESTS. Library lists (`useResolvedItems`) count ids upstream no
  longer has as `missing`; only a real failure is an error, all-missing shows the "no longer available" state. Home, Top Charts and Top Albums' "All" pass `useCatalogLang()`
  (the Languages preference) as `lang`. Only `import type` from `@infinitunes/trpc/types`; never
  `@infinitunes/ui` or the `@infinitunes/auth` barrel (`./session-cookie`, `./native-app`, `./schemas` are safe).
- Native fetch sends no `Origin`, so `trpcClient` sends `expo-origin: infinitunes://` (`NATIVE_ORIGIN_HEADER`)
  and the stored cookie with `credentials: "omit"` (`authClient.getCookie()` reads secure storage: always await it). `proxy.ts` accepts a POST without `Origin` only with that
  exact header and no `Sec-Fetch-Site` (browsers always send `Origin`, and cannot add the header cross-site
  without a CORS preflight): never add `Access-Control-Allow-*` headers to `/api/trpc`.
- The expo auth client turns a relative `callbackURL`/`newUserCallbackURL`/`errorCallbackURL` into
  `infinitunes://...`, which `webRedirectsOnly` rejects (403): native auth calls never pass them. A native
  password reset passes a relative path or the web reset page's https URL as `redirectTo` (left untouched).
- Provider sign-in (`features/auth/provider-sign-in.ts`, `provider-buttons.tsx`): Apple
  (`expo-apple-authentication`, iOS) and Google (`@react-native-google-signin`, `webClientId` = the server's
  `GOOGLE_CLIENT_ID`, the token's audience) pass an ID token to `signIn.social`. Passkeys run the ceremony
  through `authClient.$fetch` (it keeps the challenge cookie) and `react-native-passkey`, not
  `passkeyClient()`, whose sign-in calls the browser WebAuthn API; the associated domain is the https
  `EXPO_PUBLIC_API_URL` host (`app.config.ts`). A button shows only if the server lists the provider and the
  build has its ids; on iOS Google needs Apple (guideline 4.8), and Apple and passkeys need
  `EXPO_PUBLIC_APPLE_PAID_TEAM=true` (a free Apple ID cannot sign those capabilities). Cancels are silent. Jest stubs all three
  (`src/test/native-auth.tsx`).
- Bun's isolated installs: Babel resolves `nativewind/babel`'s plugins and the JSX runtime from the app, so
  `@babel/plugin-transform-react-jsx`, `@babel/runtime`, `babel-preset-expo` and `react-native-css-interop`
  are direct dependencies; `jest.config.js` adds `.bun` to the transform allow-list, falls back to the app's
  `node_modules` and maps `react` to the app's copy (else `packages/core` hooks throw "Invalid hook call").
  Jest runs real Reanimated (its `jest/resolver` composed in `src/test/resolver.js`, `setUpTests()`), swaps
  `expo-audio` for the scriptable `src/test/expo-audio.ts`, and `src/test/setup.ts` maps `~/lib/trpc` to a
  typed registry (`procedure("album.details").mockResolvedValue(...)`, reset before each test; unanswered
  catalog procedures reject) and `~/lib/auth-client` to a session store (`signInAs`, every Better Auth call
  a `jest.fn`) for every suite, plus the SQLite store,
  and stand-ins for Gesture Handler's `ReanimatedSwipeable` and `react-native-reorderable-list`, which do not
  run under Reanimated's Jest runtime. Render with `renderWithProviders`, `renderScreen(ui, { routes })` or
  `renderStack`; pick native menu actions with `chooseMenuAction(trigger, event)` and a card's long-press menu
  with `chooseCardAction(card, event)` (`src/test/render.tsx`); `@expo/ui` lists need `jest.mock("@expo/ui", () => require("~/test/expo-ui"))`. Optimistic
  overlay records expire on real timers: a suite that writes through them runs on fake timers and resets the
  overlay, or the Jest worker is force-exited. `expo-doctor` reports
  same-version "duplicates" (Bun peer variants); autolinking module resolution bundles one copy, so only a
  real version split matters. Its `react` 19.3.1 under `packages/core/node_modules` is core's dev copy for
  its own tests: Metro bundles only the app's 19.3.0 and Jest maps to it. Never switch the repo to the hoisted linker: it hoists mobile's React 19.3.0
  over web's.
- Hermes on the app's builds lacks `toSorted`/`toReversed`/`toSpliced` (Jest on Node has them, so tests pass while the device throws "undefined is not a function"): copy and sort/reverse instead; `src/test/hermes-builtins.test.ts` scans the app, core and types sources.
- `type-check` runs `expo customize tsconfig.json` first: it writes the gitignored `.expo/types` route
  types that `tsc` needs in a fresh clone. TypeScript is the repo's 7.x (`expo.install.exclude`).
- Voice assistants (`docs/mobile-assistants.md`): both open `infinitunes://action/<name>` links (`resume`, `play-liked`,
  `shuffle-liked`, `play-playlist?id=`, `play-search?q=`; plus `/search?q=`), run once by `app/action/[action].tsx` via
  `features/app-actions/` (the contract: rename nothing without the native sides). Siri's App Intents are Swift in
  `plugins/ios-app-intents/swift/`, which that plugin copies into the app target (not a pod: Xcode extracts intents
  metadata only from the app target) and which raises the app target to iOS 17.0. They cannot be compiled on Linux:
  verify with `expo prebuild --platform ios --no-install` and the pbxproj, and say a change is unbuilt. Playlists reach
  them through RN `Settings` (`UserDefaults`, `user-data/assistant-shortcuts.ios.ts`).
- No `build`/`dev`/`start` scripts in the app (root turbo tasks must not start Metro): `bun run dev:mobile`, or `bun run dev:native` for Metro plus the dev API (it also runs `adb reverse tcp:3000`, so `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` serves a USB Android device and the simulator; in dev a loopback API host is swapped for Metro's `hostUri` host, `lib/env.ts`, so a phone on Wi-Fi such as a physical iPhone follows the Mac's IP); device builds `bun run mobile:android` / `mobile:ios`, guide in `docs/mobile-device-setup.md`.
- Brand assets: the master vectors are `apps/mobile/assets/brand/{glyph,icon}.svg` (the ribbon-note, traced
  from `docs/assets/logo1500.png`); `bun run mobile:icons` (`scripts/generate-icons.ts`, sharp) renders every
  committed PNG in `assets/` (iOS light/dark/tinted, adaptive layers, splash, `notification-icon.png`). Edit the
  SVG, rerun, commit both; builds never run it. `ios.icon` takes `{light,dark,tinted}` or a `.icon` bundle path.
- iOS home-screen quick actions are the same launcher `SHORTCUTS`: `plugins/ios-quick-actions.ts` feeds `expo-quick-actions`'s plugin (Info.plist items, SF Symbols) and our own `navigation/use-quick-action-routing` (in `(tabs)/_layout.tsx`, a sub-layout) navigates to `params.href`; not `expo-quick-actions/router`, which imports `expo-router/build/hooks` and fails under Bun's isolated install.
- Android Assistant App Actions and launcher shortcuts are generated by the config plugin
  `apps/mobile/plugins/android-app-actions/` (`shortcuts.ts` builds `shortcuts.xml`, strings, icons; it only emits deep
  links the app routes). App Actions register only after a Play Console upload of the same package, and Assistant cannot
  start playback itself (expo-audio has no media browser service): see `docs/mobile-assistants.md`.
- `apps/mobile/e2e` runs the app's real `auth-client`/`trpc` (only native modules stubbed,
  `native-stubs.ts`) against a local web app and scratch database: `MOBILE_E2E_API_URL=... bun
  run test:e2e` (skipped unset; loopback only, it creates accounts). Its header comments name the
  production-limiter mode and the live-payload screen run (`live-screens.test.tsx`).

## Lyrics

- `song.syncedLyrics({ id })` resolves decoded song metadata, tries LRCLIB get, duration-matched (±3 seconds) search, then a cleaned-title retry before JioSaavn plain lyrics. Missing lyrics return nulls; instrumental matches stop fallback. `@infinitunes/core/lyrics` parses LRC and selects the active line. This normalized multi-provider procedure is an exception to catalog raw passthrough; `get.lyrics` remains raw. LRCLIB requests currently bypass the Next catalog cache (client queries stay fresh indefinitely).

## Song rows take the slim model, never the raw song

Client components (rows, row menus, `SongListClient`, `LibrarySongList`, `PlayAllButton`, details header buttons,
infinite lists) get `SongRowItem` from `toSongRow` (`packages/types/src/row.ts`), built where the raw song is
fetched (server component, or the `queryFn` of a client list). Never pass a `Song`/`Episode` as a client prop: a raw
song is about 4 KB of flight. It keeps `download_url` and `maxQuality` (the `320kbps` cap), so playback and download
fallback work; add a field there only when a client really reads it. `toSongRow` is memoized per raw object so the
header and the rows of one page share one serialized copy (Flight dedupes by reference); build rows from the same
raw array, not a re-fetched one. `toQueueEntry` turns a row or a queue entry into a fresh `Queue`.
`SongListRow` and the list/shelf/details skeletons (`song-list-skeleton`, `shelf-skeleton`, `details-header-skeleton`) are
`"use client"` on purpose: server-rendered, their class strings were serialized into the flight per row (4 KB each);
as client components the flight carries only props. Keep repeated markup (rows, skeleton cards) in client modules.

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
  accurate, and with the same `api_version` the procedure sends: the shape
  changes with it (`autocomplete.get` without v4 answers `url` instead of
  `perma_url`, which the `jiosaavn-api` reference types describe). The mobile
  E2E catalog suite plus `live-screens.test.tsx` do this for every screen.
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
prefix distinct (`@infinitunes/auth/session-cookie`, used by Better Auth,
`proxy.ts` and the mobile auth client). Opt-in DB tests need `TEST_MIGRATION_DATABASE_URL` (a disposable
admin URL).
Delete account removes only Infinitunes data and revokes sessions; shared users and credentials stay.

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
  request, and `useTrackPlayback` (`@infinitunes/core/react`) steps down a bitrate on each load error
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

## Motion is never zero

Reduced motion (OS or `data-motion="reduced"`) removes movement, not feedback: `globals.css` keeps opacity/colour/
visibility transitions at 120-200ms and `motion.css` keeps the root crossfade (the artwork flight becomes a fade).
Never set `animation-duration`/`transition-duration` to 0 for a class of elements or `animation: none` on view-transition
pseudos: that made the view transition, sidebar and queue vanish for anyone with the OS setting on. `reduced-motion.test.ts`
pins it. Panels and the morph use `--ease-panel`/`--duration-panel` (340ms); `--ease-drawer`/`--ease-spring` are 80% done
in the first quarter and read as an instant jump, so do not use them for slides. Any card that opens a detail page needs
`data-morph={type}` plus `data-morph-art` (see `slider-card`, `home-hero`, `quick-picks`); the loading placeholder shows the
card's picture so the flight lands on artwork. The queue pane scrolls only `[data-queue-scroll]`; the header, now playing
and "Up next" label sit outside it.

## Panels slide into the gutter, content stays put

The content column spans from the sidebar gap to the viewport edge and has no queue margin. `page-container`
and the toolbar's `page-gutter` (`styles/globals.css`) place the page box with
`margin-left: clamp(0, Cf - (100vw + w) / 2, Cf - R - w)`, where `R` is the registered, animated
`--queue-reserve` (the docked queue's column, from `html[data-queue=open]` at 1440px and up). When the box fits
beside the open panels it is centred in the viewport and neither the sidebar nor the queue moves it (or the
anchored player bar); when it does not fit the clamp collapses to the classic push. Never reintroduce a
margin or width on the column for a panel, and keep the sidebar gap in flow (its live width is what `Cf` reads).

## Optimistic writes

A click must change the UI in the same frame; the server write follows and a failure rolls back with a toast.
Never hang UI state on the action's round trip, and never let only the clicked control change.

- Shared client overlays own the state, layered over server props: likes in `@infinitunes/core/react/optimistic-favorite`
  (`useFavoriteToggle` in `lib/use-favorite-toggle.ts`; hearts, tile menu and player share one key), playlists in
  `@infinitunes/core/react/optimistic-playlists` (`usePlaylists` for the sidebar and add dialog, `PlaylistTitle`, `PlaylistGate`,
  `PlaylistRow`, `PendingPlaylistCards`), `?lang=` chips in `lib/pending-params.ts`. `user.getUserPlaylists` is a
  summary (`songCount`, `coverSongs`: the first four ids), never the songs; song ids come only from
  `getPlaylistDetails` (`usePlaylistDetails` overlays one) and, for mobile's
  "Add to Playlist" check marks, `getPlaylistMembership` (one query, `usePlaylistSongSets`). Use these for new write paths
  instead of a per-component `useOptimistic`, which cannot update other components.
- One write per key in flight, always the latest intent (rapid clicks never double toggle); songs of one playlist
  are written one at a time and removal indexes are adjusted for earlier removals.
- An overlay record is dropped when refreshed server props agree, on failure, or after a timeout. Do not clear it
  on action success: `refresh()` props arrive a moment later and the control would flicker back.
- Creating a playlist cannot be fully optimistic (the id is minted by the database): it shows a dimmed `pending`
  row with no link and takes the real id on return. Sign out, profile and password saves, and radio/queue
  fetches stay pending-style (toast) because the server or upstream decides the outcome.

## Proxy limiter scope

`proxy.ts` matches pages, `/api/trpc`, `/api/auth` and `/api/og` only (`PROXY_MATCHER` in
`lib/rate-limit-scope.ts`; the literal in `config.matcher` must equal it, a test checks). `limiterKinds`
charges documents, server actions and `/api` requests; RSC navigations/prefetches (`rsc` header) and
subresources (`sec-fetch-dest` other than document/iframe) are never counted, so browsing cannot 429.
`/api/og` has its own 20/min bucket on top of the global one. Do not add CSP enforcement or a limiter
for static files here.

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
- See `apps/web/lib/env.ts` and `@infinitunes/core/validations` for usage examples.

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
  and the `expo` plugin (native clients send `expo-origin`; `NATIVE_APP_ORIGIN`
  from `@infinitunes/auth/native-app` is a trusted origin), and takes extra
  plugins via `createAuth(db, { plugins })`. The scheme is trusted as a request
  origin only: `webRedirectsOnly` rejects non-http(s) `callbackURL`/`redirectTo`
  values (any app can claim a custom scheme, and reset tokens or the `expo`
  plugin's appended cookie would travel through it), and `/expo-authorization-proxy`
  is in `disabledPaths`. Native social sign-in uses the ID token flow (Apple, Google; GitHub has
  none, so it stays web-only). Apple is on when `APPLE_CLIENT_ID` is set (optional, audience
  `NATIVE_APP_ID`); `GET /api/auth/social-providers` lists the configured providers. Passkey
  `origin` is the base URL plus `android:apk-key-hash:` origins from `ANDROID_CERT_SHA256_FINGERPRINTS`,
  which with `APPLE_TEAM_ID` also feeds `app/.well-known/{assetlinks.json,apple-app-site-association}`.
  The web app injects `nextCookies()` at its call site (`apps/web/lib/auth.ts`) -
  nothing under `@infinitunes/auth` may import `better-auth/next-js`. `createAuth`
  passes `secret`/`baseURL` into Better Auth (`BETTER_AUTH_*` wins over `AUTH_*`)
  and never writes `process.env`. The client factory `createAuthClient({ baseURL })`
  in `packages/auth/src/auth-client.ts` defaults to same-origin when passed nothing.
- `@infinitunes/types` is the single source of truth for shared value lists: `LANGUAGES`
  (derive `Lang` from it), `QUALITIES_MAP`, and `parseToken` (the perma-url token extractor used
  by both `apps/web` and `packages/trpc`; don't hand-roll another copy).
- SEO origin: canonical, `og:url`, `metadataBase`, robots and sitemap URLs all come from
  `siteUrl()` (`apps/web/lib/site-url.ts`, `NEXT_PUBLIC_APP_URL` with the production default).
  Route metadata goes through `pageMetadata` (`lib/metadata.ts`, which sets the canonical); user,
  settings and auth routes export `noindexMetadata`. `app/robots.ts` owns robots.txt: never add
  `public/robots.txt`, a static file is served instead of the route.
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

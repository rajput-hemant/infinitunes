# Cloud agent to-do (device-free work)

Branch: `feat/platforms`. Every item below can be implemented and verified with code, unit/DOM/Jest tests and type-checks alone: no phone, emulator or simulator is needed to do the work. Items tagged **[device sign-off later]** are still code-complete without a device; the owner checks them on hardware afterwards, so say in the PR what to look at.

Delete this file in the last PR, once every box is ticked (the repo must not keep it).

## How to work

1. Read `AGENTS.md` first. It is the source of truth for conventions and sharp edges.
2. Take ONE batch per agent and branch from the latest `feat/platforms`. The batches own disjoint files, so several can run in parallel.
3. Verify each finding against the code before fixing it. If it is wrong or already fixed, tick it with a one-line note.
4. Write a failing test first for any non-trivial logic. Make the smallest change that fixes the root cause, and match the surrounding style.
5. Make one commit per item or small group, using conventional commits with the item id in the body.
6. Never start Metro, Expo, `next dev` or `next build`. These gates must pass:
   - `bun run fmt:check`
   - `bun run lint`
   - `bun run type-check --concurrency=2` (`SKIP_ENV_VALIDATION=true` if there is no `.env`)
   - `bun run test:mobile -- --maxWorkers=2`
   - `bun run test:isolated`
   - `bun test packages/trpc packages/core`
7. Tick the item's box in this file in the same PR, and add the branch name after the batch header.

## Sharp edges

- Hermes (mobile) lacks `toSorted`/`toReversed`/`toSpliced`.
- NativeWind spacing is a closed scale; `theme/spacing.test.ts` enforces it.
- Sizes come from `theme/tokens.ts`, never literals.
- Every song array a router returns goes through `withDownloadUrl`.
- `packages/core` imports no DOM, `next` or ui code.
- Web first-load JS rules apply: no static `Dialog`/`Drawer`/`Popover` imports from shell code.
- Optimistic writes must change the UI in the same frame and roll back on failure.

## Decisions already made (do not re-open)

- Privacy/Terms: interim noindex, out of the sitemap, no consent line. This is being done locally.
- `deleteUser` and the Lipi-shared user row: deferred to the owner. Do not change what it deletes.
- DB pool stays `max: 1` (serverless).
- Tablet scope: columns plus a readable width, no two-pane. Done (M6 merged).
- Android accent: build a full Material You `SchemeTonalSpot` from the accent seed and lazy-load the colour library.
- Android menus stay text-only. Android library lists reuse the M3 search pill.
- The Home `h1` stays the greeting.
- Rate limiting: warn when it is off in production, never fail the build.

## Do not touch (in progress locally on other branches)

These items will be merged into `feat/platforms` soon. Avoid their files, or wait until they land.

- **User router:** `fix/s1-user-router`. Files: `user.ts`, `trpc.ts`, core `optimistic-playlists`, the playlist consumers on web and mobile, `user-data/playlists.ts`, the song, native and collection menus.
- **Upstream and history:** `fix/s3-upstream-history`. Files: `router/{utils,album,playlist,history}.ts`, `synced-lyrics.ts`.

Before starting a batch marked _after S1_, check `git log --oneline feat/platforms | grep s1-user-router`. If the merge is not there yet, pick another batch.

## Batch M3 (opus): song-row menu and per-row subscriptions - `components/{song-row,song-menu,native-menu,like-button}.tsx`, `user-data/{favorites,playlists}.ts`, `navigation/use-open-entity.ts` _(after S1)_

Coordinate with S1 (S-6 changes the playlists payload shape): either land S-6 first, or keep the per-playlist `Set` here and swap the source later.

- [ ] **M-11** **[device sign-off later]** P1 PLAUSIBLE `components/song-row.tsx:98-100`, `song-menu.tsx:79-161`, `native-menu.tsx:61-71` - one native `MenuView` host plus a full playlist submenu per song row, with `useUserPlaylists()` and `every/includes` over up to 10x5000 ids per row per render [perf#1]
  - Problem: dozens of native hosts and O(rows x ids) work per list render. Fix: use the card pattern (`card-menu.tsx:140-170`): plain `IconButton` trigger, mount one `NativeMenu` lazily on first press and build entries there; a per-playlist `Set` in `useUserPlaylists`.
  - Executor: opus. Flags: needs device check.
- [ ] **M-12** P2 PLAUSIBLE `user-data/favorites.ts:35-42,81-86`, `components/like-button.tsx:27` - `LikeButton` observes the whole favorites query without `select` [perf#11]
  - Fix: `useIsFavorited(type, token)` with a boolean `select`. Executor: sonnet. Flags: none.
- [ ] **M-13** P3 PLAUSIBLE `navigation/use-open-entity.ts:13`, `like-button.tsx:26`, `song-menu.tsx:80` - `useOpenEntity` / `useUserId` subscribed per row [perf#19]
  - Fix: hoist to the list or read at press time. Do after M-11. Executor: sonnet. Flags: none.

## Batch M4 (opus): liked and per-song data fetching - `features/library/{use-liked-collection,liked-collections,use-resolved-items,use-playlist-songs,use-playlist-covers,liked-songs-screen,song-collection}.ts(x)`, `packages/core/src/liked-songs.ts` _(after S1)_

Edits `song-collection.tsx`; M-17 waits on the user decision.

- [ ] **M-14** P1 PLAUSIBLE `use-liked-collection.ts:29-35`, `liked-collections.ts:36-72`, `packages/core/src/liked-songs.ts:9` - liked albums/artists/playlists/podcasts: one full detail request per liked item, and all refetch on any like [perf#3]
  - Fix: per-id cached queries (`ensureQueryData` per token) so only new ids fetch; optionally a trimmed card-summary server procedure. Executor: opus. Flags: none.
- [ ] **M-15** P1 PLAUSIBLE `use-resolved-items.ts:45`, `use-playlist-songs.ts:21-26`, `use-playlist-covers.ts:19-35` - every like/unlike refetches the whole liked-songs list [perf#4]
  - Fix: per-song cache with a coalescing chunked loader, or key on scope and fetch only new ids. Pair with M-14. Executor: opus. Flags: none.
- [ ] **M-16** P3 CONFIRMED `liked-songs-screen.tsx:14-16`, `song-collection.tsx:77,102,110,130,138` - an unliked row is hidden but still counted and queued by Play/Shuffle [screens P3-2]
  - Fix: apply the favorites overlay to `items` before `SongCollection` and drop the `null` branch. Executor: sonnet. Flags: none.
- [ ] **M-17** **[device sign-off later]** P3 PLAUSIBLE `features/library/song-collection.tsx:168-171,202` - Liked Songs, History and playlist screens use Android's native header `Stack.SearchBar` (the 72dp inset problem Search already replaced) [screens P3-11]
  - Fix: accept it, or reuse `search-header.android.tsx`'s pill as a list header. Executor: opus. Flags: needs device check (decision: reuse the M3 pill).

## Batch M5 (opus): virtualize detail track lists + playlist screens - `components/track-list.tsx`, `components/detail/detail-screen.tsx`, `features/{album,library}/{album-screen,playlist-screen,edit-playlist-screen}.tsx` _(after S1)_

Runs after M4 only if both touch playlist hooks (they do not share files otherwise).

- [ ] **M-18** **[device sign-off later]** P1 PLAUSIBLE `components/track-list.tsx:25-37`, `detail-screen.tsx:48-54`, `album-screen.tsx:115`, `playlist-screen.tsx:97` - album and catalog playlist track lists are not virtualized (a big ScrollView of rows) [perf#2]
  - Fix: one `FlashList` as in `artist-content.tsx:49`, header/shelves as `ListHeader/Footer`, keep `useDetailScrollProps`; `TrackList numbered` and `DetailSkeleton numbered` keep matching. Executor: opus. Flags: needs device check.
- [ ] **M-19** P3 CONFIRMED `features/library/playlist-screen.tsx:131-151` - no header title while loading, errored or not found [screens P3-3]
  - Fix: render `<Stack.Screen options={{ title: playlist?.name ?? "Playlist" }} />` unconditionally. Executor: haiku. Flags: none.
- [ ] **M-20** P3 CONFIRMED `edit-playlist-screen.tsx:14-39`, `playlist-screen.tsx:129-147` - duplicated "find playlist by id, skeleton/error/not-found" ladder [screens P3-10]
  - Fix: one `usePlaylistById(id)` rendered through `LibraryListView`. Executor: sonnet. Flags: none.

## Batch M7 (sonnet): Android chrome and ListRow - `app.config.ts` (predictive back only), `navigation/tab-stack-options.ts`, `features/settings/languages-screen.tsx`, `features/player/queue-list.tsx`, create-playlist form, `components/{segmented-tabs.android,chip-row,list-row}.tsx`, `theme/{android-colors.android,dynamic-color-root.android}.ts(x)`, `theme/motion.ts` (branch `worktree-agent-a4bc026a952a4285b`)

M6 is merged. The predictive-back change needs a native rebuild, which the owner does.

- [x] **M-22** **[device sign-off later]** P1 PLAUSIBLE `AndroidManifest.xml:17`, `app.config.ts` - predictive back disabled (`enableOnBackInvokedCallback=false`) [design P1-11]
  - Fix: `android.predictiveBackGestureEnabled: true`, prebuild, verify the player modal, formSheets and search Back. Executor: sonnet. Flags: needs native rebuild, needs device check.
  - Done: set `android.predictiveBackGestureEnabled: true`; owner prebuilds and checks the player modal, formSheets and search Back.
- [x] **M-23** **[device sign-off later]** P2 PLAUSIBLE `navigation/tab-stack-options.ts` - root tab app bars (Home, Radio, Library, Browse, Charts) never tint on scroll [design P2-13]
  - Fix: `useScrolledBar()` hook lifted from `DetailFrame`, `card` once offset > 0. Executor: sonnet. Flags: needs device check.
  - Done: `navigation/use-scrolled-bar.ts` (`useScrolledBar`) tints the bar `card` once offset > 0; wired into `ScreenScrollView` (a screen's own `onScroll`, e.g. detail, takes over). FlashList root screens must spread it themselves: not done here, their files belong to other batches.
- [x] **M-24** **[device sign-off later]** P2 PLAUSIBLE `features/settings/languages-screen.tsx:58`, `features/player/queue-list.tsx:153`, create-playlist form - Android form sheets sit under the 3-button nav bar [design P2-14]
  - Fix: Android `paddingBottom: insets.bottom + space.lg`. Executor: sonnet. Flags: needs device check.
  - Done: `navigation/sheet-inset.ts` (`useSheetBottomInset`, Android `insets.bottom + space.lg`) in languages, queue and the create-playlist route.
- [x] **M-25** P3 PLAUSIBLE `components/segmented-tabs.android.tsx:107` - button-group colours snap [design P3-16]
  - Fix: `interpolateColor` on `springs.effectsDefault` (this makes `effectsDefault` live; see M-69). Executor: sonnet. Flags: none.
  - Done: fill follows `springs.effectsDefault` via `interpolateColor`; the label colour still switches at once (Text takes classes).
- [x] **M-26** P3 PLAUSIBLE `components/chip-row.tsx:168` - chips scale on Android [design P3-17]
  - Fix: ripple only, no `usePressScale` on Android. Executor: haiku. Flags: none.
  - Done: Android chips use a ripple, no press scale or opacity (no test: `MATERIAL` is a module constant).
- [x] **M-27** **[device sign-off later]** P3 CONFIRMED `components/list-row.tsx:174,267-275` - current-track tonal container toggles without a transition, and trailing controls jump 4dp when a row becomes current [design P3-18, comp P3-1]
  - Fix: animate bg/margin with the effects/spatial springs (reduce-motion gated); give the selected container `paddingEnd` of `(controls ? space.xs : space.lg) - inset` or inset the end by `space.xs`. Executor: sonnet. Flags: needs device check.
  - Done: tonal container animates (spatial spring for margins/padding, effects spring for the fill, reduce motion via ReduceMotion.System); the end inset is `space.xs` beside controls, so they no longer jump 4dp.
- [x] **M-28** P3 CONFIRMED `list-row.tsx:36-37,68-77` - `trailing: ReactNode | { chevron: true }` sentinel union [comp P3-11]
  - Fix: a plain `chevron?: boolean` prop (call site `entity-list.tsx:59`). Executor: haiku. Flags: none.
  - Done: `chevron?: boolean`; call sites updated (entity-list, song-credits, library-screen, episode-content).
- [x] **M-29** **[device sign-off later]** P3 PLAUSIBLE `theme/android-colors.android.ts:11-33`, `dynamic-color-root.android.tsx:18-21` - Material You palette cache never invalidates after a wallpaper change [comp P3-14]
  - Fix: clear on `AppState` `active` or key on the resolved `primary`. Executor: sonnet. Flags: needs device check.
  - Done: `refreshDynamicPalettes()` on `AppState` active, `DynamicColorRoot` re-reads. Components using `usePalette()` pick the fresh palette on their next render.

## Batch M8 (sonnet): iOS polish and shared control files - `components/ui/{text,icon-button,button}.tsx`, `components/{card-menu,card-play-button,drag-handle}.tsx`, `components/detail/{detail-scroll,detail-header-options}.tsx`, `features/player/{transport-controls,mini-player}.tsx`, `features/library/swipeable-row.tsx`

Owns every edit to `icon-button.tsx`, `transport-controls.tsx` and `card-play-button.tsx` (iOS and Android items together).

- [ ] **M-36** **[device sign-off later]** P3 PLAUSIBLE `features/library/swipeable-row.tsx:35` - swipe row does not commit on a full swipe [design P3-10]
  - Fix: iOS full-swipe (>60% width) triggers the destructive action. Executor: sonnet. Flags: needs device check.

## Batch M9 (opus): Android accent - `theme/use-palette.ts` (+ contrast test)

Gated on the accent decision.

- [ ] **M-40** **[device sign-off later]** P2 PLAUSIBLE `theme/use-palette.ts:20` - a custom accent replaces only `primary`; containers keep wallpaper roles [design P2-12]
  - Fix: generate `SchemeTonalSpot` from the accent seed and map every role, keep the AA test (`tokens.test.ts`). Executor: opus. Flags: needs device check (decision: reuse the M3 pill).

## Batch M10 (sonnet): network and auth plumbing - `lib/trpc.ts`, `lib/auth-client.ts`, `playback/record-play.ts`, Radio/Search tab queries

- [ ] **M-41** **[device sign-off later]** P2 PLAUSIBLE `lib/trpc.ts:20-37` - `httpBatchLink` makes cold-start Home wait for the slowest query (all tabs mount) [perf#5]
  - Fix: `httpBatchStreamLink` (or a `splitLink` for `home.home`); `enabled: isFocused` for Radio/Search tab queries. Executor: sonnet. Flags: needs device check. (Pairs with S-4 session lookup server-side.)
- [ ] **M-42** P2 PLAUSIBLE `lib/trpc.ts:27-33`, `playback/record-play.ts:15` - Keychain/Keystore read on every tRPC request and every play [perf#6]
  - Fix: in-memory cookie cache in `auth-client.ts`, refreshed on sign-in/out/session signal. Executor: sonnet. Flags: none.

## Batch M11 (sonnet): player progress and colours - `features/player/{dock-progress,scrubber,use-player-colors}.tsx`, `lib/artwork-colors.ts`, `components/floating-player-dock.tsx`

Start after M2 (status/position stores change there).

- [ ] **M-43** **[device sign-off later]** P2 PLAUSIBLE `features/player/dock-progress.tsx:18-55`, `scrubber.tsx:39-131` - scrubber/dock progress relayout every tick [perf#10]
  - Fix: shared values + `useAnimatedStyle` scaleX; time labels at 1Hz. Executor: sonnet. Flags: needs device check.
- [ ] **M-44** P3 PLAUSIBLE `features/player/use-player-colors.ts:35-70`, `lib/artwork-colors.ts`, `floating-player-dock.tsx:15` - colour extraction re-opens the image per track, and material-color-utilities loads on the launch path [perf#12, perf#17]
  - Fix: prefetch the next track's seed; dynamic-import the utilities inside the `usePlayerColors` queryFn. Executor: sonnet. Flags: none.

## Batch M12 (sonnet): loading and skeleton fidelity - `components/skeletons.tsx`, `components/detail/detail-frame.tsx`, `features/home/home-feed.tsx`, `components/shelf.tsx`, `components/paged-footer.tsx`, `features/browse/top-podcasts-screen.tsx`

Do NOT edit `catalog-screen.tsx` (M6 owns it).

- [ ] **M-45** **[device sign-off later]** P2 PLAUSIBLE `features/home/home-feed.tsx:47`, `DetailFrame`, `PagedFooter` - content pops in over skeletons [design P2-2]
  - Fix: loaded branch `entering={FadeIn.duration(200).reduceMotion(ReduceMotion.Never)}`, no exiting on the skeleton. Executor: sonnet. Flags: needs device check.
- [ ] **M-46** **[device sign-off later]** P2 CONFIRMED `components/skeletons.tsx:57-78`, `features/browse/top-podcasts-screen.tsx:53-59` - skeletons do not mirror the loaded layout: `SongRowSkeleton` lacks the 48pt heart and menu cells (text column ~100pt too wide, `pr-4` vs `space.xs`), and the TopPodcasts header (Trending shelf, "All Podcasts") appears only after data lands [comp P2-3, screens P3-7, design P2-2 skeleton-rule note]
  - Fix: add `size-touch` heart (when `useUserId()`) and `MenuGlyphSkeleton` cells, use the row's `paddingEnd`, keep the numbered length bar; render `ShelfSkeleton` + `SectionHeaderSkeleton` as TopPodcasts' header while pending; overlay-check each skeleton on the loaded page. Executor: sonnet. Flags: needs device check.
- [ ] **M-47** P3 PLAUSIBLE `components/shelf.tsx:83-92`, `home-feed.tsx:56-64` - `uniqueBy` per render and Home re-diffs every shelf [perf#14]
  - Fix: dedupe in `buildHomeModel`; consider Home as a vertical FlashList of shelves. Executor: sonnet. Flags: none.
- [ ] **M-48** P3 PLAUSIBLE `components/detail/detail-frame.tsx:56-59` - children memo is ineffective [perf#18]
  - Fix: drop the memo or move secondary queries into the page. Executor: haiku. Flags: none.

## Batch M13 (sonnet): settings and forms - `features/settings/{settings-screen,settings-screen.android,end-session,profile-form,tap-rows,row-icon}.tsx`, tests

- [ ] **M-49** P2 CONFIRMED `settings-screen.tsx:86`, `settings-screen.android.tsx:270`, `end-session.ts:30-34` - a failed sign-out is swallowed (no snackbar) [screens P2-1]
  - Fix: show `failure.message` via `showFailure` once inside `signOut` (let `forgetDeletedAccount` opt out); assert it in `settings-screen.test.tsx:104`. Executor: sonnet. Flags: none.
- [ ] **M-50** P2 CONFIRMED `features/settings/profile-form.tsx:5-17` - no `useFocusOnRefusal` on the profile form, unlike all sibling forms [screens P2-3]
  - Fix: `useFocusOnRefusal(emailChanged ? passwordInput : emailInput, serverError, pending)` plus a test mirroring `forms-pending.test.tsx`. Executor: haiku. Flags: none.
- [ ] **M-51** P3 CONFIRMED `settings-screen.tsx` vs `settings-screen.android.tsx`, `tap-rows.tsx`, `row-icon.tsx` - the whole settings model (sections, labels, handlers, URLs) is duplicated and already drifts (Delete account chevron); non-iOS `tap-rows`/`row-icon` stubs exist only for `tsc` [screens P3-10]
  - Fix: one shared settings list with per-platform row renderers; make the iOS files the base and delete the stubs, or comment them. Executor: sonnet. Flags: none.
- [ ] **M-52** P3 CONFIRMED `features/settings/require-session.tsx`, `features/show/use-show-episodes.ts:7-35`, `song-collection.tsx:89-96` - missing tests: `require-session` (`dismissTo`, `openedAsGuest`), `numEpisodes` vs `total_episodes` fallback and `hasMore`, `reorderActions` accessibility path [screens P3-14]
  - Executor: haiku (after the fixes land). Flags: none.

## Batch M14 (haiku; M-58 sonnet): screen nits - `features/{search,browse,show,library,artist,label,charts,song,auth}/**`, `app/**` route files, new `lib/params.ts` _(after S1)_

- [ ] **M-53** P2 PLAUSIBLE `features/search/search-screen.tsx:27-32`, `features/library/new-playlist-screen.tsx:9-19`, `app/(auth)/reset-password.tsx:7`, `features/app-actions/app-action-screen.tsx:18`, edit/playlist screens' `id` - repeated query params (`?q=a&q=b`, `?songs=1&songs=2`) arrive as `string[]` and crash `trim`/`split` [screens P2-2]
  - Fix: one shared `single(value)` helper in `lib/params.ts` used everywhere; add two cases to `navigation/malformed-links.test.ts`. Executor: haiku. Flags: none.
- [ ] **M-54** P3 CONFIRMED `search-screen.tsx:36-40,61,84-87` - a recent search re-runs under the last type chip, not "All" [screens P3-1]
  - Fix: `onCancel` also `setType("all")` and/or `searchFor(recent, "all")`; add a test. Executor: haiku. Flags: none.
- [ ] **M-55** P3 CONFIRMED `app/(tabs)/.../show/[name]/[season]/[token].tsx:6-7`, `show-content.tsx:44-46` - an unknown season segment selects nothing and shows "No episodes yet" [screens P3-4]
  - Fix: fall back to the latest season when `show.seasons` has no match. Executor: haiku. Flags: none.
- [ ] **M-56** P3 CONFIRMED `features/browse/use-category-covers.ts:15,41-44` - "Made for you" mix queries `home.home` with `{}` instead of `{ lang }` (second Home request, wrong catalog) [screens P3-5]
  - Fix: pass `useCatalogLang()`. Executor: haiku. Flags: none.
- [ ] **M-57** P3 CONFIRMED `features/browse/top-albums-screen.tsx:36` - title ignores `?lang=` (playlists screen titles itself) [screens P3-8]
  - Fix: `${languageLabel(lang)} Albums`. Executor: haiku. Flags: none.
- [ ] **M-58** **[device sign-off later]** P3 PLAUSIBLE `search-screen.tsx:50-52`, `search-header.tsx:31` - on iOS a cold `?q=` link may leave the native search field empty (effect runs before the ref attaches) [screens P3-6]
  - Fix: callback ref that sets the text when the native field attaches. Executor: sonnet. Flags: needs device check.
- [ ] **M-59** P3 CONFIRMED `features/song/lyrics-section.tsx:26-37` - `accessibilityLabel="Read full lyrics"` hides the preview from screen readers [screens P3-12]
  - Fix: start the label with the first lyric line or keep the preview outside the pressable. Executor: haiku. Flags: none.
- [ ] **M-60** P3 CONFIRMED `features/artist/use-artist-panel.tsx:110`, `features/label/label-content.tsx:42`, `features/search/type-results.tsx:73,93` - new `items`/`rows`/`renderItem` every render [screens P3-13]
  - Fix: `useMemo`/`useCallback` keyed on source rows. Executor: haiku. Flags: none.
- [ ] **M-61** P3 CONFIRMED `features/library/library-tile.tsx` + `features/browse/browse-tile.tsx`, `charts/top-charts-screen.tsx:27` + `browse/top-artists-screen.tsx:41`, `artist/use-artist-panel.tsx:71-102`, `use-artist.ts`/`use-show.ts` - duplicated screen logic [screens P3-10]
  - Fix: shared `PressableTile`; a `singlePage(query)` helper in `features/` (not in `CatalogScreen`, M6 owns it); a `pagedPanel` helper; one style for entity-query wrappers. Executor: haiku. Flags: none.
- [ ] **M-62** P3 CONFIRMED `features/library/library-screen.tsx:37` - empty Playlists section is bare text [design P3-4]
  - Fix: `EmptyState placement="top"` with a New Playlist action. Executor: haiku. Flags: none.
- [ ] **M-63** P3 CONFIRMED `features/auth/reset-password-form.tsx:54-58` - dead `!token` re-check after the early return [screens P3-9]
  - Fix: delete the dead check. Executor: haiku. Flags: none.

## Batch M15 (haiku): component and theme cleanup - `components/{option-menu,entity-list,song-menu*,equalizer}.tsx`, `components/ui/{spinner*,artwork,refresh-control}.tsx`, `components/form/*`, `components/catalog-grid-skeleton.tsx`, `theme/{appearance,tokens,motion}.ts`, `navigation/use-quick-action-routing.ts`, `plugins/android-app-actions/shortcuts.ts`, `docs/design/android-m3-expressive/spec.md` _(after S1)_

`song-menu.tsx` belongs to M3, so M-67 waits on M3 and the decision.

- [ ] **M-64** **[device sign-off later]** P2 PLAUSIBLE `components/option-menu.tsx:58-62` - `OptionMenu` trigger View lacks `accessible`, so VoiceOver reads inner text, not "Sort by, Popular, button" [comp P2-1]
  - Fix: add `accessible` (as `MenuTrigger` does) and `toHaveProp("accessible", true)` in the a11y test. Executor: haiku. Flags: needs device check.
- [ ] **M-65** P2 PLAUSIBLE `components/entity-list.tsx:26-33,64-66` - `entityListKey` collides when a song repeats in an artist/label/show list [comp P2-2]
  - Fix: song item `id` = `${row.id}-${index}` (or append `index` for `kind === "song"`). Executor: haiku. Flags: none.
- [ ] **M-66** P3 CONFIRMED `components/ui/spinner.tsx:11-15`, `spinner.android.tsx:9-27` - iOS and Android spinners differ in size and accessibility label [comp P3-2]
  - Fix: iOS default label "Loading" in a `sizes.touch` box. Executor: haiku. Flags: none.
- [ ] **M-67** P3 CONFIRMED `song-menu.tsx:90`, `collection-menu.tsx:73`, `native-menu.tsx:96`, `card-menu.tsx:26` - menu icons are SF Symbol names and never render on Android [comp P3-3]
  - Fix: decide, then either drop `image` for Android or map `{ ios, android }` once in `toMenuAction`. Executor: sonnet (decision) / haiku (mechanical). Flags: needs user decision.
- [ ] **M-68** P3 CONFIRMED `theme/appearance.ts:54-66` - `merge` validates accent and corners but not `mode` [comp P3-5]
  - Fix: `mode: APPEARANCE_MODES.includes(value.mode) ? value.mode : "system"`. Executor: haiku. Flags: none.
- [ ] **M-69** P3 CONFIRMED `theme/tokens.ts:303` (`sizes["ctl-lg"]`), `theme/motion.ts:19` (`springs.effectsDefault`), spec Motion table "effects fast 3800/123" - dead tokens and spec drift [comp P3-6]
  - Fix: delete `ctl-lg`, the phantom spec row, and `effectsDefault` only if M-25 did not start using it. Do after M7. Executor: haiku. Flags: none.
- [ ] **M-70** P3 CONFIRMED `components/ui/artwork.tsx:48`, `catalog-grid-skeleton.tsx:14`, `components/equalizer.tsx:23-25` - duplicated `9999` full-radius literal; Equalizer sizes are literals [comp P3-7, P3-8]
  - Fix: export `FULL_RADIUS` once (or call `artworkFrame`); `EDGE = iconSize.sm`, `BAR_GAP = sizes.seam`. Executor: haiku. Flags: none.
- [ ] **M-71** P3 PLAUSIBLE `components/ui/artwork.tsx:109-117` - 150ms fade on recycled list cells [perf#20]
  - Fix: `transition={0}` for row/card sizes. Executor: haiku. Flags: none.
- [ ] **M-72** P3 CONFIRMED `components/form/{form-field,email-field,password-field}.tsx` - deprecated `forwardRef` on React 19 [comp P3-12]
  - Fix: take `ref` as a prop. Executor: haiku. Flags: none.
- [ ] **M-73** P3 CONFIRMED `components/ui/refresh-control.tsx:29-42` - a rejected `onRefresh` becomes an unhandled rejection (latent) [comp P3-13]
  - Fix: `.catch(reportFailure("Couldn't refresh."))`. Executor: haiku. Flags: none.
- [ ] **M-74** P3 PLAUSIBLE `navigation/use-quick-action-routing.ts:20` - `QuickActions.initial` replays on every layout mount [comp P3-15]
  - Fix: module-level `handledInitial` flag. Executor: haiku. Flags: none.
- [ ] **M-75** P3 CONFIRMED `docs/design/android-m3-expressive/spec.md` "Spacing and density" - the "same-size wrapper drops slop" claim is wrong on RN 0.88 Fabric; only `overflow: hidden|scroll` does [comp P3-16]
  - Fix: reword the spec sentence (leave `Button`/`IconButton` as they are). Executor: haiku. Flags: none.
- [ ] **M-76** P3 CONFIRMED `plugins/android-app-actions/shortcuts.ts:6` - `DEEP_LINK_SCHEME` duplicates `NATIVE_APP_SCHEME` [core#12]
  - Fix: import it from `@infinitunes/auth/native-app` as `app.config.ts` does. Executor: haiku. Flags: none.

## Batch M16 (sonnet): song cache, downloads, notifications - `lib/{song-cache,download,notifications}.ts`

Fix the permission race inside `downloadTrack`/`downloadAll` so `song-menu.tsx`/`collection-menu.tsx` (M3) stay untouched.

- [ ] **M-77** **[device sign-off later]** P2 PLAUSIBLE `lib/song-cache.ts:56-74,126-137,146,220-222,258-260` - synchronous FS work on the JS thread during playback (directory walk per qualified listen and on Settings mount, 1000-entry resort, persist on every load); `refreshSongCache` is also exported unserialized next to `refreshSongCacheSize` [perf#8, core#8, core#13]
  - Fix: async FS, reconcile once per app run (and after a clear), keep the per-listen check to `existing`; in-memory `lastPlayed` persisted per track end, bounded LRU; make `refreshSongCache` module-private. Executor: sonnet. Flags: needs device check.
- [ ] **M-78** **[device sign-off later]** P3 PLAUSIBLE `lib/download.ts:72-85` - Android deletes the shared file as soon as the chooser returns; the receiver may still be reading [core#6]
  - Fix: delay the delete (next app foreground or a few seconds) or delete on the next download of the same name. Executor: sonnet. Flags: needs device check.
- [ ] **M-79** **[device sign-off later]** P3 PLAUSIBLE `lib/download.ts:118-125` - iOS "Download all" into a folder that already has the files fails every track [core#7]
  - Fix: pick `name (2).mp4` or overwrite, add an existing-file case to `download-flow.test.ts`. Verify expo-file-system `createFile` semantics. Executor: sonnet. Flags: needs device check.
- [ ] **M-80** **[device sign-off later]** P3 PLAUSIBLE `lib/notifications.ts:87-102` - permission prompt and share sheet are not sequenced; both system sheets overlap on iOS [core#11]
  - Fix: `await ensureNotificationPermission()` inside the download functions before starting. Executor: haiku. Flags: needs device check.

## Batch M17 (sonnet): component tests and snackbar gesture - `components/failure-snackbar.tsx`, new tests under `components/**`, `navigation/**`

- [ ] **M-81** **[device sign-off later]** P3 CONFIRMED `components/failure-snackbar.tsx:93-126` - snackbar swipe is a JS-thread `PanResponder` [comp P3-9]
  - Fix: `Gesture.Pan()` on the UI thread with `runOnJS` for dismiss/release. Executor: sonnet. Flags: needs device check.
- [ ] **M-82** P3 CONFIRMED `equalizer`, `refresh-control`, `use-schema-form`, `detail-scroll`/`detail-frame` (Android scrolled bar), `card-play-button`, `segmented-tabs` (iOS), `use-quick-action-routing`, `player-dock` - no tests for their behaviour [comp P3-17]
  - Fix: add the tests listed in the comp report (paused/reduced-motion bars, `refreshing` follows only the pull, first issue per field, scroll-past offset bar swap, pending/label, out-of-range index, initial action once, dock inset). Run after M7/M8 so tests match final code. Executor: sonnet. Flags: none.

## Batch W2 (sonnet): details and row "more" sheets - `components/song-list/{more-button,more-button-mobile-popup,more-button-radio}.ts(x)`, `components/details-header/more-button.tsx`, `components/{share-options,share-button}.tsx`, `tests/dom/more-button-share-panel.test.tsx`

Do P1 + the extraction together so the fix is applied once.

- [ ] **W-4** P1 CONFIRMED `song-list/more-button-mobile-popup.tsx:107-116`, `details-header/more-button.tsx:329-340` - phone "more" bottom sheets never close after an action (needs Cancel; Add to Playlist opens a dialog over the open drawer) [wcomp P1-1]
  - Fix: render entries as `DrawerClose` (as `user-menu-sheet.tsx:74-77` does), close the header drawer before opening the playlist dialog; add "choosing an entry closes the sheet" tests for row and header. Executor: sonnet. Flags: none.
- [ ] **W-5** P2 CONFIRMED `details-header/more-button.tsx:278-390,103-164`, `more-button-mobile-popup.tsx:54-173`, `more-button-radio.ts:27-77` - two drifted copies of the share drawer and of "create station then play" [wcomp P2-5]
  - Fix: one `MoreSheet({ art, title, subtitle, entries, sharePath })` and one `startRadio(seed, radio)`. Executor: sonnet. Flags: none.
- [ ] **W-6** P2 CONFIRMED `details-header/more-button.tsx:14-30,65`, `share-button.tsx` - the header menu imports Drawer, DropdownMenu and the Add-to-playlist Dialog statically while the row menu defers all three (detail routes carry the largest budget class) [wcomp P2-6]
  - Fix: shell trigger with identical classes/ARIA, `useDeferred("details-more", () => import("./more-button-popup"))`, `React.lazy` for the dialog, fold `ShareButton` into the chunk; check `bun run budget`. Executor: sonnet. Flags: none.
- [ ] **W-7** P2 CONFIRMED `components/share-options.tsx:160-164` - `navigator.clipboard.writeText` unawaited: a rejection is unhandled and the UI still says "Link Copied" [wcomp P2-2]
  - Fix: `.then(success, () => toast.error("Couldn't copy the link"))`, guard undefined `navigator.clipboard`, add a rejected-write test. Executor: haiku. Flags: none.
- [ ] **W-8** P3 CONFIRMED `share-options.tsx:155,162` - `isCopied` never resets ("Link Copied" for the rest of the page) [wcomp P3-3]
  - Fix: reset on a 2s timer or menu close. Executor: haiku. Flags: none.
- [ ] **W-9** P3 CONFIRMED `song-list/more-button.tsx:100-104` - "Play Song Now" matches by `id`, not `queueItemId` (duplicate track jumps to the first copy) [wcomp P3-10]
  - Fix: `findQueueIndex(initialQueue, { token: item.id, queueItemId })` as `play-button.tsx:60` does. Executor: haiku. Flags: none.
- [ ] **W-10** P3 CONFIRMED `details-header/more-button.tsx:267-273` - the Download entry disappears while a download runs (`hide: isDownloading`) [wcomp P3-11]
  - Fix: keep it, `disabled`/`aria-busy`. Executor: haiku. Flags: none.

## Batch W3 (sonnet): catalog list pages and metadata - `apps/web/app/(root)/{album,playlist,radio,show,artist}/page.tsx` + their `_components/{top-albums,featured-playlists,featured-stations,top-podcasts}.tsx`, `app/(root)/browse/page.tsx`

Does not touch `browse/_components` (W7 moves `catalog-states`).

- [ ] **W-11** P2 CONFIRMED `(root)/album/page.tsx:30-45` + `top-albums.tsx:20-29`, `playlist/page.tsx:27-43` + `featured-playlists.tsx:23-32`, `radio/page.tsx:30-46` + `featured-stations.tsx:25-34`, `show/page.tsx:46-52` + `top-podcasts.tsx:19-28` - `?page=N` is fetched by the server but the client infinite query is seeded as page 1, so scrolling loads page 2 under page N and drops page N as a duplicate [routes 3]
  - Fix: pass the parsed page into the client components for `initialPageParam` and `pageParams: [page]` (or stop reading `page` and drop it from `KeyedByParams`); add one dom test seeding page 3 and asserting the next request is page 4. Executor: sonnet. Flags: none.
- [ ] **W-12** P3 CONFIRMED `(root)/playlist/page.tsx:14-15`, `show/page.tsx:18-19`, `artist/page.tsx:18`, `album/page.tsx:15` - static metadata copy: build-time year, "Saavn" brand leak, EDM description on podcasts, padded `/artist` title, trailing "." on `/album` [routes 12]
  - Fix: rewrite the four strings; drop the year or compute it in `generateMetadata`. Executor: haiku. Flags: none.
- [ ] **W-13** P3 CONFIRMED `(root)/browse/page.tsx:43-47,61-65` - "Top Albums" and "New Releases" tiles both link to `/album` [routes 13]
  - Fix: point New Releases at `/album?lang=<first language>` or drop it. Executor: haiku. Flags: none.

## Batch W4 (opus): label route restructure - `apps/web/app/(root)/label/[name]/[token]/{page,loading}.tsx`, `packages/core/src/entity-route.ts`

`entity-route` is shared with mobile: re-run mobile route tests after the change.

- [ ] **W-14** P2 PLAUSIBLE `(root)/label/[name]/[token]/loading.tsx:1-17` - `usePathname()` outside `PathnameBoundary`, so the shell degrades to the generic `(root)/loading.tsx` grid and the page shows three layouts in a row [routes 5]
  - Fix: static header/tab skeleton, list-vs-grid choice behind `PathnameBoundary` with the grid as the null fallback (or always the grid); add a dom test with no pathname. Executor: sonnet. Flags: none. (Superseded if W-15's layout lands first.)
- [ ] **W-15** P2 CONFIRMED `label/[name]/[token]/page.tsx:62-63,69-117`, `lib/types` fixture `label/music-label/lbl123_` - label tabs are `<Link>`s that re-skeleton the whole page, both lists are rendered and shipped every visit, and a slug without `-songs`/`-albums` makes both tabs link to the same URL (Songs unreachable) [routes 6]
  - Fix: mirror the artist pattern: `label/[name]/[token]/layout.tsx` (header + tab nav) with `page.tsx` (songs) and `albums/page.tsx`, map `-songs`/`-albums` slugs in `getHref`/`entity-route` like `legacyArtistPath`. Minimal fallback: client-state tabs, render only the active panel, never rewrite the slug. Executor: opus. Flags: none.

## Batch W5 (sonnet): `/me`, show and home routes - `apps/web/app/(root)/me/**`, `app/(root)/show/[name]/[season]/[token]/page.tsx`, `app/(root)/_components/home-greeting.tsx`, `app/(root)/page.tsx`, `lib/db/queries.ts` _(after S1)_

- [ ] **W-16** P2 PLAUSIBLE `(root)/me/(layout-a)/layout.tsx:25-29,63-65`, `error.tsx`, `page.tsx:28`, `albums/page.tsx:14`, `liked-songs/page.tsx:29-32`, `recently-played/page.tsx:25` - with a stale session cookie the page body throws UNAUTHORIZED into `error.tsx` before the `ProfileHeader` redirect lands [routes 4]
  - Fix: one `requireUser()` (`getViewer()` then `redirect("/login")`) at the top of every `/me` page and in `ProfileHeader`; add a mocked test with a null session. Executor: sonnet. Flags: none.
- [ ] **W-17** P3 CONFIRMED `show/.../page.tsx:33-42,45,54,131-137`, `inputs.ts:80` - `?sort=` is not normalised and `generateMetadata` and the page fetch under different cache keys for `?sort=asc` [routes 8]
  - Fix: `readSort(searchParams)` returning `"asc" | "desc"` used by both; give `generateMetadata` the `searchParams` prop; add a test. Executor: sonnet. Flags: none.
- [ ] **W-18** P3 CONFIRMED `show/.../page.tsx:19,21,76-82,134-136` - the page re-implements `getViewer()` with a `.catch(() => undefined)` hack [routes 9]
  - Fix: `const { user, favorites, playlists } = await getViewer();` in `ShowEpisodeSection`; delete the three imports and the catch. Executor: haiku. Flags: none.
- [ ] **W-19** P3 CONFIRMED `(root)/me/(layout-a)/shows/page.tsx:14-21` - two sequential upstream calls per saved podcast (`show.episodes` then `show.details`) [routes 10]
  - Fix: store the show token/`show_url` with the favorite id, one `show.details` per item; keep the two-call path as lazy fallback for old rows. Executor: sonnet. Flags: needs live DB.
- [ ] **W-20** P3 CONFIRMED `(root)/me/playlist/[id]/page.tsx:120-131` - whole-playlist duration shown as "95:12" and "1 Songs" [routes 11]
  - Fix: `"hh:mm:ss"` at 3600s or more; reuse `LibraryHeading`'s pluralisation. Executor: haiku. Flags: none.
- [ ] **W-21** P3 CONFIRMED `(root)/_components/home-greeting.tsx:27,36`, `(root)/page.tsx:27-32` - the document's only `h1` is the time-of-day greeting [routes 18]
  - Fix: greeting as `p` plus a visually hidden `h1`, or `h1` only when signed in. Executor: sonnet. Flags: needs user decision (design call).

## Batch W6 (sonnet): player and play controls, a11y - `components/{play-button,play-all-button,queue,player,like-button,download-button}.tsx`, `components/song-list/play-pause-button.tsx`, `components/player/use-queue-removal.ts`, `components/site-header/surprise-me-button.tsx`, `tests/dom/{queue-sheet,like-button,card-play,download-button,play-button-season}.test.tsx`, `tests/player-a11y.test.ts`

- [ ] **W-22** P2 PLAUSIBLE `components/play-button.tsx:46,56` - `useSearchParams()` in every play control (hero, quick picks, cards, rows) for a `sort` only show/episode read; may push the home content out of the static shell [wcomp P2-1]
  - Fix: read `sort` at click time from `window.location.search` in those two branches (or pass it as a prop) and remove the hook; confirm `.next/server/app/index.html` contains the hero or add an `instant()` e2e for `/`. Executor: sonnet. Flags: none.
- [ ] **W-23** P2 CONFIRMED `components/download-button.tsx:67-81,100-103` - "Download N songs" runs `Promise.all` over every song: N blobs in memory, N save dialogs the browser blocks, one failure masks partial success [wcomp P2-3]
  - Fix: sequential (or 2 at a time), release each blob, one progress toast ("3 of 40"), report partial failure, consider a confirm above ~10. Executor: sonnet. Flags: none.
- [ ] **W-24** P2 CONFIRMED `components/queue.tsx:40-48,64,85-93`, `player.tsx:331-333,401` - closing the queue pane (Escape, close, `q`) while focused inside drops focus to `body` [wcomp P2-4]
  - Fix: on close, if the pane contains `document.activeElement`, focus `[aria-controls="player-queue"]`; optionally focus the pane on open. Executor: sonnet. Flags: none.
- [ ] **W-25** P2 CONFIRMED `song-list/play-pause-button.tsx:35,47-52`, `play-button.tsx:176`, `like-button.tsx:54` - row play/like controls are all named "Play" / "Like" with no track name [wcomp P2-7]
  - Fix: `aria-label={`Play ${item.name}`}` / "Pause ..." and `Like ${name}` (keep the word first for `aria-pressed`); update the like-button and a11y tests. Executor: haiku. Flags: none.
- [ ] **W-26** P3 CONFIRMED `play-button.tsx:160-166`, `library/play-all-button.tsx:43-46`, `surprise-me-button.tsx:90-93` - success toast on every Play over a player that already announces it [wcomp P3-2]
  - Fix: drop for Play/Play All/Surprise Me; keep toasts for radio and errors. Executor: haiku. Flags: none.
- [ ] **W-27** P3 CONFIRMED `components/player/use-queue-removal.ts:107-112` - "Removed from queue" lives 10s with no Undo [wcomp P3-1]
  - Fix: `action: { label: "Undo" }` reinserting at the old index, or default duration. Executor: sonnet. Flags: none.
- [ ] **W-28** P3 CONFIRMED `components/player.tsx:328-330` - `s` (shuffle) gives no feedback while `l` toasts [wcomp P3-4]
  - Fix: toast "Shuffle on/off" or write it to the `aria-live` `<output>`. Executor: haiku. Flags: none.
- [ ] **W-29** P3 CONFIRMED `components/queue.tsx:50-53` - `clearUpNext` calls `setCurrentIndex(currentIndex)` (no-op) [wcomp P3-12]
  - Fix: delete the line. Executor: haiku. Flags: none.
- [ ] **W-30** P3 CONFIRMED `tests/dom/*`, `tests/player-a11y.test.ts` - missing web tests: `ExpandedPane` phone toggles/`aria-expanded`, `MainNavPopup` with duplicate titles, plus those named in W-4, W-7, W-22..W-25 [wcomp T-1]
  - Executor: sonnet, alongside each fix. Flags: none.

## Batch W7 (haiku): small component and route nits - `components/{slider/slider-list,slider/slider-card,error-illustration,route-error,catalog-load-more,site-header/main-nav-popup,search/use-search-palette-keys,library/library-song-list}.tsx`, `app/(root)/{playlist/[name]/[token],album/[name]/[token],radio/[name]/[token]}/page.tsx`, `app/(root)/settings/_components/{profile-form,settings-search}.tsx`, `app/@modal/**`, `app/(root)/browse/_components/catalog-states.tsx`, `app/(root)/loading.tsx` _(after S1)_

- [ ] **W-31** P2 CONFIRMED `components/slider/slider-list.tsx:16-39`, `slider/shelf.tsx:70-98`, `album/[name]/[token]/page.tsx:73-82`, `artist/[name]/[token]/layout.tsx:62-103`, `song/[name]/[token]/page.tsx:204-213` - empty shelves render a heading plus two disabled arrows (album "Artists", seven artist shelves) [routes 7]
  - Fix: `if (items.length === 0) return null;` in `SliderList` (one line covers every caller); delete the redundant guard in the playlist page. Executor: haiku. Flags: none.
- [ ] **W-32** P3 CONFIRMED `settings/_components/profile-form.tsx:195-204`, `settings-search.tsx:161-182` - dead "Change avatar" control and an "Appearance saved" pill on first paint [routes 14]
  - Fix: remove the avatar button until uploads exist; show the status only after the first `update()`. Executor: haiku. Flags: none.
- [ ] **W-33** P3 CONFIRMED `radio/[name]/[token]/page.tsx:52-70` - station artwork `alt` duplicates the `h1` [routes 15]
  - Fix: `alt=""`. Executor: haiku. Flags: none.
- [ ] **W-34** P3 CONFIRMED `app/@modal/(.)reset-password/page.tsx`, `@modal/auth-modal.tsx:56-71` - unreachable reset-password modal; forgot/reset modals say "Already have an account? Login" [routes 16]
  - Fix: delete `@modal/(.)reset-password`; make the footer line a `login`/`signup`-only prop. Executor: haiku. Flags: none.
- [ ] **W-35** P3 CONFIRMED `components/catalog-load-more.tsx:5`, `app/(root)/loading.tsx` - shared component imports `CatalogEnd` from the route-private `browse/_components/catalog-states` [wcomp P3-5]
  - Fix: move `CatalogEnd` and the catalog skeletons under `components/catalog/`. Executor: haiku. Flags: none.
- [ ] **W-36** P3 CONFIRMED `slider/slider-card.tsx:109`, `error-illustration.tsx:11`, `route-error.tsx:71` - decorative media announced twice (text alt, no `aria-hidden`) [wcomp P3-6]
  - Fix: `alt=""` on card art and the duck gif; `aria-hidden` on `RefreshCw`. Executor: haiku. Flags: none.
- [ ] **W-37** P3 CONFIRMED `site-header/main-nav-popup.tsx:75,95,111` - mega-menu keys use `title`, duplicates collide [wcomp P3-7]
  - Fix: key by `perma_url`. Executor: haiku. Flags: none.
- [ ] **W-38** P3 CONFIRMED `search/use-search-palette-keys.ts:42-70` - the MutationObserver is recreated on every arrow key (`index` in deps) [wcomp P3-8]
  - Fix: observer effect keyed on `[enabled, listboxId]`, read `index` via a ref. Executor: haiku. Flags: none.
- [ ] **W-39** P3 CONFIRMED `library/library-song-list.tsx:154-158` - empty `items` with no filter shows `No songs match ""` [wcomp P3-9]
  - Fix: branch on `query.trim()` and show `LibraryEmpty` otherwise. Executor: haiku. Flags: none.

## Batch T1 (sonnet): CI, budget and lint gates - `.github/workflows/ci.yml`, `turbo.json`, `packages/ui/package.json`, `scripts/check-budget.ts`, `knip.json`, root `package.json` (lint-staged), `next.config.ts`, `lib/image-hosts.ts`

Run `bun run build && bun run budget` first to get real numbers.

- [ ] **T-1** P2 CONFIRMED `packages/ui/package.json:8`, `turbo.json`, `ci.yml:34` - `lint:shadcn` (`no-raw-colors`, `require-static-classes`) is not a turbo task and never runs in CI [lib 4]
  - Fix: add a `lint:shadcn` turbo task and a CI step; run once first and fix or exempt findings. Executor: haiku (sonnet if it finds violations). Flags: none.
- [ ] **T-2** P2 CONFIRMED `scripts/check-budget.ts:16-22,59-68,72-80` - hard caps (365/425/380/380/360/365/255) are 14-20 KB above the documented ratchet, so "caps equal the ratchet" is tautological [lib 5]
  - Fix: measure, set ceilings ~5% above current maxima, rewrite the header (or state the raise was deliberate). Executor: sonnet. Flags: none.
- [ ] **T-3** P2 CONFIRMED `apps/web/tests/mocked/cached-api.test.ts:8-11,84-100`, `tests/cached-api-runtime.ts`, `ci.yml:85-101` - the `use cache` error-digest round-trip is only covered by a manual script CI never runs [lib 3]
  - Fix: run `tests/cached-api-runtime.ts` with the `cached-api-fetch.mjs` preload in the production job after readiness, list it as a knip `entry`; or make the mocked test throw a structurally cloned error. Executor: sonnet. Flags: none.
- [ ] **T-4** P3 CONFIRMED `scripts/check-budget.ts:66-67,342-343` - `forbiddenMode: "warn"` means the Zod/passkey shell-chunk rule can never fail CI [lib 15]
  - Fix: run `bun run budget`; if clean flip to `"error"`, else report the offender. Executor: sonnet. Flags: none.
- [ ] **T-5** P3 CONFIRMED root `package.json` lint-staged vs `apps/web/package.json:11` - pre-commit oxlint is weaker than CI (no `--deny-warnings --nextjs-plugin`) [lib 9]
  - Fix: add the flags or run `turbo run lint --filter=...[HEAD]`. Executor: haiku. Flags: none.
- [ ] **T-6** P3 CONFIRMED `knip.json:4-6` - ignores cause false positives (`@happy-dom/global-registrator`, `scripts/api-server.ts`, `tests/cached-api-runtime.ts`) [lib 10]
  - Fix: declare them as `entry` instead of `ignore`. Executor: haiku. Flags: none.
- [ ] **T-7** P3 CONFIRMED `apps/web/next.config.ts:58-66`, `lib/image-hosts.ts:2-4`, `.github/workflows/ci.yml:5` - dead `images.remotePatterns` under `unoptimized: true`; stale `migration/bun-monorepo` branch [lib 16]
  - Fix: drop the block and the comment; fix the branch list. Executor: haiku. Flags: none.

## Batch T2 (sonnet): CSP avatars - `apps/web/lib/{csp,image-hosts}.ts`, `apps/web/tests/csp.test.ts`

Shares `image-hosts.ts` with T1's T-7: do T2 first or have one executor take both.

- [ ] **T-8** P2 CONFIRMED (gap) / PLAUSIBLE (hosts) `lib/csp.ts:67`, `lib/image-hosts.ts:6-9`, `components/user-avatar.tsx:38`, `packages/auth/src/auth.ts:226-228`, `tests/csp.test.ts:49-56` - `img-src` omits the Google/GitHub avatar hosts, so social-login avatars always violate CSP and break if `CSP_ENFORCE` flips [lib 2]
  - Fix: `AVATAR_HOSTS = ["lh3.googleusercontent.com", "avatars.githubusercontent.com"]` (confirm against a real `user.image`), spread into `img-src`, update the test; keep them out of `parseAllowedImageUrl`. Executor: sonnet. Flags: none.

## Batch T3 (sonnet): type-check tests and scripts - new `apps/web/tsconfig.tests.json`, root `tsconfig.json`, `type-check` scripts

Run LAST (after the S/W/M batches merge): the first run surfaces real type errors across ~150 test files, and it would conflict with every batch that adds tests.

- [ ] **T-9** P2 CONFIRMED `apps/web/tsconfig.json:16-21`, root `scripts/*` - tests and scripts are excluded from type-checking, so renamed exports and stale shapes only fail at runtime [lib 1]
  - Fix: `tsconfig.tests.json` (extends, `include: ["tests","scripts","**/*.test.*"]`, `types: ["bun"]`) and a root tsconfig for `scripts/`, chained into `type-check` as `packages/core` does; fix the errors in the same change. Executor: sonnet. Flags: none.

## Batch T4 (haiku; T-13 sonnet): web lib cleanup - `apps/web/lib/{cached-api,search-route,rate-limit-scope,client-ip,env,theme-config,use-favorite-toggle,csp,control-styles,pending-params}.ts`, `lib/glass/{artwork,overlays}.ts`, `lib/theme/{oklch,accent}.ts`, `lib/trpc/server.ts`, `hooks/{use-deferred,use-store}.ts`, `packages/trpc/src/lib/api.ts`

- [ ] **T-13** P3 PLAUSIBLE `lib/rate-limit-scope.ts:10`, `tests/mocked/proxy.test.ts:643` - any page path ending in a static extension (`/search/all/50%.json`, `/album/x/y.mp3`) skips the proxy: no search repair, CSP header or limiter charge [lib 8]
  - Fix: anchor the extension exclusion to top-level public files or `_next/`, `favicon.ico`, `/images/`, `/fonts/`; add a search-query case to the matcher test. Executor: sonnet. Flags: none.

## Extra follow-ups (from earlier work, not in the review batches)

- [ ] **X-1** P2 Security: email change without verification. `packages/trpc/src/router/user.ts` (`updateUser`). Changing the email now clears `emailVerified` and revokes other sessions, but nothing proves the user owns the new address. Better Auth then links a Google sign-in for that email to this account. Fix: use Better Auth's `changeEmail` flow, which sends a verification to the new address and changes it only on confirm, or block the change until verified. _(after S1)_
- [ ] **X-2** P3 `apps/mobile/src/components/catalog-screen.tsx`: the skeleton disappears in one frame and the cards fade in from 0, so there is a 200ms dip to the background. Crossfade the skeleton out instead, opacity only and reduce-motion safe.
- [ ] **X-3** P3 Animation and accessibility sweep, last, after the batches above:
  - review mobile and web motion for missing enter and exit transitions on state changes (sheets, lists, toggles) and for reduce-motion gates
  - add accessibility labels and roles where tests show gaps
  - one PR per platform, with no visual redesign

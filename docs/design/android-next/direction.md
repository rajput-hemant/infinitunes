# Android next: "Ink & Wash"

A design direction for the Android app (`apps/mobile`, Expo SDK 58). It replaces the Material 3
Expressive brief in `docs/design/android-m3-expressive/spec.md` as the target; that spec stays the
record of what is built today. iOS is untouched: every change below is an Android branch
(`.android.tsx`, `Platform.select`, the android side of `theme/tokens.ts`), never a screen.

## 0. What the screenshots show

All 35 attachments in the owner's folder (`mcp-48a17f1b-*`, 10-21 to 10-29) are **iOS**: iPhone
frames with a Dynamic Island, the glass tab bar and the system mini-player accessory
(`c3d332b0`, `494e9b60`, `850781d2`, `30dbc6f2`, `073c0512`, `ae81caaa`, `1ff8c504`, `df553627`,
`eee46e18`, `6a0daf8d`, `48229db7`, `9609b79c`, the small crops), one is Apple Music itself
(`23472592`, the reference for the iOS layout), one is the web player (`99ad4b8c`) and one the web
playlist header (`cb622fe0`). None is the Android build. The diagnosis below is therefore read from
the Android code paths and the M3E spec's own "before" audit, not from a picture of the device.
Before implementation starts, one Android screenshot per package's screen should be taken and
attached to the package (see "Device sign-off" at the end).

The iOS screenshots still matter: they show the layout Android inherited. Android today is Apple
Music's composition (centred header, grabber, four equal pills, Apple Music swipe capsules) with
Material parts bolted on. That is the root of "rough": two visual systems on one screen.

## 1. Diagnosis

Each item names the code that produces it. Line numbers are at `f493e764` (feat/platforms).

1. **The header wash stops at the toolbar.** `EntityHeader` paints the artwork wash from 400pt
   above its box so it "meets the top of the screen" (`components/entity-header.tsx:34-37, 101-114`),
   but Android's native stack header is opaque `surface` (`navigation/tab-stack-options.ts:7-9`
   sets only `headerShadowVisible`; `navigation-theme.ts:44-45` makes `card` the surface colour).
   iOS gets `headerTransparent: true` (`tab-stack-options.ios.ts:12-19`). On Android the bleed is
   hidden behind a wallpaper-coloured bar: a hard seam between toolbar and album colour on every
   album, playlist, artist and station page.
2. **Three colour sources per screen.** Wallpaper roles tint the page and every container
   (`theme/tokens.ts:141-158`: `background`, `card`, `muted`, `secondary` all Material You), the
   artwork seeds the header and the dock (`lib/use-player-colors.ts:133-143`,
   `features/player/floating-player-dock.tsx:31-36`), and the navigation bar is wallpaper again
   (`navigation-theme.ts:38-50`). A lavender wallpaper page with an orange album header above a
   teal dock above a lavender nav bar is the common case, and nothing in the system decides which
   colour owns the screen.
3. **Two floating slabs at the bottom.** The mini player is a 64dp card inset 16dp, 8dp above the
   80dp navigation bar (`floating-player-dock.tsx:18-19, 59-68`; `navigation/player-dock.ts:7-18`),
   on the album's tonal surface while the bar is wallpaper. Stacked, they read as a widget sitting
   on another widget, with a 2dp progress line at the bottom edge of the top one.
4. **The toolbar is a stock toolbar.** On Android `useTopLevelHeaderOptions` returns only
   `{ title, headerRight }` (`navigation/top-level-actions.tsx:89`): Home opens with "Good
   afternoon, Asha" as a 22sp toolbar title. The custom large greeting is iOS 26 only
   (`top-level-actions.tsx:91-113`). Nothing on an Android root screen is bigger than a list title.
5. **Headline weights are a settings app's.** The Android scale is Material's: `largeTitle`
   28/400, `title1` 24/400, emphasized to 500 (`theme/tokens.ts:402-412, 419-432`). Entity titles
   and the Now Playing title are `title1 emphasized`, 24sp at 500, centred and wrapping to three
   lines for "Welcome (Original Motion Picture Soundtrack)" (`entity-header.tsx:118, 157-164`:
   `items-center`, `text-center`). A music app's title should be the loudest thing on the page;
   here it weighs the same as a section label (`section-header.tsx:31-40`, 22/700).
6. **Four corner languages in one scroll.** Home: hero art 28 (`media-card.tsx:31-34`), quick
   picks 12 with art 8 (`quick-pick-tile.tsx:41-51`), cards 12 (`tokens.ts:293-304`
   `artRadius.card = "md"`); Library: tiles 16 (`library-tile.tsx:39-43`); Settings: 16 outer, 4
   inner (`settings-screen.android.tsx:31-38, 73`). The M3E shape scale is right; the app uses all
   of it on one screen.
7. **Everything is a tonal box.** Quick-pick tiles, library tiles, browse tiles, the Top Result
   card and the dock are all `bg-card` (`surfaceContainerHigh`) rectangles
   (`quick-pick-tile.tsx:47-50`, `library-tile.tsx:38-43`, `features/browse/browse-tile.tsx:33`,
   `features/search/top-result-card.tsx:41`). Rows are flat. Elevation exists once
   (`floating-player-dock.tsx:19`). Surfaces carry no depth order, only alpha.
8. **The only motion is press feedback.** Springs are defined (`theme/motion.ts`) and used for
   button corner morphs, the press sink and the current-track container
   (`list-row.tsx:383-406`). Everything else is a 200ms opacity fade (`components/skeletons.tsx:35-45`,
   `CONTENT_REVEAL`), and the scrolled app bar is "an instant swap" (`navigation/use-scrolled-bar.ts:62-70`
   calls `setOptions` with a new `headerStyle`; the spec admits it at `spec.md:202-203`). A page
   arrives, it does not land.
9. **The player is an iOS sheet.** Now Playing draws a grabber ("iOS's grabber",
   `features/player/full-player.tsx:441-466`), rounded top corners as "the system sheet it
   replaced" (`full-player.tsx:676-683`), Apple Music's four equal capsules in the compact header
   (`full-player.tsx:570-634`), and the Lyrics / Up next toggles as two round buttons at the far
   corners. Android has a predictive back gesture (`app.config.ts:64`) and no sheet grabber idiom.
10. **Home's chips say "filter", do "navigate".** The language row is a Material filter chip row
    with a checked "For you" (`features/home/home-header.tsx:17-25`, `components/chip-row.tsx:33-50`),
    but each chip pushes `/album?lang=` (`home-header.tsx:23`). A check mark promises a filter on
    this page and the page changes instead.
11. **Search's root has a back arrow.** The Search tab hides its toolbar and shows a 56dp
    full-round pill with a leading Back that goes Home (`features/search/search-header.android.tsx:34-59`).
    On a root tab a Back button is a pushed-screen idiom with nowhere to go.
12. **Rows are one shade of grey apart.** Row subtitles are `footnote` 14/400 in
    `onSurfaceVariant` (`list-row.tsx:235-239`); on One UI that resolves to `onSurface` and is
    faded to 72% (`theme/dynamic-palette.ts`, AGENTS.md). Title and subtitle are 16/400 against
    14/400: the list reads as a wall of equal lines.

## 2. The language: Ink & Wash

The names already exist in the code (`OnWash`, `WashText`, `TextInkContext` in
`components/wash.tsx` and `components/ui/text.tsx`). The direction makes them the whole system.

- **Wash**: one artwork-derived colour field per screen, edge to edge, under the status bar. The
  entity page's wash is its artwork; Home, Library, Radio and Search take the now-playing
  artwork's accent for their one accent colour; with nothing playing and no entity, the screen
  is neutral. Material You stays for the chrome the system draws (navigation bar, ripples,
  the loading indicator) and as the accent when nothing is playing, so the app still agrees with
  the wallpaper at rest and takes the colour of the music once it plays.
- **Ink**: heavy, tight, left-aligned Roboto for everything that names a thing; solid
  monochrome (foreground / background) controls instead of tonal ones; content laid directly on
  the page, not in boxes. The only containers left are the ones that hold a *state* (the current
  track's tile, the dock, a sheet).

### 2.1 Type (Roboto, system; no custom fonts)

`TypeStyle` gains an optional `letterSpacing` (`theme/tokens.ts:374-378`). Android scale:

| `TextVariant` | Size/line | Weight | Emphasized | Tracking | Use                                          |
| ------------- | --------- | ------ | ---------- | -------- | -------------------------------------------- |
| `largeTitle`  | 32/38     | 700    | 800        | -0.5     | Home greeting, Library, Radio (in the page)  |
| `title1`      | 28/34     | 700    | 800        | -0.25    | Entity title, Now Playing title              |
| `title2`      | 22/28     | 700    | 700        | 0        | Section titles (unchanged)                   |
| `headline`    | 16/22     | 600    | 700        | 0        | Row title of the current track, tile titles  |
| `body`        | 16/22     | 400    | 500        | 0        | Row titles                                   |
| `label`       | 14/20     | 500    | 700        | 0.1      | Buttons, chips, card titles                  |
| `subhead`     | 14/18     | 400    | 500        | 0        | Credits                                      |
| `footnote`    | 13/18     | 400    | 500        | 0.1      | Row subtitles                                |
| `caption`     | 12/16     | 500    | 700        | 0.3      | Eyebrows ("ALBUM · 2007"), uppercase         |

Roboto renders 600 as 700 on some devices; `headline` at 600 is the intent and falls back to
700 (one weight step over `body`, as today). Headlines (`largeTitle`, `title1`) are left-aligned
on Android everywhere they are centred on iOS. Tabular figures for durations stay.

### 2.2 Shape

The `radii` android branch stays `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 28 }`; what changes is how
much of it one screen uses.

| Element                               | Radius | Note                                             |
| ------------------------------------- | ------ | ------------------------------------------------ |
| Row art (48), quick-pick art, chips   | `sm`   | unchanged                                        |
| Card art (136), library tiles, hero   | `lg`   | `artRadius.card` becomes `lg` on Android         |
| Header art (248), Now Playing art     | `xl`   | the two biggest pictures share the biggest shape |
| Controls at rest                      | full   | press morph to `sm` stays                        |
| Dock                                  | 0      | it is a strip, not a card (2.3)                  |
| Sheets                                | `xl`   | unchanged                                        |

Three radii on a screen, never four. `md` is left for the connected button group and the search
field.

### 2.3 Surface and elevation

- Page: `background` (Material You `surface`), or the wash where the screen has one. The wash is
  a vertical gradient from the artwork colour at the top to `background` by the end of the
  header, and it starts at y = 0, under a transparent native header.
- The native header on Android is transparent on every stack. A `BarScrim` view inside the page
  fades a `background`-coloured layer in behind the bar as the content scrolls under it, on the
  UI thread (a Reanimated interpolation of the scroll offset over the first 56dp), replacing the
  instant `headerStyle` swap. The title still appears in the bar when the header scrolls under
  (`detailHeaderOptions` keeps `headerTitle`).
- No tonal boxes around content. Quick-pick, library and browse tiles become **ink tiles**: a
  transparent fill with a hairline `border` outline in `outlineVariant` and the title in
  `foreground`. The Top Result card and the current-track container keep a fill (they mark a
  state: "this one", "playing now").
- One elevated surface: the dock, a full-width strip fused to the top of the navigation bar
  (no inset, no corners), on the dock wash (`dockWash`), with the 2dp progress line along its
  **top** edge where it also separates the strip from the page. The navigation bar keeps the
  system surface (the NativeTabs rule in AGENTS.md stands).
- Settings keeps the Android 16 segmented list: it is the one place a boxed list is the platform
  idiom.

### 2.4 Colour

- `androidDynamicColors` is unchanged: surfaces and text stay Material You.
- A new `usePlayingAccent()` (`theme/playing-accent.ts`) returns `{ primary, foreground }` from
  the current track's `dock.accent` / `dock.background` pair when the listener's accent
  preference is `default`, both checked at 3:1 against the page `background` and 4.5:1 for
  `foreground` on it with `contrastRatio` (`lib/artwork-colors.ts`); otherwise `undefined`.
  `ThemeRoot` sets `--primary` / `--primary-foreground` from it, so filled buttons, the selected
  chip, "See All", the tab tint and the like heart take the colour of what is playing, and fall
  back to the wallpaper when nothing is.
- The explicit accent presets (`ACCENTS`) win over both, as today.
- Every pair that becomes text or a control is AA-checked where it is produced; nothing new is
  produced without a `contrastRatio` guard and a test (`tokens.test.ts` pins the palettes,
  `playing-accent.test.ts` pins the derived pair).

### 2.5 Motion

The springs stay (`theme/motion.ts`). Three additions make them a system:

- **Land**: an entity page's header art and wash arrive together: the art scales 0.94 → 1 on
  `spatialSlow` while the wash fades in (`effectsDefault`), one shared value, no stagger. Rows
  below still fade (`CONTENT_REVEAL`); no entering animations on FlashList cells.
- **Scrim**: the bar scrim is a scroll-driven interpolation, never a state swap.
- **Dock**: play/pause on the strip is the same shape morph as Now Playing's (rounded square
  paused, circle playing) at 40dp; the strip itself slides in from under the navigation bar on
  `spatialDefault` when the first track starts and out when the queue empties.

Reduce motion: the land becomes the fade alone, the scrim stays (it is opacity), the dock snaps.

### 2.6 Density and rhythm

- Rows 56dp, art 48, unchanged. Row subtitle `footnote` 13 with `caption`-style tracking; the
  title stays `body`. The current track's row title is `headline`.
- Sections: 24dp above a section title (`pt-6`), 8 below; shelves keep no vertical padding. Home
  therefore reads as hero / quick picks / shelves with a visible beat between them.
- The entity header: art 248 at `xl`, then 16dp, then the eyebrow in `caption` uppercase, the
  title in `title1` left-aligned, the credit and meta lines left-aligned, then the action row:
  heart and menu at the start, a spacer, Shuffle (standard icon button, no container) and a 56dp
  filled Play at the end. Download joins the menu on Android. Everything is `px-page` and
  `max-w-readable`.
- Home: the greeting is the first thing in the page (`largeTitle`, `px-page pt-2`), not the
  toolbar title; the toolbar shows nothing but Settings and the avatar. The language chips sit
  under it as **assist chips**: outlined, no check, the current one in `foreground` text
  (`tabs` false means no selected state is drawn).
- Search root: the field is a 56dp `md`-cornered outlined field with a magnifier, no Back; the
  pushed results screen keeps Back.

### 2.7 Accessibility rules kept

48dp targets (`sizes.touch`, hit slop on the outermost view), AA on every text pair, `announce()`
for results VoiceOver/TalkBack cannot see, `useReducedMotion` on every Reanimated CSS animation,
labelled `View`s for items without a screen. The ink tiles' outline is `outlineVariant`, which is
decorative: the tile's text carries the contrast.

## 3. Work packages

Independent, in priority order; each is one branch off `feat/platforms`. Sizes: S (half a day),
M (a day or two), L (several days). Acceptance is what Jest (`bun run test:mobile`) and
`bun run type-check` can prove; Jest runs the iOS modules by default, so an Android branch is
tested by importing the `.android` file by name (as `segmented-tabs.android.test.tsx` does) or by
assigning `Platform.OS = "android"` in the test and restoring it (as `haptics.test.ts` does).
Every package keeps `theme/spacing.test.ts` and `theme/radius.test.ts` green (only classes on the
closed scale, only known radii) and touches no screen file for a platform difference.

### WP1 · Wash to the top (M)

The header wash reaches the status bar on Android; the scrolled bar fades instead of snapping.

Files: `navigation/tab-stack-options.ts` (android: `headerTransparent: true`),
`components/detail/detail-header-options.tsx` (Android branch stops setting `headerStyle`;
keeps the `headerTitle` swap), `components/detail/detail-scroll.tsx` (also exposes a shared
scroll offset for the scrim), `navigation/use-scrolled-bar.ts` (root screens: same scrim instead
of `setOptions`), new `components/bar-scrim.android.tsx` (a `background` layer with animated
opacity, absolutely placed over the header height from `useHeaderHeight()`) and
`components/bar-scrim.tsx` (renders `null`), `components/detail/detail-frame.tsx` and
`components/screen-scroll-view.tsx` (mount the scrim; add the header height to the top content
inset on Android, `contentInsetAdjustmentBehavior` does not apply there),
`components/entity-header.tsx` (`WASH_BLEED` covers the inset top; the wash gradient ends at
`background`).

Acceptance:

- `detail-header-options.test.tsx`: with `Platform.OS = "android"` and `scrolledColor` set, the
  options contain `headerTitle: item.name` and no `headerStyle.backgroundColor`.
- `bar-scrim.android.test.tsx` (new): opacity is 0 at offset 0, 1 at and past the header height,
  linear between; `null` is rendered on iOS (`bar-scrim.test.tsx`).
- `detail-screen.test.tsx` and a new `screen-scroll-view.test.tsx`: the scrim is in the tree on
  Android only; content top padding equals the header height on Android.
- `entity-header.test.tsx`: `header-wash` is present with a gradient whose second stop is the
  palette `background`.
- Type-check green.

### WP2 · Ink type and left-aligned headers (M)

The Android type scale from 2.1, tracking support, and left-aligned entity headers.

Files: `theme/tokens.ts` (`TypeStyle.letterSpacing?`, `androidScale`, `emphasizedWeights`
android branch, `artRadius` via `Platform`-free `process.env.EXPO_OS` like `radii`),
`components/ui/text.tsx` (applies `letterSpacing`; a new `uppercase` prop for eyebrows that sets
`textTransform` without touching the label read by screen readers), `components/entity-header.tsx`
(`HEADER_ALIGN = Platform.select({ android: "start", default: "center" })` driving
`items-start`/`text-left` vs `items-center`/`text-center`; the action row from 2.6; Download
moves into `menu` on Android via `components/detail/detail-menu.tsx`),
`components/skeletons.tsx` (`EntityHeaderSkeleton` mirrors the alignment and the row),
`components/section-header.tsx` (android `pt-6`), `features/player/full-player.tsx`
(`TITLE_VARIANT` stays `title1`, now heavier by the scale alone).

Acceptance:

- `theme/tokens.test.ts`: every android `TypeStyle` has `lineHeight >= fontSize`, `largeTitle`
  and `title1` weights are `"700"`, emphasized weights are one step up and never below the base.
- `components/ui/text.test.tsx`: `letterSpacing` from the variant lands in the style; `uppercase`
  sets `textTransform` and leaves `children` as given.
- `entity-header.test.tsx`: on Android (`Platform.OS = "android"`) the title has `text-left` and
  the action row ends with a `large` filled Play; on iOS the existing assertions hold unchanged.
- `skeletons.test.tsx`: the Android header skeleton has the same number of text lines and the
  same control sizes as the header (overlay rule), asserted by test ids.
- `spacing.test.ts`, `radius.test.ts` green; type-check green.

### WP3 · Home as a page: display greeting and assist chips (S)

Files: `navigation/top-level-actions.tsx` (Android branch returns `headerTitle: ""` and keeps
`title` for the back menu), new `features/home/home-title.tsx` (the greeting as `largeTitle`
emphasized, `px-page pt-2`, `accessibilityRole="header"`; rendered by `home-feed.tsx` above
`HomeHeader` on Android only through `Platform.select`, iOS renders nothing),
`components/chip-row.tsx` (Android: the check icon and the `secondaryContainer` fill only when
`tabs` is true; otherwise outlined with the selected label in `foreground`),
`features/home/home-skeleton.tsx` (a `largeTitle` line first on Android).

Acceptance:

- `home-greeting.test.tsx`: on Android the greeting is a header element in the page and the
  stack options carry an empty `headerTitle`; on iOS unchanged.
- `chip-row.test.tsx`: with `tabs` unset no chip renders the check icon on Android; with `tabs`
  the selected chip does; the selected chip keeps `accessibilityState.selected`.
- `routes.test.tsx` still renders every tab.
- Type-check green.

### WP4 · Ink tiles and one card shape (M)

Files: `components/quick-pick-tile.tsx` (`PICK_TILE_CLASS` android: `border border-border`,
no `bg-card`; the icon cell keeps `bg-fill-2`), `features/library/library-tile.tsx` and
`features/browse/browse-tile.tsx` (same outline treatment, `rounded-lg`),
`theme/tokens.ts` (`artRadius.card = "lg"` on Android; `hero` stays `lg` so `HERO.radius`
in `media-card.tsx` becomes `lg` on both), `components/media-card.tsx` (ripple clip
`rounded-t-lg` on Android), `features/home/home-skeleton.tsx` and `components/skeletons.tsx`
(mirror through `PICK_TILE_CLASS` and `artworkFrame`, no new code expected),
`features/search/top-result-card.tsx` (unchanged: it keeps its fill on purpose; add a comment).

Acceptance:

- `quick-pick-tile.test.tsx`: on Android the tile's class has `border` and not `bg-card`; the
  ripple is still bounded (`android_ripple.foreground`); the dimmed variant still dims only the
  picture.
- `media-card.test.tsx`: the card art frame's radius equals `radii.lg` on Android and `radii.md`
  on iOS (`artworkFrame("card", ...)`).
- `skeletons.test.tsx` / `catalog-screen.test.tsx`: skeleton card frames equal the live frames.
- `radius.test.ts`, `spacing.test.ts`, type-check green.

### WP5 · The dock as a strip (L)

Files: `navigation/player-dock.ts` (`FLOATING_DOCK_INSET` and `DOCK_GAP` become
`Platform.select`: 0 on Android; `playerDockInset` follows), `features/player/floating-player-dock.tsx`
(Android: `left: 0, right: 0, borderRadius: 0`, the strip's enter/exit on `spatialDefault`
driven by whether a track exists, `useReducedMotion` snaps it), `features/player/dock-progress.tsx`
(`edge: "top" | "bottom"` prop, Android top), `features/player/mini-player.tsx` (Android art
`art.dock = 48` as a new `ArtSize` with `artRadius.dock = "sm"`, title `headline`, credit
`footnote`), `features/player/transport-controls.tsx` (`PlayPauseButton` on Android reuses the
40dp shape morph: extract the radius spring from `AndroidProminentPlayPauseButton` into a
`usePlayShape(size)` hook used by both). `floating-player-dock.ios.tsx` is untouched.

Acceptance:

- `navigation/player-dock.test.tsx` and `sheet-inset.test.ts`: on Android the dock offset is
  `insets.bottom + 80` and `playerDockInset` is `sizes.dock`; on iOS the previous values.
- `dock-progress.test.tsx`: `edge="top"` places the line at `top: 0`.
- `player-accessibility.test.tsx` / a new `floating-player-dock.test.tsx`: with no track the
  strip is not in the tree; with a track it is, with the "Now playing" button, play/pause and
  next; reduce motion renders it at its final position.
- `transport-controls.test.tsx`: the mini play/pause on Android reports a `borderRadius` of
  `sizes.ctl / 2` while playing and `radii.sm` while paused (the hook is unit-tested with
  `Platform.OS = "android"`).
- Type-check green.

### WP6 · The playing accent (S)

Files: new `theme/playing-accent.ts` (`usePlayingAccent()`: `usePlayer(selectCurrentTrack)` →
`usePlayerColors` → the dock pair, contrast-checked against `usePalette().background`; `undefined`
when the accent preference is not `default`, nothing plays, or a check fails) and
`theme/playing-accent.test.ts`, `theme/theme-root.tsx` (merges the pair into the `vars` after
the corner radii and before an explicit accent), `theme/use-palette.ts` (`useTabAccent` reads it
too, so the navigation bar tint follows), `theme/accent-palette.android.ts` (no change expected;
confirm `ACCENTED_TOKENS` stays the explicit-accent list).

Acceptance:

- `playing-accent.test.ts`: returns `undefined` with no track, with an explicit accent, and when
  `dock.accent` is under 3:1 on the background or `dock.background` under 4.5:1 for its
  foreground; returns the pair otherwise (seed a track through the test registry and the
  `artwork-colors` fixtures).
- `theme-root.test.tsx`: the root's variables contain `--primary` from the playing pair when it
  exists, and the explicit accent wins when both exist.
- `navigation-theme.test.tsx`: the tab tint equals the playing accent while one exists.
- `tokens.test.ts` AA pins unchanged; type-check green.

## 4. Device sign-off

None of this has been seen on a device. Each package's PR attaches one Android screenshot of the
screen it changes (dark and light, a Samsung One UI device and a Pixel if both exist) and is
checked against: the wash under the status bar (WP1), the title weight at the system's largest
font size (WP2), the greeting and chips with a long name (WP3), tile outlines on a light
wallpaper (WP4), the strip against the navigation bar with the system's three-button navigation
on (WP5), and a low-contrast cover (a white sleeve) producing no playing accent (WP6). Items that
pass in Jest but not on the device go to `memory/device-checks-pending.md`.

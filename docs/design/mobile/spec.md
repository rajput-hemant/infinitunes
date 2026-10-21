# Infinitunes mobile: design spec

Status: target design for `apps/mobile` (Expo SDK 58, iOS 26 + Android 16). Mockups: the Design canvas
"Infinitunes mobile directions" (https://claude.ai/artifact/4EEYTgr7cUwv2p8ETEJMi8), one row per direction and
platform, each showing Home, an album detail and Now Playing with the same content so the treatments compare.

The owner's brief: the current UI is "too messy". The audit in section 5 shows why: the same pieces (section
headers, rows, trailing actions, artwork) are rebuilt per screen with different paddings, sizes and radii, one
`title` style plays five roles, and Android content ignores the Material You colours its own chrome uses. The fix
is fewer patterns, each defined once, not new decoration.

## 1. Three directions

**D1. Quiet Native** (recommended)
System chrome untouched (Liquid Glass on iOS 26, Material You on Android), a monochrome UI on the web's neutral palette.
Artwork is the only colour on screen; one row, one card, one section header, one header layout, everywhere.
Left-aligned, generous 4pt rhythm, no separators, no play buttons on every card.

**D2. Liner Notes** (editorial)
Big display headings in the web's heading face (Cal Sans), left-aligned entity headers with large art and credits.
Dark by default, numbered track lists, dense 52pt rows, hairline rules between sections like a printed sleeve.
Strong brand voice; costs a bundled font, custom header layouts and more contrast work in light mode.

**D3. Ambient Tonal** (immersive)
Surfaces take their colour from the artwork: detail headers and Now Playing sit on an artwork-derived wash.
Content is grouped into tonal cards (M3 surface containers on Android, tinted fills on iOS).
Most colourful; needs per-image colour extraction, contrast checks per image and more surface rules.

### Why D1

1. It removes patterns instead of adding them, which is the brief. D2 and D3 each add a layer (a font and custom
   headers; colour extraction and tonal cards) on top of a codebase whose problem is too many layers.
2. It matches the web app, whose primary is neutral and whose colour comes from artwork and the optional glass tint
   (`docs/design-system/tokens.md`, `glass.md`).
3. It keeps the platforms native: no colours on `NativeTabs` or headers, system glass and Material You stay correct
   by construction (AGENTS.md, apps/mobile "Native look per platform").
4. Contrast is already pinned for its palette (`theme/tokens.test.ts`); D3 would need runtime checks per cover.
5. Nothing new to install. D2's font and D3's palette extraction are new native dependencies.

D1 borrows one idea from D2: album track lists are numbered instead of repeating the cover in every row.

## 2. D1 specification

All values are points (iOS) / dp (Android). Token names refer to `apps/mobile/src/theme/tokens.ts` (section 6).

### 2.1 Spacing: 4pt grid, seven steps

| Token  | Value | Tailwind | Use                                                               |
| ------ | ----- | -------- | ----------------------------------------------------------------- |
| `xs`   | 4     | `*-1`    | icon to label in a badge, eyebrow to title                        |
| `sm`   | 8     | `*-2`    | section header to content, art to card text, chip gap             |
| `md`   | 12    | `*-3`    | row leading to text, card gap, grid gap, button gap               |
| `lg`   | 16    | `*-4`    | page gutter (`px-page`), entity header blocks                     |
| `xl`   | 24    | `*-6`    | above every section header, Now Playing gutter                    |
| `xxl`  | 32    | `*-8`    | Now Playing block gaps                                            |
| `xxxl` | 48    | `*-12`   | empty and error state vertical padding                            |

Rules:

- S1. Screens use only these steps. No half steps (`*-0.5`, `*-1.5`, `*-2.5`) and no `*-5`, `*-10`; text pairs
  (title over subtitle) have no gap, their line heights space them.
- S2. Horizontal: every content block is inset by `page` (16). Full-bleed is allowed only for horizontal lists
  (their content container carries the 16) and row press highlights.
- S3. Vertical rhythm: sections carry no padding of their own. `SectionHeader` supplies 24 above and 8 below; a
  section's content ends flush. The scroll view supplies the bottom inset (`playerDockInset`).

### 2.2 Type ramp

One `Text` component, variant names below. iOS sizes are Dynamic Type defaults (they scale with the setting);
Android values are the M3 type scale with Roboto / the system font (they scale with font size). No custom fonts.

| Variant      | iOS text style      | iOS size/line/weight | M3 role          | Android size/line/weight | Use                                                |
| ------------ | ------------------- | -------------------- | ---------------- | ------------------------ | -------------------------------------------------- |
| `largeTitle` | Large Title         | 34/41 bold           | headlineMedium   | 28/36 regular            | only when not drawn by the navigation bar          |
| `title1`     | Title 1             | 28/34 bold           | headlineSmall    | 24/32 regular            | entity header title                                |
| `title2`     | Title 2             | 22/28 bold           | titleLarge       | 22/28 regular            | section headers, Now Playing title                 |
| `headline`   | Headline            | 17/22 semibold       | titleMedium      | 16/24 medium             | emphasis: empty-state title, tile title            |
| `body`       | Body                | 17/22 regular        | bodyLarge        | 16/24 regular            | row title, paragraphs                              |
| `label`      | Headline            | 17/22 semibold       | labelLarge       | 14/20 medium             | button text                                        |
| `subhead`    | Subheadline         | 15/20 regular        | bodyMedium       | 14/20 regular            | card title, meta line, chip text, text buttons     |
| `footnote`   | Footnote            | 13/18 regular        | bodyMedium       | 14/20 regular            | row and card subtitles                             |
| `caption`    | Caption 1           | 12/16 regular        | labelMedium      | 12/16 medium             | eyebrows, times, copyright, badges                 |

- T1. `title` stays as a deprecated alias of `title2` until every screen has migrated, then is removed.
- T2. Tones: `default`, `muted`, `primary` (new: accent text, e.g. the playing row's title), `onPrimary`,
  `onDestructive`, `error`. Colour goes through `tone`, never a `text-*` class or `style.color`.
- T3. Tabular figures (`fontVariant: ["tabular-nums"]`) for times and track numbers; `Text` takes `numeric`.
- T4. Native `@expo/ui` text (settings lists) takes `textStyles[variant]` from tokens, never literal sizes.
- T5. Only fixed-height chrome (mini player) caps scaling, with `maxFontScale.chrome` (1.3).

### 2.3 Corner radii

| Token  | Value | Use                                                                |
| ------ | ----- | ------------------------------------------------------------------ |
| `xs`   | 4     | explicit badge, radio badge, skeleton text bars                    |
| `sm`   | 6     | artwork at 64 and below (row, mini player, tile)                   |
| `md`   | 10    | cards (156), quick pick tiles, browse tiles, inputs                |
| `lg`   | 16    | artwork at 240 and above (entity header, hero, Now Playing), Android dock |
| `xl`   | 24    | sheets' own inner surfaces, large panels                           |
| `full` | -     | buttons, chips, avatars, round artwork (artists, stations), iOS dock |

- R1. Artwork radius follows its size token (2.4), never the call site: `Artwork` applies it.
- R2. Buttons and chips are capsules on both platforms (iOS 26 and M3 both use full-round buttons).
- R3. A tile that holds artwork clips it (`overflow-hidden`) so the art takes the tile's radius on its outer corners.

### 2.4 Artwork sizes

| Token    | Edge                         | Quality | Radius | Context                                    |
| -------- | ---------------------------- | ------- | ------ | ------------------------------------------ |
| `row`    | 48                           | medium  | sm     | song, media, library and search rows       |
| `mini`   | 36                           | medium  | sm     | mini player                                |
| `pick`   | 56                           | medium  | sm*    | quick pick tile (clipped by the tile, R3)  |
| `tile`   | 64                           | medium  | sm     | browse tile                                |
| `avatar` | 48                           | -       | full   | profile initial                            |
| `card`   | 156                          | high    | md     | shelf card (2 cards + a 38pt peek at 390)  |
| `header` | 240                          | high    | lg     | entity header                              |
| `hero`   | 280                          | high    | lg     | home featured carousel                     |
| `player` | min(window - 2 x 24, 360)    | high    | lg     | Now Playing                                |

Round types (`artist`, `radio_station`) use `full` at every size.

### 2.5 List rows (`ListRow`)

```
| 16 | leading 48 | 12 | title (body, 1 line)          | trailing  | 4 |
|    |            |    | subtitle (footnote, muted, 1) | 48 + 48   |   |
min height 64, vertical padding 8, grows with Dynamic Type
```

- L1. One anatomy for every list row: songs, media, library entries, recent searches, search results.
- L2. Leading is one of: artwork (`row`), an icon tile (48, `bg-fill`, radius sm, icon `md`), or a track number
  (48 wide, `body`, muted, tabular, centred). Album track lists use the number; playlists, queue, search and
  history use artwork.
- L3. Trailing holds at most two 48pt controls (heart, menu) or one chevron (`sm`, muted, iOS only; Android rows
  have no chevron). End padding is 4 when trailing controls exist (their 48 target puts the glyph 18 from the
  edge), 16 otherwise.
- L4. No separators on either platform. Rows are separated by their height.
- L5. Pressed: iOS `bg-fill-2` full-bleed highlight, Android ripple (`android_ripple`, `fill-2`).
- L6. Current track: the title in `tone="primary"` and the leading slot shows the waveform (`sm` icon) on a
  scrim over the art, or in place of the number.
- L7. Explicit: the `E` badge leads the subtitle line (rows, cards). In the entity header it sits before the title.
- L8. A row without a destination is a labelled `View` with `opacity-50`, never a disabled `Pressable`.

### 2.6 Section headers (`SectionHeader`)

- H1. One component for every titled group: shelves, quick picks, search groups, recent searches, library
  playlists, browse languages, detail sections.
- H2. `title2`, `accessibilityRole="header"`, one line, `px-page`, 24 above, 8 below, min height 28.
- H3. Optional trailing action: one text button in `subhead`, `tone="muted"`, `TEXT_BUTTON_HIT_SLOP`; a link when
  it has an `href`, a button when it has `onPress` ("See All", "Clear").

### 2.7 Shelves and cards

- C1. Shelf = `SectionHeader` + horizontal list; content inset 16, card gap 12, no vertical padding.
- C2. Card: art `card` (156), 8 below, title `subhead` 1 line, subtitle `footnote` muted 1 line, no gap between.
  Round types centre their text.
- C3. Hero variant (home only): art `hero` (280), eyebrow `caption` muted ("Featured playlist"), title `headline`,
  and a 48 round Play button (`bg-primary`) on the art's bottom-end corner, inset 12.
- C4. Play buttons appear only on hero cards and entity headers. Regular cards and quick picks open the item;
  their long-press menu (`NativeMenu`) offers Play, Play next and Add to queue.
- C5. Grids (quick picks, browse, liked collections): two columns, `GRID_GAP` (12), `useGridCardWidth()`.
- C6. Quick pick tile: height 56, `bg-fill`, radius md, art `pick` flush at the start, title `subhead` 2 lines,
  12 between art and text, 12 end padding.

### 2.8 Home

Top to bottom:

1. Navigation large title "Home"; header trailing: Languages (`globe` / `language`).
2. Greeting line (`subhead`, muted, `px-page`): "Good evening, Priya" (`formatGreeting`).
3. Language chips (`ChipRow`): For you, then languages. 8 above and below.
4. Featured carousel: `Shelf` hero variant with the featured item and the hero tiles. No section title.
5. Quick picks (`SectionHeader` "Quick picks"): the first two tiles are actions, Surprise me (`sparkles` /
   `auto_awesome`) and Browse (`square.grid.2x2` / `grid_view`), same tile with an icon in place of the art;
   then up to six picks.
6. Shelves.

The full-width square hero (358pt), its full-width Play button, the "Fresh picks for you." line and the two
secondary buttons above the chips are removed.

### 2.9 Entity header (album, playlist, mix, station, artist, show)

Centred, top to bottom, inside `px-page`, 8 below the navigation bar:

1. Art `header` (240), round for artists and stations; iOS adds a soft shadow (`0 8 24 rgba(0,0,0,.18)`),
   Android none (M3 is flat).
2. 16 gap, eyebrow `caption` muted, kind and year ("Album · 2023"), verified seal (`sm` icon, primary) for artists.
3. 4 gap, title `title1`, two lines max, explicit badge before it.
4. Subtitle `subhead` muted: the credit (artists, curator).
5. Meta `footnote` muted: "17 songs · 1 hr 12 min · 2.4M plays".
6. 16 gap, actions row: Play (primary) and Shuffle (secondary), each `flex-1`, gap 12, height 48; then a second
   line centred: heart and the collection menu as 48 `IconButton`s, gap 24. On Android Shuffle is the tonal
   button (`secondary` maps to secondaryContainer).
7. 16 below, then the track list (2.5). Copyright `caption` muted, `px-page`, 16 above. Secondary shelves follow.

The native header carries only the small title (shown once the header art scrolls away) and Share.

### 2.10 Mini player and Now Playing

Mini player

- iOS 26: `NativeTabs.BottomAccessory`; the system draws the glass capsule. Content: art `mini`, 12, title
  `subhead` + subtitle `caption` muted, play/pause (`lg`) and next (`md`) as 48 `IconButton`s. No own background.
- Android and iOS < 26: `FloatingPlayerDock`, height 64, inset 16 from the screen edges, 8 above the tab bar.
  Android: `bg-card` (surfaceContainerHigh), radius lg, tonal elevation level 2. iOS < 26: `GlassSurface`, radius
  full. A 2pt progress line in `primary` runs along the dock's bottom inside its radius.

Now Playing (`/player`, a full-screen sheet)

1. Top bar, 8 below the sheet's grabber: close (`chevron.down` / `keyboard_arrow_down`, `lg`) at the start, the
   song menu at the end, both 48 `IconButton`s; between them "Playing from" `caption` muted over the source name
   `footnote` when the queue has one (radio name for stations).
2. Art `player`, centred, 24 gutters; iOS shadow as 2.9; lyrics replace it in the same frame.
3. 32 gap, title row: title `title2` 1 line, subtitle `body` muted 1 line, heart at the end.
4. 24 gap, scrubber: 4pt track, radius full, `fill-3` track, `primary` fill, 12pt thumb on iOS (system slider),
   M3 slider on Android; times `caption` muted tabular below, 4 gap.
5. 24 gap, transport: shuffle (`md`), previous (`xl`), play/pause as a 72 `bg-primary` circle with a 32 glyph in
   `onPrimary`, next (`xl`), repeat (`md`); shuffle and repeat in `primary` when on.
6. 32 gap, bottom row, `justify-between`: Lyrics (`quote.bubble` / `lyrics`) and Up next (`list.bullet` /
   `queue_music`), `lg` icons.

Background is `background` on both platforms: no artwork wash, no glass on content.

### 2.11 Empty, error, loading

- E1. `EmptyState`: centred column, 48 vertical padding, icon `xxl` (48) `muted`, 16, title `headline`, 4,
  message `subhead` muted (max width 300), 16, one action `Button` (secondary for retry, primary for a way forward).
- E2. `ErrorState` is `EmptyState` with the warning icon, "Couldn't load this", `userMessage(error)`, "Try again".
- E3. A secondary list that fails or is empty renders nothing (existing `SecondaryShelf` rule).
- E4. Skeletons mirror the real layout at real sizes: blocks for artwork use the artwork token and radius; text
  uses `SkeletonText variant` (height = the variant's font size, radius xs, centred in its line height) so a
  skeleton line is exactly as tall as the text it stands for. One `SkeletonPulse` per layout.
- E5. Pull to refresh is the system `RefreshControl`, never a custom spinner.

### 2.12 Iconography

- I1. iOS: SF Symbols, regular weight, outline by default; `.fill` for selected states (tab icons, liked heart)
  and all playback glyphs (`play.fill`, `pause.fill`, `forward.fill`, `backward.fill`).
- I2. Android: Material Symbols Rounded, outlined by default, filled for selected states; names in the `md`
  half of each `{ ios, android }` pair.
- I3. Sizes, `iconSize`: `xs` 12 (badges), `sm` 16 (chevrons, inline marks), `md` 20 (row controls, shuffle,
  repeat, tile icons), `lg` 24 (header and toolbar buttons, mini player play), `xl` 32 (previous, next), `xxl` 48
  (empty states). No other sizes.
- I4. Colour: `foreground` by default, `muted-foreground` for passive marks (chevrons, empty icons), `primary` for
  an active toggle. Icon-only controls are always `IconButton` (48 target, `label`).

## 3. Surfaces per platform

### iOS 26 (Liquid Glass)

- P1. Glass is chrome only: the system tab bar (with the separate search tab), navigation bars, the bottom
  accessory (mini player), toolbars, menus and sheets. We set no colours or backgrounds on any of them.
- P2. `GlassSurface` (`expo-glass-effect`) is allowed only for app-drawn floating chrome: today that is the
  floating dock before iOS 26. Never on cards, rows, headers inside content, chips or artwork overlays.
- P3. Content is opaque: `background` (systemBackground) for screens, `card` (secondarySystemBackground) for
  raised blocks, `fill*` for tiles and chips. Grouped settings use the native grouped list.
- P4. Tab roots: large title collapsing into the transparent glass header (`tabStackOptions`). Detail screens:
  small title, scroll edge effect.
- P5. Buttons: Play is the prominent filled capsule (`bg-primary`); Shuffle the tinted capsule (`bg-secondary`).

### Android (Material 3, Material You)

- P6. Colour comes from dynamic colour (wallpaper) on Android 12+, baseline scheme before. Content tokens map to
  M3 roles exactly as chrome already does (`theme/navigation-theme.ts`), see the `androidDynamicColors` map in 6.1.
  Today content uses the static neutral palette while the navigation bar and app bar are wallpaper-tinted.
- P7. Tab roots: M3 small top app bar, title `titleLarge`, `surface` background, no shadow; it fills to
  `surfaceContainer` when content scrolls under it. Detail screens: same bar with a back arrow and Share.
- P8. Navigation bar: 80dp, `surfaceContainer`, active indicator pill (64x32, `secondaryContainer`), labels always
  shown. Set by `NativeTabs`; the app adds no colours.
- P9. Elevation is tonal (surface container level), not shadow; the only shadowed element is the floating dock
  (level 2).
- P10. Buttons: Play is a filled button (`primary`), Shuffle a tonal button (`secondaryContainer`). Chips: selected
  filter chip is `secondaryContainer` with a check-less label; unselected is outlined (`outlineVariant`).

### Accent and brand

- A1. The UI accent is `primary`: `label` (black/white) on iOS, dynamic `primary` on Android. No brand hue is
  added; the brand is the artwork and the web's neutral palette (`#f5f5f7` / `#0b0b0c`).
- A2. `primary` is for: the Play buttons, the playing row title and waveform, active toggles (shuffle, repeat),
  progress, verified seal. Nothing else.
- A3. `destructive` only for delete and remove actions and error text.
- A4. No hard-coded hex in screens. Browse tiles (`browse-tile.tsx`) drop their eight-colour palette: a tile is
  `bg-fill`, radius md, title `headline`, its cover at `tile` size inside the end edge (R3).

## 4. Motion

Unchanged from the code: system transitions, `transition={150}` on artwork, one skeleton pulse gated by
`useReducedMotion`. Now Playing opens as the system sheet. Haptics: selection tick on shuffle, repeat and opening
the player (as today).

## 5. Cleanup checklist (from the code audit)

Each item names the files and the rule above that fixes it.

| #   | Finding                                                                                                                                                                                                                                                                                                 | Files                                                                                                                                                                                                  | Fix          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 1   | Section header markup rebuilt eight times with different padding: `pt-3 pb-1`, `pb-1` inside `py-3`, `pt-4 pb-1`, `gap-2 py-3`, `gap-3 py-3`, `gap-3`                                                                                                                                                   | `components/section-heading.tsx`, `components/shelf.tsx`, `features/search/result-section.tsx`, `features/search/idle-search.tsx` (x2), `features/home/quick-picks.tsx`, `features/library/library-screen.tsx`, `features/browse/browse-screen.tsx` | H1-H3, S3    |
| 2   | The trailing "See All" / "Clear" action built three ways (Link + Pressable, Pressable button, Pressable button) with copied hit slop and styles                                                                                                                                                          | `components/shelf.tsx`, `features/search/result-section.tsx`, `features/search/idle-search.tsx`                                                                                                        | H3           |
| 3   | Row anatomy duplicated four times, with different end padding (`px-page` vs `pl-page pr-2`) and the skeleton row a third height (`h-row` fixed vs `min-h-row`)                                                                                                                                          | `components/media-row.tsx`, `components/song-row.tsx`, `features/library/library-row.tsx`, recent-search row in `features/search/idle-search.tsx`, `components/skeletons.tsx`                          | L1-L3, E4    |
| 4   | `LibraryRow` renders a disabled `Pressable` (role "text") for a pending playlist, against the app's own accessibility rule                                                                                                                                                                              | `features/library/library-row.tsx`                                                                                                                                                                     | L8           |
| 5   | One `title` variant (22) is the greeting, every section header, the hero name, the entity title and the Now Playing title                                                                                                                                                                               | `features/home/home-header.tsx`, `home-hero.tsx`, `components/entity-header.tsx`, `features/player/full-player.tsx`, the files in #1                                                                   | 2.2          |
| 6   | Hard-coded type: `fontSize: 20/17`, `fontWeight: "bold"/"600"`; `font-bold` class on the badge                                                                                                                                                                                                          | `features/settings/profile-header.tsx`, `components/explicit-badge.tsx`                                                                                                                                | T4, 2.2      |
| 7   | Palette looked up by hand (`colors[useColorScheme() === "dark" ? ...]`) instead of `usePalette()`                                                                                                                                                                                                      | `features/settings/profile-header.tsx`, `features/settings/tap-rows.tsx`                                                                                                                               | 6.2 (`usePalette`) |
| 8   | The same 12pt gap defined three times; loose size constants per file: `MEDIA_CARD_WIDTH` 150, `ENTITY_ART_SIZE` 220, quick-pick `ART_SIZE` 56, mini `ARTWORK_SIZE` 36, browse `ART_SIZE` 72 / `TILE_HEIGHT` 96, `AVATAR_SIZE` 48, `PLAY_INSET` 4                                                    | `components/shelf.tsx` (`CARD_GAP`), `lib/use-grid-card-width.ts` (`GRID_GAP`), `features/library/liked-collection-screen.tsx` (`COLUMN_GAP`), `components/media-card.tsx`, `components/entity-header.tsx`, `features/home/quick-picks.tsx`, `features/player/mini-player.tsx`, `features/browse/browse-tile.tsx`, `features/settings/profile-header.tsx` | 2.1, 2.4     |
| 9   | Mixed radii for like things: buttons `lg` (18) but chips `full`; hero and entity art `lg`, Now Playing art and the dock `xl`; quick-pick art unrounded inside a rounded tile without clipping; radius chosen at every call site                                                                       | `components/ui/button.tsx`, `components/chip-row.tsx`, `features/home/home-hero.tsx`, `components/entity-header.tsx`, `features/player/full-player.tsx`, `features/player/floating-player-dock.tsx`, `features/home/quick-picks.tsx` | 2.3, R1-R3   |
| 10  | Eleven icon sizes in use: 11, 12, 14, 16, 18, 20, 22, 24, 30, 40, 44                                                                                                                                                                                                                                     | e.g. `features/player/radio-badge.tsx` (11), `features/library/library-screen.tsx` chevron (14), `components/entity-header.tsx` (14), `components/card-play-button.tsx` (18), `features/player/transport-controls.tsx` (30, 44), `components/empty-state.tsx` (40) | I3           |
| 11  | Half-step spacing off the 4pt grid: `gap-1.5`, `py-2.5`, `px-1.5`, `py-0.5`, `gap-0.5`                                                                                                                                                                                                                   | `components/media-card.tsx`, `features/player/mini-player.tsx`, `features/player/radio-badge.tsx`, `features/player/full-player.tsx`                                                                   | S1           |
| 12  | Android content uses the static neutral palette while its app bar and navigation bar are Material You tinted, so content and chrome disagree                                                                                                                                                            | `theme/tokens.ts`, `tailwind.config.ts` vs `theme/navigation-theme.ts`                                                                                                                                 | P6, 6.1      |
| 13  | Browse tiles hard-code eight hues and `#ffffff` text that ignore the theme, with rotated art hanging off the corner                                                                                                                                                                                     | `features/browse/browse-tile.tsx`                                                                                                                                                                      | A4           |
| 14  | Home stacks a greeting, a filler line, two secondary buttons and chips before a 358pt square hero with its own full-width Play button                                                                                                                                                                   | `features/home/home-header.tsx`, `features/home/home-hero.tsx`, `features/home/home-skeleton.tsx`                                                                                                      | 2.8          |
| 15  | A play button on every shelf card and every quick pick                                                                                                                                                                                                                                                  | `components/media-card.tsx`, `features/home/quick-picks.tsx`                                                                                                                                           | C4           |
| 16  | Skeleton text bars use arbitrary heights (`h-3`, `h-3.5`, `h-4`, `h-5`, `h-6`) unrelated to the type they stand for                                                                                                                                                                                     | `components/skeletons.tsx`, `features/home/home-skeleton.tsx`, `features/show/show-skeleton.tsx`                                                                                                       | E4           |
| 17  | Button text uses `headline` (Android 16 medium; M3 buttons are labelLarge 14) and colours the icon with `colors.background` rather than the on-primary token                                                                                                                                             | `components/ui/button.tsx`                                                                                                                                                                             | 2.2 `label`, T2 |
| 18  | Explicit badge beside the title in cards and headers, absent from rows                                                                                                                                                                                                                                  | `components/media-card.tsx`, `components/entity-header.tsx`, `components/song-row.tsx`                                                                                                                 | L7           |
| 19  | Now Playing: transport play is a bare 44 glyph, not a control shape; Lyrics / Up next spread with `justify-around`; the close row is ad-hoc padding (`px-2 pt-1`)                                                                                                                                       | `features/player/full-player.tsx`, `features/player/transport-controls.tsx`                                                                                                                            | 2.10         |
| 20  | Album track lists repeat the album cover in every row                                                                                                                                                                                                                                                   | `components/track-list.tsx`, `features/album/album-screen.tsx`                                                                                                                                         | L2           |
| 21  | Scattered chrome constants: `MAX_FONT_SCALE` local to the mini player, `FLOATING_DOCK_HEIGHT` / dock inset 12 vs page 16                                                                                                                                                                               | `features/player/mini-player.tsx`, `navigation/player-dock.ts`, `features/player/floating-player-dock.tsx`                                                                                             | T5, 2.10     |

## 6. Frozen primitive contract

Two engineers work in parallel:

- **Theme + components** owns `src/theme/**`, `src/components/**` (and `src/lib/use-grid-card-width.ts`,
  `src/navigation/player-dock.ts`).
- **Screens** owns `src/features/**`, `src/app/**`.

The screens engineer may rely on exactly what is listed here. Every change is additive first: old names keep
working (marked deprecated) until the screens side has migrated, so neither side blocks the other. Value changes
(radii, row height, card width) land in tokens and reach screens without screen edits.

### 6.1 `theme/tokens.ts`

```ts
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { xs: 4, sm: 6, md: 10, lg: 16, xl: 24 } as const; // + Tailwind rounded-full
export const art = {
  row: 48, mini: 36, pick: 56, tile: 64, avatar: 48, card: 156, header: 240, hero: 280,
} as const;
export type ArtSize = keyof typeof art | "player";
export const artRadius: Record<keyof typeof art, keyof typeof radii | "full">; // per 2.4
export const sizes = { ctl: 40, "ctl-lg": 44, touch: 48, row: 64, page: 16, dock: 64 } as const;
export const iconSize = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32, xxl: 48 } as const;
export type IconSize = keyof typeof iconSize;
export const maxFontScale = { chrome: 1.3 } as const;
export type TextVariant =
  | "largeTitle" | "title1" | "title2" | "title" /* deprecated = title2 */
  | "headline" | "body" | "label" | "subhead" | "footnote" | "caption";
export const typeScale: Record<"ios" | "android", Record<TextVariant, TypeStyle>>; // values in 2.2
export const textStyles: Record<TextVariant, TypeStyle>; // this platform's, for @expo/ui Text
export const androidDynamicColors: Partial<Record<ColorToken, string>>; // see below
```

`sizes.art` is removed once screens use `art.row`; until then it equals `art.row`.

Tailwind classes the screens engineer may use: spacing `*-1 *-2 *-3 *-4 *-6 *-8 *-12`, `px-page`, `min-h-row`,
`min-h-touch`, `size-touch`; radii `rounded-xs|sm|md|lg|xl|full`; every colour token as `bg-*` / `text-*` /
`border-*` (unchanged list: `background foreground card card-foreground primary primary-foreground secondary
secondary-foreground muted muted-foreground accent accent-foreground destructive destructive-foreground border
input fill fill-2 fill-3 scrim`).

`androidDynamicColors` (theme engineer resolves each role from the same source as `Color.android.dynamic`;
static palette below Android 12, and the same AA check as `iosSystemColors` in `tokens.test.ts`):
`background` surface, `foreground` onSurface, `card` surfaceContainerHigh, `card-foreground` onSurface, `primary`
primary, `primary-foreground` onPrimary, `secondary` secondaryContainer, `secondary-foreground`
onSecondaryContainer, `muted` surfaceContainerHighest, `muted-foreground` onSurfaceVariant, `accent`
secondaryContainer, `accent-foreground` onSecondaryContainer, `destructive` error, `destructive-foreground`
onError, `border` outlineVariant, `input` outline. `fill*` and `scrim` stay alpha values.

### 6.2 Components (`~/components/...`)

Unchanged and safe to use as today: `ui/artwork` (plus the additions below), `ui/icon-button`, `native-menu`,
`menu-trigger`, `like-button`, `card-play-button`, `collection-menu`, `song-menu`, `detail/detail-frame`,
`detail/detail-screen`, `detail/detail-header-options`, `segmented-tabs`, `chip-row`, `screen-scroll-view`,
`secondary-shelf`, `paged-footer`, `option-menu`, `form/*`, `ui/glass-surface` (floating chrome only), and
`usePalette()` from `~/theme/use-palette` (the only way to read a colour in JS besides `useTheme().colors`).

Changed or new, with the props screens may pass:

```ts
// ui/text
<Text variant?: TextVariant tone?: "default"|"muted"|"primary"|"onPrimary"|"onDestructive"|"error"
      numeric?: boolean {...RN TextProps} />

// ui/icon, ui/icon-button: `size` also takes an IconSize name ("md"); numbers keep working.
<Icon name size?: number | IconSize color? />

// ui/artwork: `size` sets edge, radius and quality; `style` still overrides (layout only).
<Artwork image size?: ArtSize round?: boolean quality?: ImageQuality style? testID? />

// ui/button: capsule; text in `label`; `secondary` is tonal on Android.
<Button label icon? variant?: "primary"|"secondary"|"destructive" {...PressableProps} />

// section-header (new). SectionHeading keeps working as SectionHeader({ title }) until removed.
<SectionHeader title: string
  action?: { label: string; href?: Href; onPress?: () => void; accessibilityLabel?: string } />

// list-row (new): the one row (2.5). MediaRow keeps its API, rebuilt on it.
<ListRow title: string subtitle?: string explicit?: boolean
  leading?: { artwork: string; round?: boolean } | { icon: SymbolName } | { index: number }
  trailing?: ReactNode   // at most two IconButton/MenuTrigger, or { chevron: true } on iOS
  href?: Href onPress?: () => void selected?: boolean
  accessibilityLabel?: string accessibilityHint?: string />

// song-row, track-list: numbered album lists.
<SongRow song onPress queueItemId? removal? leading?: "artwork" | "index" index?: number />
<TrackList rows numbered?: boolean />

// media-card, shelf: hero variant (2.7); play button only on hero.
<MediaCard item width? variant?: "card" | "hero" onPress? />
<Shelf title?: string items seeAllHref? onItemPress? variant?: "card" | "hero" />  // no title: no header

// quick-pick-tile (new, moved from features/home so Browse and Home share it)
<QuickPickTile width title: string href?: Href onPress?: () => void
  leading: { artwork: string } | { icon: SymbolName } accessibilityLabel?: string />

// entity-header: adds `meta` (second muted line); layout per 2.9.
<EntityHeader image title subtitle? meta? eyebrow? round? explicit? verified?
  onPlay onShuffle? like? actions? />

// empty-state, error-state: API unchanged, layout per 2.11.
<EmptyState icon title message? action? />   <ErrorState error onRetry />

// skeletons: existing exports keep their props; new:
<SkeletonText variant: TextVariant width: DimensionValue />
<SectionHeaderSkeleton />
<ShelfSkeleton cards? variant?: "card" | "hero" />
```

Layout helpers: `useGridCardWidth()` and `GRID_GAP` (= `space.md`) from `~/lib/use-grid-card-width`;
`playerDockInset` from `~/navigation/player-dock` (unchanged).

### 6.3 Screen rules for the screens engineer

1. No numbers in screens for size, radius, gap or font: use tokens or the components above.
2. No `Text` for a section title: `SectionHeader`. No hand-built rows: `ListRow`, `SongRow` or `MediaRow`.
3. Screens never set colours on headers or `NativeTabs`; colour via `tone`, token classes or `usePalette()`.
4. A screen's scroll content has no horizontal padding; each block insets itself with `px-page` (S2).
5. Order of work: theme engineer lands 6.1 and the new components (additive) first; screens migrate per feature
   (home, album/playlist/mix, player, library, search, browse, settings), deleting local constants as they go;
   the theme engineer then removes the deprecated `title`, `sizes.art` and `SectionHeading`.

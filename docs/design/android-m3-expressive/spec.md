# Infinitunes Android: Material 3 Expressive spec

The Android app follows Material 3 Expressive (M3E) at YouTube Music density: compact rows, small (40dp)
buttons, emphasized type only where it carries hierarchy, shape and spring motion as the expressive layer.
Rules are Android branches (`.android.tsx`, `Platform.select`, or the android side of `theme/tokens.ts`)
unless marked "both platforms" (round 3's compact icon buttons, action rows, Top Result card, skeletons). The mockup is `index.html` in this folder.

## Audit (before, Samsung A34, Android 16, dark)

1. Top app bar is `surfaceContainer` while the page is `surface`: a grey band over every screen. M3 bars sit
   on `surface` and only tint when content scrolls under them.
2. Detail screens repeat the title: the app bar says "Rajini The Jailer 2 (Original…" and so does the header.
3. Filter chips are capsules with no check mark; M3 filter chips are 8dp-cornered, `secondaryContainer` with a
   leading check when selected.
4. Buttons are 48dp capsules with no shape response; M3E small buttons are 40dp (48dp target) and morph their
   corners while pressed. Play/Shuffle are two loose buttons, not a button group.
5. Artist tabs are the old outlined segmented buttons; M3E replaces them with a connected button group.
6. Settings cards use 38dp corners (24 × the "Round" multiplier) around one block with inset dividers, values in
   accent on the right plus an up/down glyph: heavy and unlike Android 16 Settings (segmented list: separate
   tiles, 2dp seams, large outer corners, small inner corners, value as supporting text).
7. Section titles are 20sp/500 and "See All" is a muted 14sp link: weak hierarchy, weak affordance.
8. Navigation bar labels are 10sp (M3 is 12sp/500).
9. Mini player is a flat card with a bare play glyph; the full player's play control is a fixed circle, its
   artwork 16dp-cornered; nothing communicates play state by shape.
10. Shape scale is iOS's (6/10/16/24): Android art and tiles read as iOS.

## Type roles (Roboto, the system font; no custom fonts)

| Token (`TextVariant`) | M3 role        | Size/line | Weight | Emphasized (`emphasized` prop) |
| --------------------- | -------------- | --------- | ------ | ------------------------------ |
| `largeTitle`          | headlineMedium | 28/36     | 400    | 500                            |
| `title1`              | headlineSmall  | 24/32     | 400    | 500                            |
| `title2`              | titleLarge*    | 20/28     | 500    | 700                            |
| `headline`            | titleMedium    | 16/24     | 500    | 700                            |
| `body`                | bodyLarge      | 16/24     | 400    | 500                            |
| `label`               | labelLarge     | 14/20     | 500    | 700                            |
| `subhead`             | bodyMedium     | 14/20     | 400    | 500                            |
| `footnote`            | bodyMedium     | 14/20     | 400    | 500                            |
| `caption`             | labelMedium    | 12/16     | 500    | 700                            |

\* titleLarge is 22sp in M3; it stays at 20sp for YouTube Music density.

Roboto renders 600 as 700, so emphasized title roles use 700 (bold, YouTube Music's section weight).
Emphasized is used for: section titles, entity titles, the player's track title, the mini player's title,
selected chips. `Text emphasized` is a no-op on iOS.

## Shape scale (`radii`, android branch; the corner-style multiplier still applies)

| Token | dp  | M3E name    | Used by                                            |
| ----- | --- | ----------- | -------------------------------------------------- |
| `xs`  | 4   | extra-small | segmented-list inner corners, explicit badge       |
| `sm`  | 8   | small       | row art, chips, pressed button corners             |
| `md`  | 12  | medium      | cards' art, quick-pick tiles, search field         |
| `lg`  | 16  | large       | header art, mini player, segmented-list outer      |
| `xl`  | 28  | extra-large | Now Playing art, sheets, toasts                    |
| full  | -   | full        | buttons at rest, avatars, stations, play (playing) |

Shape morphing: buttons go from full to `sm` corners while pressed; the full player's play button is a
rounded square (`xl`-ish, 28) while paused and a circle while playing; a connected button group's selected
segment becomes full, the rest keep `sm` inner corners.

## Spacing and density

The 4dp grid (`space`) and the closed Tailwind scale stay. Additions: `sizes.seam` = 2 (segmented-list and
connected-group seams). Rows 56dp minimum, row art 48, card art 136, quick-pick tile 56 high, buttons 40 high
reaching 48 with hit slop, chips 32 high reaching 48 with hit slop, mini player 64, page gutter 16.

## Colour roles (Material You, already wired by `DynamicColorRoot`)

- Page: `surface` (`bg-background`). Top app bar: `surface` (was `surfaceContainer`).
- Tiles, quick picks, settings tiles: `surfaceContainerHigh` (`bg-card`). Skeletons: `fill` alphas.
- Filled button: `primary`/`onPrimary`. Tonal: `secondaryContainer`/`onSecondaryContainer`.
- Selected chip and selected segment: `secondaryContainer`. Idle chip outline: `outlineVariant`.
- Section labels in Settings: `primary`. Supporting text: `onSurfaceVariant`.
- Player surfaces keep the artwork-seeded wash (`wash.tsx`), with D1 tokens as the fallback.

## Components

- **Top app bar**: small, flat, `surface`, title titleLarge; pushed entity screens show no title (the header
  says it once), only back and Share.
- **Navigation bar**: native NativeTabs, labels 12sp; pill indicator from the system.
- **Button** (`components/ui/button.tsx`): 40dp, 16dp padding, labelLarge, 20dp icon, filled / tonal /
  destructive. Pressed: corners morph full → 8 on the spatial-fast spring.
- **Icon buttons** (`IconButton`, both platforms): compact UI prefers a symbol to a labelled button wherever the
  symbol alone is unambiguous (Play, Shuffle, Clear queue); `variant` `filled` (primary) or `tonal`
  (`secondaryContainer`) in a round container, 48dp, or 56dp `large` with an `xl` symbol for a screen's main Play.
  Every one keeps its `accessibilityLabel`. Text stays on form submits, the empty states' way forward, "See All".
- **Action row** (entity header, both platforms): heart and the overflow menu lead, a spacer, then Shuffle
  (tonal, 48dp) and Play (filled, 56dp) at the end, where the thumb rests. Song collections (liked songs, history, playlists)
  put the count and sort first in the same row, then Shuffle and Play.
- **Connected button group** (`segmented-tabs.android.tsx`): 40dp segments, 2dp seams, selected segment
  `secondaryContainer` with a check and full corners, others `surfaceContainerHighest` with `sm` inner corners.
- **Filter chip** (`chip-row.tsx`): 32dp, `sm` corners, outline idle; `secondaryContainer` + check selected.
- **Section header**: titleLarge emphasized; action is a primary text button.
- **List row**: unchanged geometry (56dp, 48 art at `sm`), ripple feedback. The current track sits in a
  `secondaryContainer` tile inset 8dp (`lg` corners), title emphasized, with a three-bar `Equalizer` (still
  and low while paused, static under reduce motion). Leading icons sit in a round `secondaryContainer`.
- **Search**: Android hides the app bar and shows Material 3's search bar (`search-header.android.tsx`): a
  56dp full-round `bg-card` pill, page-gutter inset, back arrow inside at the start, the field, clear at the
  end. The native header field started after the toolbar's 72dp title inset, far from back. iOS keeps the
  search tab's native field. Top Result is a filled card on both platforms (96dp art, titleLarge emphasized,
  kind and credit, a 56dp filled Play at its end). Result subtitles name the kind on Android ("Song · Arijit
  Singh"; `result-subtitle.ts`); Top Searches names the kind on both ("Song", "Album") and draws artists round.
- **Empty/error states**: the symbol in a 96dp `secondaryContainer` at `xl` corners, titleLarge title.
- **Text field**: outlined, 56dp, `xs` corners, label set into the outline; 2dp `primary`/`error` outline
  while focused or invalid.
- **Lyrics** (song screen): the preview is a `bg-card` card, titleMedium emphasized, "Read More" in primary.
- **Queue**: group labels are labelLarge in `primary`; clearing Up next is an icon button (`clear_all`).
- **Sheets** (queue, languages, new playlist): Android form sheets draw no header or grabber, so
  `SheetHeader` (`sheet-header.android.tsx`) draws the 32×4dp drag handle and a titleLarge title. A sheet lays
  out at its largest detent, so its empty states sit at the top (`EmptyState placement="top"`).
- **Checkbox rows** (languages): every row shows its checkbox (`check_box` / `check_box_outline_blank`).
- **Loading indicator**: footers and gates use `Spinner`, Compose's M3E `LoadingIndicator` on Android.
- **Pull to refresh**: `PullToRefresh`, the spinner in `primary` on a `card` disc (the stock control is white on
  white), shown only for the listener's own pull.
- **Skeletons** mirror the loaded screen exactly on both platforms: same text roles, artwork at the corner
  style's radii, the header's action row, a Top Result card, grids for grid results, and the header's own
  lines and controls (`EntityHeaderSkeleton` `like`/`menu`/`subtitle`/`meta`). Check by overlaying the
  skeleton on the loaded page.
- **Media card**: art `md`, title labelLarge (14/500), subtitle bodySmall muted.
- **Quick-pick tile**: `bg-card`, `md` corners, art flush start, title labelLarge. Browse tiles share its press sink (`usePressScale`).
- **Mini player**: floating 64dp, `lg` corners, title emphasized, play/pause a 40dp filled circle in the wash's
  control colour.
- **Full player**: art `xl`, title headlineSmall emphasized, transport with a 72dp play button that morphs
  rounded-square (paused) ↔ circle (playing), flanked by 56dp tonal prev/next (text colour at 14%). The Home
  hero's play button is a rounded square (`md`).
- **Settings**: segmented list: each row its own `bg-card` tile, 2dp seams, outer corners `lg`, inner `xs`,
  the value as supporting text under the title, no trailing glyphs except the chevron for navigation.

## Motion (`theme/motion.ts`, Reanimated `withSpring`, mass 1)

Compose `MotionScheme.expressive()` values, damping coefficient = 2·ζ·√stiffness:

| Spring          | Stiffness | ζ   | `damping` | Use                                  |
| --------------- | --------- | --- | --------- | ------------------------------------ |
| spatial fast    | 800       | 0.6 | 34        | press morphs, press-scale release    |
| spatial default | 380       | 0.8 | 31        | play-button shape, segment selection |
| spatial slow    | 200       | 0.8 | 23        | large surfaces                       |
| effects fast    | 3800      | 1   | 123       | colour/opacity, fast                 |
| effects default | 1600      | 1   | 80        | colour/opacity                       |

Spatial springs may overshoot (expressive bounce); effects springs never do. Worklet springs follow the
system's reduce-motion setting (`ReduceMotion.System`): under reduce motion a morph jumps straight to its final
shape. No entering animations on FlashList cells.

## Not in JS reach (native work)

- One UI quirk (handled): Samsung resolves `onSurfaceVariant` to `onSurface`; `withDynamicRoles` then fades
  `muted-foreground` to the text colour at 72%.

- Flexible / large collapsing top app bar and its scroll-tinted colour (native-stack header).
- Navigation bar height and indicator shape (NativeTabs is the platform view).
- Wavy progress: needs Compose (`@expo/ui/jetpack-compose`).

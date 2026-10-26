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
| `title2`              | titleLarge     | 22/28     | 500    | 700                            |
| `headline`            | titleMedium    | 16/24     | 500    | 700                            |
| `body`                | bodyLarge      | 16/24     | 400    | 500                            |
| `label`               | labelLarge     | 14/20     | 500    | 700                            |
| `subhead`             | bodyMedium     | 14/20     | 400    | 500                            |
| `footnote`            | bodyMedium     | 14/20     | 400    | 500                            |
| `caption`             | labelMedium    | 12/16     | 500    | 700                            |

`title2` is 22/28 on both scales (iOS's Title 2). Roboto renders 600 as 700, so emphasized title roles use
700 (bold, YouTube Music's section weight). Emphasized is used for: section titles, entity titles and the full
player's track title (both `title1`, headlineSmall emphasized), the mini player's title, selected chips, the
prominent lyrics. `Text emphasized` is a no-op on iOS.

## Shape scale (`radii`, android branch; the corner-style multiplier still applies)

| Token | dp  | M3E name    | Used by                                            |
| ----- | --- | ----------- | -------------------------------------------------- |
| `xs`  | 4   | extra-small | segmented-list inner corners, explicit badge       |
| `sm`  | 8   | small       | row art, chips, pressed button corners             |
| `md`  | 12  | medium      | cards' art, quick-pick tiles, search field         |
| `lg`  | 16  | large       | header art, mini player, segmented-list outer      |
| `xl`  | 28  | extra-large | Now Playing art, Home hero art, sheets, toasts     |
| full  | -   | full        | buttons at rest, avatars, stations, play (playing) |

Shape morphing: buttons and filled/tonal icon buttons go from full to `sm` corners while pressed; the full player's play button is a
rounded square (`xl`-ish, 28) while paused and a circle while playing; a connected button group's selected
segment becomes full, the rest keep `sm` inner corners.

## Spacing and density

The 4dp grid (`space`) and the closed Tailwind scale stay. Additions: `sizes.seam` = 2 (segmented-list and
connected-group seams) and `sizes["row-2"]` = 72 (a two-line list row). Rows 56dp minimum, row art 48, card
art 136, quick-pick tile 56 high, buttons 40 high reaching 48 with hit slop, chips 32 high reaching 48 with hit
slop, mini player 64, page gutter 16.

Hit slop only works on the outermost view: Android drops a touch outside a parent's bounds (an
`overflow: hidden` view's own, else its children's frames, never their slop) before it reaches the children,
so a slopped child of a clipped or same-size wrapper keeps its 40dp target. `Button` and `IconButton` make the
clipped, shaped view the pressable itself, with no wrapper. A native menu (`OptionMenu`, `MenuTrigger`)
hit-tests its child's bounds, so its trigger is the full 48dp instead.

## Colour roles (Material You, already wired by `DynamicColorRoot`)

- Page: `surface` (`bg-background`). Top app bar: `surface` (was `surfaceContainer`); a detail screen's bar
  turns `surfaceContainerHigh` (`card`) once the header art scrolls under it.
- Search bar: `surfaceContainerHighest` (`bg-muted`), one step above the Top Result card's `card`.
- Tiles, quick picks, settings tiles: `surfaceContainerHigh` (`bg-card`). Skeletons: `fill` alphas.
- Filled button: `primary`/`onPrimary`. Tonal: `secondaryContainer`/`onSecondaryContainer`.
- Selected chip: `secondaryContainer`. Idle chip outline: `outlineVariant`. Selected segment of a connected
  button group: `primary` (see the component below).
- Section labels in Settings: `primary`. Supporting text: `onSurfaceVariant`.
- Player surfaces keep the artwork-seeded wash (`wash.tsx`), with D1 tokens as the fallback.

## Components

- **Top app bar**: small, flat, `surface`, title titleLarge. Pushed entity screens show only back and Share
  at the top (the header says the title); once the header art scrolls under the bar it turns `card` and shows
  the title (an instant swap; spread `useDetailScrollProps()` from `components/detail/detail-scroll.tsx` on any
  detail scroll view). The auth stack shows no bar title.
- **Navigation bar**: native NativeTabs (Home, Radio, Library; no Search tab on Android), labels 12sp; pill
  indicator from the system.
- **Button** (`components/ui/button.tsx`): 40dp, 16dp padding, labelLarge, 20dp icon, filled / tonal /
  destructive. Pressed: corners morph full → 8 on the spatial-fast spring. The pressable is the clipped view.
- **Icon buttons** (`IconButton`, both platforms): compact UI prefers a symbol to a labelled button wherever the
  symbol alone is unambiguous (Play, Shuffle, Clear queue). On Android `filled` (primary) and `tonal`
  (`secondaryContainer`) draw a 40dp container with 4dp slop to 48 (56dp `large`, no slop), corners morphing full
  → `sm` on spatial fast; a `selected` standard button (a toggle) shows a tonal container. Every one keeps its
  `accessibilityLabel`. Text stays on form submits, the empty states' way forward, "See All".
- **Action row** (entity header, both platforms): heart and the overflow menu lead, a spacer, then Shuffle
  (tonal) and Play (filled) at the end, where the thumb rests: Android 40dp tonal and 56dp Play, iOS both 48pt.
  Song collections (liked songs, history, playlists) put the count and sort first in the same row, then Shuffle
  and Play. The header's credit line is in the text colour; only the meta line under it is `onSurfaceVariant`
  (both share bodyMedium, so colour carries the hierarchy).
- **Detail text** (both platforms): a show's or episode's description is `Description`, three lines and a
  primary "Read More"; the artist's Songs/Albums order is one `OptionMenu` ("Sort by", a 48dp plain trigger) at
  the list's end, never a second connected group under the tabs. The song menu's way in is "View Song Details".
- **Connected button group** (`segmented-tabs.android.tsx`): 40dp segments, 2dp seams, selected segment
  `primary`/`onPrimary` with full corners and no check, others `secondaryContainer` with `sm` inner corners.
  A group's items are Compose's `ToggleButton`s: the filled toggle's checked container is `Primary`
  (`FilledButtonTokens.SelectedContainerColor`) and it carries no check icon (selection is colour plus shape);
  the leading check belongs to the old segmented button and to filter chips.
- **Filter chip** (`chip-row.tsx`): 32dp, `sm` corners, outline idle; `secondaryContainer` + check selected.
  The selected chip scrolls into view; the row fades its trailing edge natively (`fadingEdgeLength`).
- **Section header** (both platforms): titleLarge emphasized; the action is a primary text button.
- **List row**: unchanged geometry (56dp, 48 art at `sm`), ripple feedback. Numbered rows (an album's
  `TrackList numbered`, both platforms) end with the track's length in bodyMedium `onSurfaceVariant`, tabular
  figures, before the heart and menu; the skeleton (`SongListSkeleton numbered`) mirrors the number and length.
  The current track sits in a `secondaryContainer` tile inset 8dp (`lg` corners), title emphasized, with a
  three-bar `Equalizer` (both platforms; still and low while paused, never a pause glyph, static under reduce motion). Leading icons sit in a round
  `secondaryContainer`. iOS rows that navigate show a disclosure chevron. A paged list's last line is
  `EndOfList` (`components/end-of-list.tsx`).
- **Search**: Android hides the app bar and shows Material 3's search view bar (`search-header.android.tsx`):
  a 56dp full-round `bg-muted` pill, page-gutter inset, a labelled Back as its navigation icon in every state
  (the screen is pushed; no magnifier), the field, clear at the end while there is text. The native header
  field started after the toolbar's 72dp title inset, far from back. iOS uses the system search tab
  (a `UISearchTab`: `ios.role: "search"` and `automaticallyActivatesSearch` through `unstable_nativeProps`;
  expo-router's own `role` only sets the magnifier item). Top Result is a filled card on both platforms (96dp art, titleLarge emphasized, kind and
  credit, a 56dp filled Play at its end). Result subtitles name the kind on Android ("Song · Arijit Singh";
  `result-subtitle.ts`); Top Searches names the kind on both ("Song", "Album") and draws artists round.
- **Empty/error states**: the symbol in a 96dp `secondaryContainer` at `xl` corners, titleLarge title.
- **Text field**: outlined, 56dp, `xs` corners, label set into the outline; 2dp `primary`/`error` outline
  while focused or invalid. A server refusal is `FormError` (a leading error mark, inset 16dp on Android) and
  takes focus (`useFocusOnRefusal`).
- **Lyrics** (song screen): the preview is a `bg-card` card, titleMedium emphasized, "Read More" in primary;
  its placeholder (`LyricsSkeleton`) mirrors the card.
- **Queue**: group labels are labelLarge in `primary`; clearing Up next is an icon button (`clear_all`).
- **Sheets** (queue, languages, new playlist): Android form sheets draw no header or grabber, so
  `SheetHeader` (`sheet-header.android.tsx`) draws the 32×4dp drag handle and a titleLarge title.
  react-native-screens defaults Android sheets to 0 corners: `sheetCornerRadius` is `radii.xl`. A sheet lays
  out at its largest detent, so its empty states sit at the top (`EmptyState placement="top"`).
- **Checkbox rows** (languages): every row shows its checkbox (`check_box` / `check_box_outline_blank`). The
  list shows the effective selection: the defaults while none is chosen, and the last checked can't be
  unchecked.
- **Snackbar** (`components/failure-snackbar.tsx`, failures only): Material 3's snackbar on an inverse surface
  (the `foreground` token as the fill and `background` as the text, a pinned AA pair), a 48dp+ bar at `xs`
  corners, bodyMedium copy, an optional labelLarge text action ("Retry"), level-3 elevation, spanning the page gutters
  above the floating dock and navigation bar. Enters with a 150ms fade and scale from 80%, exits with a 75ms fade
  (a fade only under reduce motion); one at a time, about 4s (8s with an action), tap or swipe to dismiss; a live
  region so TalkBack reads it. iOS shows the same failures as a glass capsule with an SF Symbol.
- **Loading indicator**: footers and gates use `Spinner`, Compose's M3E `LoadingIndicator` on Android.
- **Pull to refresh**: `PullToRefresh`, the spinner in `primary` on a `card` disc (the stock control is white on
  white), shown only for the listener's own pull.
- **Skeletons** mirror the loaded screen exactly on both platforms: same text roles, artwork at the corner
  style's radii, the header's action row, a Top Result card, grids for grid results, and the header's own
  lines and controls (`EntityHeaderSkeleton` `like`/`menu`/`subtitle`/`meta`). Check by overlaying the
  skeleton on the loaded page.
- **Media card**: art `md`, title labelLarge (14/500), subtitle bodySmall muted, a bounded ripple.
- **Home hero** (M3 hero carousel, both platforms): one large card (`useHeroWidth()` in `shelf.tsx`) leaving
  a 56dp peek of the next, snapping per card. Android: `xl` corners, eyebrow and title only; its play button
  is a rounded square (`md`).
- **Quick-pick tile**: `bg-card`, 56dp, `md` corners, 48dp art inset 4dp at `sm` (concentric; an action tile's icon
  sits in the same cell, `fill-2` over the tile), title labelLarge, a bounded ripple. Browse
  tiles share its press sink (`usePressScale`; iOS's release spring is `iosPressRelease` in `theme/motion.ts`).
  Browse has six categories ("Made for you" spans a full row) and no New Releases tile (Top Albums' `/album`).
- **Library**: Liked Songs and Recently Played are the hub's two large tiles (`LibraryTile`); New Playlist is
  the Playlists section header's "New" action; playlist rows show their first song's art (`usePlaylistCovers`).
- **Mini player**: floating 64dp, `lg` corners, title emphasized, play/pause a 40dp filled circle in the wash's
  control colour.
- **Full player**: art `xl` (expo-image, a `CROSSFADE_MS` cross-dissolve between tracks), title `title1`
  emphasized, transport with a 72dp play button that morphs rounded-square (paused) ↔ circle (playing), flanked
  by 56dp tonal prev/next (text colour at 14%). The Lyrics/Up next row is pinned to the bottom; Lyrics is a
  `ModeToggle` (a filled control circle while on). Lyrics show as `SyncedLyrics prominent`: title2 emphasized,
  inactive lines at 0.55, fading edges. The explicit mark on the wash is a hairline outline.
- **Settings**: segmented list: each row its own `bg-card` tile, 2dp seams, outer corners `lg`, inner `xs`,
  56dp tiles (72dp, `sizes["row-2"]`, with supporting text), a bare 24dp `onSurfaceVariant` leading icon (a
  filled circle only on the profile card), the value as supporting text under the title, the chevron only for
  navigation (none on in-place actions).

## Motion (`theme/motion.ts`, Reanimated `withSpring`, mass 1)

Compose `MotionScheme.expressive()` values, damping coefficient = 2·ζ·√stiffness:

| Spring          | Stiffness | ζ   | `damping` | Use                                  |
| --------------- | --------- | --- | --------- | ------------------------------------ |
| spatial fast    | 800       | 0.6 | 34        | press morphs, press-scale release    |
| spatial default | 380       | 0.8 | 31        | play-button shape, segment selection |
| spatial slow    | 200       | 0.8 | 23        | large surfaces                       |
| effects default | 1600      | 1   | 80        | colour/opacity                       |

Spatial springs may overshoot (expressive bounce); effects springs never do. Worklet springs follow the
system's reduce-motion setting (`ReduceMotion.System`): under reduce motion a morph jumps straight to its final
shape. No entering animations on FlashList cells.

## Not in JS reach (native work)

- One UI quirk (handled): Samsung resolves `onSurfaceVariant` to `onSurface`; `withDynamicRoles` then fades
  `muted-foreground` to the text colour at 72%.

- Flexible / large collapsing top app bar (native-stack header); the detail bar's tint is an instant swap,
  not an animated one.
- Navigation bar height and indicator shape (NativeTabs is the platform view).
- Wavy progress: needs Compose (`@expo/ui/jetpack-compose`).

# Infinitunes design spec (porting contract)

Source of truth: `style.css` (layout, type, spacing, states), `glass.css` / `glass.js` (Liquid Glass materials and their geometry, documented in `glass-spec.md`), `app.js` (markup). `px` assume `--base: 16px`; the app scales every rem value with the text-size setting (15/16/17/18), so port sizes as `rem` (`px / 16`).

How the numbers were obtained: component sizes, paddings, gaps, radii, fonts and colours were measured from the rendered mockup (headless Chrome, 9 widths from 320 to 2560, 28 routes plus every overlay). Rows tagged **(R#)** are targets that the current `app.js` does not render yet because inline styles override them; the CSS hook for each already exists and the request list is in section 15. Untagged rows are what the mockup renders today.

Precedence: this file owns layout, spacing, type and non-glass states. `glass-spec.md` owns material (tint, blur, lens, rim, shadow) and the geometry of the glass surfaces it lists in its section 9 (toolbar groups, search pill, tab bar capsule, player radius, sidebar and queue inset). Where the two differ, `glass-spec.md` wins for those surfaces and rows here are marked **[glass]**. Section 3b lists the type and colour overrides glass surfaces apply on top of the scale.

## 1. Grid and spacing

| Rule | Value |
| --- | --- |
| Base unit | 4px. Every padding, margin, gap, width and height is a multiple of 4px unless listed in section 12 |
| Section rhythm | 8px steps: 8, 16, 24, 32, 48, 64 |
| Spacing scale | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (tokens `1` to `16` in a Tailwind 4px scale: `1,2,3,4,5,6,8,10,12,16`) |
| Section gap (`.sec` margin-top) | 32 |
| Section header to content (`.sec-h` margin-bottom) | 12 |
| Page header (`.phead`) | padding 8 0 24; title/subtitle gap 4 |
| Page bottom padding | 136 desktop (clears the 72 player + 12 inset + 52 air), 160 + safe-area on phone |
| Footer (`.foot-links`) | margin-top 64, padding-top 24, hairline top |
| Card grid gap | 24 row, 16 column (phone 24 / 12) |
| Shelf gap | 16 (phone 12) |
| Icon to label gap | 8 in buttons, chips, segmented, option buttons, menus use 12 |

### Gutters and widths

| Breakpoint | `--pad` (page gutter) | `--card-w` (min card / shelf column) | Hero min-height | Detail cover |
| --- | --- | --- | --- | --- |
| < 768 | 16 | 40vw shelf, 2 equal cols grid | 240 | min(60vw, 224) |
| 768 to 1023 | 24 | 160 | 256 | 144 |
| 1024 to 1279 | 32 | 160 | 256 | 176 |
| 1280 to 1439 | 32 | 176 | 288 | 176 |
| 1440 to 1919 | 40 | 176 | 288 | 224 |
| 1920 to 2559 | 40 | 192 | 288 | 224 |
| >= 2560 | 40 | 208 | 288 | 224 |

- Content max width `--max` = 1600px (`.page`). Above it the page centres and the toolbar padding grows to `max(--pad, (100% - 1600px) / 2)` so toolbar items sit on the content edges (measured at 2560 with queue open: toolbar inset 172, content 1600).
- Detail header band and shelves bleed to the full main column, not to the 1600 box: `--bleed = --pad + max(0, (100cqw - 1600px) / 2)`, where `100cqw` is the inner width of `#view` (`container-type: inline-size`). Band margin-inline `-bleed`, padding-inline `bleed`.
- Shell grid: `[sidebar --side-w] [main 1fr] [queue 0 | --q-w]`.

| Region | < 768 | 768 to 1023 | 1024 to 1439 | 1440 to 1919 | >= 1920 |
| --- | --- | --- | --- | --- | --- |
| `--side-w` | 0 (tab bar) | 72 (rail) | 240 | 240 | 264 |
| `--q-w` (docked queue) | floating panel | floating panel | floating panel | 320 | 352 |
| Sidebar box **[glass]** | none | 64 wide, 8 inset | 232 wide, 8 inset | 232 | 256 |

## 2. Tokens

### Colour (light / dark)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | #f5f5f7 | #0b0b0c | page |
| `--surface` | #ffffff | #1c1c1e | panels, selected segment, kbd |
| `--text` | #1d1d1f | #f5f5f7 | primary text, `.chip.on` fill, big play fill |
| `--muted` | #6e6e73 | #98989f | secondary text, idle icons |
| `--line` | rgba(0,0,0,.08) | rgba(255,255,255,.09) | hairlines |
| `--fill` | rgba(0,0,0,.045) | rgba(255,255,255,.07) | idle control fill, hover on transparent |
| `--fill-2` | rgba(0,0,0,.08) | rgba(255,255,255,.12) | hover on `--fill`, selected nav, pressed on transparent |
| `--fill-3` | rgba(0,0,0,.12) | rgba(255,255,255,.18) | pressed on `--fill` |
| `--accent` | #e11d48 (user set, 12 presets + custom) | same; if luminance < .03 then #f4f4f5 | primary, progress, selected |
| `--on-accent` | #fff, or #111 when accent luminance > .45 | same | text on accent |
| `--danger` | #dc2626 | #f87171 | destructive text and icons, solid danger button |
| `--danger-bg` | rgba(220,38,38,.10) | rgba(248,113,113,.16) | soft danger button |
| `--scrim` | rgba(0,0,0,.28) | rgba(0,0,0,.5) | overlay backdrop |

Contrast: `--muted` on `--bg` 4.7:1 light, 6.9:1 dark; accent on white 4.7:1. `prefers-contrast: more` sets `--line` rgba(0,0,0,.3) and `--muted` #4a4a4f.

### Radius (single input `--r`, default 12, range 0 to 24, presets 0, 5, 8, 12, 16)

| Token | Formula | At 12 | Use |
| --- | --- | --- | --- |
| `--r-sm` | 0.66 r | 7.9 | nav items, track rows, inputs, option buttons, menu items, quick tiles |
| `--r` | 1 r | 12 | cards and artwork, panels, tiles, menu header art |
| `--r-lg` | 1.5 r | 18 | hero, dialogs, palette, preview, expanded art |
| `--r-ctl` | 1.5 r | 18 | buttons, icon buttons, chips, segmented, toasts (pill-like) |
| row art | 0.75 r-sm | 5.9 | artwork in rows, queue, palette |
| micro | 0.5 r-sm | 4 | kbd, inline code, nav playlist thumbs |
| hero caption | r-lg - 8 | 10 | `.hero .cap` |
| menu | r + 2 | 14 | menu outer (padding 6 = menu radius - item radius 8, concentric) |
| tab bar | 2.5 r / 2.5 r - 4 | 30 / 26 | dock and its items (phone) **[glass: pill 999]** |
| Sheet top | fixed 24 | 24 | phone menus, dialogs |
| Circle | 50% | | avatars, swatches, card play, round artist art |

### Control sizes (pointer / touch, switch at < 768)

| Token | Pointer | Touch | Use |
| --- | --- | --- | --- |
| `.ib.xs` (class, no token) | 24 | 24 | sidebar "new playlist" add (R13) |
| `--ctl-sm` | 28 | 40 | row actions, queue row actions, play-in-row |
| `--ctl` | 32 | 40 | buttons, icon buttons, chips, option buttons, segmented outer, menu items (44 on phone), settings nav |
| `--ctl-lg` | 36 | 44 | inputs, selects, large buttons (`.btn.lg`) |
| `--ctl-xl` | 40 | 48 | search-page field |
| Switch | 40 x 24, knob 20, travel 16 | same | |
| Swatch | 32 | 32 | |
| Segmented | outer 32, button 28, inset 2 | outer 40, button 36 | |
| Tab (underline) | 40 | 44 | |

### Row heights

| Row | Comfortable | Compact | Phone comfortable | Phone compact |
| --- | --- | --- | --- | --- |
| Track row `--row` | 52 | 40 | 56 | 48 |
| Artwork `--art` (row minus 8) | 44 | 32 | 48 | 40 |
| Table head `.th` | not shown | 32 | not shown | not shown |
| Queue row | 48 (art 40) | | | |
| Palette row | 48 (art 40) | | | |
| Menu item | 32 | | 44 | |
| Quick tile | 56 (art 56) | | 48 (art 48) | |
| Genre tile / language tile | 96 / 72 | | | |

### Icons

Lucide-style, 24 grid, stroke 2, round caps. Rendered sizes only 16, 18, 20, 24 (32 inside card placeholder).

| Size | Where |
| --- | --- |
| 16 | buttons, chips, segmented, option buttons, menu items, row actions (in 28 box), palette, toast, settings nav, kbd-height rows |
| 18 | `.ib` default (in 32 box), sidebar nav, palette search glyph |
| 20 | rail nav (in 48 x 40) |
| 24 | tab bar, empty-state glyph (in 48 circle), expanded play (56 box) |
| Box rule | icon is centred in its box (measured max offset 0.0px on every icon-only button); icon + text pairs align on the text line centre within 1px |

### Motion

| Token | Value | Use |
| --- | --- | --- |
| `--spring` | cubic-bezier(.2, .9, .25, 1) | enter, reveal, sheet, knob |
| Press | 100ms, scale .96 (cards and rows .98, hero .99) | `:active` |
| Hover fill | 150ms | background-color |
| State change | 200ms | switch fill, segmented, tab colour |
| Reveal | 250ms spring | card play, toolbar title, scrim fade |
| Overlay | 220 to 300ms spring, blur 8px to 0 + scale .94 to 1 + opacity | menus, dialogs, palette, toast |
| Page enter | 350ms spring, translateY 6px | `.page` |
| Expanded player | 400ms spring translateY 8% | `.np` |
| Theme change | 400ms | body background and colour |
| Reduced motion | animation 0.01ms, transition 150ms | `prefers-reduced-motion` or setting |
| Transition properties | never `all`; list properties explicitly (a bare shorthand animates the focus ring from a black 3px outline) | |

### Hairlines

`--hair: 1px`; `0.5px` at `min-resolution: 2dppx`. Used by sidebar edge, list head, tabs, panels, menu separators, settings rows, palette dividers, footer, empty-state dashed border.

### Z-index

bar 30, player and tab bar 40, floating queue 45, expanded player 80, scrim 85, menus/dialogs/palette 86, toasts 90.

## 3. Type scale

One scale. Tracking is size specific. Line heights are multiples of 4. Font families `--font` (UI) and `--font-head` (headings, logo, big numerals). Fluid `clamp()` sizes are not used; steps change at breakpoints.

| Role | Size / line | Weight | Tracking | Use (selector) |
| --- | --- | --- | --- | --- |
| display-xl | 72 / 72 | 800 | -0.05em | 404 numerals (`.t-display-xl`) |
| display | 44 / 48 (>= 1024), 36 / 40 (768 to 1023), 28 / 32 (< 768) | 800 | -0.03em | `.dhead h1` |
| title | 32 / 40 (>= 768), 28 / 32 (< 768) | 700 | -0.025em | `.ptitle`; auth `h1` is 28 / 32 everywhere |
| headline | 24 / 32 (phone hero 20 / 28) | 700 | -0.02em | hero `h2`, expanded title, top-result name (`.t-headline`) |
| section | 20 / 28 | 700 | -0.015em | `.sec-h h2`, `.set-sec > h2`, dialog `h2` (`.t-section`) |
| brand | 18 / 24 | 700 | -0.02em | `.logo` |
| subhead | 16 / 24 | 700 | -0.01em | panel `h2`, empty `h3`, genre tile label, prose `h2`, small `.sec-h.sm h2` (`.t-sub`) |
| body-lg | 16 / 24 | 400 or 600 | -0.01em | palette input, phone inputs (16 stops iOS zoom), expanded artist link, lyric lines (600), phone menu items (500) |
| body | 14 / 20 | 400 | -0.006em | default text, subtitles, descriptions |
| body-strong | 14 / 20 | 500 or 600 | -0.006em | track title 500, sidebar nav 500, toolbar title 600, menu header name 600, queue head 700 |
| ui | 13 / 20 | 500 or 600 | -0.084px (inherited) | buttons 600, chips/options/segmented/set-nav 500, card title 600, queue and palette titles, kv, tables, links 600, field labels 600 |
| caption | 12 / 16 | 400 | 0 | `small`, subtitles in rows and cards, scrub times, side footer, dialog footers |
| label | 11 / 16 | 600, uppercase | +0.06em | sidebar section, table head, queue labels, detail kind, hero eyebrow, verified badge |
| micro | 10 / 12 | 600 | 0 | tab bar labels |
| mono | 12 / 16 | 500 | 0 | hex values, code (`.mono`, `code`) |
| numeric | role size, `font-variant-numeric: tabular-nums` | | | track numbers, durations, scrub times, rank, range output, queue durations, counts |

Colour: primary text `--text`; secondary `--muted`; links `--accent` 600.

### 3b. Glass surface overrides (apply on top of sections 3 and 9; source `glass.css`, rules in `glass-spec.md` sections 5 and 9)

Surfaces with `data-glass`: sidebar, toolbar groups and search, player, tab bar, menus, dialogs, palette, toasts, floating and wide queue, hero caption, preview cards.

| Property | Scale value | Value on a glass surface | Measured example |
| --- | --- | --- | --- |
| Tracking | -0.006em body, -0.084px ui, 0 caption | +0.004em on all text | menu item 14 / 20 500 +0.004em |
| Secondary text colour | `--muted` #6e6e73 | `--text` at 66% alpha (`color-mix`) | `.menu .mh small`, `.dialog .desc`, `.nav-h` |
| Secondary text weight | 400 | 500 on `small` and `.muted` | |
| Player title weight | 600 | 650 (`.pl-now b`) | |
| Menu separator, selected palette row | `--line`, `--fill-2` | rgba(127,127,127,.18) and rgba(127,127,127,.16) | |
| Hover on controls inside glass | `--fill` | rgba(127,127,127,.14) | |
| Hero caption text | `--text` | `#fff`, secondary 80%, 1px text shadow (clear variant) | |
| Tinted controls (toolbar Log in, expanded play, preview button) | `--accent` | accent at 0.84 light / 0.94 dark, text `--on-accent` | |

Geometry decisions (one value each):

| Item | Value that wins | Why |
| --- | --- | --- |
| Toolbar search field and button groups | 36 high pill, groups padded 2 with 32 buttons inside | `glass.css`; equals `--ctl-lg` on desktop. On phone the search glyph must be 40 x 40 like the other icon buttons (request G1) |
| Segmented selection | sliding droplet `.lg-sel`, radius `r-ctl - 2` (request G2: glass.css still says `- 3px`) | seg padding is 2 |
| Sidebar and wide queue | 8 inset from the screen, radius `r-lg + 6` (24 at r 12), height 100dvh - 16 | `glass.css` |
| Player | radius `r-lg + 4` (22), artwork radius `max(4, radius - 10)`; capsule (999) on phone | `glass.css` |
| Tab bar | 64 high capsule, collapsible to a 52 puck after 48px of downward scroll | `glass.css` |
Sample font option tile: 20 / 28, 600 (the one place a heading-size glyph sits inside a control).

## 4. Shell

### Toolbar (`.bar`, sticky, z 30)

| Property | Desktop | Phone |
| --- | --- | --- |
| Height | 56 (`--bar-h`) | 56 + safe-area top (padding-top safe-area) |
| Padding | 0 `max(--pad, (100% - 1600) / 2)` | 0 8 |
| Gap | 8 | 4 |
| Content | back / forward (32 each, gap 4), title (fades in 600 on scroll, 4px rise), search field, language button, avatar | mobile logo (padding-left 8), search glyph button, language glyph button, avatar; back button replaces the logo on child routes |
| Search field | 12 padding, 8 gap, 16 icon, kbd 20 high; width 192 (768), 256 (1024), 320 (>= 1280). Height 36 **[glass: pill]** | icon only, 40 wide |
| Language button | ghost, 32 high, padding 0 12; text hides on phone | 40 |
| Avatar | 32 circle, 13 / 13 700 | 32 in 40 button |
| Scrolled state | material from glass, 18px fade under it | |

### Sidebar and rail

| Property | Sidebar (>= 1024) | Rail (768 to 1023) |
| --- | --- | --- |
| Width | `--side-w` (240) | 72 |
| Padding | 8 8 16 | 8 |
| Section gap | 24 | 24 |
| Logo row | 40 high, padding 0 12, gap 8, mark 28 (radius r-sm, icon 16), word brand 18 / 24 | mark only, centred |
| Nav item | 32 high, padding 0 12, gap 12, icon 18, text 14 / 20 500, radius r-sm, gap between items 2 | 48 x 40, icon 20, centred |
| Section label | 11 / 16 label, padding 0 12 4 | hidden |
| Playlist rows | art 24 (radius 4), same item box | hidden |
| Add-playlist button | 24 box, icon 16 | hidden |
| Footer links | 12 / 16, gap 12, padding 0 12, pinned to bottom | hidden |
| Left text edge | 20 from the sidebar edge (8 + 12), logo, labels, items and footer all share it | |

States: item hover `--fill`, active press `--fill-3`, selected `--fill-2` plus accent icon, focus ring 2px accent offset -2 (inset).

### Tab bar (phone only)

| Property | Value |
| --- | --- |
| Box | left/right 12, bottom 12 + safe-area, height 64, padding 4, radius 2.5 r **[glass: pill, collapsible]** |
| Item | flex 1, 56 high, icon 24, label 10 / 12 600, gap 4, radius 2.5 r - 4 |
| States | idle `--muted`; selected accent text on `--fill-2`; press scale .96 |
| Items | Home, Search, Browse, Library, Settings |

### Player (`#player`, fixed, z 40)

| Property | Desktop | Pill (phone) |
| --- | --- | --- |
| Box | left `--side-w` + 12, right 12 (or `--q-w` + 12 with docked queue), bottom 12, height 72, padding 0 12, gap 16, radius r-lg + 4 **[glass]** | left/right 12, bottom 84 + safe-area (tab bar top 76 + 8), height 56, padding 0 8, gap 8, radius pill |
| Columns | `minmax(144, 1fr)  minmax(240, 576)  minmax(144, 1fr)` | `1fr auto` |
| Artwork | 48, radius `pl-r - 10` **[glass]**, gap 12 to text | 40, circle |
| Title / artist | 14 / 20 600 / 12 / 16 muted | same |
| Transport | shuffle, prev, play, next, repeat: icon buttons 32, gap 8, play 40 filled `--text` with `--bg` glyph; repeat and shuffle show a 4px accent dot 2px from bottom when on | play 40 (filled) + next 40 |
| Scrubber | row 16 high: time 12 / 16 tabular, 8 gap, track 16 high hit area with 4px bar (6px on hover and drag), fill `--text` | 2px bar inset 16 along the bottom edge |
| Right cluster | like, queue, mute (32 each), volume range 96 (min 64), expand; gap 4 | hidden |
| Container query | volume hides below 860px wide, like hides below 680px | |
| States | `.ib` hover `--fill`, press `--fill-2` + scale .96; big play hover opacity .85; track hover thickens |

### Expanded player (`.np`)

| Property | Desktop | Phone |
| --- | --- | --- |
| Layer | fixed full screen, z 80, bg `--bg` + artwork wash | drag-down sheet with 36 x 4 grabber (top 8) |
| Top bar | 56 high, padding 12 16, close, "Playing from", more (32 buttons) | same |
| Inner | width min(1152, 100%), 2 cols, gap 48, padding 64 48 48 | 1 col, gap 16, padding 56 24 24 + safe-area |
| Artwork | min(100%, 480), radius r-lg, shrinks to .88 when paused | min(100%, 352) |
| Title / artist | 24 / 32 700, 16 / 24 muted, row gap 16, margin-top 20, like button 32 | same |
| Scrub / controls | scrub margin-top 16; controls margin-top 12, space-between, play 56 (icon 24) | track hit area 24 |
| Right pane | height min(576, 70vh), segmented (Up next, Lyrics) margin-bottom 12, scroller padding 8 radius r | hidden unless chosen (50vh) |

### Queue (`#qpane`)

| Property | >= 1440 docked | < 1440 floating |
| --- | --- | --- |
| Box | column `--q-w` (320 / 352) **[glass: 8 inset, radius r-lg + 6]**; no border when closed (a closed docked pane previously leaked a 1px border and a horizontal scrollbar) | right 12, bottom 92, width min(352, 100vw - 24), height min(544, 100dvh - 120); phone: left/right 12, bottom 148 + safe-area |
| Head | 56 high, padding 0 12 0 20, title 14 / 20 700, close 32 | same |
| Body | padding 0 12 112 | padding-bottom 16 |
| Now art | 100% square, radius r, padding 0 8 16 (hidden below 1440) | hidden |
| Section label | 11 / 16 label, padding 12 8 4, trailing "Clear" link 13 / 20 600 accent (no uppercase) | same |
| Row | 48 high, grid `40 1fr auto`, gap 12, padding 4 8, radius r-sm, art 40 radius 5.9, title 13 / 20 500, artist 12 / 16, duration 12 / 16 tabular, remove 28 | same |
| Row states | hover `--fill` + remove icon appears; press `--fill-2`; focus-within shows the remove icon |

## 5. Cards, shelves, grids

| Component | Spec |
| --- | --- |
| Shelf (`.shelf`) | grid auto-flow column, columns `--card-w`, gap 16, snap x mandatory, padding 4 `--bleed` 8, margin -4 -bleed 0, scroll-padding bleed, hidden scrollbar |
| Grid (`.grid`) | `repeat(auto-fill, minmax(--card-w, 1fr))`, gap 24 / 16; phone 2 equal columns, gap 24 / 12 |
| Card | column, gap 8; art square radius r, shadow-sm (shadow on hover); title 13 / 20 600 one line ellipsis; subtitle 12 / 16 muted ellipsis; round variant 50% art and centred text |
| Card play | 36 circle accent, icon 16 filled, right 8 bottom 8, hidden (opacity 0, translateY 6, scale .9) until card hover or its own focus; always visible on phone (32) and on `hover: none` |
| Rank badge | 24 high, min-width 24, padding 0 8, radius r-ctl, 12 / 16 700 tabular, left 8 top 8, glass chip |
| Card states | hover: art shadow grows, play appears; press: art scale .98; focus ring 2px accent offset 2 on the card |
| Quick tile (`.qtile`) | 56 high, art 56 square, padding-right 12, gap 12, text 13 / 20 600 ellipsis, radius r-sm, bg `--fill`; hover `--fill-2`; press scale .98; grid 2 columns gap 8. Phone 48 high, gap 8 |
| Genre tile (`.tile`) | 96 high (language tiles 72), padding 16, radius r, label 16 / 24 700 white, rotated 18deg 72px art bottom-right offset -12; grid `repeat(auto-fill, minmax(160, 1fr))` gap 12 (phone 2 cols). Hover brightness 1.06, press scale .98 |
| Hero (`.hero`) | radius r-lg, min-height 240 / 256 / 288, caption box margin 16, padding 16 20, gap 8, max-width 416, eyebrow label, title headline, blurb 14 / 20 muted (hidden on phone), actions row; press scale .99. Hero row grid `1.25fr 1fr` gap 16, one column below 1024 |

## 6. Track list

| Part | Comfortable | Compact |
| --- | --- | --- |
| Grid columns | `36  1fr  56  84` | `36  3fr  2fr  2fr  56  84` (number, title, artist, album, time, actions) |
| Row | height `--row` (52), padding 0 8, gap 12, radius r-sm | 40 |
| Number cell | 36 wide, 13 / 20 muted tabular; on hover or current row shows a 28 play button (icon 16) in its place; current row shows the 16 high equaliser (3px bars, 2px gap, accent) while playing | same |
| Title cell | art 44 (radius 5.9) + title 14 / 20 500 + artist 12 / 16 muted, gap 12; current title is accent | art 32, no second line |
| Artist / album cells | not shown (artist is in the second line) | 13 / 20 muted ellipsis |
| Time | 56 wide, right aligned, 13 / 20 muted tabular | same |
| Actions | 84 wide, right aligned, like (28, hidden until hover or focus unless liked) + more (28), gap 4 | same |
| States | hover `--fill`, press `--fill-2`, current accent title, focus-within reveals hidden actions; `hover: none` always shows them |
| Table head (`.th`) | compact only: 32 high, same columns, 11 / 16 label, bottom hairline, margin-bottom 4, clock icon 16 |
| Narrow list (container width, not viewport) | compact only: <= 720 hides the album column (`36 3fr 2fr 56 84`); <= 480 also hides artist and restores the second line (`36 1fr 56 84`) | |
| Phone | grid `1fr auto`, padding 0 4, row 56 (compact 48), art 48 (40), number, artist col, time and like hidden, more 40 |
| List tools row | margin 16 0 8, count 14 / 20 muted left, density segmented right (2 icon segments, 86 x 32) |

## 7. Detail header band (`.dhead`)

| Property | >= 1024 | 768 to 1023 | < 768 |
| --- | --- | --- | --- |
| Band | pulls under toolbar (margin-top -56), padding 80 `--bleed` 24, 2 columns `auto 1fr`, gap 32, align end | same, cover 144 | 1 column centred, padding 72 16 24 (`bar + 16`), gap 16 |
| Cover | 176 (>= 1440: 224), radius r (circle for artists), shadow | 144 | min(60vw, 224) |
| Eyebrow | `.kind` 11 / 16 label, optional verified badge (accent, 16 icon, gap 4) | | centred |
| Title | display 44 / 48, margin 4 0 8 | 36 / 40 | 28 / 32 |
| Meta | 14 / 20 muted, wraps, column gap 8, links `--text` 600 underline on hover | | centred |
| Actions | margin-top 20, gap 8; `.btn.lg` 36 (primary filled, secondary fill), icon buttons 32 | | gap 8, buttons 44, download hidden |
| Background | artwork wash with mask, material **[glass]** | | |

## 8. Navigation controls

| Component | Spec |
| --- | --- |
| Tabs (`.tabs`) | row gap 24, bottom hairline, margin 8 0 24, scrollable; tab 40 high (44 phone), 14 / 20 600, idle `--muted`, hover and selected `--text`; selected underline 2px accent, radius 2, overlapping the hairline by 1; focus ring inset -2 |
| Segmented (`.seg`) | height 32 (40 phone), padding 2, gap 2, radius r-ctl, bg `--fill`; segment 28 (36) high, padding 0 12, gap 8, 13 / 20 500, radius r-ctl - 2, icon 16; idle `--muted`, hover `--text`, press scale .96, selected `--surface` + shadow-sm (dark: `--fill-2`) **[glass: sliding selection droplet, radius r-ctl - 2 once G2 lands]** |
| Chip (`.chip`) | 32 (40 phone) high, padding 0 12, gap 8, radius r-ctl, 13 / 20 500, bg `--fill`; hover `--fill-2`, press `--fill-3` + scale .96, selected `--text` fill with `--bg` text; icon 16; rows scroll horizontally with 2px padding so focus rings (offset 0) are not clipped; the gap to the content below is 24 (R1; renders 22 today) |
| Link | accent 13 / 20 600, hover underline, press opacity .7 |

## 9. Buttons and form controls

### Buttons

| Variant | Height | Padding | Radius | Type | Rest | Hover | Press | Disabled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Primary `.btn.pri` | 32 | 0 12 | r-ctl | 13 / 20 600 | `--accent` fill, `--on-accent` | brightness 1.06 | brightness .94, scale .96 | opacity .4 |
| Secondary `.btn` | 32 | 0 12 | r-ctl | same | `--fill` | `--fill-2` | `--fill-3`, scale .96 | opacity .4 |
| Ghost `.btn.ghost` | 32 | 0 12 | r-ctl | same | transparent | `--fill` | `--fill-2` | opacity .4 |
| Danger soft `.btn.danger` | 32 | 0 12 | r-ctl | same | `--danger` text on `--danger-bg` | brightness .96 | scale .96 | opacity .4 |
| Danger solid `.btn.pri.danger` (R6, unused until then) | 32 | 0 12 | r-ctl | same | `--danger` fill, white | | | |
| Large `.btn.lg` | 36 | 0 16 | r-ctl | same | modifier | | | |
| Square `.btn.sq` | 32 (36 lg) | 0 12 | r-sm | same | settings and auth forms | | | |
| Block `.btn.block` | width 100% | | | | | | | |
| Icon `.ib` | 32 | none | r-ctl | icon 18 | transparent; `.on` accent icon (heart fills) | `--fill` | `--fill-2`, scale .96 | opacity .4 |
| Small icon | 28 (row actions), 24 (`.ib.xs`) | | | icon 16 | | | | |

Phone: 40 for 32, 44 for 36. Icon + label gap 8. Focus: 2px solid `--accent`, offset 2 (offset -2 inside menus, tabs, segmented and settings nav; offset 0 on chips and option rows in scrollers; offset 8 on a selected swatch). A focus ring never changes the element's radius.

### Inputs, select, textarea, password

| Part | Spec |
| --- | --- |
| Text input | height 36 (44 phone, font 16 / 24), padding 0 12, radius r-sm, no border, bg `--fill`; hover `--fill-2`; focus bg `--surface` + 2px accent shadow ring (no offset); placeholder `--muted` |
| Textarea | height 80, padding 8 12, vertical resize |
| Select | width 192 (100% phone), padding-right 32, two 5px triangle chevrons at 16 and 11 from the right edge |
| Field | grid gap 8: label 13 / 20 600, control, help `small` 12 / 16 muted |
| Password toggle | 32 icon button inside the input, 2px from top and right (centres in 36; phone 40 in 44) |
| Switch | 40 x 24, radius 12, off `--fill-2` (hover `--fill-3`), on `--accent`; knob 20 white, 2px inset, travel 16, spring 300ms |
| Range / volume | native `accent-color: --accent`; width 100% (player 96, min 64); output 14 / 20 muted tabular, min-width 48, right aligned |
| Disabled | opacity .4 and no pointer events, every control |

## 10. Layers

All layers: scrim z 85 (`--scrim`, 250ms fade), content z 86, material **[glass]**.

| Layer | Desktop | Phone |
| --- | --- | --- |
| Menu | min-width 224, padding 6, radius 14; anchored below the trigger, flips up near the bottom, 8 from edges; opens with 220ms materialize from the trigger corner | bottom sheet full width, radius 24 24 0 0, padding-bottom 16 + safe-area, max-height 88dvh, 36 x 4 grabber margin 0 auto 12, drag to dismiss |
| Menu header | padding 8 12 12, gap 12, art 40 (radius r-sm), name 14 / 20 600, artist 12 / 16 muted, bottom hairline, margin-bottom 4 | same |
| Menu item | 32 high, padding 0 12, gap 12, radius r-sm, 14 / 20 500, icon 16 muted, trailing chevron or value muted; hover and keyboard focus `--fill-2` (focus also ring inset -2); press `--fill-3`; danger item `--danger`; current option accent 600 | 44 high, 16 / 24 |
| Separator | 1 hairline, margin 4 8 | |
| Submenu | replaces the content in the same box with a Back item then a separator | |
| Dialog | width min(416, 100vw - 32) (wide 480), padding 24, radius r-lg, centred, h2 section, description 14 / 20 muted margin 4 0 20, footer margin-top 20, gap 8, right aligned | sheet as above |
| Auth dialog | wide, same content as the auth page, card width 100%, close `.ib` at top 12 right 12 | |
| Palette | width min(640, 100vw - 32), top 12vh, radius r-lg; input row 52 (padding 0 16, gap 12, glyph 18, text 16 / 24, close 32); body padding 8, max-height min(60vh, 512); rows 48 (padding 4 12, gap 12, art 40, round for artists, 14 / 20 title + 12 / 16 muted sub), selected and hover `--fill-2`, press `--fill-3`; section label label role; footer padding 8 16, gap 16, 12 / 16 muted with kbd hints | full screen, no footer |
| Toast | min-height 40, padding 8 16, gap 8, radius r-ctl, 14 / 20 500, icon 16 accent; stack gap 8; centred, bottom 96 (phone 152 + safe-area); 300ms in, 200ms out (scale .96) | |
| Keyboard dialog | `dl.kv` gap 12 / 24 with kbd 20 high, padding 0 4, min-width 20, 11 / 16 500 | |

## 11. Pages

### Settings

| Part | Spec |
| --- | --- |
| Layout (`.set`) | >= 1024: grid `208 1fr`, gap 40; below: one column, gap 16, nav becomes a horizontal pill row |
| Nav | sticky top 72 (bar + 16); group title 14 / 20 700 padding 0 12 4; link 32 high, padding 0 12, gap 8, 13 / 20 500, icon 16, radius r-sm, idle `--muted`, hover `--fill`, press `--fill-2`, selected `--text` on `--fill-2`; groups gap 16. Pills (< 1024): bg `--fill`, radius r-ctl, gap 8, scroll x, bleed to the gutter |
| Body | grid gap 40; section grid gap 16, scroll-margin-top 72; `h2` section; description 14 / 20 muted pulled up 12 (so title to text gap is 4) |
| Account form | `minmax(0, 448) auto`, gap 32; fields gap 20 (R3: the password form renders 18); avatar 112 (phone 80) with 40 / 1 700 initial; "Change avatar" secondary below, gap 12 |
| Setting row (`.srow`) | max-width 640, padding 16 0, gap 16, bottom hairline (none on last), label 13 / 20 600, help 12 / 16 muted max 416, control right; phone wraps |
| Option button (`.opt`) | 32 (40 phone) high, min-width 80, padding 0 12, gap 8, radius r-sm, 13 / 20 500, bg `--fill`; hover `--fill-2`; press scale .96; selected inset 2px accent ring + accent 8% tint; group gap 8, wraps; phone 2 per row |
| Swatches | 32 circles, gap 12, selected = 2px ring 4px outside (offset), custom swatch conic gradient with hidden colour input, hex in mono |
| Font option (`.fontopt`) | min-width 120, padding 8 12, column: glyph 20 / 28 600 then name 12 / 16 muted; 60 high |
| Radius row | option buttons 0, 0.3, 0.5, 0.75, 1.0 (each min 80, five fit in 472) + range 0 to 24 and output |
| Preview card (R4: inner gaps render 10, target 12) | sticky top 72 in a right column of 288 (gap 32) at >= 1440, stacked below at narrower widths; radius r-lg, padding 20, min-height 240, gap 12, content on artwork with two glass cards (padding 12, radius r) |
| Danger zone | soft danger button, description above |

### Auth

| Part | Page | Dialog |
| --- | --- | --- |
| Layout | grid `1.1fr 1fr`, min-height 100dvh; art column is a sticky 3 x n artwork mosaic, gap 8, padding 8, black; below 768 single column and art hidden | wide dialog |
| Art overlay | inset auto 24 24 24, padding 24, radius r-lg, white text, headline 28 / 32 700 -0.025em, body 14 / 20 at 75% | none |
| Form | centred, padding 32 24, close button at top 16 left 16 | |
| Card | width min(352, 100%), grid gap 16; logo row (padding 0, margin-bottom 8) on the page only; title 28 / 32 700; sub 14 / 20 muted; passkey button `.btn.lg.sq.block`, GitHub and Google 2-up grid gap 8; divider "or" 12 / 16 muted with hairlines and gap 12; fields as section 9 (input 36); primary `.btn.pri.lg.sq.block`; footer text 12 / 16 muted centred, links accent 600 | |

### Empty, loading, error (`.empty`, `.skel`)

| State | Spec |
| --- | --- |
| Empty | grid centred, gap 8, padding 48 16, dashed hairline radius r; glyph 24 in a 48 circle `--fill` muted; title 16 / 24 700; text 14 / 20 muted max 352; optional button below (margin-bottom 0) |
| Error (R6) | identical frame; glyph circle uses `--danger` (`.ic.err`, unused until R6); the action is a secondary button with a refresh icon; retry shows a disabled "Retrying" state then replaces the frame |
| Loading (R5: bars render 14 and 10 high, row gap 6) | skeleton: `--fill` to `--fill-2` shimmer, 1.4s linear, radius r-sm. Card skeleton = square art (radius r) + 12 high title bar 80% + 8 high caption bar 50%, same gap 8 as a card. Row skeleton = number 16 x 12, art `--art`, two bars (12 and 8 high, 60% and 30%) |
| 404 (R7) | empty frame padding 64 16; display-xl numerals with accent to text gradient, title 20 / 28 700, text 14 / 20 muted, two buttons (primary Home, secondary Search) gap 8 |

### Footer (`.foot-links`)

margin-top 64, padding-top 24, top hairline, flex space-between, wrap gap 16, 12 / 16 muted; links gap 16, hover `--text`; trailing theme segmented (3 icon segments, 32 high).

### Other pages

Prose: max-width 672, `h2` 16 / 24 700 margin 24 0 8, `p` 14 / 20 muted margin 0 0 12. Route-map tables: th label role, td 13 / 20, cell padding 8, row hairlines, code 12 / 16 mono padding 2 4.
Search page field (R2): `.searchbox.lg` width 100%, height 40 (48 phone), margin-bottom 24 (renders 44 high today). Detail panels (song, artist bio): `.panel` padding 24, radius r, `--surface` with hairline inset (dark `--fill`), two-column grid `2fr minmax(256, 1fr)` gap 24 below 1440 one column; key-value `dl.kv` columns `max-content 1fr` gap 8 / 24, 13 / 20.

## 12. State matrix (every interactive element)

| Element | Hover | Press (active) | Focus-visible | Selected | Disabled |
| --- | --- | --- | --- | --- | --- |
| `.ib` | `--fill` | `--fill-2`, scale .96 | ring 2 / offset 2 | accent icon | .4 |
| `.btn` | `--fill-2` | `--fill-3`, scale .96 | ring | `.pri` fill (toggle buttons) | .4 |
| `.btn.pri` | brightness 1.06 | brightness .94, scale .96 | ring | | .4 |
| `.chip` | `--fill-2` | `--fill-3`, scale .96 | ring offset 0 | `--text` fill | .4 |
| `.seg button` | text `--text` | scale .96 | ring offset -2 | surface plus shadow | .4 |
| `.tabs button` | text `--text` | | ring offset -2 | text + 2px underline | .4 |
| `.nav a` | `--fill` | `--fill-3` | ring | `--fill-2`, accent icon | |
| `.set-nav a` | `--fill`, text `--text` | `--fill-2` | ring offset -2 | `--fill-2` | |
| `.opt` | `--fill-2` | scale .96 | ring | 2px accent inset + 8% tint | .4 |
| `.swatch` | scale 1.08 | scale .96 | ring (offset 8 when selected) | 2px ring outside | |
| `.switch` | `--fill-3` off | | ring | accent | .4 |
| `.input` | `--fill-2` | | 2px accent shadow, surface bg | | .4 |
| `.tr` | `--fill`, reveals actions | `--fill-2` | ring on inner buttons, row shows actions via focus-within | accent title (current) | |
| `.qrow`, `.prow` | `--fill` / `--fill-2` | `--fill-2` / `--fill-3` | ring | `.sel` `--fill-2` | |
| `.mi` | `--fill-2` | `--fill-3` | ring offset -2 | accent 600 (`.cur`) | .4 |
| `.card`, `.qtile`, `.tile`, `.hero` | art shadow + play / `--fill-2` / brightness 1.06 / none | art scale .98 / .98 / .98 / .99 | ring offset 2 on the whole tile | | |
| `.panel[data-go]` | surface mixed 6% text | scale .99 | ring | | |
| `.searchbox` | `--fill-2` | `--fill-3` | ring | | |
| `.link` | underline | opacity .7 | ring (radius 4) | | |
| `.pl-now` | none | opacity .8 | ring | | |
| `.track` (scrub) | bar 6px | drag keeps 6px | ring | | |

`hover: none` (touch): hidden hover-only controls (row like, queue remove, card play) are always visible.

## 13. Documented exceptions to the 4px grid

| Value | Where | Why |
| --- | --- | --- |
| 2px | segmented inset and gap, chip row padding, nav item gap, equaliser gap, switch knob inset, password toggle inset, code padding, toolbar button groups **[glass]** | sub-grid optical inset, always 2px |
| 6px | menu padding | concentric with item radius (14 - 8) |
| 1px / 0.5px | hairlines | `--hair` |
| 3px, 5px | equaliser bar width, select chevron triangle | glyph geometry |
| 4px | scrub bar thickness, grabber height | glyph geometry |
| fractional | 13.xx on `rem` text sizes when the user changes text size | scales from the 16px definition |
| 15 / 17 / 18 | `--base` text size setting | the grid is defined at 16 |
| 10 / 11 / 13 | caption, label, ui type sizes | type scale, line heights stay on the grid |
| 60 | font option tile height | 8 + 28 + 16 + 8 |

## 14. Responsive behaviour (summary)

- 320 to 767: no sidebar; toolbar 56 with glyph buttons; floating player pill (56) above a floating tab bar (64); shelves 40vw cards; grids 2 columns; menus, dialogs and the palette become sheets; touch sizes 40 / 44 / 48; track rows 56 / 48 with art 48 / 40; display and title scale to 28.
- 768 to 1023: rail 72; toolbar search 192; hero row stacks; settings nav becomes a pill row and the appearance preview stacks below; queue floats.
- 1024 to 1279: sidebar 240; search 256; display 44; cover 176; hero beside quick tiles (1.25fr 1fr).
- 1280 to 1439: cards 176; search 320; hero 288.
- 1440 to 1919: gutter 40; queue docks at 320; cover 224; settings preview docks as a right column.
- 1920 and up: sidebar 264, queue 352, cards 192 (208 at 2560); content stays 1600 wide, toolbar and header band follow it.
- Verified: no horizontal overflow, no overlapping siblings and no clipped text at 320, 390, 768, 900, 1024, 1280, 1440, 1920 and 2560 on all 28 routes, with queue open and closed, comfortable and compact density, and at 2x pixel density.

## 15. Markup requests and port contract

Line numbers are for `app.js` as of 20:21 (after the glass edits). The CSS hook named in each row already exists in `style.css`; until the markup changes, the target value in the tagged rows is not what renders.

| # | app.js (current text) | Change | CSS hook |
| --- | --- | --- | --- |
| R1 | L291 `<div class="chips" style="margin-bottom:1.25rem">`, L322 and L444 `<div class="chips" style="margin-bottom:1.5rem">` | drop the inline `margin-bottom` | `.chips:not(:last-child)` gives a 24 visual gap |
| R2 | L434 `<button class="searchbox" data-act="palette" style="width:100%;height:2.75rem;margin-bottom:1.5rem">` | `class="searchbox lg"`, keep `margin-bottom:1.5rem` only | `.searchbox.lg` |
| R3 | L510 `<div class="fields" style="display:grid;gap:1.125rem;max-width:28rem">` | `style="max-width:28rem"` | `.fields` gap 20 |
| R4 | L542 `gap:0.625rem` on the preview player card, L543 `display:grid;gap:0.625rem` and `<h3 style="font-size:1.125rem;letter-spacing:-0.015em">` | gap 0.75rem; h3 `class="t-sub"` | `.t-sub` |
| R5 | L363 skeleton `height:0.875rem`; L579 and L580 `height:0.625rem`; L580 `gap:0.375rem` | 0.75rem, 0.5rem, 0.5rem | none needed |
| R6 | L587 `<div class="ic" style="color:#dc2626">`; L1007 and L1010 `<button class="btn pri" style="background:#dc2626;color:#fff" ...>` | `class="ic err"`; `class="btn pri danger"` | `.ic.err`, `.btn.pri.danger` |
| R7 | L576 404 numerals `style="font:800 4.5rem/1 var(--font-head);letter-spacing:-0.05em;background:..."` and `<h3 style="font-size:1.25rem">` | `class="t-display-xl"` (keep the gradient inline); `<h3 class="t-section">` | `.t-display-xl`, `.t-section` |
| R8 | L447 top result `<h3 style="font-size:1.5rem;letter-spacing:-0.02em">` | `class="t-headline"` | `.t-headline` |
| R9 | L362 and L365 `<h2 style="font-size:1rem">` in `.sec-h`; L419 `<h2 style="font-size:1rem;margin-bottom:0.5rem">`; inline `font-size:0.75rem` at L341, L362, L364, L710, L813, L884 | `.sec-h sm` / `t-sub` / `t-caption`; keep margins | `.sec-h.sm h2`, `.t-sub`, `.t-caption` |
| R10 | L558 `<b style="font-size:0.95rem">G</b>` | remove the inline size (13 / 20 700) | none |
| R11 | L525 hex readout `style="font:500 0.75rem ui-monospace,monospace;margin-left:0.25rem"` | `class="mono muted"`, keep the margin | `.mono` |
| R12 | L530, L531, L532 `<div class="srow" style="display:block;border:0;padding:0">` | `class="srow stack"` | `.srow.stack` |
| R13 | L653 `<button class="ib" style="width:1.5rem;height:1.5rem" ...>` | `class="ib xs"` | `.ib.xs` |
| R14 | L465 `<div class="art" style="display:grid;place-items:center;border:1.5px dashed var(--line);box-shadow:none;background:none">` | `class="art new"` (1.5px dashed is off the hairline rule) | `.card .art.new` |
| R15 | every `<a data-go>` (34 on Home), `.card`, `.qtile`, `.hero`, clickable `.tr`, `.qrow[data-act]`, `.pl-now`, `.track[data-scrub]` | real `href`, or `tabindex="0"` with role and Enter/Space handling; the track needs `role="slider"` and arrow keys | focus ring rule in section 12 |

Requests to the glass owner (files this spec does not touch):

| # | File | Change |
| --- | --- | --- |
| G1 | `glass.css` `.bar .searchbox { height: 2.25rem }` | phone icon-only state should be 40 x 40 (`var(--ctl)`) to match the neighbouring `.ib`; desktop 36 is fine |
| G2 | `glass.css` `.seg > .lg-sel { border-radius: max(0px, calc(var(--r-ctl) - 3px)) }` | `- 2px`, because `.seg` padding is now 2px |
| G3 | `glass.css` `.lg-demo-card { padding: 0.875rem 1rem; gap: 0.125rem }` | `1rem` and `0.25rem` to stay on the 4px grid |

Port contract:

1. Selected state is exposed as `aria-pressed` (options, chips) or `aria-selected` / `aria-current` (tabs, nav), not only a class.
2. Use the role classes for type instead of inline sizes: `t-display-xl`, `t-headline`, `t-section`, `t-sub`, `t-caption`, `mono`.
3. Never write a bare `transition: <time> <easing>` shorthand; list properties (a bare shorthand animates the focus ring in from a black 3px outline).
4. Animate only `transform`, `opacity`, `background-color`, `box-shadow`, `filter`.

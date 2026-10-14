# Liquid Glass spec (porting contract)

Source of truth: `design-mockups/final/glass.css` (material, variants, overrides) and `design-mockups/final/glass.js`
(map generators, filters, interaction). Every number below is the value those files ship. When this document and the code
disagree, the code wins and this document is the bug.

## 1. Model

Liquid Glass is three layers over a lensed backdrop (css-tricks "Getting clarity on Apple's Liquid Glass"; Apple, WWDC 2025):

1. **Lens.** The backdrop is refracted at the bezel, clear in the centre. Blur is low (1.8 to 10.5px). Chromium only.
2. **Highlight.** A 1px specular rim, bright at the top-left, weaker at the bottom-right, peaking in the curved corners,
   plus a baked Blinn-Phong specular inside the lens filter. The rim angle follows the pointer.
3. **Shadow and illumination.** A soft drop shadow scaled by surface size, inner glow, a top-down illumination wash,
   and a radial glow that brightens from the touch point while pressed.

Tint, dim and text colour adapt to what is behind (scheme plus an 8x8 sample of the playing artwork).
Bigger surfaces read thicker: more blur, more tint, deeper shadow, weaker lens.

## 2. Parameters (`:root`, user-adjustable)

Settings > Appearance > Glass and motion > "Liquid Glass" (heading, then a live preview card over a vivid gradient, then the controls) writes these inline on `<html>`; they persist in `localStorage["inf-prefs"].lg`.

| Variable | Light | Dark | Slider range | Meaning |
| --- | --- | --- | --- | --- |
| `--glass-tint` | 0.14 | 0.24 | Transparency 10% to 100% (stored as 1 - value) | base tint alpha |
| `--glass-blur` | 3px | 3px | 0 to 20px | base blur, times size factor |
| `--glass-refraction` | 30 | 30 | 0 to 48px | peak displacement for size s, px |
| `--glass-sat` | 1.8 | 1.8 | 100% to 260% | backdrop saturate() |
| `--glass-spec` | 1 | 1 | 0 to 160% | rim, inner highlight, baked specular, press glow |
| `--glass-shadow` | 1 | 1 | 0 to 160% | drop-shadow alpha multiplier |
| `--ambient` | 0.62 | 0.62 | 0 to 100% | ambient colour field opacity |
| `--glass-bri` | 1.06 | 0.90 | fixed | backdrop brightness() |
| `--glass-tint-c` | `#fff` | `#1e1e22` | toggle "Tint follows accent" | tint colour; with the toggle `color-mix(accent 22%, #fff)` / `color-mix(accent 26%, #1e1e22)` |
| `--g-rim-k` | 1 | 0.62 | fixed | rim strength per scheme |
| `--g-sh-k` | 1 | 2.2 | fixed | shadow weight per scheme |

The Variant control (Regular / Clear / Tinted) sets `html.lg-v-clear` or `html.lg-v-tinted`. Every `regular` surface of size `s` or `m` then renders as that variant: player, tab bar, toolbar, toasts. `l` and `xl` surfaces (menus, dialogs, palette, sidebar) stay Regular for legibility. On the Solid preset the sliders and variant control are dimmed and inert.

Presets (Liquid / Subtle / Solid) reset the user overrides:
- **Liquid** = the defaults above.
- **Subtle**: tint 0.62, blur 8px, refraction 8px, saturate 1.4, spec 0.6, shadow 0.8, ambient 0.4.
- **Solid** (`html.glass-off`): `--g-a: 1` with `--surface` tint, no backdrop filter, no lens. Rim and shadow stay.

**Adaptive tint.** glass.js draws the playing artwork into an 8x8 canvas (`crossOrigin="anonymous"`; the CDN sends
`Access-Control-Allow-Origin: *`) and writes:
- `--g-art-l`: mean relative luminance, 0 to 1.
- `--g-art`: mean colour.
- `--g-blob-1..3`: the most saturated cell in rows 0-2, 3-4 and 5-7, pushed to HSL s >= 0.7 and l 0.5 to 0.62. These seed the ambient field. When all three hues lie within 40 degrees (warm covers), blobs 2 and 3 are rotated to hue -60 and +60 degrees from blob 1, so the field always carries at least three hues.

The adaptive term is added to the tint alpha:

```
--g-adapt (light) = (1 - L) * 0.10
--g-adapt (dark)  = L * 0.12
--g-a = --glass-tint + size add + --g-adapt          (capped at 0.97)
```

**Ambient field** (`#ambient`, z -1, fixed):
- The blurred artwork at 0.85 opacity.
- Three radial blobs: 38%x34% at 12% 18%, 42%x38% at 88% 26%, and 50%x42% at 55% 92%, each fading to transparent at 70 to 72%.
- A `--bg` veil: light mode transparent at the top to 30% at 75% height; dark mode 8% to 42%.
- The whole layer at `--ambient` opacity. Glass is invisible over flat `#f5f5f7`, so this field is mandatory at default settings.

## 3. Size classes

| Size | Used for | Blur factor (px at default) | Tint add | Lens strength (feDisplacementMap scale at default) | Drop shadow (light; dark alpha x2.2) |
| --- | --- | --- | --- | --- | --- |
| `s` | tab bar, toolbar groups, search, round buttons, selection droplet | 1 (3px) | 0 | 1.0 (60, so +-30px) | `0 0 0 .5px rgb(0 0 0/.05), 0 1px 2px rgb(0 0 0/.06), 0 6px 18px -4px rgb(0 0 0/.18)` |
| `m` | player, toasts, hero caption, preview cards | 1.75 (5.25px) | 0.26 light, 0.30 dark, plus backdrop `contrast(.6)` light / `contrast(.5)` dark | 0.75 (45) | `0 0 0 .5px rgb(0 0 0/.05), 0 2px 6px rgb(0 0 0/.07), 0 14px 36px -10px rgb(0 0 0/.26)` |
| `l` | menus, dialogs, palette, sheets, floating queue | 3 (9px) | 0.38 | 0.45 (27) | `0 0 0 .5px rgb(0 0 0/.05), 0 4px 12px rgb(0 0 0/.08), 0 30px 70px -18px rgb(0 0 0/.34)` |
| `xl` | sidebar, wide queue pane (full height, no lens) | 3.5 (10.5px) | 0.26 | off | `0 0 0 .5px rgb(0 0 0/.04), 0 10px 40px -20px rgb(0 0 0/.2)` |

All shadow alphas are multiplied by `--glass-shadow` and, in dark mode, by `--g-sh-k`.
Hard caps:
- Lens only when the element area is at most 900x700 and its size is not `xl`.
- No blur above 10.5px anywhere. The old 39px sidebar blur and 28px bars are gone.

## 4. Layers (exact)

```css
background:
  linear-gradient(180deg, rgb(255 255 255 / calc(.12 * spec * rimk)), transparent 42%),   /* illumination */
  linear-gradient(rgb(0 0 0 / var(--g-dim)) 0 0),                                         /* dimming (clear) */
  color-mix(in srgb, var(--glass-tint-c) calc(min(var(--g-a), .97) * 100%), transparent); /* tint */
backdrop-filter: [url(#lens)] blur(calc(3px * k)) saturate(1.8) brightness(1.06 | .9) contrast(var(--g-con, 1));   /* --g-con: m .6 light / .5 dark, clear 1 */
box-shadow:
  inset 0 1px 1px  rgb(255 255 255 / calc(.50 * spec * rimk)),
  inset 0 -1px 1px rgb(255 255 255 / calc(.16 * spec * rimk)),
  inset 0 0 18px   rgb(255 255 255 / calc(.12 * spec * rimk)),
  inset 0 0 0 .5px rgb(255 255 255 / calc(.24 * spec * rimk)),
  <size drop shadow>;
```

**Rim (`::before`, z 1).**
- A 1px ring: `padding: 1px` with the mask `linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)`.
- Fill is `linear-gradient(var(--g-light, 135deg), ...)` with these white alphas, each times `spec * rimk`:

  | Stop | 0% | 16% | 40% | 60% | 84% | 100% |
  | --- | --- | --- | --- | --- | --- | --- |
  | Alpha | 0.95 | 0.34 | 0.07 | 0.07 | 0.30 | 0.70 |

- Because a linear gradient's 0% and 100% land on the box corners, the peaks fall on the curved corners, not the straight edges.

**Glow (`::after`, z -1).** `radial-gradient(circle 8rem at var(--g-px) var(--g-py), rgb(255 255 255 / calc(.34 * --g-press * spec)), transparent 72%)`.

**Pointer light.**
- On `pointermove` (mouse only), coalesced into one rAF, each surface within 320px of the pointer gets a `--g-light` angle.
- The angle points the gradient start at the pointer. It blends toward 135deg by `1 - distance / 320`.
- With `deviceorientation`, `--g-light = 135deg + clamp(gamma, -40, 40) * 1.2` on `:root`.
- Nothing else changes per frame. Filters are never touched by pointer movement.

## 5. Variants

| Variant | Tint | Dim | Blur factor | Text | Where |
| --- | --- | --- | --- | --- | --- |
| `regular` (default) | `--glass-tint-c` at `--g-a` | 0 | size | `--text`; secondary `color-mix(text 88%)` light, 94% dark, weight 500 | navigation chrome |
| `clear` | `#fff` at 0.06 | `0.16 + 0.44 * --g-art-l` | 0.6 (1.8px) | `#fff`, secondary 80%, `text-shadow: 0 1px 2px rgb(0 0 0/.28)` | over media: hero caption, Now Playing top buttons, toolbar capsules while the bar sits over an artwork header (`.bar.lg-over-art:not(.titled)`) |
| `tinted` | `--accent` at `0.7 + --glass-tint` (0.84 light, 0.94 dark) | 0 | size | `--on-accent` | primary actions on the navigation layer: toolbar Log in, Now Playing play/pause, preview button |

For `clear`, `--g-art-l` is sampled from the image behind the surface (`parentElement > img`) when there is one. Otherwise it comes from the playing artwork.

All surfaces add `letter-spacing: .004em` and antialiasing, and secondary text uses weight 500.

### Contrast

**Measured on rendered pixels.** A solid slab (black in light mode, white in dark mode) is injected under the player. The tint pixels beside the title are read back from the screenshot, and the secondary text is composited over the measured extremes (`glass-contrast-*.png`).

| Player | Title | Secondary |
| --- | --- | --- |
| light 1280, over black | 5.48 | 4.59 |
| dark 1280, over white | 5.58 | 5.16 |
| light 390, over black | 5.48 | 4.59 |
| dark 390, over white | 5.26 | 4.87 |

**Computed for the other classes** (worst backdrop: black in light mode, white in dark mode):

| Surface | Worst case |
| --- | --- |
| light `l` (`a` .52 to .62), menus, dialogs | 4.5 to 6.0 |
| dark `l` (`a` .62 to .74), menus, dialogs | 5.0 to 6.9 |
| tinted (`a` .84), white glyph over white, rose / violet | 4.0 / 4.3 |
| clear, white text, backdrop at its sampled mean L | 19.5 (L=0), 4.5 (L=.5), 5.7 (L=1) |

Tinted is a UI-component case, so the requirement is 3:1.

What these numbers mean:
- `l` and `m` text surfaces hold AA over any backdrop.
- `s` surfaces (tab bar, toolbar capsules) are icon-led. On phones they sit over the hard bottom scroll edge, whose 55% `--bg` veil keeps their backdrop near mid-grey. They are not guaranteed AA over a solid-black slab in light mode.
- Clear glass is AA only when local brightness is close to the sampled mean.

**Type on glass** (glass-owned overrides of SPEC.md type roles):

| Override | Value |
| --- | --- |
| Tracking | +0.004em on every surface |
| Secondary text | 88% alpha light, 94% dark (66% fails AA on glass) |
| Secondary weight | 500 |
| Player title | weight 650 |
| Clear text shadow | `0 1px 2px rgb(0 0 0/.28)` |

## 6. Lens: displacement map and filter graph

Constants:
- Index of refraction `ior = 1.5`.
- Base thickness `0.35` bezel units.
- Profile: convex squircle `h(t) = (1 - (1 - t)^4)^(1/4)`, where `t` is distance from the rim / bezel. The glass is as tall as the bezel is wide.
- Bezel width:

```
bezel = round(min(r, max(8, min(w, h) * (size == s ? 0.32 : 0.22)), size == l ? 22 : 18))
```

r is the computed border radius, clamped to w/2 and h/2. Clamping the bezel to r keeps the inward normal continuous (no diagonal seam).

### Pseudocode

```
createDisplacementMap(w, h, r, bezel, ior = 1.5, thickness = .35, magnify = 0):
  for i in 0..128: t = i/128
      theta1 = atan(h'(t)); theta2 = asin(sin(theta1) / ior)
      prof[i] = (h(t) + thickness) * tan(theta1 - theta2)
  prof /= max(prof)                                      # peak 1 at the rim, 0 at the inner bezel edge
  for each pixel centre p:
      (d, n) = roundedRectSDF(p, w, h, r)                # d < 0 inside, n = outward unit normal of nearest edge
      inside = -d
      v = (0, 0)
      if 0 <= inside < bezel: v = -n * prof[round(inside / bezel * 128)]   # inward: never samples outside the box
      if magnify and inside >= 0: v += (centre - p) / (min(w, h) / 2) * magnify
  normalise so max |component| <= 1
  R = 128 + 127 * v.x ; G = 128 + 127 * v.y ; B = 128 ; A = 255

roundedRectSDF(p, w, h, r):
  q = |p - centre| - (w/2 - r, h/2 - r)
  if q.x > 0 and q.y > 0: d = |q| - r ; n = normalise(q) * sign(p - centre)
  else: d = max(q.x, q.y) - r ; n = axis of max(q.x, q.y) * sign
```

`createSpecularMap(w, h, r, bezel, lightAngle = 315, key = .9, counter = .45, fresnel = .35, shininess = 18)` uses the same SDF.
- The normal tilts outward by `slope = min(6, h'(max(t, .02)))`.
- Alpha = `fresnel * (1 - n.z)^3 + sum(strength * max(0, n . H)^18 * (1 - n.z) * 2)`.
- There are two lights 40deg above the plane: the key from `lightAngle` and the counter from the opposite side.
- The viewer is at +z, and `H` is the half vector. The map is white with that alpha, and 0 outside the bezel.

Both functions are pure: inputs are numbers, output is `{ data: Uint8ClampedArray(w*h*4), width, height }`. They port to TypeScript unchanged.

### SVG filter (one per `w x h x r x size`, cached by key, ids `lg-0..n`)

```xml
<filter id="lg-N" x="0" y="0" width="W" height="H" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB">                          <!-- sRGB is mandatory: linearRGB shifts 128 -->
  <feImage href="data:image/png;base64,DISPLACEMENT" x="0" y="0" width="W" height="H" preserveAspectRatio="none" result="map"/>
  <feDisplacementMap in="SourceGraphic" in2="map" scale="2 * refraction * strength" xChannelSelector="R" yChannelSelector="G" result="refr"/>
  <feImage href="data:image/png;base64,SPECULAR" x="0" y="0" width="W" height="H" preserveAspectRatio="none" result="spec"/>
  <feComponentTransfer in="spec" result="specA"><feFuncA type="linear" slope="min(1.5, spec * .8)"/></feComponentTransfer>
  <feBlend in="specA" in2="refr" mode="screen"/>
</filter>
```

The element gets `--g-lens-url: url(#lg-N)`. The CSS applies `backdrop-filter: var(--g-lens-url,) blur() saturate() brightness()` only under `html.lg-lens`. The lens comes first, and the blur after it hides displacement aliasing.

Strength by size: s 1.0, m 0.75, l 0.45, selection droplet 0.7 with magnify 0.12.

**Lifecycle.** Filters are cached by key. When the cache reaches 24 filters, any filter no connected surface references is evicted; ids come from a monotonic counter.
- A ResizeObserver watches every surface.
- When the size drifts by more than 1px, the lens is removed at once, because a stale map would shear the backdrop. It is reapplied 140ms after the size settles.
- Maps are cached by key and never regenerated per frame.
- `scale` changes only while the surface materializes, and when the user moves the Refraction slider.

**Capability check (`lensCapable()`).** The lens path is on when all of these hold:
- `CSS.supports("backdrop-filter", "url(#lg) blur(1px)")`.
- `SVGFEDisplacementMapElement` and `SVGFEImageElement` exist.
- `navigator.userAgentData.brands` contains Chromium, Google Chrome or Microsoft Edge. This is an API only Chromium ships, and it is the tiebreaker because Safari and Firefox parse `url()` in backdrop-filter but render nothing.

`?lens=0` forces the fallback, and `?lens=1` skips the engine tiebreaker. Result: `html.lg-capable`. The lens is active (`html.lg-lens`) when capable, not on the Solid preset, and not under `prefers-reduced-transparency` or `prefers-contrast: more`.

## 7. Motion

All springs use the app's `spring({ response, damping })` (Apple parameters) and are skipped under reduced motion.

| Interaction | Spring / timing |
| --- | --- |
| Press in (glow, scale) | response .30, damping 1.0. Growth is capped at 6px: a child control scales to `1 + min(.08, 6/width)`, and a surface that is itself a control "gels" to `1 + min(.06, g)` x `1 + min(.04, g)`. Full-width rows therefore never overflow their sheet. |
| Press release | response .30, damping .55 for gel surfaces (visible wobble), .75 for child controls |
| Selection slide after tap (FLIP from stored x) | response .38, damping .82 |
| Selection drag | threshold 8px, 1:1 tracking with pointer capture, rubber band `o*d*.55/(d+.55*abs(o))` past the ends |
| Drag release | velocity from the last 5 samples; `project(v, .99)`; snap to the nearest item centre; response .35, damping .80 with velocity handoff `v/(to-from)`; then navigate (`Router.go`) or `click()`, swallowing the native click |
| Lifted droplet | scale 1.14, z above the items, magnifying lens (strength 0.7, magnify .12), clear tint `rgb(255 255 255/.06)` |
| Materialize (menus at 768px and up, toasts; dialogs and palette keep their keyframes; phone sheets keep the `draggable().enter()` spring and no CSS animation) | `.34s cubic-bezier(.32,1.18,.5,1)` from opacity 0, scale .92, blur 10px (blur gone by 60%); lens `scale` ramps 0 to 1 over 320ms, ease-out cubic |
| Queue morph from the player (<1440px) | `clip-path: inset(calc(100% - 3rem) 5rem 0 calc(100% - 13rem) round 999px)` to `inset(-4rem round ...)`, translateY 4.75rem to 0, blur 6px to 0; .46s; opacity .22s |
| Tab bar minimize (phone) | minimize after 48px of accumulated downward scroll past y 40; expand after 24px up or at y < 40, or when the minimized bar is tapped. right, height and player bottom/left/height use `.45 to .5s cubic-bezier(.32,1.18,.5,1)` |

## 8. Scroll edge effect (no dividers under glass)

**Top bar.** `.bar` keeps no background. On `.scrolled` two pseudo layers fade in over .3s:
- **`::before`.** Height bar + 1.75rem.
  - bg `linear-gradient(to bottom, bg 62%, bg 30% at 55%, transparent)`.
  - `backdrop-filter: blur(2px)`.
  - mask `linear-gradient(to bottom, #000 40%, transparent)`.
- **`::after`.** Height bar + .5rem.
  - `backdrop-filter: blur(8px) saturate(1.3)`.
  - mask `linear-gradient(to bottom, #000 30%, transparent)`.

**Bottom (`.lg-edge-bottom`, fixed, z 35, under the player).**

| Style | Where | Height | Background | Blur | Mask |
| --- | --- | --- | --- | --- | --- |
| Soft | wide screens | 3.5rem | `linear-gradient(to top, bg 30%, transparent)` | 2px | `#000 25%` to transparent |
| Hard | phones | 5rem + safe area | `bg 55%` from 30% height | 2px | `#000 60%` to transparent |

## 9. Surface table

| Surface | Selector in mockup | Variant | Size | Lens |
| --- | --- | --- | --- | --- |
| Player (bar / phone pill) | `.player` | regular | m | on |
| Tab bar (phone) | `#tabbar` | regular | s | on; selection droplet lens while pressed/dragged |
| Toolbar back/forward group | `.bar .nav-arrows` | regular (clear over artwork header) | s | on |
| Toolbar search field | `.bar .searchbox` | regular (clear over artwork header) | s | on |
| Toolbar trailing group (languages + account) | `.bar .tb-group` | regular (clear over artwork header) | s | on |
| Toolbar back (phone) | `.bar .back` | regular | s | on |
| Toolbar primary (Log in) | `.bar .btn.pri` | tinted | s | on |
| Sidebar (floating, 0.5rem inset) | `.side` | regular | xl | off |
| Queue, wide pane (>=1440) | `.qpane` | regular | l (pane rules) | off |
| Queue, floating panel (<1440) | `.qpane` | regular | l | on |
| Menus and bottom sheets | `.menu` | regular | l | on |
| Dialogs | `.dialog` | regular | l | on |
| Command palette | `.palette` | regular | l | on |
| Toasts | `.toast` | regular | m | on |
| Hero caption | `.hero .cap` | clear | m | on |
| Now Playing top buttons | `.np-top .ib` | clear | s | on |
| Now Playing play/pause | `.np .pl-ctl .big` | tinted | s | on |
| Segmented control | `.seg` | track is a plain fill (content layer) | n/a | droplet only while pressed or dragged, and never inside another glass surface |
| Settings preview | `.preview .glass`, `.lg-demo [data-demo]` | regular / chosen variant | m | on |

Never glass:
- Content cards, rows and rank badges. The rank badge is now `rgb(0 0 0/.55)`.
- The Now Playing lyrics/queue list. It is now `color-mix(bg 40%)`.
- The auth artwork panel, which is intentionally left as it was.

Never glass on glass:
- Controls inside a glass surface get a `rgb(127 127 127/.14)` hover and the spring press. They never get a backdrop filter.

Concentric radii:
- Player radius `--r-lg + 4px`, and its artwork `max(4px, radius - 10px)`.
- On phones the player and tab bar are capsules (999px), and their inner artwork and droplet are circles or capsules.
- Floating chrome keeps a consistent inset from screen edges: 0.5rem for the sidebar and wide queue pane, 0.75rem for the player on wide layouts, and 0.625rem for the player and tab bar on phones.

## 10. Accessibility and fallback overrides

| Condition | Result |
| --- | --- |
| Safari, Firefox, `?lens=0` | Same layers without `url()`: tint, blur, saturate, brightness, rim, inner glow, shadow, press glow. |
| `prefers-reduced-transparency: reduce` | Lens off. `--g-a: .86`. Clear dim .62 with tint .04. Ambient opacity x0.5. |
| `prefers-contrast: more` | Tint `--surface` at .97. No backdrop filter. No rim. Border `inset 0 0 0 1.5px color-mix(text 60%)`. Text `--text`. Tinted keeps the accent. |
| `prefers-reduced-motion: reduce` or `html.reduce-motion` | No springs: values jump. Menus, toasts, dialogs and palette use a .2s opacity fade. No queue morph. Tab bar minimize and the player slide change position without a transition. |
| `html.glass-off` (Solid preset) | Opaque `--surface`, no backdrop filter, no lens. |

## 11. Public API

**HTML attributes**
- `data-glass="regular|clear|tinted"`
- `data-glass-size="s|m|l|xl"`
- `data-lens="off"` opts a surface out of refraction.

**Classes set by glass.js**

| Class | Set on | Meaning |
| --- | --- | --- |
| `lg-capable` | `html` | engine can refract |
| `lg-lens` | `html` | lens active |
| `lg-accent-tint` | `html` | tint follows the accent |
| `tab-min` | `html` | phone tab bar minimized |
| `lg-over-art` | `.bar` | an artwork header is under the toolbar |
| `.lg-sel` | element | selection droplet inside `#tabbar` and `.seg` |
| `.lifted` | `.lg-sel` | droplet is pressed or dragged |
| `.lg-edge-bottom` | element | bottom scroll edge |

**CSS variables**
- Inputs: the section 2 table.
- Set by glass.js per element: `--g-lens-url`, `--g-light`, `--g-press`, `--g-px`, `--g-py`, `--g-art-l`.

**JavaScript (`window.Glass`)**
- `init()`
- `refresh()`
- `apply()`: writes the variables from prefs.
- `settingsPanel(): string`
- `bind(root)`
- `createDisplacementMap(opts)`
- `createSpecularMap(opts)`
- `roundedRectSDF(x, y, w, h, r)`
- `refractionAt(t, ior, thickness)`
- `lens` (boolean)
- `config()`

Hooks into app.js are limited to:
- `applyPrefs()` calls `Glass.apply()`.
- The Appearance page renders `Glass.settingsPanel()`.
- The Liquid / Subtle / Solid presets clear `S.prefs.lg`.
- The toolbar groups its trailing controls in `.tb-group`.
- The `glass` class is removed from rank badges and the Now Playing list.

**Porting to the Next.js app.**
- Put generators and the capability check in `packages/ui` as plain TS modules.
- Render one hidden `<svg><defs>` host in the root layout.
- A `useLiquidGlass(ref, { variant, size })` client hook owns the ResizeObserver, cache lookup and `--g-lens-url`.
- Surfaces set `data-glass` / `data-glass-size` directly, so no selector registry is needed.
- glass.css becomes a global stylesheet next to the theme tokens.

## 12. Measured performance

All numbers come from headless Chrome (`--headless=new`, software raster, so treat them as relative), 1280x800, home route, a 3s scripted scroll at 12px per frame.

| Mode | Frame p50 | Frame p95 | Max frame | Paint | Raster | Composite |
| --- | --- | --- | --- | --- | --- | --- |
| Lens on (default) | 16.7ms | 16.8ms | 33.3ms (one) | 3ms | 33ms | 108ms |
| Frosted fallback (`?lens=0`) | 16.7ms | 16.8ms | 16.8ms | 2ms | 32ms | 97ms |
| Solid | 16.7ms | 16.8ms | 16.8ms | 1ms | 44ms | 81ms |
| Lens on, palette open | 16.7ms | 16.7ms | 16.8ms | 2ms | 55ms | 98ms |

Paint, raster and composite are totals over the 3s scroll.

During playback, with the 250ms progress tick active and a 3s scroll, the frame p50 is 16.7ms, p95 16.7ms and max 16.8ms. Layout totals 27ms, Paint 71ms and Raster 17ms. Text-only mutations no longer trigger a glass rescan.

Map generation is one time per size (JS map plus PNG encode, both maps):

| Size | Maps | PNG encode | Data URL size |
| --- | --- | --- | --- |
| 1016x68 (player) | 18.8ms | 3.5ms | 12KB |
| 390x60 | 5.6ms | 2.5ms | 11KB |
| 416x330 (dialog) | 10.5ms | 3.2ms | 17KB |
| 640x420 | 14.5ms | 4.7ms | 25KB |

A fresh page holds 7 to 13 filters; the cache is capped at 24 by eviction.

## 13. Screenshots (`design-mockups/screenshots/`, not committed)

**Before:**
- `glass-before-home-1280-light.png`
- `glass-before-album-1280-dark.png`
- `glass-before-menu-1280-light.png`
- `glass-before-dialog-1280-dark.png`
- `glass-before-home-390-light.png`
- `glass-before-album-390-dark.png`
- `glass-before-player-zoom.png`
- `glass-before-tabbar-zoom.png`

**After.** `glass-{state}-{width}-{light|dark}[-art{bright|dark}][-fallback|-tabmin].png`:
- `home` and `album` at 390, 900, 1280, 1440 and 1920.
- `menu`, `dialog`, `palette`, `settings` and `scrolled` at all five widths.
- Bright and dark artwork (`afsaana` L .67, `patient-zero` L .15) at 390 and 1280.
- The `?lens=0` fallback at 1280.
- The minimized tab bar at 390.
- Zooms: `glass-zoom-player-1280-light.png`, `glass-zoom-tabbar-390-dark.png`, `glass-zoom-droplet-390.png`, `glass-zoom-demo-1280-light.png`.
- Accessibility: `glass-a11y-{reduced-transparency|contrast-more|reduced-motion}-1280-{light|dark}.png`.
- Contrast probes: `glass-contrast-{light|dark}-{1280|390}.png`.
- Over file://: `glass-home-1280-light-file.png`.

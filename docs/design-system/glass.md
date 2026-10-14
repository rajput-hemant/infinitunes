# Liquid Glass: usage guide

The single guide for placing glass. The mockup is the source of truth (`design-mockups/final/glass.css`, `glass.js`,
`glass-spec.md`); this file says how the app exposes it. Engine code lives in `apps/web/lib/glass/` (pure, unit
tested), `apps/web/components/glass/` (DOM) and `apps/web/hooks/`; the stylesheet is `apps/web/styles/glass.css`.

## What is mounted for you

`app/layout.tsx` (static, reads no request data) renders once: `GlassFilters` (the hidden SVG filter host) and
`GlassRuntime` (client island that runs the engine). There is no colour field behind the page: glass refracts the real
content behind it (artwork, text). You only place surfaces. `GlassRuntime` finds every `data-glass` surface and every
`packages/ui` popup, attaches the lens and the press gel, and tracks capability, level and accessibility settings live.

## The model

The look is the CodePen "SVG Liquid Glass (feDisplacementMap)" model, delivered as `backdrop-filter: url(#lg-N)` on
Chromium and as frost (blur, glint, tint) on Safari and Firefox. The CodePen's clone-the-scene trick needs a cloned
DOM behind every lens and repaints on scroll, which a scrolling app cannot afford.

- **Map** (`lib/glass/engine.ts`): a rounded-rect signed-distance ring. `span = s < 0 ? splay + feather : splay`,
  `amt = pow(smootherstep(max(0, 1 - |s| / span)), curve)`, `R = 127.5 - nx * amt * 127 * 0.8` (G likewise with ny),
  B 128, A 255. One quadrant is computed and mirrored with the offsets negated (4-fold symmetry). It is generated only
  when a shape changes (size, radius, splay, feather, curve, magnify), never on move, and cached with its filter by
  that key. Every map gets a fresh filter id (`lg-N`), because Safari caches filter output by id.
- **Filter** (`components/glass/lens-registry.ts`): `feImage` (the map) then `feDisplacementMap` with `scale = depth`,
  scaled by surface class (`s` 1, `m` .75, `l` .45, `xl` none). With chroma above 0 it becomes the pen's two passes
  (red at `depth * (1 + chroma)`, green and blue at `depth * (1 - chroma)`); at 0 there are no extra primitives. With
  the tint on it adds `feFlood`, a multiply `feBlend` and a mix, so the refracted backdrop itself is multiplied by the
  tint colour. Depth, chroma and the tint values are rewritten in place; a shape change rebuilds the lens.
- **Paint** (`styles/glass.css`): blur is `blur()` in the same `backdrop-filter` list as the lens. Glint is the pen's
  inset highlight (`inset 1.5px 1.5px 4px white / .7` and `inset -2px -2px 5px black / .28`) scaled by `glint / 100`
  (capped at 1). Tint is a `::before` layer in `tintColor` at `tint` opacity with `mix-blend-mode: multiply`; a layer
  inside the element cannot multiply its own backdrop, so under the lens the filter does that and the layer fades out
  (`--g-lens-tint`), and the layer is what Safari and Firefox show. The layer only renders while `tint` is above 0
  (`html[data-glass-tint="on"]`). The outer shadow is soft and subtle. Nothing here carries a hue.
- **Tuning** (`GlassTuning`, `lib/glass/tuning.ts`): depth 0 to 120 (60), splay 2 to 40 (2), feather 0 to 40 (24),
  curvature .3 to 3 (2), blur 0 to 5 (0), chromatic 0 to .25 (0), glint 0 to 150 (25), tint 0 to 1 (0), tint colour
  (`#ffffff`). Presets: Simple, Thick, Frosted, Cut, Orange plexiglass (`GLASS_PRESETS`, the pen's values).
- **The accent is the tint.** While `tint` is above 0 the primary token derives from `tintColor`
  (`lib/theme/accent.ts`); at 0 it is neutral.

## Surfaces

Navigation layer only: sidebar, toolbar capsules, tab bar, player, queue, menus, popovers, dialogs, sheets, toasts,
selector droplet, command palette. Never on content cards, rows, rank badges, prose, lyric or queue lists (use
`color-mix(in srgb, var(--background) 40%, transparent)` there). Never nested: controls inside glass get a hover fill
and the press gel, no backdrop filter. Pair a modal glass surface with a scrim.

Two ways to make a surface, equivalent:

```tsx
<GlassSurface size="m" glassRole="player" className="fixed ...">...</GlassSurface>
<GlassSurface render={<nav aria-label="Main" />} size="s" glassRole="tabbar">...</GlassSurface>
<div data-glass="regular" data-glass-size="s">...</div>   // markup only, no import
```

`GlassSurface` props: `variant` (`regular|clear|tinted`, default regular), `size` (`s|m|l|xl`, default m), `lens`
(`on|off`; `xl` is always off), `preset` (a `GlassPresetId`: this surface follows that preset's lens, blur, glint and
tint instead of the page's settings, as `data-glass-preset` plus inline `--glass-*` paint variables), `interactive`
(the surface is itself pressable: press gel), `glassRole`, `render`
(an element, Base UI style; this component's props win, class names merge). It forwards `ref` (`HTMLElement`) and any
native attribute. It never sets `position`, so give it `fixed`, `sticky` or `absolute` yourself; otherwise glass.css
makes it `relative` (layered, so any utility wins).

| `size` | Use                                             | Blur factor | Lens   |
| ------ | ----------------------------------------------- | ----------- | ------ |
| `s`    | tab bar, toolbar groups, search, round buttons  | .5          | strong |
| `m`    | player, toasts, hero caption                    | 1           | medium |
| `l`    | menus, dialogs, palette, sheets, floating queue | 2           | weak   |
| `xl`   | full-height sidebar and wide queue pane         | 3.5         | none   |

The blur factor multiplies a 2px base and adds the Blur setting. The size classes also add to a light fill
(`--g-base` .14 light, .24 dark) so text stays legible: `m` .2 (.26 dark), `l` .32, `xl` .26.

Variants: `regular` adapts to the backdrop; `clear` has almost no tint, a dim layer and white text, only over
artwork or media (the home hero caption and the shelf arrows); `tinted` is the accent, only for a primary action.
Never mix them in one view. A toolbar over an artwork header puts
`data-glass-over-art` on its wrapper (and `data-glass-titled` once the title has scrolled into the bar) and its regular
glass renders clear.

## Attributes

On a surface: `data-glass`, `data-glass-size`, `data-lens="off"` (opt out of refraction), `data-glass-press` (it is
a pressable control itself), `data-glass-role`.

`data-glass-role` is one of `player | tabbar | toolbar | sidebar | queue | menu | dialog | sheet | palette | toast`.
`menu`, `dialog`, `palette` and `toast` get the materialize lens ramp; `tabbar` and `player` get the phone minimize
rules (see Hooks). The rest are metadata for stylesheets and tests.

On `<html>` (written by the theme and the runtime; never write them yourself):

| Attribute           | Values                                | Meaning                                                                                                                                           |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-glass-level`  | `liquid` (default), `subtle`, `solid` | the Glass level setting; `solid` is opaque with no filter                                                                                         |
| `data-glass-tint`   | `on` (absent = tint 0)                | the glass tint layer is on                                                                                                                        |
| `data-glass-engine` | `lens`, `frost`                       | set by `GlassRuntime`: `lens` only when the browser can refract, the level is not solid, and neither reduced transparency nor more contrast is on |
| `data-motion`       | `reduced`, `full`                     | in-app reduce motion                                                                                                                              |
| `data-tab-min`      | `true`                                | phone tab bar minimized (set by `useTabBarMinimize`)                                                                                              |

`data-glass` is only meaningful together with `data-glass-size`. The old html `data-glass` was renamed
`data-glass-level` (decision D6) because it matched the document as a surface.

Tuning variables (inline on `<html>` when the user changes them): `--glass-depth`, `--glass-splay`, `--glass-feather`,
`--glass-curve`, `--glass-chroma` (read by `GlassRuntime`, not by CSS), `--glass-blur`, `--glass-glint` (glint / 100),
`--glass-tint`, `--glass-tint-c`. The Subtle level denses the fill (.62) and sets depth 20, blur 6px and glint .15; user
overrides still win. Set per element by the engine: `--g-lens-url`, `--g-lens-tint`, `--g-press`, `--g-px`, `--g-py`,
`--g-art-l` (the artwork under a clear surface).

Inside any glass surface the app tokens are remapped for the subtree: `--foreground` follows the surface text,
`--muted-foreground` is the heavier 88 percent (94 dark) secondary text, and `--muted` and `--accent` become a
translucent grey, so shadcn text and hover fills read correctly with no per-component overrides. Do not set colours
on glass; use the tokens.

## Overlays (`packages/ui`, read-only)

Popups cannot take `data-glass`, so glass.css matches their real `data-slot` and `GlassRuntime` attaches the lens by
the same list (`OVERLAY_TARGETS` in `lib/glass/overlays.ts`; a test keeps the CSS in step with it and with
`packages/ui`):

| Popup                     | Selector                                             | Role   | Size |
| ------------------------- | ---------------------------------------------------- | ------ | ---- |
| Popover                   | `popover-content`                                    | menu   | l    |
| Dropdown menu and submenu | `dropdown-menu-content`, `dropdown-menu-sub-content` | menu   | l    |
| Dialog, alert dialog      | `dialog-content`, `alert-dialog-content`             | dialog | l    |
| Sheet, drawer             | `sheet-content`, `drawer-popup`                      | sheet  | l    |
| Toast (sonner)            | `[data-sonner-toast]`                                | toast  | m    |
| Tooltip                   | `tooltip-content`                                    | none   | s    |

Chromium resolves a `backdrop-filter` reference filter's user space against the element's ink overflow, so an outer
`box-shadow` (the l and m drop shadows) shifts the filter region right and down by how far the shadow reaches past the
left and top edges. Left alone, only part of a popup is filtered and the rest shows crisp page content through it.
`inkOverflowOrigin` (`lib/glass/shadow-overflow.ts`) reads that reach from the computed shadow and the lens registry
offsets the filter region and both maps by its negative; the offset is part of the filter cache key. The reach is capped
by the surface's distance from the viewport's left and top edges (Chromium clips ink overflow to the viewport), so the
registry passes the border box position and re-reads it when the surface's animation or transition ends. In
`forced-colors: active` the lens is off (`lensActive`) and no glass surface keeps a backdrop-filter.

Tooltips use the s material with the m contrast floor (12px text keeps AA) and never get a lens, so they are styled in
glass.css but kept out of `OVERLAY_TARGETS`. Not covered: select, hover card, context menu, menubar
and command palette are not in `packages/ui` today. If one is added, add its slot to `OVERLAY_TARGETS` and to the
`:is()` lists in glass.css (the test fails until both agree); a popup built outside `packages/ui` just uses
`GlassSurface`. Menus and popovers from 768px, and toasts, materialize (opacity, scale .92, blur 10px to 0, lens ramp
0 to 1 over 320 ms); dialogs keep their own enter animation, sheets and drawers keep their spring. Known limit: a popup
that scrolls its own content (a long menu) scrolls the rim with it.

## Hooks and components

- `useTabBarMinimize()` (`~/hooks/use-tab-bar-minimize`): call once from the tab bar component. 48px of accumulated
  downward scroll past y 40 sets `html[data-tab-min="true"]`; 24px up, the top of the page, or a tap on the minimized bar
  clears it. No-op from 768px. glass.css contract: the tab bar (`glassRole="tabbar"`) is `fixed` with a 0.625rem inset on
  each side, its items are direct children marked `data-glass-item` with the current one `aria-current`, each with a
  `span` label; the player (`glassRole="player"`) is `fixed` above it. The tab bar collapses to the current tab and the
  player slides into the row.
- `useScrollEdge<T>(opts?)` (`~/hooks/use-scroll-edge`): returns a ref; put it on the toolbar wrapper carrying
  `data-glass-edge="top"` (a wrapper, not a glass surface). It toggles `data-scrolled` past 4px (or a `scroller`). Remove
  the toolbar's own background and divider. `<GlassEdge />` is the bottom edge (soft on wide, hard on phones); set
  `--g-edge-l` and `--g-edge-r` to clear the sidebar and docked queue, and keep it under the player.
- `GlassSelector` (`components/glass/glass-selector`): tab bar and segmented controls. Children are `data-glass-item`,
  the active one `aria-current`, `aria-selected` or `aria-pressed`. It slides a spring indicator, lifts into a magnifying
  droplet while pressed, and supports drag with rubber band and fling projection. A drag release clicks the picked item
  (or calls `onPick`). Put `data-glass` on the host for the tab bar; leave it plain for a segmented control (it gets a
  raised thumb).
- `lib/glass/spring.ts`: `spring`, `project`, `rubber` for your own physical motion; honour `prefersReducedMotion()`.

## Fallbacks and accessibility

| Condition                                         | Result                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Safari, Firefox, `?lens=0`, no SVG host           | frosted: fill, blur, glint, tint layer, shadow, press glow (`data-glass-engine="frost"`)                                                    |
| `?lens=1`                                         | skips only the Chromium check                                                                                                               |
| `data-glass-level="solid"`                        | opaque `--popover`, no backdrop filter, no lens                                                                                             |
| `prefers-reduced-transparency`                    | lens off, fill .86, clear dim .62                                                                                                           |
| `prefers-contrast: more`                          | opaque surface, no tint layer, 1.5px text border, no filter                                                                                 |
| Solid level, `prefers-contrast: more`             | always win over the clear and tinted variants (`data-glass-over-art`): the variant rules are excluded under them, a test checks the cascade |
| `forced-colors: active`                           | `Canvas` and `CanvasText`, 1px outline, no tint layer                                                                                       |
| `prefers-reduced-motion`, `data-motion="reduced"` | no materialize, no spring (values jump), tab bar and player change position without a transition, no device-orientation light               |

The scroll edge (`data-glass-edge`) and the lifted selector droplet are deliberately not gated by Solid or the
contrast modes (the mockup does not either): the edge blurs page content that scrolled under a toolbar, not the
toolbar's own text, and the droplet's 0.5px blur sits over a surface that is already opaque in those modes.

Contrast holds WCAG AA on text-bearing `m` and `l` surfaces over any backdrop (measured values in `glass-spec.md`);
`s` icon-led surfaces are guaranteed 3:1. Clear glass is AA only near the sampled brightness.

## How to verify

1. `bun run test` (pure engine math, capability and override parsing, the lens registry, press, selector,
   hooks, CSS coverage), then `bun run type-check`, `lint`, `fmt:check`.
2. In Chromium: surfaces refract (`<html data-glass-engine="lens">`, `--g-lens-url` on each surface). `?lens=0` must
   look the same minus refraction; `?lens=1` forces it elsewhere.
3. Toggle Settings > Appearance > Glass level (Solid and Subtle), OS reduced transparency, more contrast, reduced motion.
4. Phone width: scroll down and the tab bar minimizes; tap it to expand.

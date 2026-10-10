# Liquid Glass: usage guide

The single guide for placing glass. The mockup is the source of truth (`design-mockups/final/glass.css`, `glass.js`,
`glass-spec.md`); this file says how the app exposes it. Engine code lives in `apps/web/lib/glass/` (pure, unit
tested), `apps/web/components/glass/` (DOM) and `apps/web/hooks/`; the stylesheet is `apps/web/styles/glass.css`.

## What is mounted for you

`app/layout.tsx` (static, reads no request data) renders once: `GlassFilters` (the hidden SVG filter host),
`GlassAmbient` (the colour field behind everything) and `GlassRuntime` (client island that runs the engine). You only
place surfaces. `GlassRuntime` finds every `data-glass` surface and every `packages/ui` popup, attaches the lens, the
pointer light and the press gel, and tracks capability, level and accessibility settings live.

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
(`on|off`; `xl` is always off), `interactive` (the surface is itself pressable: press gel), `glassRole`, `render`
(an element, Base UI style; this component's props win, class names merge). It forwards `ref` (`HTMLElement`) and any
native attribute. It never sets `position`, so give it `fixed`, `sticky` or `absolute` yourself; otherwise glass.css
makes it `relative` (layered, so any utility wins).

| `size` | Use                                             | Blur factor | Lens   |
| ------ | ----------------------------------------------- | ----------- | ------ |
| `s`    | tab bar, toolbar groups, search, round buttons  | 1           | strong |
| `m`    | player, toasts, hero caption                    | 1.75        | medium |
| `l`    | menus, dialogs, palette, sheets, floating queue | 3           | weak   |
| `xl`   | full-height sidebar and wide queue pane         | 3.5         | none   |

Variants: `regular` adapts to the backdrop; `clear` has almost no tint, a dim layer and white text, only over
artwork or media; `tinted` is the accent, only for a primary action. Never mix them in one view. The Variant setting
re-skins `s` and `m` regular surfaces only (`html[data-glass-variant]`). A toolbar over an artwork header puts
`data-glass-over-art` on its wrapper (and `data-glass-titled` once the title has scrolled into the bar) and its regular
glass renders clear.

## Attributes

On a surface: `data-glass`, `data-glass-size`, `data-lens="off"` (opt out of refraction), `data-glass-press` (it is
a pressable control itself), `data-glass-role`.

`data-glass-role` is one of `player | tabbar | toolbar | sidebar | queue | menu | dialog | sheet | palette | toast`.
`menu`, `dialog`, `palette` and `toast` get the materialize lens ramp; `tabbar` and `player` get the phone minimize
rules (see Hooks). The rest are metadata for stylesheets and tests.

On `<html>` (written by the theme and the runtime; never write them yourself):

| Attribute                     | Values                                | Meaning                                                                                                                                           |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-glass-level`            | `liquid` (default), `subtle`, `solid` | the Glass level setting; `solid` is opaque with no filter                                                                                         |
| `data-glass-variant`          | `clear`, `tinted` (absent = regular)  | the Variant setting                                                                                                                               |
| `data-glass-accent-tint`      | `true`, `false`                       | tint follows the accent                                                                                                                           |
| `data-glass-engine`           | `lens`, `frost`                       | set by `GlassRuntime`: `lens` only when the browser can refract, the level is not solid, and neither reduced transparency nor more contrast is on |
| `data-motion`, `data-ambient` | `reduced`/`full`, `on`/`off`          | in-app reduce motion, ambient field                                                                                                               |
| `data-tab-min`                | `true`                                | phone tab bar minimized (set by `useTabBarMinimize`)                                                                                              |

`data-glass` is only meaningful together with `data-glass-size`. The old html `data-glass` was renamed
`data-glass-level` (decision D6) because it matched the document as a surface.

Tuning variables (inline on `<html>` when the user changes them): `--glass-tint`, `--glass-blur`, `--glass-refraction`,
`--glass-sat`, `--glass-spec`, `--glass-shadow`, `--ambient`. The Subtle level presets them to the mockup values
(tint .62, blur 8, refraction 8, sat 1.4, spec .6, shadow .8, ambient .4); user overrides still win. Set per element
by the engine: `--g-lens-url`, `--g-light`, `--g-press`, `--g-px`, `--g-py`, `--g-art-l`.

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
- `useGlassArtwork(url)` (`~/hooks/use-glass-artwork`): the player calls it once with the current track artwork URL
  (the 500px one; the CDN sends CORS headers) or `null`. The ambient field shows it and an 8x8 sample sets
  `--g-art-l`, `--g-art` and `--g-blob-1..3` (adaptive tint). Pure sampling math: `lib/glass/artwork.ts`.
- `useGlassLens(ref, opts)`: registers an element that is neither `data-glass` nor a known popup. Rarely needed.
- `lib/glass/spring.ts`: `spring`, `project`, `rubber` for your own physical motion; honour `prefersReducedMotion()`.

## Ambient field

`GlassAmbient` paints the blurred artwork and three gradient blobs behind everything; glass is invisible over a flat
page without it. Default `--ambient` is the mockup's 0.62 in both schemes (it was 0.22 and 0.32 in `globals.css`):
legibility does not depend on it because text surfaces carry their own tint floor and backdrop contrast (below). Layouts
that paint an opaque page background hide it, so shell and page wrappers must be transparent over `body`.

## Fallbacks and accessibility

| Condition                                         | Result                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Safari, Firefox, `?lens=0`, no SVG host           | frosted: tint, blur, saturate, brightness, rim, shadow, press glow (`data-glass-engine="frost"`)                              |
| `?lens=1`                                         | skips only the Chromium check                                                                                                 |
| `data-glass-level="solid"`                        | opaque `--popover`, no backdrop filter, no lens                                                                               |
| `prefers-reduced-transparency`                    | lens off, tint .86, clear dim .62, ambient halved                                                                             |
| `prefers-contrast: more`                          | opaque surface, no rim, 1.5px text border, no filter                                                                          |
| `forced-colors: active`                           | `Canvas` and `CanvasText`, 1px outline, no rim, no ambient                                                                    |
| `prefers-reduced-motion`, `data-motion="reduced"` | no materialize, no spring (values jump), tab bar and player change position without a transition, no device-orientation light |

Contrast holds WCAG AA on text-bearing `m` and `l` surfaces over any backdrop (measured values in `glass-spec.md`);
`s` icon-led surfaces are guaranteed 3:1. Clear glass is AA only near the sampled brightness.

## How to verify

1. `bun run test` (pure engine math, capability and override parsing, the lens registry, press, light, selector,
   hooks, CSS coverage), then `bun run type-check`, `lint`, `fmt:check`.
2. In Chromium: surfaces refract (`<html data-glass-engine="lens">`, `--g-lens-url` on each surface). `?lens=0` must
   look the same minus refraction; `?lens=1` forces it elsewhere.
3. Toggle Settings > Appearance > Glass level (Solid and Subtle), OS reduced transparency, more contrast, reduced motion.
4. Phone width: scroll down and the tab bar minimizes; tap it to expand.

# Design tokens and theme engine

The single reference for every UI unit. Source of truth: `apps/web/styles/globals.css` (tokens), `apps/web/lib/theme/` and `apps/web/lib/theme-config.ts` (engine), `apps/web/lib/control-styles.ts` (control sizes). Target design: `design-mockups/final/`. Glass tokens (`--glass*`, `--blur`, `--shadow*`, glass edge and rim) are not here: see `glass.md`.

## 1. Mockup to app names

The mockup and the app use different names, and two of them collide with shadcn. Port mockup CSS with this table, never by copying the name.

| Mockup                                | App                                            | Note                                        |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `--bg`                                | `--background` (`bg-background`)               | page                                        |
| `--surface`                           | `--card`, `--popover`                          | cards, menus, dialogs                       |
| `--text`                              | `--foreground` (`text-foreground`)             | body text                                   |
| `--muted` (a text colour)             | `--muted-foreground` (`text-muted-foreground`) | **shadcn `--muted` is a fill, not text**    |
| `--accent` (the brand colour)         | `--primary` (`bg-primary`, `text-primary`)     | **shadcn `--accent` is a soft tinted fill** |
| `--on-accent`                         | `--primary-foreground`                         | text on the accent                          |
| `--line`                              | `--line`, `--border` (`border-border`)         | same value, hairlines                       |
| `--fill`, `--fill-2`                  | `--fill`, `--fill-2` (`bg-fill`, `bg-fill-2`)  | neutral hover and selected fills            |
| `--scrim`                             | `--scrim` (`bg-scrim`)                         | modal backdrops                             |
| `--r`, `--r-sm`, `--r-lg`, `--r-ctl`  | `--radius`, `--r-sm`, `--r-lg`, `--r-ctl`      | see radius                                  |
| `--ctl`, `--ctl-lg`, `--row`, `--art` | same                                           | see sizes                                   |
| `--spring`                            | `--ease-spring` (`ease-spring`)                |                                             |
| `--font`, `--font-head`               | `--font-sans`, `--font-heading`                |                                             |
| `--base`                              | `--text-scale` (a multiplier of the root size) |                                             |
| `--pad`                               | `--page-pad` (`px-page`)                       | page gutter                                 |
| `--ambient`                           | `--ambient`                                    | ambient artwork opacity                     |

Mockup `html.dark`, `html.compact`, `html.glass-*`, `html.no-ambient`, `html.reduce-motion` become `.dark` and the `data-*` attributes in section 6.

## 2. Colour tokens

Surfaces and text are shared by every accent; only the accent family changes (section 5). Every text pair below clears WCAG AA 4.5:1 and `--input` clears 3:1 on both surfaces, enforced in `tests/theme-contrast.test.ts`, also under `prefers-contrast: more`.

| Token                                       | Utility                                         | Light                                                          | Dark                     | Use                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `--background`                              | `bg-background`                                 | `#f5f5f7`                                                      | `#0b0b0c`                | page                                                                                                                |
| `--foreground`                              | `text-foreground`                               | `#1d1d1f`                                                      | `#f5f5f7`                | body text                                                                                                           |
| `--card`, `--popover`                       | `bg-card`, `bg-popover`                         | `#ffffff`                                                      | `#1c1c1e`                | raised surfaces, panels, menus                                                                                      |
| `--card-foreground`, `--popover-foreground` | `text-card-foreground`                          | = foreground                                                   | = foreground             | text on those                                                                                                       |
| `--primary`                                 | `bg-primary`, `text-primary`, `ring-primary`    | derived                                                        | derived                  | accent fill, active icon, link, progress                                                                            |
| `--primary-foreground`                      | `text-primary-foreground`                       | derived                                                        | derived                  | text and icons drawn on `bg-primary`                                                                                |
| `--accent`                                  | `bg-accent`                                     | derived tint                                                   | derived tint             | soft accent fill (shadcn hover and selected rows)                                                                   |
| `--accent-foreground`                       | `text-accent-foreground`                        | = foreground                                                   | = foreground             | text on `bg-accent`                                                                                                 |
| `--secondary`, `--muted`                    | `bg-secondary`, `bg-muted`                      | `#eaeaec`                                                      | `#2c2c2e`                | quiet filled areas, skeletons, chips                                                                                |
| `--secondary-foreground`                    | `text-secondary-foreground`                     | = foreground                                                   | = foreground             |                                                                                                                     |
| `--muted-foreground`                        | `text-muted-foreground`                         | `#66666b`                                                      | `#98989f`                | secondary text. Clears 4.5:1 on background, card and muted. The mockup's `#6e6e73` is one step darker here for that |
| `--destructive`, `--destructive-foreground` | `bg-destructive`, `text-destructive-foreground` | red 0.50                                                       | red 0.73                 | delete and errors                                                                                                   |
| `--border` = `--line`                       | `border-border` (default border colour)         | `rgb(0 0 0 / .08)`                                             | `rgb(255 255 255 / .09)` | hairlines. Stronger under `prefers-contrast: more`                                                                  |
| `--input`                                   | `border-input`                                  | `#86868b`                                                      | `#6c6c70`                | form control borders (3:1 non-text contrast)                                                                        |
| `--ring`                                    | `ring-ring`, focus outline                      | = primary                                                      | = primary                | focus ring colour                                                                                                   |
| `--fill`                                    | `bg-fill`                                       | `rgb(0 0 0 / .045)`                                            | `rgb(255 255 255 / .07)` | neutral hover fill (mockup `:hover`)                                                                                |
| `--fill-2`                                  | `bg-fill-2`                                     | `rgb(0 0 0 / .08)`                                             | `rgb(255 255 255 / .12)` | neutral selected or pressed fill                                                                                    |
| `--scrim`                                   | `bg-scrim`                                      | `rgb(0 0 0 / .28)`                                             | `rgb(0 0 0 / .5)`        | modal and sheet backdrop                                                                                            |
| `--sidebar*`                                | `bg-sidebar`, `text-sidebar-foreground`, ...    | alias of background, foreground, primary, accent, border, ring | same                     | shadcn sidebar parts                                                                                                |
| `--ambient`                                 | plain CSS                                       | `0.62`                                                         | `0.62`                   | opacity of the ambient artwork layer. `0` when `data-ambient="off"`, halved under `prefers-reduced-transparency`    |

Guidance: neutral hover is `hover:bg-fill`, selected is `bg-fill-2`, the active item's icon or label is `text-primary`. Use `bg-primary/10` for an accent wash (mockup `color-mix(accent 8%)`). `text-primary` is guaranteed 4.5:1 only on `--background` and `--card`; on `--muted` or fills use `text-foreground`.

Selection (`::selection`) is `bg-primary text-primary-foreground`. Scrollbar, `::selection` and the focus ring follow the accent automatically.

## 3. Geometry

All corners derive from one base, `--radius` (default `0.75rem`, i.e. 12px; user range 0 to 1.5rem).

| Token      | Utility                                                                 | Value | Use                                                                       |
| ---------- | ----------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| `--radius` | `rounded-md`                                                            | 1x    | cards, inputs, rows, menus                                                |
| `--r-sm`   | `rounded-sm`                                                            | 0.66x | small chips, row artwork (use `calc(var(--r-sm) * .75)` for list artwork) |
| `--r-lg`   | `rounded-lg`                                                            | 1.5x  | hero, large cards, sheets                                                 |
| `--r-ctl`  | `rounded-ctl`                                                           | 1.5x  | buttons, icon buttons, segmented controls, tab bar                        |
| (derived)  | `rounded-xl` 2x, `rounded-2xl` 2.5x, `rounded-3xl` 3x, `rounded-4xl` 4x |       | big shapes                                                                |
|            | `rounded-full`                                                          |       | avatars and dots only                                                     |

At radius 0 everything is square, at 24px controls become pills. Never hard-code a radius.

| Token        | Utility                   | Pointer                      | Coarse pointer | Use                                                     |
| ------------ | ------------------------- | ---------------------------- | -------------- | ------------------------------------------------------- |
| `--ctl`      | `h-ctl`, `size-ctl`       | 2rem (32px)                  | 2.5rem (40px)  | standard control height                                 |
| `--ctl-lg`   | `h-ctl-lg`, `size-ctl-lg` | 2.25rem (36px)               | 2.75rem (44px) | prominent actions, hero CTA                             |
| `--row`      | `h-row`                   | 3.25rem                      | 3.5rem         | song and list row. Compact density: 2.5rem, coarse 3rem |
| `--art`      | `size-art`                | 2.5rem                       | 2.75rem        | row artwork. Compact: 2rem, coarse 2.25rem              |
| `--page-pad` | `px-page`                 | `clamp(1rem, 2.4vw, 2.5rem)` | same           | page gutter                                             |
| `--page-gap` | plain CSS                 | 1.5rem                       |                | gap between page sections                               |
| `--side-w`   | plain CSS                 | 15rem                        |                | sidebar width                                           |
| `--queue-w`  | plain CSS                 | 20rem                        |                | queue pane width                                        |

All `rem` sizes scale with the text size setting (section 7), so controls and rows grow with the text. Use `controlStyles` (section 8) for controls instead of the raw utilities.

Body text defaults to `0.875rem` (14px) with `line-height: 1.45`, so `text-base` is larger than the default. `h1`, `h2`, `h3` use the heading font automatically.

## 4. Motion and focus

| Token                                          | Utility                                  | Value                             | Use                                       |
| ---------------------------------------------- | ---------------------------------------- | --------------------------------- | ----------------------------------------- |
| `--ease-spring`                                | `ease-spring`                            | `cubic-bezier(0.2, 0.9, 0.25, 1)` | enter, press, toggles (the mockup spring) |
| `--ease-out`, `--ease-in-out`, `--ease-drawer` | `ease-out`, `ease-in-out`, `ease-drawer` | unchanged                         | existing app curves                       |
| `--duration-fast`                              | `duration-fast`                          | 150ms                             | hovers, colour changes                    |
| `--duration-base`                              | `duration-base`                          | 250ms                             | menus, toggles, tabs                      |
| `--duration-slow`                              | `duration-slow`                          | 400ms                             | page and sheet transitions                |
| `--focus-ring-width`, `--focus-ring-offset`    | plain CSS                                | 2px, 2px                          | the global `:focus-visible` outline       |

`:focus-visible` gets `outline: var(--focus-ring-width) solid var(--ring)` globally. Do not remove outlines; only components with their own ring (`focus-visible:ring-*`) opt out with `outline-hidden`.

Reduced motion: under `prefers-reduced-motion: reduce` or `data-motion="reduced"` the three `--duration-*` tokens become `0.01ms`, and all animations and transitions collapse (spinners keep turning). Smooth scrolling stops.

## 5. Accent engine

Accent = a preset name (`config/themes.ts`: zinc, slate, stone, gray, neutral, red, rose, orange, green, blue, yellow, violet) or a custom `#rrggbb`. Default is `rose` (`#e11d48`). `lib/theme/accent.ts` `deriveAccentTokens(hex)` turns any hex into, per scheme:

- `--primary`: the accent moved only along lightness (hue and chroma kept, chroma shrunk only to stay in sRGB) until it clears 4.5:1 on both `--background` and `--card` of that scheme and for its own text colour.
- `--primary-foreground`: white (`oklch(1 0 0)`) or near-black (`oklch(0.18 0 0)`), whichever contrasts more, always at least 4.5:1 on `--primary`.
- `--accent`: soft tint of the accent hue (`oklch(0.94 ...)` light, `oklch(0.30 ...)` dark).
- A dark accent in dark mode (luminance under 0.03) flips to a light neutral `#f4f4f5`, exactly as the mockup's `applyPrefs`.

Derivation keeps a 0.05 contrast headroom so 8-bit rounding in browsers cannot dip below AA. Consequence: a light accent such as yellow or orange becomes a darker, deeper tone on light surfaces (yellow turns olive). That is the cost of guaranteed 4.5:1 for accent text.

Delivery without flash: the server writes six custom properties on `<html style>` (`--light-primary`, `--light-primary-foreground`, `--light-accent`, `--dark-primary`, `--dark-primary-foreground`, `--dark-accent`). `:root` maps `--primary` to `--light-*` and `.dark` to `--dark-*`, so light, dark and system modes all work, and the stylesheet defaults are the derived rose. Presets and custom hex take the identical path.

Contrast of every preset (from the function; ratios are WCAG 2):

| Preset  | Hex       | Light primary              | vs page | vs card | text on it | Dark primary               | vs page | vs card | text on it |
| ------- | --------- | -------------------------- | ------- | ------- | ---------- | -------------------------- | ------- | ------- | ---------- |
| zinc    | `#18181b` | `oklch(0.21 0.005 285.9)`  | 16.28   | 17.73   | 17.73      | `oklch(0.967 0.001 286.4)` | 17.88   | 15.46   | 17.09      |
| slate   | `#0f172a` | `oklch(0.208 0.039 265.8)` | 16.38   | 17.84   | 17.84      | `oklch(0.967 0.001 286.4)` | 17.88   | 15.46   | 17.09      |
| stone   | `#1c1917` | `oklch(0.216 0.006 56)`    | 16.07   | 17.49   | 17.49      | `oklch(0.967 0.001 286.4)` | 17.88   | 15.46   | 17.09      |
| gray    | `#111827` | `oklch(0.21 0.031 264.7)`  | 16.29   | 17.74   | 17.74      | `oklch(0.967 0.001 286.4)` | 17.88   | 15.46   | 17.09      |
| neutral | `#171717` | `oklch(0.205 0 89.9)`      | 16.45   | 17.91   | 17.91      | `oklch(0.967 0.001 286.4)` | 17.88   | 15.46   | 17.09      |
| red     | `#dc2626` | `oklch(0.571 0.215 27.3)`  | 4.55    | 4.95    | 4.95       | `oklch(0.641 0.215 27.3)`  | 5.30    | 4.59    | 5.07       |
| rose    | `#e11d48` | `oklch(0.572 0.222 17.6)`  | 4.57    | 4.98    | 4.98       | `oklch(0.642 0.222 17.6)`  | 5.28    | 4.56    | 5.04       |
| orange  | `#f97316` | `oklch(0.559 0.153 47.6)`  | 4.56    | 4.97    | 4.97       | `oklch(0.705 0.186 47.6)`  | 7.02    | 6.07    | 6.71       |
| green   | `#16a34a` | `oklch(0.529 0.148 149.2)` | 4.56    | 4.96    | 4.96       | `oklch(0.627 0.169 149.2)` | 5.97    | 5.16    | 5.70       |
| blue    | `#2563eb` | `oklch(0.546 0.215 262.9)` | 4.75    | 5.17    | 5.17       | `oklch(0.622 0.203 262.9)` | 5.27    | 4.56    | 5.04       |
| yellow  | `#facc15` | `oklch(0.545 0.111 91.9)`  | 4.56    | 4.97    | 4.97       | `oklch(0.861 0.173 91.9)`  | 12.86   | 11.13   | 12.30      |
| violet  | `#7c3aed` | `oklch(0.541 0.246 293)`   | 5.24    | 5.70    | 5.70       | `oklch(0.637 0.215 293)`   | 5.30    | 4.58    | 5.07       |

Text on the accent is white (`oklch(1 0 0)`) on light surfaces and near-black (`oklch(0.18 0 0)`) on dark surfaces for every preset, rose included. A dark-mode accent light enough to clear 4.5:1 on `--card` cannot also hold 4.5:1 with white text, so the mockup's white-on-rose in dark mode is the one visible departure.

## 6. Theme config, cookie and `<html>` attributes

`ThemeConfig` (`@infinitunes/types`):

| Field          | Values                                                                      | Default         | Becomes                                             |
| -------------- | --------------------------------------------------------------------------- | --------------- | --------------------------------------------------- |
| `accent`       | preset name or `#rrggbb`                                                    | `"rose"`        | the six accent custom properties (omitted for rose) |
| `radius`       | 0 to 1.5 (rem, continuous). Presets `RADIUS_PRESETS` = 0, 0.3, 0.5, 0.75, 1 | `0.75`          | `--radius`                                          |
| `font`         | `"system" \| "rounded" \| "grotesk" \| "serif" \| "mono"`                   | `"system"`      | `data-font`                                         |
| `headingFont`  | `"display" \| "system" \| "rounded" \| "grotesk" \| "serif" \| "mono"`      | `"display"`     | `data-heading-font`                                 |
| `textSize`     | `15 \| 16 \| 17 \| 18` (px)                                                 | `16`            | `--text-scale` (size / 16)                          |
| `density`      | `"comfortable" \| "compact"`                                                | `"comfortable"` | `data-density`                                      |
| `glass`        | `"liquid" \| "subtle" \| "solid"`                                           | `"liquid"`      | `data-glass-level`                                  |
| `ambient`      | boolean                                                                     | `true`          | `data-ambient="on" \| "off"`                        |
| `reduceMotion` | boolean                                                                     | `false`         | `data-motion="reduced" \| "full"`                   |

Light, dark and system mode stay with `next-themes` (`useTheme()`), which toggles the `dark` class on `<html>`.

`<html>` always carries `data-density`, `data-glass-level`, `data-ambient`, `data-motion`, `data-font`, `data-heading-font`. Style against them with attribute selectors in CSS (`[data-density="compact"]`), or read the matching tokens (`--row`, `--art`) instead of branching. Glass units read `data-glass-level` and `data-ambient`; the engine defines no glass tokens.

Mockup class to attribute: `html.glass-subtle` is `[data-glass-level="subtle"]`, `html.glass-off` is `[data-glass-level="solid"]` (the config calls it Solid), `html.no-ambient` is `[data-ambient="off"]`, `html.compact` is `[data-density="compact"]`, `html.reduce-motion` is `[data-motion="reduced"]`. `glass.css` should key off those attributes. It must not redefine tokens this file owns: `--ambient`, `--line`, `--fill`, `--fill-2`, `--scrim`, `--radius`, `--r-*`, `--ctl*`, `--row`, `--art`.

Cookie: `theme-config`, JSON with only the non-default fields (`{}` is never stored), one year, `sameSite=lax`, readable by script (not `httpOnly`; it holds only appearance preferences), plus a derived `html` field (`{a: attributes, s: variables}` from `themeConfigToHtml`, written by `lib/theme/cookie.ts`) that the pre-paint script applies; `parseThemeConfig` ignores it. It is user controlled: `normalizeThemeConfig` validates every field independently, falls back to the default per field, never throws, and rejects prototype keys. Cookies written by the old appearance page (`{"theme":"violet","radius":0.5}`) still migrate to `accent: "violet"`. Every value that reaches `<html>` comes from the validated config; nothing from the cookie is interpolated.

Rendering and caching: the root layout is static and never reads the cookie. It renders the default attributes on `<html>`; `THEME_BOOTSTRAP_SCRIPT` (`lib/theme-script.ts`, allowed by hash in `lib/csp.ts`) applies the cookie's `html` field before first paint, and `ThemeConfigProvider` reads the same cookie in the browser (`lib/theme/stored.ts`) for the settings UI. A cookie saved before the `html` field existed is applied by the provider after hydration (one-time flash until the next save). To run more state before paint, add a step to `STEPS` in `lib/theme-script.ts`.

## 7. Fonts

| `font` / `headingFont`   | Face                      | Variable                | Notes                                         |
| ------------------------ | ------------------------- | ----------------------- | --------------------------------------------- |
| `system`                 | Inter (variable)          | `--font-inter`          | default interface font, system stack fallback |
| `rounded`                | Nunito (variable)         | `--font-nunito`         |                                               |
| `grotesk`                | Hanken Grotesk (variable) | `--font-hanken-grotesk` | clean grotesque                               |
| `serif`                  | Source Serif 4 (variable) | `--font-source-serif`   |                                               |
| `mono`                   | JetBrains Mono (variable) | `--font-jetbrains-mono` |                                               |
| `display` (heading only) | Cal Sans                  | `--font-cal-sans`       | default heading font                          |

All via `next/font` (self-hosted, `display: swap`, Latin subset, one variable file per face, so no unused weights). Only Inter, Cal Sans and Noto Sans Devanagari are preloaded; the other faces are declared and downloaded the first time they render. `data-font` and `data-heading-font` map the face onto `--font-sans` and `--font-heading` in `globals.css`, so a switch re-renders nothing. `font-sans` and `font-heading` always append the Devanagari face and the generic fallbacks. For previews use `FONT_FACES[id].family` (`lib/theme/fonts.ts`) as `font-family`.

Text size: `html { font-size: calc(100% * var(--text-scale, 1)) }`. It respects the browser's own default size and scales every rem.

## 8. Controls (`~/lib/control-styles`)

`controlStyles` classes read `--ctl` and `--ctl-lg`, so there is no `pointer-coarse:` height in any class. They use the variable form (`h-(--ctl)`) on purpose: `cn()` (tailwind-merge) resolves conflicts only for classes it knows, so it replaces a shadcn button's own `h-9` and `rounded-md` with these but would keep both next to `h-ctl`. Use `controlStyles`, and compose with `cn()`.

| Key                 | Pointer | Coarse | Tap area (coarse) | Use                                                         |
| ------------------- | ------- | ------ | ----------------- | ----------------------------------------------------------- |
| `text`              | 32px    | 40px   | 40px              | buttons, selects, segmented items (`px-3.5`, `rounded-ctl`) |
| `textLg`            | 36px    | 44px   | 44px              | form submit, dialog confirm, retry (`px-4.5`)               |
| `headerIcon`        | 32px    | 40px   | 44px              | header and toolbar icon triggers                            |
| `rowIcon`           | 32px    | 40px   | 44px              | icon buttons inside rows                                    |
| `hero`              | 36px    | 44px   | 44px              | hero Play and its text companions (`px-5`)                  |
| `heroIcon`          | 36px    | 44px   | 44px              | hero icon-only companions                                   |
| `transport`         | 32px    | 40px   | 44px              | previous, next, shuffle, repeat                             |
| `transportPlayMini` | 40px    | 40px   | 44px              | mini player Play                                            |
| `transportPlay`     | 56px    | 56px   | 56px              | expanded player Play                                        |

Icon-only keys grow an invisible `::after` hit area to 44px on coarse pointers (`pointer-coarse:after:-inset-0.5`) and set `relative`; keep that in mind for absolutely positioned icon buttons. Text controls at 40px are below 44px on touch; use `textLg` or `hero` for primary touch actions.

## 9. Accessibility signals (inherited through tokens)

| Signal                                              | Effect                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `prefers-reduced-motion: reduce`, or `reduceMotion` | `--duration-*` become 0.01ms, animations and transitions collapse, no smooth scroll                                                  |
| `prefers-contrast: more`                            | `--line` and `--border` stronger, `--muted-foreground` darker (light `#4a4a4f`, dark `#c0c0c6`), all text pairs still at least 4.5:1 |
| `prefers-reduced-transparency: reduce`              | `--ambient` is halved. Glass tokens are flipped by `glass.css`. Tailwind variant `reduced-transparency:` is available                |
| `pointer: coarse`                                   | `--ctl`, `--ctl-lg`, `--row`, `--art` grow (section 3). Tailwind variant `pointer-coarse:`                                           |

Use Tailwind's `motion-reduce:`, `contrast-more:` and the added `reduced-transparency:` variants for one-off cases; prefer tokens.

## 10. Public API

Types (`@infinitunes/types`): `ThemeConfig`, `FontId`, `HeadingFontId`, `TextSize`, `Density`, `GlassLevel`; lists `FONT_IDS`, `HEADING_FONT_IDS`, `TEXT_SIZES`, `DENSITIES`, `GLASS_LEVELS`, `RADIUS_PRESETS`, `RADIUS_MAX_REM`.

Client hook (`~/hooks/use-theme-config`, client components only):

```ts
const { config, update, reset, isDefault, isSaving } = useThemeConfig();
update({ accent: "blue" }); // page changes immediately, saved ~300ms after the last change
update({ radius: 12 / 16 }); // slider: call on every tick; saves are debounced
update({ accent: "#3a7bd5", density: "compact" });
reset(); // all defaults, clears the cookie
```

`config` is the on-screen config (persisted plus unsaved); `update(patch)` validates the merge, applies it to `<html>` before paint with no reload and no `router.refresh()`, and persists in the background. A failed save shows a toast and leaves the page as the user set it. The hook needs `ThemeConfigProvider`, mounted once in `components/provider.tsx` (it reads the saved cookie in the browser; the static layout has no request).

Server and shared modules:

| Export                                                                                                                             | From                                  | Purpose                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `saveThemeConfig(input: unknown): Promise<void>`                                                                                   | `~/lib/theme/actions` (server action) | validates, writes or clears the cookie. The hook calls it; call it directly only from server code |
| `DEFAULT_THEME_CONFIG`, `normalizeThemeConfig`, `parseThemeConfig`, `serializeThemeConfig`, `isDefaultThemeConfig`, `THEME_COOKIE` | `~/lib/theme-config`                  | pure, safe in client code                                                                         |
| `themeConfigToHtml(config)`, `applyThemeConfig(element, config)`, `resolveAccentHex(accent)`                                       | `~/lib/theme/html`                    | the `<html>` mapping used by the cookie writer and the provider                                   |
| `deriveAccentTokens(hex)`, `accentVariables(tokens)`, `AA_CONTRAST`, `SURFACES`                                                    | `~/lib/theme/accent`                  | accent derivation                                                                                 |
| `normalizeHex`, `contrastRatio`, `colorLuminance`, `hexToOklch`                                                                    | `~/lib/theme/oklch`                   | colour math                                                                                       |
| `themes` (`{ name, label, hex }[]`), `DEFAULT_ACCENT`                                                                              | `~/config/themes`                     | accent presets for swatches                                                                       |
| `FONT_FACES`                                                                                                                       | `~/lib/theme/fonts`                   | label and `font-family` per font id, for previews                                                 |
| `THEME_COLOR`                                                                                                                      | `~/lib/theme-color`                   | background hex per scheme (status bar colour)                                                     |
| `controlStyles`                                                                                                                    | `~/lib/control-styles`                | control sizes                                                                                     |

Building the Appearance page: swatches from `themes` plus a colour input (`update({ accent: value })`), radius presets from `RADIUS_PRESETS` plus a 0 to 24 slider (`px / 16`), font pickers from `FONT_IDS` and `HEADING_FONT_IDS` previewed with `FONT_FACES[id].family`, `TEXT_SIZES`, `DENSITIES`, `GLASS_LEVELS`, two switches, and a reset button wired to `reset()` and disabled when `isDefault`. Light, dark and system stay with `useTheme()`.

Status bar colour: `<meta name="theme-color">` is `THEME_COLOR` per scheme (`#f5f5f7`, `#0b0b0c`) and `ThemeColorSync` keeps it equal to the rendered `--background` when the in-app mode differs from the OS.

## 11. App-wide base changes to expect

These apply to every page the moment this lands, so visual checks should expect them: body text is 14px (`0.875rem`, line-height 1.45, tracking -0.003em); `h1` to `h3` use the heading font; at the default radius `rounded-md` grows from 8px to 12px, `rounded-lg` from 10px to 18px and `rounded-xl` from 14px to 24px (shadcn cards, dialogs and buttons follow); a global 2px `:focus-visible` outline in the accent colour; `--muted-foreground` is `#66666b`; the accent is rose instead of violet; the sidebar background is the page background instead of a muted fill.

## 12. Rules for adding tokens

Add to `globals.css` (plain `:root` and `.dark`), map to Tailwind in `@theme inline` only when a utility is wanted, document it here, and keep contrast tests green. Do not create per-component colours. If a token you need is missing, list it under "Needs shared change" in your report.

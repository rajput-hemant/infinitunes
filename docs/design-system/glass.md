# Liquid Glass

The shared glass material (Phase 1) for floating panels, dialogs, and tools.

## Public API

### React Components

**`GlassSurface`** (`apps/web/components/glass/glass-surface.tsx`)
A `div` wrapper that sets up glass attributes and handles pointer interactions.

- `variant` (`"regular" | "clear" | "tinted"`, default `"regular"`)
- `size` (`"s" | "m" | "l" | "xl"`, default `"m"`)
- `lens` (`"on" | "off"`, default `"on"`)
- `interactive` (`boolean`): if true, enables press gel illumination on click.

**`GlassFilters`** (`apps/web/components/glass/glass-filters.tsx`)
A hidden SVG definitions component. MUST be rendered exactly once in the root layout.

### React Hooks

**`useGlassLens(ref, { size, magnify, off })`**
A client hook that tracks element dimensions via ResizeObserver, dynamically computes and injects a generated displacement+specular SVG filter for real-time background refraction. It handles graceful degradation based on system capabilities and prefers-reduced-transparency/motion settings.

### HTML Attributes

- `data-glass="regular|clear|tinted"`
- `data-glass-size="s|m|l|xl"`
- `data-lens="off"` (to opt-out of refraction explicitly)

### CSS Variables

Generated and applied to `<html>` via the Theme Engine:

- `--glass-tint`
- `--glass-blur`
- `--glass-refraction`
- `--glass-sat`
- `--glass-spec`
- `--glass-shadow`
- `--ambient`

Set internally per-element: `--g-lens-url`, `--g-press`, `--g-px`, `--g-py`.

## Usage Rules

**Allowed:** Floating UI (Sidebar, Queue panels, Menus, Dialogs, Command palette, Toasts, Tab bars).
**Forbidden:** Content cards, table rows, rank badges, auth artwork panels, or nested glass inside glass.

## Fallbacks & Accessibility

- **No Lens / Browser incapable:** Uses frosted backdrop-filter CSS with tint, blur, rim, and shadows.
- `prefers-reduced-transparency: reduce`: Lens off, clear dim tweaks.
- `prefers-contrast: more`: No backdrop-filter, explicit solid background and border.
- `prefers-reduced-motion: reduce`: No spring animations.

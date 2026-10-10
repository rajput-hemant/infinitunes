# UI quality and responsive layout

Last live proof: 2026-10-10, [skill-verify record](../../../../docs/verification/skill-verify-2026-10-10.md). Signed-in 320, 200% zoom (640x400), 1920 and 390 light forced colors; the rest of the sweep is in earlier records. Issues: ISSUE-017, ISSUE-019 in [verification-issues.md](../../../../docs/archive/verification-issues.md).

## Sub-features

- Responsive shell: sidebar (`Toggle Sidebar`), mobile nav, mobile search, player bar and queue sheet.
- Light and dark themes, theme presets, Tailwind CSS v4.
- Overlays: auth modal, search dialog, add-to-playlist dialog, queue sheet, dropdowns, drawers on mobile.
- Accessibility handles: labelled icon buttons listed in [../SKILL.md](../SKILL.md); inputs use `sr-only` labels.
- Source-level layout guards exist as unit tests (`root-shell-layout`, `sidebar-inset-layout`, `slider-card`, `auth-form-sizes`, `orientation-attributes`); they check class names, not rendering.

## How to get to it (user POV)

Every route, at 390px and 1280px, in light and dark.

## Driving it with browser skill (pending)

1. For each route in [README.md](README.md) check at 390px and 1280px, light and dark: no horizontal overflow, no clipped text, readable contrast, visible focus rings.
2. Tab through header, sidebar, player and dialogs; expect logical order, Esc closing overlays, focus returning to the trigger.
3. Check loading skeletons, empty states and error pages for layout shift.
4. Check touch targets on the player at 390px, and that the queue sheet and menus do not trap scroll.
5. Capture screenshots under `docs/evidence/<run-id>/`.

Observable end state: documented per-route evidence; defects go to the ledger, not into this file.

## Gotchas

- Overflow and spacing regressions came from Tailwind 4 class semantics before (Separator width); expect more of the same kind.
- No Tailwind 3 baseline exists, so judge against intent, not pixel parity.

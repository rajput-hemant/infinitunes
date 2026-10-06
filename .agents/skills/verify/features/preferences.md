# Appearance and preferences

**DRAFT. Last live proof: none.** Issues: ISSUE-017, ISSUE-019 in [verification-issues.md](../../../../docs/archive/verification-issues.md).

## Sub-features

- Theme toggle in footer (`Toggle Light Mode`, `Toggle System Mode`, `Toggle Dark Mode`) and `next-themes`.
- `/settings/appearance`: theme presets (`config/themes.ts`).
- `/settings/preferences`: language toggle group and stream, download, image quality dropdowns writing localStorage.
- Settings stays accessible to guests.

## How to get to it (user POV)

Footer toggles and the `/settings` side navigation.

## Driving it with browser skill (pending)

1. Toggle light, dark and system; expect `html` class and CSS variables to change and persist after reload.
2. Pick a preset in appearance; expect colors to apply on a content page.
3. Change stream, download and image quality; expect localStorage keys `stream_quality`, `download_quality`, `image_quality` to update and the setting rows to stay aligned (a prior Tailwind 4 overflow bug was fixed here).
4. At 390px and 1280px, expect no horizontal overflow on settings.

Observable end state: choices persist across reload and apply across pages.

## Gotchas

- Tailwind 3 baseline screenshots do not exist, so visual regression versus the old build is unproven (ISSUE-017).

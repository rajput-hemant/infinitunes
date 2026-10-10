# Infinitunes UI migration, phase 2: finish the redesign with Apple Liquid Glass

You are the orchestrator for the second half of the Infinitunes UI redesign. Plan the work, split it across subagents, keep their file ownership disjoint, merge their branches one at a time, and verify everything yourself. Do not trust a subagent's claim that tests pass. Run the gates yourself after every merge.

## 1. Where things stand

Repository: `rajput-hemant/infinitunes` (Bun workspaces + Turborepo, Next.js 16, React 19, Tailwind v4, Base UI/shadcn). Work on branch `task/ui-mockups` (pushed). Read these files first, in this order:

1. `AGENTS.md` (repo rules and sharp edges, including the Next.js 16 note: read `node_modules/next/dist/docs/` before writing routing, caching or cookie code).
2. `docs/design-system/CONTRACT.md` (binding rules for every agent).
3. `docs/design-system/tokens.md` (design tokens, Tailwind utilities, `controlStyles`, `useThemeConfig`, data attributes).
4. `docs/design-system/glass.md` (the glass primitives that exist today).
5. `design-mockups/final/SPEC.md` (numeric spec for every component and breakpoint) and `design-mockups/final/glass-spec.md` (numeric glass spec; the code wins where they differ).

The approved design is the clickable mockup in `design-mockups/final/` (`index.html`, `style.css`, `glass.css`, `glass.js`, `app.js`). Open it with a static server (`python3 -m http.server` from `design-mockups/`, then `/final/index.html`) and use `#/map` for the route list. **The mockup is the source of truth and is read only. Nobody edits `design-mockups/`. Nobody changes the design. Agents implement it.**

Already done and merged on the branch:

- Token layer and theme engine (accent derivation with WCAG AA, radius, fonts, density, text size, ambient, reduce motion, cookie driven, no flash).
- All 11 UI units restyled to the mockup: shell (collapsible sidebar, tablet rail, phone tab bar), player (bar, pill, expanded view, collapsible docked queue), controls, home shelves, catalog, detail header and song list, detail pages, search palette and results, library, settings (full Appearance customizer), auth pages and error pages.
- Glass phase 1: `GlassSurface`, `GlassFilters`, `useGlassLens`, a pure displacement/specular engine in `apps/web/lib/glass/`, `apps/web/styles/glass.css`, and `glassTuning` in the theme config.
- Gates are green: `bun run fmt:check`, `bun run lint`, `bun run type-check`, `bun run test` (plain, then mocked, then dom), `SKIP_ENV_VALIDATION=true bun run build`.

What is NOT done (this is your scope):

1. Liquid Glass is built but not applied anywhere. `GlassFilters` is not mounted. No component uses `GlassSurface`.
2. The app glass is much smaller than the mockup glass (`apps/web/styles/glass.css` is about 300 lines, mockup `glass.css` about 20 KB, engine 250 lines vs `glass.js` 35 KB). Features missing or simplified: pointer-driven specular rim angle, press "gel" interaction, droplet lens, artwork-sampled adaptive tint, tab bar minimize on scroll, scroll-edge effect, materialize animation, thickness by size, and the full set of accessibility overrides.
3. Settings glass sliders (transparency, blur, refraction, saturation, highlight, shadow, Regular/Clear/Tinted, tint follows accent, ambient level) are built in `LiquidGlassSettings` but not rendered, because `appearance-settings.tsx` does not pass the `tuning` prop yet.
4. Branch divergence: `origin/migration/bun-monorepo` has 7 commits that `task/ui-mockups` lacks (static root layout with hash CSP, Cache Components public catalog cache, shared DB seed). They must be merged. The root layout will conflict, because the redesign reads the theme cookie there and `cookies()` makes a route dynamic. Resolve this deliberately (see work package 1).
5. Gaps against the mockup that were deferred: detail header Shuffle and Share buttons, the header band bleeding under the toolbar, Browse tiles page (the route currently redirects home), search palette "Go to" group and the full-screen phone palette, home hero and quick-pick tiles where data exists, toolbar scroll-title fade.
6. A code quality pass over every component touched by the redesign (see section 5).

## 2. Research first (mandatory, before any implementation)

Do not start implementing glass until the research note exists. Have one Sonnet agent produce `docs/design-system/liquid-glass-research.md` (max 200 lines) from primary sources:

- Apple Human Interface Guidelines "Materials" and "Liquid Glass" pages; WWDC25 sessions "Meet Liquid Glass", "Get to know the new design system", "Build a SwiftUI app with the new design" (transcripts).
- css-tricks "Getting clarity on Apple's Liquid Glass" and the best web recreations of lensing (SVG `feDisplacementMap` plus `backdrop-filter: url()`, signed distance field maps, specular rims), including their browser support limits.
- The Apple "iOS 26 Liquid Glass UI Kit" Figma community file for the visual target (vivid colour behind glass, bright 1px rim lit from top left, soft shadow, gel-like pills and circles).

The note must state: the three layers (lens, highlight, shadow/illumination), Regular vs Clear vs Tinted, where glass is allowed (navigation layer only: sidebar, toolbar, tab bar, player, queue pane, menus, popovers, dialogs, sheets, toasts, segmented controls, palette) and forbidden (content cards, rows, text blocks, glass on glass), concentric radii, scroll-edge effect instead of dividers, vibrancy and legibility rules, motion (springs, interruptibility, materialize), accessibility (reduce transparency, increase contrast, reduce motion, forced colors), and a gap table comparing the app's current glass against `design-mockups/final/glass.css` and `glass.js`, feature by feature. That table drives work package 2.

## 3. Work packages, models and advisors

Claude Code Desktop only offers Claude models. Use the cheapest model that can do the job. Haiku does mechanical, well specified restyling and cleanup. Sonnet does design-sensitive and cross-file work. Opus is only an advisor, never an executor, unless a Sonnet agent fails twice. Give every executor an advisor through the native Advisor tool, and tell it to call the advisor before committing to an approach on consequential choices and before declaring done. Pairs: Haiku executor with Sonnet advisor; Sonnet executor with Opus advisor. Never use Haiku for a review.

| WP | Scope | Executor | Advisor | Depends on |
|----|-------|----------|---------|------------|
| 0 | Research note and glass gap table | Sonnet | Opus | none |
| 1 | Merge `origin/migration/bun-monorepo` into `task/ui-mockups`, resolve the layout conflict | Sonnet | Opus | none |
| 2 | Glass engine parity with the mockup, mount `GlassFilters`, ambient layer | Sonnet | Opus | 0, 1 |
| 3 | Apply glass to the shell: sidebar, rail, toolbar, phone tab bar | Haiku | Sonnet | 2 |
| 4 | Apply glass to the player: bar, pill, expanded view, docked and floating queue | Sonnet | Opus | 2 |
| 5 | Apply glass to overlays: every menu, popover, dropdown, dialog, sheet, select, tooltip, toast, command palette | Haiku | Sonnet | 2 |
| 6 | Settings: wire `LiquidGlassSettings` tuning and the live preview to the real `GlassSurface` | Haiku | Sonnet | 2 |
| 7 | Deferred mockup gaps (section 1, item 5) | Haiku | Sonnet | 3, 4 |
| 8a-8f | Code quality sweeps, one per area (section 5) | Haiku | Sonnet | after the area's glass work |
| 9 | Visual QA against the mockup and fix list | Sonnet | Opus | all above |
| 10 | Independent review of the final diff, three parts | Sonnet (fresh session per part) | none | 9 |

Run WP0 and WP1 in parallel. Run WP3 to WP6 in parallel after WP2 merges. Create one git worktree per subagent from the current head of `task/ui-mockups`, named `ds2-<wp>` on branch `task/ds2-<wp>`. Merge sequentially with `git merge --no-ff`, run the gates after each merge, then delete the merged branch and worktree immediately. Never force push. Do not push anything except `task/ui-mockups` unless told to.

### Ownership (prevents merge conflicts)

Each agent edits only the paths listed for its work package. Unlisted files are frozen for that agent. If an agent needs a change in a file it does not own, it reports it as "Needs shared change" with the exact edit, and you apply it centrally.

- WP2: `apps/web/styles/glass.css`, `apps/web/components/glass/**`, `apps/web/lib/glass/**`, `apps/web/app/layout.tsx` (mount `GlassFilters` and the ambient layer only), glass tests, `docs/design-system/glass.md`.
- WP3: `apps/web/components/sidebar.tsx`, `apps/web/components/site-header/**`, `apps/web/components/site-footer/**`, `apps/web/app/(root)/layout.tsx`.
- WP4: `apps/web/components/player.tsx`, `player-wrapper.tsx`, `expanded-player.tsx`, `queue.tsx` and their tests.
- WP5: `apps/web/components/user-dropdown.tsx`, `share-options.tsx`, `share-submenu.tsx`, `song-list/more-button.tsx`, `details-header/more-button.tsx`, `components/search/**`, `components/library/**` (dialogs), `components/playlist/**` (dialogs), `app/@modal/**`, and any app-level wrapper around shadcn overlays. The shadcn components in `packages/ui` are never edited; glass reaches them through the `data-slot` selectors in `glass.css`.
- WP6: `apps/web/app/(root)/settings/**`.
- WP7: `apps/web/components/details-header/**` (not more-button), `apps/web/components/play-button.tsx`, `apps/web/app/(root)/page.tsx`, `apps/web/app/(root)/_components/**`, `apps/web/app/(root)/browse/**`, `apps/web/components/skeletons/**`.
- WP8: only the files of its area, and only for cleanup. If a WP3 to WP7 agent has not merged yet, wait.

## 4. Implementation rules for Liquid Glass

- Follow the mockup closely: sizes, radii, tint, blur, refraction scale, rim and shadow values come from `glass-spec.md` and `design-mockups/final/glass.css`. Do not invent values. Do not restyle anything the mockup does not restyle.
- Glass only on the navigation layer. Never on content cards, rows or prose. Never nest glass inside glass. A menu opened from a glass toolbar is its own surface, not a child of the toolbar.
- Use only the primitives from `apps/web/components/glass/**` and the `data-glass` attributes. No hand-rolled `backdrop-filter` anywhere else.
- Refraction (SVG lens) only where `backdrop-filter: url()` works (Chromium). Elsewhere the frosted fallback must still look clearly like glass: bright rim, saturation, tint. Keep `?lens=0` and `?lens=1` working for testing.
- Honor `prefers-reduced-transparency`, `prefers-contrast: more`, `prefers-reduced-motion` and the in-app Glass level (liquid, subtle, solid) and tuning sliders. Text on glass must keep WCAG AA contrast.
- The ambient colour field behind glass (blurred artwork or gradient) is what makes glass visible. It must exist at default settings, controlled by the ambient setting.
- The queue pane, player bar, expanded player, tab bar, toolbar, sidebar and all overlays render as siblings or portals such that a `backdrop-filter` on one never breaks the fixed positioning of another.

## 5. Code quality (applies to every component any agent touches)

Many components were restyled by different agents. Clean them up without changing behavior.

- Strict TypeScript. No `any`, no `as unknown as`, no non-null assertions to silence errors, no casts that hide a real type issue. Named prop types, discriminated unions instead of piles of booleans.
- Server Components by default. `"use client"` only for real interactivity, as low in the tree as possible. Pages stay Server Components that fetch through `api.<router>.<procedure>` from `~/lib/trpc/server`; keep `cache()` wrappers shared by `generateMetadata` and the page body.
- One responsibility per file. Split files that are long or mix concerns. No barrel files in `apps/web/components`. Delete dead code, unused exports and dead classes. No commented-out code.
- Tokens and utilities only: no raw hex, rgb or oklch outside token definitions, no arbitrary pixel values where a token or utility exists, no inline `style` unless a value is dynamic. Control sizes come from `controlStyles` in `~/lib/control-styles`. Compose classes with `cn()`.
- Effects only for synchronizing with external systems. Derive state during render. Avoid effects that set state from props.
- Comments only for a non-obvious reason the code cannot show. No narration. No em dashes or en dashes in code, comments or copy.
- Accessibility is part of done: roles and names, visible `:focus-visible`, `aria-expanded` for disclosure toggles and `aria-pressed` only for true toggles, `aria-current` for navigation, 44px touch targets on coarse pointers, live regions only where useful.
- Tests assert behavior, not class strings. Add a test for any new logic. Update tests you break. Keep tests in `apps/web/tests/`, `tests/mocked/` (process isolated `mock.module`) and `tests/dom/` (happy-dom). Do not add a testing library; render with `react-dom/client` and `act` as the existing dom tests do.
- Known review findings to fix during the sweeps: queue docked state is read from localStorage after first paint above 1440px, causing a layout jump (apply the state before paint, for example with a small blocking script or a cookie read on the server, after reading the Next 16 docs); search palette options are `Link`s with `role="option"` (evaluate a button or listbox pattern); the `/me` and settings links, skeletons and loading states must match the final layout with no shift.
- Known false positives, do not "fix": `rounded-md` default on `ImageWithFallback` is correct for covers; Tailwind v4 `@container` already sets the container type; `LikeButton` already sets `aria-pressed`.

## 6. Verification you must do yourself

After every merge run, from the repo root, each once (wrap in `heavy bash -c "..."` if the `heavy` wrapper exists, otherwise run one heavy command at a time):

```
bun run fmt:check
bun run lint
bun run type-check
bun run test
bun run test:mocked
bun run test:dom
SKIP_ENV_VALIDATION=true bun run build
```

`bun run test` stops at the first failing stage, so run the three test scripts separately when something fails. All must pass with zero lint warnings.

Visual QA (WP9, one dev server at a time, on a unique port): start Postgres (`docker-compose.yml`) if available, run `bun run dev`, and compare each route against the mockup at 390, 768, 1280, 1440 and 1920 px, light and dark, with the default accent and one other accent, glass levels liquid, subtle and solid, and with `?lens=0`. Routes: home, browse, albums, chart, album, playlist, mix, song, artist, label, radio, show, episode, search and results, me tabs, user playlist, settings (all three pages), login, signup, forgot and reset password, 404, error. Also test: sidebar collapse and persistence, queue open and close and `q`, phone tab bar and sheets, palette keyboard use, theme customizer live apply and reset, reduced motion, reduced transparency, increased contrast, and forced colors. Local verification of the DES download links needs `NODE_OPTIONS=--openssl-legacy-provider` (see AGENTS.md); do not commit that flag. Produce a parity report with screenshots, list every deviation, and fix or report each one.

Final acceptance: gates green, every route visually matches the mockup, glass is applied to the sidebar, rail, toolbar, tab bar, player (bar, pill, expanded), queue pane, every menu, popover, dropdown, dialog, sheet, select, tooltip, toast and the command palette, the Settings glass sliders work live and persist across reload, fallbacks and accessibility modes are verified, no component in the diff has the quality problems listed in section 5.

## 7. How subagents are briefed

Every subagent brief must contain: its work package and owned paths; the base commit; its model, and its advisor with when to call it; the instruction to read `AGENTS.md`, `CONTRACT.md`, `tokens.md`, `glass.md`, the relevant `SPEC.md` sections and the mockup code for its area before editing; the instruction to read the relevant Next.js docs in `node_modules/next/dist/docs/` and use any available Next.js or React best practices skill before touching Server and Client boundaries, caching or cookies; "never edit `design-mockups/`, never change the design, never edit `packages/ui`, never add dependencies or touch `bun.lock`"; "never run `git checkout`, `switch`, `stash` or `reset` in a shared checkout; work only in your worktree"; the gate commands; and the report format (branch, final commit, files changed, what changed for the user, test results, what was not done, "Needs shared change" entries, under 40 lines).

Triage reviewer output yourself. Verify each finding in the code before acting on it. Dismiss false positives with a reason. Send blockers and majors back as fixes to a fresh agent with the full brief.

## 8. Orchestration lessons from phase 1

- A subagent said all tests passed while one test imported a library that does not exist in this repo. Run the gates yourself.
- Free or small models produce `any` casts, unused imports and narrating comments. Review their diffs for those first.
- When a card or shell component changes width behavior, every call site must be checked (the stretched `SliderCard` bug).
- Do not let two agents edit the same worktree. Do not resume a failed unit on a second agent while the first is still alive.
- Keep each agent's context small: give file pointers, not pasted code.
- Record decisions and deviations in the final report, with who decided and why.

## 9. Final report

Reply with: what you merged (branches and commits), gate results, the parity report summary, deviations from the mockup with reasons, open issues ranked by severity, and the exact next step. Keep it short. Name each principle that shaped a decision.

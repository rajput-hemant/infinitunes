# Design system rollout contract

Every agent working on the rollout reads this file first. It is short on purpose and binding.

## Source of truth

- The target design is the clickable mockup in `design-mockups/final/` (`style.css`, `glass.css`, `glass.js`, `app.js`, `SPEC.md`). Open it over a static server or `file://` and compare against it. Do not edit it.
- Route map for the whole app: open `design-mockups/final/index.html#/map`.
- Tokens and glass primitives are produced by the `theme-engine` and `glass` units and documented in `docs/design-system/tokens.md` and `docs/design-system/glass.md`. Read both before styling anything. Do not invent colors, radii, sizes or shadows. Use tokens and the glass primitives.

## Ownership (what prevents merge conflicts)

- `docs/design-system/ownership.json` assigns every editable file to exactly one unit. Anything not listed is frozen.
- You may edit only files your unit owns. You may create new files only under paths your unit owns.
- Check before you finish and before every commit: `node scripts/design-system/check-ownership.mjs check <unit> <base-sha>`. It must print `ok`.
- If you need a change in a file you do not own (a token, a shared component prop, a frozen file), do not make it. List it under "Needs shared change" in your final report with the exact edit. The orchestrator applies it centrally.
- Never change the exported names, props or behavior of a component you own if another unit imports it. Styling and markup inside the component are yours. A prop change needs a "Needs shared change" entry.

## Branch and worktree

- Create your own worktree from the base sha you were given: `git worktree add ~/.t3/worktrees/infinitunes/ds-<unit> -b task/ds-<unit> <base-sha>`. Work only there. Never touch the main checkout or another unit's worktree.
- `heavy bun install` once inside your worktree. Wrap every heavy command (install, type-check, lint, tests, build) in `heavy bash -c "<cmd>"`. Only one heavy process runs on this machine at a time, so queue patiently and run each once, not in loops.
- Do not start a dev server or a browser. Visual verification happens centrally after merge.
- Commit on your branch with Conventional Commit messages, for example `feat(web): restyle detail header with glass band`. No co-author or attribution trailers. Never `git push`, never open a PR, never merge.

## Code standards (non-negotiable, reviewers enforce them)

- Read `AGENTS.md` at the repo root. Use the Next.js docs in `node_modules/next/dist/docs` and the `vercel-react-best-practices` skill when you have it. Next.js 16, React 19, Tailwind v4.
- Server Components by default. `"use client"` only for real interactivity, as low in the tree as possible.
- Imports: `@infinitunes/ui/components/<name>` for shared UI, `~/*` for app code. No barrel files under `apps/web/components`. Never edit `packages/ui`.
- Styling: Tailwind utilities backed by design tokens. No raw hex, rgb or oklch values, no arbitrary pixel sizes where a token or utility exists, no inline `style` unless a value is dynamic. Control sizes come from `controlStyles` in `~/lib/control-styles`. Compose classes with `cn()`.
- Glass is only for the navigation layer (player, tab bar, toolbar, menus, dialogs, toasts, sidebar, segmented controls). Never put glass on content cards or rows. Never nest glass inside glass. Use the glass primitives from the `glass` unit, not hand-rolled `backdrop-filter`.
- TypeScript strict. No `any`, no `as unknown as`, no non-null assertions to silence errors. Props get named types. Prefer discriminated unions over boolean flag piles.
- Names say what a thing is. One responsibility per file. Delete dead code and dead classes you leave behind. No commented-out code.
- Comments only for a non-obvious reason the code cannot show. No narration. No em dashes or en dashes anywhere in code, comments or copy.
- Accessibility is part of done: visible `:focus-visible`, correct roles and names, 44px touch targets on coarse pointers via `controlStyles`, `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` honored through the tokens.
- Tests: update the tests you break, and add a test for any new logic (not for class strings alone). Test behavior, not implementation. Tests live where `AGENTS.md` says.
- Run before you finish: `heavy bash -c "bunx oxfmt --write <your files>"`, `heavy bash -c "bunx oxlint <your files>"`, `heavy bash -c "bun run --filter @infinitunes/web type-check"`, and the test files you own through the repo's test scripts. Fix everything. Report the exact commands and results.

## Final report format

Reply with: branch name and final commit sha, files changed, what changed for the user, tests run with results, anything you could not do, and "Needs shared change" entries. Do not paste diffs. Keep it under 40 lines.

# TODO

Canonical task index for Infinitunes. Only unfinished work is listed here; completed evidence lives in [migration-acceptance.md](verification/migration-acceptance.md). Source plan: [migration-plan.md](plans/migration-plan.md). Environment baseline: [migration-baseline.md](reference/migration-baseline.md).

## Summary (as of 2026-10-03)

Open items: **41** (each checklist line below carries a `[priority · kind]` tag; the "Triage remaining CONFIRMED items" line is an umbrella and is not counted). Audit method: docs, ledger, verify feature maps and source `TODO` comments were read and every candidate was checked against this branch by reading and grep only; no server, build, browser or test was run. No unchecked item had implementation evidence of being done, so none was ticked. 18 entries were added by this audit; confirmed defects are in the [ledger](verification/verification-issues.md) and linked, not duplicated.

| Kind             | P0  | P1  | P2  | P3  | Total |
| ---------------- | --- | --- | --- | --- | ----- |
| confirmed bug    | 0   | 0   | 3   | 3   | 6     |
| UI regression    | 0   | 0   | 0   | 0   | 0     |
| fix              | 0   | 0   | 4   | 4   | 8     |
| verification gap | 0   | 3   | 2   | 6   | 11    |
| improvement      | 0   | 0   | 1   | 8   | 9     |
| decision needed  | 0   | 1   | 2   | 4   | 7     |
| **Total**        | 0   | 4   | 12  | 25  | 41    |

Priorities: P0 data loss or broken deploy, P1 blocks promotion or a primary path is unproven, P2 user-visible defect or CI/security gap, P3 polish, low risk or coverage. No UI regression is confirmed: the Tailwind 4 overflow regression was fixed (acceptance section 13) and the remaining UI items are design gaps or unverified.

## Collapsible sidebar (2026-10-03)

Done and verified in a browser (Chrome via chrome-devtools-axi, fixture user, shared local DB): icon-rail collapse and expand by toggle click and Enter, tooltips on collapsed items, `aria-expanded` and label flip, `sidebar_state` cookie restored server-side after reload, widths 1024/1280/1440/1920 with no overflow or overlap, 800px and 390px unchanged, light and dark. Evidence: stored under the firstmate home, task infinitunes-collapsible-sidebar.

- [ ] [P3 · verification gap] Space key on the sidebar toggle was not exercised (the driver's synthetic Space did not toggle; Enter did). Native button behavior is expected. Evidence: this run. Status: open.
- [ ] [P3 · improvement] Collapsed "Create Playlist" controls use a native `title` instead of the shared tooltip. Evidence: `apps/web/components/sidebar.tsx`. Status: open.
- [ ] [P3 · improvement] Unused `ListPlus` import in `apps/web/components/sidebar.tsx` (pre-existing, flagged by oxlint). Status: open.
- [ ] [P3 · verification gap] The mobile sheet sidebar has no trigger below `lg` (the navbar trigger is `hidden lg:flex`; mobile uses `MobileNav`). Unchanged by this work. Evidence: 390px run. Status: open.

## Migration promotion (Bun monorepo)

From [migration-acceptance.md](verification/migration-acceptance.md) section 12 and the [plan](plans/migration-plan.md#acceptance-tests):

- [ ] [P1 · verification gap] Finish the authenticated smoke gaps from [section 13](verification/migration-acceptance.md#13-local-smoke-pass-2026-10-02): passkey flow, add-song-to-playlist, queue removal, and the OAuth provider round trip (needs real credentials).
- [ ] [P3 · verification gap] Compare the Tailwind 4 desktop/mobile and light/dark screenshots against a pre-migration Tailwind 3 baseline (only Tailwind 4 captures exist, see section 13).
- [ ] [P2 · verification gap] Verify a Vercel preview built from `apps/web` (routing, static assets, auth callback URLs, external API access, env loading).
- [ ] [P1 · decision needed] Captain decision: promote `migration/bun-monorepo` into `master` (not decided here).
- [ ] [P3 · decision needed] The `dockerfile` was removed in `c663112` (local-dev rework) but `IS_DOCKER` handling remains in `apps/web/next.config.ts` and `turbo.json`, `.dockerignore` names it, and [migration-plan.md](plans/migration-plan.md#acceptance-tests) still lists "Docker build passes" unchecked. Decide whether a Docker image deploy path is supported (restore the file and rebuild) or drop the plumbing and the plan item. Evidence: `git ls-files` shows no dockerfile; [ISSUE-021](verification/verification-issues.md#issue-021) update. Status: open. Uncertainty: the Vercel path may be the only intended deploy.

## Verification (draft)

Partial: a source-grounded DRAFT verification skill and feature map exist ([.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`). Nothing is live-verified; browser automation is paused until the user chooses a browser skill. Issues, hypotheses and gaps are in [verification/verification-issues.md](verification/verification-issues.md).

- [x] Draft skill (launch, doctor, drive, evidence, cleanup) and 14 feature files written from source (no live proof).
- [x] Non-browser checks run 2026-10-02: install, lint, type-check, `bun test` pass; `fmt:check` fails on 14 files ([ISSUE-001](verification/verification-issues.md#issue-001)).
- [ ] [P1 · verification gap] Execute the skill end to end with the chosen browser skill: launch, doctor, drive one feature, retain evidence, cleanup. Until then every feature stays DRAFT.
- [ ] [P1 · verification gap] Browser proof of each feature file, auth first: [email](../.agents/skills/verify/features/auth-email.md), [passkey](../.agents/skills/verify/features/auth-passkey.md), [access control](../.agents/skills/verify/features/access-control.md), [account settings](../.agents/skills/verify/features/account-settings.md).
- [ ] [P2 · verification gap] UI quality pass (390px and 1280px, light and dark, focus order, overlays): [ui-quality](../.agents/skills/verify/features/ui-quality.md).
- [x] Password reset oracle ([ISSUE-007](verification/verification-issues.md#issue-007)), email update validation ([ISSUE-008](verification/verification-issues.md#issue-008)) and profile stubs ([ISSUE-005](verification/verification-issues.md#issue-005)) fixed 2026-10-03.
- [ ] [P2 · fix] Reviewer follow-ups (auth/user router): lowercase email in `resetPasswordSchema` (`packages/auth/src/schemas.ts`) to match stored lowercased emails; assert `password` column is omitted from `updateUser` return value in `packages/trpc/tests/user-router.test.ts`. Audit 2026-10-03: both still open (no `toLowerCase` in `resetPasswordSchema` or `resetPassword`; the `updateUser` tests cover bad email, normalization and conflict but never assert the omitted `password`). Casing part is [ISSUE-024](verification/verification-issues.md#issue-024). Status: open.
- [ ] [umbrella, not counted] Triage remaining CONFIRMED items: formatting, remaining stubs ([ISSUE-003](verification/verification-issues.md#issue-003)), recently played ([ISSUE-004](verification/verification-issues.md#issue-004), needs a decision on where history is stored), reset-password throttling. Individual entries are listed in the next section; this line is kept as the original umbrella and is not counted.

## UI follow-ups (design review 2026-10-03)

Found while polishing library and player. Priority is impact on users; none are confirmed regressions.

- [ ] [P2 · fix] Medium: base-ui `Slider` does not forward `aria-label` to its thumb, so the seek and volume sliders have no accessible name (snapshot shows an unnamed `slider`). Fix through an app wrapper or the `Slider` `thumbProps`/label API; protected shadcn source stays untouched. Evidence: chrome-devtools snapshot at 390px while playing. Uncertain which base-ui prop is supported; check the installed version's docs. Audit 2026-10-03 (source read): `apps/web/components/player.tsx` passes `aria-label="Seek"`/`"Volume"` to `Slider`, and `packages/ui/src/components/ui/slider.tsx` spreads props onto `SliderPrimitive.Root` while its `Thumb` gets no label, so the gap stands. Status: open.
- [ ] [P2 · improvement] Medium: player bar hides loop, shuffle, volume and queue below `lg`, so mobile users cannot reach them (only previous/play/next were exposed in this batch). Needs a design for a mobile expanded player sheet.
- [ ] [P3 · fix] Low: the empty-state "More" button in `components/player.tsx` has no `aria-label`; left alone to avoid overlapping the favorite-state work in the same file. Audit 2026-10-03: still unlabeled at `apps/web/components/player.tsx` (the `<Button size="icon" variant="ghost"><MoreVertical /></Button>` branch). Status: open.
- [ ] [P3 · improvement] Low: no shadcn `Empty` or `Alert` component is installed in `packages/ui`; `components/library/library-section.tsx` composes the existing tokens and `Button` instead. Add them with the shadcn CLI (explicit approval, since it writes to `packages/ui`) and swap the wrapper internals.
- [ ] [P3 · improvement] Low: other pages still repeat the gradient heading and dashed empty-state markup (for example search, settings); reuse `LibraryHeading`/`LibraryEmpty` or extract a general version.
- [ ] [P3 · decision needed] Low: the liked-songs list and the other library tabs have no sort or filter, and no unlike action at the row level on mobile (the heart is desktop only). Needs a product decision.
- [ ] [P3 · verification gap] Low: library `error.tsx` uses `reset()`, which may not re-fetch a failed server component; Next documents `unstable_retry` for that. Check the installed docs and align the app's error boundaries (inherited convention). Uncertain, not reproduced. Audit 2026-10-03: `reset()` is used in `app/error.tsx`, `app/(root)/error.tsx` and `app/(root)/me/(layout-a)/error.tsx`. Status: open.
- [ ] [P3 · fix] Low: partial failures in liked albums/playlists/artists/podcasts render a shorter list with a count that understates the saved total; show a "some items could not load" note. `song.details` failure in liked songs is swallowed with no server-side log.
- [ ] [P3 · improvement] Low: tab label "Your Playlists" differs from the page heading "My Playlists"; pick one. Mobile previous/next are about 32px, below a 44px touch target.
- [ ] [P3 · fix] Non-design: liked songs fetch all ids in one `song.details` call; if upstream rejects one id the whole list fails. Fetch in chunks and tolerate partial results (backend/query logic). Audit 2026-10-03: `app/(root)/me/(layout-a)/liked-songs/page.tsx` calls `song.details({ id: favoriteSongs.songs.join(",") })` once with `.catch(() => undefined)`; the album, artist, playlist and show pages already use `Promise.allSettled`. Status: open.

## Confirmed defects and decisions from the ledger (audit 2026-10-03)

Full reproduction, expected vs actual and evidence live in [verification/verification-issues.md](verification/verification-issues.md); each line links to its entry. Source was read on this branch; no app, build, browser or test was run for this audit.

- [ ] [P2 · fix] Run `bun run fmt` in a formatting-only change so CI `fmt:check` passes. Evidence: [ISSUE-001](verification/verification-issues.md#issue-001), 14 files. Status: open. Uncertainty: count is from the 2026-10-02 run, not re-run here.
- [ ] [P3 · fix] Triage the 47 oxlint warnings and suppress the intentional `import "server-only"` in `packages/trpc/src/index.ts`; remove the unused `currentlyInDev` imports in `apps/web/components/play-button.tsx` and `apps/web/components/details-header/more-button.tsx`. Evidence: [ISSUE-002](verification/verification-issues.md#issue-002). Status: open. Uncertainty: lint not re-run, so the current warning count may differ.
- [ ] [P2 · confirmed bug] Remaining stubbed actions show the in-development toast: `Like` on mix and episode details headers (`components/like-button.tsx` `default:`) and play / add to queue for episode rows (`components/song-list/more-button.tsx`). Evidence: [ISSUE-003](verification/verification-issues.md#issue-003). Status: open. Uncertainty: not reproduced in a browser; radio-station and season headers may also reach the default branch.
- [ ] [P2 · decision needed] `/me/recently-played` is a "coming soon" page that the sidebar still links to; decide where listening history is stored (database table or localStorage) or hide the nav entry. Evidence: [ISSUE-004](verification/verification-issues.md#issue-004), `apps/web/config/nav.ts`. Status: needs-decision.
- [ ] [P3 · confirmed bug] `appRoutes` lists `/playlists` but the route is `/playlist`, so `/playlist/<x>` is not normalized by `proxy.ts` like the other types. Evidence: [ISSUE-006](verification/verification-issues.md#issue-006), `apps/web/config/routes.ts`. Status: open. Uncertainty: user-visible effect not observed; confirm with the `curl` in the ledger first.
- [ ] [P3 · decision needed] Decide whether the `/api/trpc` origin check must reject requests with neither `Origin` nor `Referer` (it currently passes them as same-origin). Evidence: [ISSUE-010](verification/verification-issues.md#issue-010), `apps/web/proxy.ts`. Status: open. Uncertainty: treated as documented intent unless it must act as an authorization control.
- [ ] [P2 · confirmed bug] Public data pages return HTTP 500 when the JioSaavn API or database is unreachable; check which error boundary renders and make the failure graceful. Evidence: [ISSUE-011](verification/verification-issues.md#issue-011) (prior proof, not re-run). Status: open. Uncertainty: `(root)/error.tsx` may already render in a browser.
- [ ] [P3 · confirmed bug] An invalid song token (`/song/x/invalid-token`) renders the generic error page instead of a not-found state. Evidence: [ISSUE-013](verification/verification-issues.md#issue-013) (prior proof, not re-run). Status: open.
- [ ] [P2 · decision needed] Provide a test OAuth app (Google, GitHub) for the provider round trip, callback URLs and the `OAuth Account Not Linked` path, or accept the gap. Evidence: [ISSUE-015](verification/verification-issues.md#issue-015), `.agents/skills/verify/features/auth-oauth.md`. Status: needs-decision.
- [ ] [P3 · confirmed bug] `user.resetPassword` looks the email up as typed while stored emails are lower-cased, so mixed-case input is rejected as "incorrect". Evidence: [ISSUE-024](verification/verification-issues.md#issue-024), `packages/trpc/src/router/user.ts`. Status: open. Uncertainty: read from source, not run. Overlaps the reviewer follow-up above (one fix covers both).
- [ ] [P2 · confirmed bug] `user.resetPassword` is public and has no attempt limit; the only limiter is the optional production proxy limiter. Evidence: [ISSUE-025](verification/verification-issues.md#issue-025). Status: open. Uncertainty: fix shape undecided (throttle, or move behind a session).

## Unverified hypotheses and unexercised coverage (audit 2026-10-03)

Not confirmed defects; each needs a run that has not happened.

- [ ] [P3 · verification gap] Account deletion has no server-side confirmation (`user.deleteUser` checks only the session); confirm over tRPC on a disposable DB, then decide whether recent re-authentication is wanted. Evidence: [ISSUE-009](verification/verification-issues.md#issue-009), `packages/trpc/src/router/user.ts`. Status: needs-browser. Uncertainty: hypothesis.
- [ ] [P3 · verification gap] Raw `&quot;` may still appear in non-song search results and slider cards: `search-results.tsx` and `components/slider/slider-card.tsx` render `title`/`name` without `decode()`, while lists, player, queue and details headers decode. Evidence: [ISSUE-012](verification/verification-issues.md#issue-012). Status: needs-browser. Uncertainty: not observed; upstream may not send entities for those types.
- [ ] [P3 · verification gap] Exercise the 429 rate-limit path and the Upstash integration on a production build with a throwaway Upstash database. Evidence: [ISSUE-020](verification/verification-issues.md#issue-020), `apps/web/proxy.ts`. Status: open.
- [ ] [P3 · verification gap] Radio queue refill (`currentIndex >= queue.length - 3` in `apps/web/components/player.tsx`) was never exercised because headless playback could not advance. Evidence: `.agents/skills/verify/features/radio.md` (marked a retained gap). Status: open. Uncertainty: needs playable audio, so a CDN-reachable run.

## Product

- [ ] [P3 · decision needed] README still labels the app `[WIP]`; as a portfolio showcase, decide when it counts as finished (see [project.md](reference/project.md#purpose)).
- [ ] [P3 · improvement] Deferred seams from the plan (`packages/domain`, `packages/api-client`, `packages/player`) are not extracted; revisit only if a native app is pursued.
- [ ] [P2 · fix] Medium: `username`/`displayUsername` were removed from `packages/db/src/schema.ts` (auth is email-only) but the production columns and the drizzle snapshot still have them, so the next `db:generate` would propose dropping them. Review that diff and keep the columns (or drop them deliberately) before generating. Evidence: schema vs `0000_baseline.sql`. Status: open. Audit 2026-10-03: re-checked, `packages/db/src/schema.ts` and `0003_futuristic_hiroim.sql` do not mention `username`, `0000_baseline.sql` lines 81-91 still create it.
- [ ] [P3 · improvement] `components/playlist/add-to-playlist-dialog.tsx:52` carries `TODO: add image collage` (playlist rows show a generic list icon). Status: open. Uncertainty: cosmetic, no design exists.
- [ ] [P3 · improvement] Sync stale doc statements (docs only, no behavior): `.agents/skills/verify/features/README.md` labels Radio "stubbed" and `player-queue.md` calls `radio_station` play a stub while `radio.md` records live proof and `play-button.tsx` plays stations; `radio.md` says refill at 2 remaining tracks but `radio-research.md` says 3 and the code checks `queue.length - 3`; the [migration-plan.md](plans/migration-plan.md#acceptance-tests) acceptance boxes predate [migration-acceptance.md](verification/migration-acceptance.md#13-local-smoke-pass-2026-10-02) section 13; the ledger header names an old branch and base commit; the README Vercel env table omits `ENABLE_RATE_LIMITING` and `RATE_LIMITING_REQUESTS_PER_SECOND` that `.env.example` and `packages/env/src/schema.ts` define. Status: open. Uncertainty: wording choices belong to the doc owner.

## shadcn source audit (2026-10-03)

`bunx shadcn@latest add <name> --dry-run --diff` (CLI 4.21.1, style `base-nova`, `packages/ui/components.json`) was run for all 24 components in `packages/ui/src/components/ui`; nothing was written, reverted or updated. All differences below predate this task (history in `git log -- packages/ui/src/components/ui`). No automatic upstream update is authorized.

- [ ] [P3 · improvement] Pre-existing, intentional: orientation variants use `data-[orientation=horizontal|vertical]` instead of upstream `data-horizontal|vertical` in `field`, `scroll-area`, `separator`, `slider`, `tabs`, `toggle-group` (commit 27c7c65, 2026-09-26, guarded by `packages/ui/tests/orientation-attributes.test.ts`). Revisit if the installed `@base-ui/react` exposes the `data-horizontal`/`data-vertical` attributes, then upgrade through the CLI with approval.
- [ ] [P3 · improvement] Pre-existing, cosmetic only: import order and wrapping differ from upstream (oxfmt) in `alert-dialog`, `avatar`, `card`, `dialog`, `drawer`, `dropdown-menu`, `input`, `label`, `sheet`, `sidebar`, `sonner`, `toggle-group`, plus formatting-only differences in `accordion`, `badge`, `button`, `navigation-menu`, `skeleton`, `toggle`, `tooltip`. No behavioral change found.
- [ ] [P2 · improvement] `apps/web/instrumentation.ts` (commit a79f088) is ~145 lines and redeclares fixture types (`LocalDevFixture`) and a loopback-host check (`isLoopbackHost`) that already exist in `packages/db/src/fixtures/local-dev-user.ts` and the db package's loopback guard. It should be a tiny `register()` that imports the shared pieces (types and `parseLocalDevFixture`/`getLocalDevFixture`). Evidence: commit a79f088. Status: open.
- [ ] [P2 · improvement] Commit a79f088 also contains unrelated formatter churn (import reordering and reflowed lines) in about 12 files (`apps/web/app/(root)/me/playlist/[id]/page.tsx`, `apps/web/app/(root)/settings/page.tsx`, `apps/web/lib/actions.ts`, `packages/auth/src/auth.ts`, and several `apps/web/tests/*.test.ts` files). Revert-to-minimal is advisable. Evidence: commit a79f088. Status: open.
- [ ] [P1 · fix] `packages/db/tests/fixtures.test.ts` line ~29 hardcodes the fixture password literal in TypeScript; local credentials must not live in any TypeScript file. The test should read the value from `local-dev/fixtures.json`. Evidence: commit a79f088 / source read. Status: open.
- [ ] [P2 · verification gap] Collapsible sidebar (commit 83acad8): Space key toggle not exercised; mobile sheet sidebar open not exercised (no trigger below `lg`); existing unit tests only assert layout source strings. Add behaviour tests covering keyboard (Space/Enter on toggle) and mobile sheet open/close, plus responsive trigger presence. Evidence: stored under the firstmate home, task infinitunes-collapsible-sidebar; captures removed from repo. Tests in `apps/web/tests/` assert source only. Status: open.
- [ ] [P2 · verification gap] Credential logging (`a79f088`) not verified against a production build or full app integration: confirm `register()` skips non-dev/non-loopback correctly, does not crash when `local-dev/fixtures.json` is missing, and prints only in the intended runtime. Evidence: `apps/web/instrumentation.ts` source; no integration/build test run. Status: open.

## Ready to archive once confirmed

Verification/review documents categorized but not archived (not every item is fully captured in TODO.md; confirm before moving to `archive/`):

- `docs/verification/verification-issues.md` (ledger links to TODO items but holds full reproduction, expected/actual, evidence texts, and updates not duplicated here).
- `docs/verification/migration-acceptance.md` (acceptance evidence, environment-only blockers, deferred checks, and section 13 proofs referenced by TODO links but not replicated here).

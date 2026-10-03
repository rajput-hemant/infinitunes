# TODO

Canonical task index for Infinitunes. Only unfinished work is listed here; completed evidence lives in [migration-acceptance.md](migration-acceptance.md). Source plan: [migration-plan.md](migration-plan.md). Environment baseline: [migration-baseline.md](migration-baseline.md).

## Migration promotion (Bun monorepo)

From [migration-acceptance.md](migration-acceptance.md) section 12 and the [plan](migration-plan.md#acceptance-tests):

- [ ] Finish the authenticated smoke gaps from [section 13](migration-acceptance.md#13-local-smoke-pass-2026-10-02): passkey flow, add-song-to-playlist, queue removal, and the OAuth provider round trip (needs real credentials).
- [ ] Compare the Tailwind 4 desktop/mobile and light/dark screenshots against a pre-migration Tailwind 3 baseline (only Tailwind 4 captures exist, see section 13).
- [ ] Verify a Vercel preview built from `apps/web` (routing, static assets, auth callback URLs, external API access, env loading).
- [ ] Captain decision: promote `migration/bun-monorepo` into `master` (not decided here).

## Verification (draft)

Partial: a source-grounded DRAFT verification skill and feature map exist ([.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`). Nothing is live-verified; browser automation is paused until the user chooses a browser skill. Issues, hypotheses and gaps are in [checks/verification-issues.md](checks/verification-issues.md).

- [x] Draft skill (launch, doctor, drive, evidence, cleanup) and 14 feature files written from source (no live proof).
- [x] Non-browser checks run 2026-10-02: install, lint, type-check, `bun test` pass; `fmt:check` fails on 14 files ([ISSUE-001](checks/verification-issues.md#issue-001)).
- [ ] Execute the skill end to end with the chosen browser skill: launch, doctor, drive one feature, retain evidence, cleanup. Until then every feature stays DRAFT.
- [ ] Browser proof of each feature file, auth first: [email](../.agents/skills/verify/features/auth-email.md), [passkey](../.agents/skills/verify/features/auth-passkey.md), [access control](../.agents/skills/verify/features/access-control.md), [account settings](../.agents/skills/verify/features/account-settings.md).
- [ ] UI quality pass (390px and 1280px, light and dark, focus order, overlays): [ui-quality](../.agents/skills/verify/features/ui-quality.md).
- [x] Password reset oracle ([ISSUE-007](checks/verification-issues.md#issue-007)), email update validation ([ISSUE-008](checks/verification-issues.md#issue-008)) and profile stubs ([ISSUE-005](checks/verification-issues.md#issue-005)) fixed 2026-10-03.
- [ ] Triage remaining CONFIRMED items: formatting, remaining stubs ([ISSUE-003](checks/verification-issues.md#issue-003)), recently played ([ISSUE-004](checks/verification-issues.md#issue-004), needs a decision on where history is stored), reset-password throttling.

## UI follow-ups (design review 2026-10-03)

Found while polishing library and player. Priority is impact on users; none are confirmed regressions.

- [ ] Medium: base-ui `Slider` does not forward `aria-label` to its thumb, so the seek and volume sliders have no accessible name (snapshot shows an unnamed `slider`). Fix through an app wrapper or the `Slider` `thumbProps`/label API; protected shadcn source stays untouched. Evidence: chrome-devtools snapshot at 390px while playing. Uncertain which base-ui prop is supported; check the installed version's docs.
- [ ] Medium: player bar hides loop, shuffle, volume and queue below `lg`, so mobile users cannot reach them (only previous/play/next were exposed in this batch). Needs a design for a mobile expanded player sheet.
- [ ] Low: the empty-state "More" button in `components/player.tsx` has no `aria-label`; left alone to avoid overlapping the favorite-state work in the same file.
- [ ] Low: no shadcn `Empty` or `Alert` component is installed in `packages/ui`; `components/library/library-section.tsx` composes the existing tokens and `Button` instead. Add them with the shadcn CLI (explicit approval, since it writes to `packages/ui`) and swap the wrapper internals.
- [ ] Low: other pages still repeat the gradient heading and dashed empty-state markup (for example search, settings); reuse `LibraryHeading`/`LibraryEmpty` or extract a general version.
- [ ] Low: the liked-songs list and the other library tabs have no sort or filter, and no unlike action at the row level on mobile (the heart is desktop only). Needs a product decision.
- [ ] Non-design: liked songs fetch all ids in one `song.details` call; if upstream rejects one id the whole list fails. Fetch in chunks and tolerate partial results (backend/query logic).

## Product

- [ ] README still labels the app `[WIP]`; as a portfolio showcase, decide when it counts as finished (see [project.md](project.md#purpose)).
- [ ] Deferred seams from the plan (`packages/domain`, `packages/api-client`, `packages/player`) are not extracted; revisit only if a native app is pursued.

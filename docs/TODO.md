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
- [ ] Triage CONFIRMED items from the ledger in later ships: formatting, stubs ([ISSUE-003](checks/verification-issues.md#issue-003)), password reset oracle ([ISSUE-007](checks/verification-issues.md#issue-007)), email update validation ([ISSUE-008](checks/verification-issues.md#issue-008)).

## Product

- [ ] README still labels the app `[WIP]`; as a portfolio showcase, decide when it counts as finished (see [project.md](project.md#purpose)).
- [ ] Deferred seams from the plan (`packages/domain`, `packages/api-client`, `packages/player`) are not extracted; revisit only if a native app is pursued.

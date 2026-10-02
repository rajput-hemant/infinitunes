# TODO

Canonical task index for Infinitunes. Only unfinished work is listed here; completed evidence lives in [migration-acceptance.md](migration-acceptance.md). Source plan: [migration-plan.md](migration-plan.md). Environment baseline: [migration-baseline.md](migration-baseline.md).

## Migration promotion (Bun monorepo)

From [migration-acceptance.md](migration-acceptance.md) section 12 and the [plan](migration-plan.md#acceptance-tests):

- [ ] Finish the authenticated smoke gaps from [section 13](migration-acceptance.md#13-local-smoke-pass-2026-10-02): passkey flow, add-song-to-playlist, queue removal, and the OAuth provider round trip (needs real credentials).
- [ ] Compare the Tailwind 4 desktop/mobile and light/dark screenshots against a pre-migration Tailwind 3 baseline (only Tailwind 4 captures exist, see section 13).
- [ ] Verify a Vercel preview built from `apps/web` (routing, static assets, auth callback URLs, external API access, env loading).
- [ ] Captain decision: promote `migration/bun-monorepo` into `master` (not decided here).

## Product

- [ ] README still labels the app `[WIP]`; as a portfolio showcase, decide when it counts as finished (see [project.md](project.md#purpose)).
- [ ] Deferred seams from the plan (`packages/domain`, `packages/api-client`, `packages/player`) are not extracted; revisit only if a native app is pursued.

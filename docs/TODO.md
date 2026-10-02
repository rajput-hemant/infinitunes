# TODO

Canonical task index for Infinitunes. Only unfinished work is listed here; completed evidence lives in [migration-acceptance.md](migration-acceptance.md). Source plan: [migration-plan.md](migration-plan.md). Environment baseline: [migration-baseline.md](migration-baseline.md).

## Migration promotion (Bun monorepo)

From [migration-acceptance.md](migration-acceptance.md) section 12 and the [plan](migration-plan.md#acceptance-tests):

- [ ] Run `docker compose build` and a container smoke run with a Docker daemon available.
- [ ] Run authenticated smoke tests against a non-production database: credentials, OAuth entry points, session persistence, protected pages, playlist mutations, favorites, logout.
- [ ] Run live-data smoke tests: public data pages (`/`, `/search`, `/radio`, `/playlist`, `/me`) returned HTTP 500 without a reachable JioSaavn API and database.
- [ ] Run browser smoke tests (landing, search, album/artist/song, playback, queue, downloads, themes, responsive navigation, dialogs, error pages); needs Chrome.
- [ ] Capture the Tailwind 4 desktop/mobile and light/dark visual comparison.
- [ ] Verify a Vercel preview built from `apps/web` (routing, static assets, auth callback URLs, external API access, env loading).
- [ ] Captain decision: promote `migration/bun-monorepo` into `master` (not decided here).

## Product

- [ ] README still labels the app `[WIP]`; as a portfolio showcase, decide when it counts as finished (see [project.md](project.md#purpose)).
- [ ] Deferred seams from the plan (`packages/domain`, `packages/api-client`, `packages/player`) are not extracted; revisit only if a native app is pursued.

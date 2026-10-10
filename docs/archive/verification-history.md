# Verification history

Condensed record of the 2026-10-02 verification ledger and the migration acceptance report. Issue IDs (`ISSUE-NNN`) are cited by `docs/TODO.md` and by [feature files](../../.agents/skills/verify/features/README.md); current status lives in [TODO.md](../TODO.md). Skill: [.agents/skills/verify/SKILL.md](../../.agents/skills/verify/SKILL.md).

Classes: **CONFIRMED** (evidence named in the entry), **HYPOTHESIS** (suspected, not reproduced), **GAP** (not exercised; neither pass nor failure). "Prior proof" means evidence from the local smoke pass below, not re-run. Issue states: `open`, `closed`, `needs-browser`, `needs-decision`.

## Issue index

| ID                      | Class                   | Sev    | Area                                    | State          |
| ----------------------- | ----------------------- | ------ | --------------------------------------- | -------------- |
| [ISSUE-001](#issue-001) | CONFIRMED               | low    | formatting gate                         | closed         |
| [ISSUE-002](#issue-002) | CONFIRMED               | low    | lint warnings                           | open           |
| [ISSUE-003](#issue-003) | CONFIRMED               | medium | stubbed actions                         | open           |
| [ISSUE-004](#issue-004) | CONFIRMED               | low    | recently played                         | closed         |
| [ISSUE-005](#issue-005) | CONFIRMED               | low    | profile stubs                           | closed         |
| [ISSUE-006](#issue-006) | CONFIRMED               | low    | route list mismatch                     | open           |
| [ISSUE-007](#issue-007) | CONFIRMED               | medium | password reset oracle                   | closed         |
| [ISSUE-008](#issue-008) | CONFIRMED               | medium | email update validation                 | closed         |
| [ISSUE-009](#issue-009) | HYPOTHESIS              | low    | delete account                          | needs-browser  |
| [ISSUE-010](#issue-010) | CONFIRMED               | low    | tRPC origin check                       | open           |
| [ISSUE-011](#issue-011) | CONFIRMED (prior proof) | medium | upstream outage = 500                   | open           |
| [ISSUE-012](#issue-012) | HYPOTHESIS              | low    | HTML entities in titles                 | needs-browser  |
| [ISSUE-013](#issue-013) | CONFIRMED (prior proof) | low    | invalid song token                      | open           |
| [ISSUE-014](#issue-014) | GAP                     | high   | passkey flows                           | needs-browser  |
| [ISSUE-015](#issue-015) | GAP                     | medium | OAuth round trip                        | needs-decision |
| [ISSUE-016](#issue-016) | GAP                     | medium | add-to-playlist, queue removal          | needs-browser  |
| [ISSUE-017](#issue-017) | GAP                     | low    | Tailwind 3 vs 4 baseline                | needs-decision |
| [ISSUE-018](#issue-018) | GAP                     | medium | Vercel preview                          | needs-decision |
| [ISSUE-019](#issue-019) | GAP                     | high   | no browser proof of any feature or UI   | needs-browser  |
| [ISSUE-020](#issue-020) | GAP                     | low    | rate limiting                           | open           |
| [ISSUE-021](#issue-021) | CONFIRMED               | low    | stale process notes                     | closed         |
| [ISSUE-022](#issue-022) | CONFIRMED               | medium | artist "Play Radio" silent failure      | closed         |
| [ISSUE-023](#issue-023) | CONFIRMED               | low    | email login: no client redirect         | closed         |
| [ISSUE-024](#issue-024) | CONFIRMED               | low    | reset password email not lower-cased    | closed         |
| [ISSUE-025](#issue-025) | CONFIRMED               | medium | reset limits are local, production-only | open           |
| [ISSUE-026](#issue-026) | CONFIRMED               | low    | queue lists the same artist twice       | closed         |

## Confirmed

### ISSUE-001

`fmt:check` failed on 14 files (same 14 as the smoke pass noted). Closed 2026-10-03 (C-11): `bun run fmt:check` passes.

### ISSUE-002

Oxlint warnings, no errors (46 web, 1 trpc: `import "server-only"` at `packages/trpc/src/index.ts:3`, intentional). Unused `currentlyInDev` imports were removed in `4eae157`. Revalidation 2026-10-05: web lint exits 0 with 15 warnings, trpc lint clean; `packages/ui/src/components/ui/sidebar.tsx:92` has two `no-shadow` warnings in protected source. Remaining warnings tracked as TC-5.

### ISSUE-003

Visible actions were stubs showing "This feature is currently in development."

- Radio actions: now real JioSaavn station sessions (`api.radio.createStation`/`api.radio.songs`, `activeRadioSessionAtom` in `apps/web/components/player.tsx`); 9 tests in `packages/trpc/tests/radio-router.test.ts`. See [radio-research.md](../research/radio-research.md), [radio.md](../../.agents/skills/verify/features/radio.md).
- Song-row `Add To Favourite` is real (label flips to `Remove From Favourite`, hidden for episodes, sign-in warning when signed out). Browser proof at 390/768/1280px, light and dark: DB `infinitunes_favorite.songs` gained and lost the token, 0 console errors. The playerbar favorite state is plumbed via `getUserFavorites()` in `apps/web/app/(root)/layout.tsx` and `useOptimistic` in `TileMoreButton`. The sidebar playlist-row play stub was removed.
- `currentlyInDev` no longer exists in `apps/` or `packages/` (`4eae157`); no source emits the toast.
- Still to re-verify in a browser before closing: the `components/like-button.tsx` `default:` branch (mix, episode headers) and episode rows in `components/song-list/more-button.tsx` (`play()`, `addToQueue()`). State open.

### ISSUE-004

`/me/recently-played` was a placeholder linked from the sidebar. Closed 2026-10-03: implemented per account (C-60).

### ISSUE-005

Profile form had non-functional `Verify Email` and avatar `Edit` controls. Closed 2026-10-04: controls removed (source review, no browser run).

### ISSUE-006

`appRoutes` in `apps/web/config/routes.ts` lists `/playlists`, but the routes are `/playlist` and `/playlist/[name]/[token]`; `apps/web/proxy.ts` normalizes two-segment paths only for names in that list, so `/playlist/<x>` is not normalized like other types. User-visible effect not observed. Check: `curl -si http://localhost:3417/album/foo` should 307 to `/album`; compare `/playlist/foo`. State open.

### ISSUE-007

Public `user.resetPassword` leaked account existence and acted as a password-guess oracle (distinct errors for unknown email, wrong password, passwordless account; no throttle). Messages unified 2026-10-03 (`packages/trpc/tests/user-router.test.ts`); the procedure was later removed (see ISSUE-025). Closed.

### ISSUE-008

`user.updateUser` accepted any string as email, wrote it directly, returned HTTP 500 with the raw SQL error on duplicates, and returned the bcrypt `password` hash (reproduced 2026-10-03). Fix: `emailSchema` plus lower-casing, unique violation maps to `CONFLICT` "That email is already in use", row omits `password`. Re-run: bad email 400, duplicate 409, valid 200. Not added: re-verification (no email provider). Closed.

### ISSUE-010

The `/api/trpc` origin check in `apps/web/proxy.ts` passes requests with neither `Origin` nor `Referer` (documented server-to-server intent). Browsers always send `Origin` on cross-site POSTs, so the effect is limited to non-browser clients. Low; no follow-up unless it must act as an authorization control. State open.

### ISSUE-011

Public data pages returned HTTP 500 when the JioSaavn API or database was unreachable (`/`, `/search`, `/radio`, `/playlist`, `/me` with placeholder API/DB; 200 with the live API and a local DB). Whether the `(root)/error.tsx` boundary applies is unverified. Re-run with the network cut off. State open (CD-1).

### ISSUE-013

An invalid song token renders the generic error page instead of a not-found state (prior proof). Repro in a browser: `/song/x/invalid-token`. State open.

### ISSUE-021

Stale process notes from the migration report: the Docker-build, live-data and Chrome blockers were superseded by the smoke pass; Bun is pinned to `1.4.2` in `package.json` and `.github/workflows/ci.yml`. The Dockerfile was later removed (`c663112`), so the Docker build proofs describe a file no longer in the tree (tracked in TODO). Closed.

### ISSUE-022

Artist header "Play Radio" created a station but got zero songs and failed silently.

| Item       | Detail                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repro      | `/artist/arijit-singh-songs/LlRWpHzy3Hk_` > More options > Play Radio; `radio.createStation` 200 with `artistId: null`, `radio.songs` returned `[]`, `activeRadio` stayed null                                   |
| Root cause | `apps/web/components/details-header/more-button.tsx` `playRadio()` never received `artistId`/`language`; upstream without `artistId` falls back to `webradio.createFeaturedStation`, a placeholder with no songs |
| Fix        | `details-header.tsx` passes `artistId` and `language` (artist `dominantLanguage`) to `MoreButton`, which forwards them to `createStation.mutate`                                                                 |
| Proof      | Live 2026-10-02: station `...~^~artist_radio~^~459320`, 20 songs queued, `active_radio_session` set; counterfactual with `artistId: "461968"` returned tracks                                                    |
| Test       | `apps/web/tests/details-header-radio.test.ts`                                                                                                                                                                    |

Closed.

### ISSUE-023

After a successful email login the form stayed on `/login` (200 and session cookie set, toast shown, no navigation). Cause: `onSubmit()` in `apps/web/app/(auth)/_components/login-form.tsx` only toasted. Fix: on email and passkey sign-in, read `callbackUrl` (default `/`), then `router.push(asRoute(callbackUrl))` and `router.refresh()`. Live-verified 2026-10-02 (redirected to `/`). Test: `apps/web/tests/login-redirect.test.ts`. Closed.

### ISSUE-024

`user.resetPassword` looked up the email as typed while stored emails are lower-cased (`updateUser` already lower-cased). Closed 2026-10-03: the reset schema lower-cases (C-4).

### ISSUE-025

Better Auth reset limits use per-instance memory and run only in production. The historical public `resetPassword` procedure (no throttle) no longer exists; `packages/trpc/src/router/user.ts` exposes session-protected `changePassword`, anonymous reset uses Better Auth's emailed-token flow. `packages/auth/src/auth.ts` configures reset limits but enables them only in production with no shared storage, and the proxy matcher excludes `/api/auth`, so the optional proxy limiter does not cover them. Source review only. Follow-up under SE-17 and SE-4. State open.

### ISSUE-026

The queue listed one artist several times (for example `Sadhu Tiwari, Sadhu Tiwari`), which also produced duplicate React keys. Cause: upstream `artistMap.artists` has one entry per role with the same id; `toQueue` in `packages/types/src/media.ts` copied it. Fix: `toQueue` keeps one entry per artist id. Test `apps/web/tests/queue-artists.test.ts` (mutation-checked). A queue already in `localStorage` keeps old entries until rebuilt. Closed (C-128).

## Hypotheses

### ISSUE-009

Account deletion has no server-side confirmation: the `DELETE MY ACCOUNT` phrase is enforced only in `profile-form.tsx`; `user.deleteUser` is a `protectedProcedure` with no password or phrase check. Question is whether recent re-authentication is wanted. State needs-browser.

### ISSUE-012

Song titles may show raw `&quot;`. Lists, player bar, queue (`toQueue()` calls `decode()`) and details headers decode, but non-song search results (`search/[type]/[query]/_components/search-results.tsx` into `components/slider/slider-card.tsx`) pass raw `title` and `subtitle`. Test: `apps/web/tests/song-list-decode.test.ts`. Whether upstream titles for those entity types contain entities is not observed. State needs-browser.

## Gaps (unexercised)

| ID                      | Not exercised                                                                                                                                                                          | Needs                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [ISSUE-014](#issue-014) | Passkey enrollment, listing, removal, sign-in ([auth-passkey.md](../../.agents/skills/verify/features/auth-passkey.md)); unit tests cover config and schema only                       | WebAuthn virtual authenticator                        |
| [ISSUE-015](#issue-015) | OAuth round trip (Google, GitHub), callback URLs, `OAuth Account Not Linked` ([auth-oauth.md](../../.agents/skills/verify/features/auth-oauth.md)); only reached the provider redirect | A test OAuth app, or accept the gap                   |
| [ISSUE-016](#issue-016) | Add song to playlist, queue item removal (later verified, see AU-1 in TODO)                                                                                                            | Browser                                               |
| [ISSUE-017](#issue-017) | No Tailwind 3 baseline for comparison with the Tailwind 4 build                                                                                                                        | Render pre-migration `master`, or drop the comparison |
| [ISSUE-018](#issue-018) | Vercel preview built from `apps/web` (routing, assets, auth callbacks, API access, env)                                                                                                | Hosting access                                        |
| [ISSUE-019](#issue-019) | No feature in the verification map had live browser proof; UI quality (responsive, themes, focus, contrast) unproven                                                                   | Browser skill choice                                  |
| [ISSUE-020](#issue-020) | Rate limiting 429 path and Upstash (only active with `ENABLE_RATE_LIMITING=true`, `NODE_ENV=production`, Upstash configured)                                                           | Production build plus a throwaway Upstash database    |

Each gap carries the state shown in the index. ISSUE-014 to ISSUE-016 and ISSUE-019 are needs-browser; ISSUE-015, ISSUE-017, ISSUE-018 are needs-decision; ISSUE-020 is open.

## Migration acceptance (2026-10, branch `fm/infinitunes-final-f2`)

Final pass for the Bun monorepo migration (plan: [migration-plan.md](../plans/migration-plan.md), baseline: [migration-baseline.md](../reference/migration-baseline.md)). No secrets, mutating DB commands, pushes or CI runs.

Compatibility-only changes applied:

| Change                                                             | Why                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `@next/env` as a web devDependency                                 | `drizzle.config.ts` imports it; not resolvable under Bun's layout, broke type-check                      |
| Production-only React Compiler, `jsx: "preserve"`                  | Restored per plan step 4                                                                                 |
| `outputFileTracingRoot`, Turbo `outputs` `.next/**`                | Deterministic standalone tracing; Turbo outputs are package-relative                                     |
| Turbo `globalPassThroughEnv`                                       | Turbo env filtering dropped `SKIP_ENV_VALIDATION` and build/runtime vars                                 |
| Dockerfile builder on `oven/bun`, standalone paths (since removed) | Builder lacked `bun`; monorepo standalone nests `server.js` under `apps/web`                             |
| README Vercel env table aligned to the env schema                  | Stale `NEXTAUTH_*` names                                                                                 |
| Tailwind v4 via `@tailwindcss/upgrade`, `tw-animate-css`           | Codemod output adopted; replaced v3-only `tailwindcss-animate`; `tailwind.config.ts` removed (CSS-first) |

Gates (forced, no cache): frozen install, `fmt:check`, `lint` (43 warnings, 0 errors), `type-check`, `test` all pass. `bun run build` fails without env at validation (designed); with `SKIP_ENV_VALIDATION=true` it compiles and prerenders, including the standalone output. This is source compilation only, not a production certification. Drizzle `generate` (temp dir) and `check` passed with no DB contact and no committed migration modified. Relocation integrity: 230 `src` files, 34 `public` files and 15 migrations unchanged versus master; intentional removals were `.eslintrc`, `.prettierrc`, `.prettierignore`, `bun.lockb`.

Accepted deviation: `BlobPart[]` typing instead of a literal byte copy. Tailwind v4 parity was asserted from the compiled CSS (theme colors, `.dark` variant, `container`, radii, fonts, `tw-animate-css` utilities), not pixel comparison.

## Local smoke pass (2026-10-02)

Disposable local PostgreSQL 17 container (removed afterwards), inert OAuth placeholders, throwaway `AUTH_SECRET`, live public JioSaavn API. This supersedes the earlier Docker, live-data and Chrome blockers.

| Defect                                                                                         | Fix                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `docker compose build` failed: `oven/bun:1.3.14` cannot parse `bun.lock` (`lockfileVersion` 2) | Bun `1.4.2` pinned in the Dockerfile, `package.json` `packageManager`, CI |
| Docker build: `@t3-oss/env-core` not found (per-package `node_modules` not copied)             | Builder copies the whole `deps` stage                                     |
| Settings quality rows overflowed (`Separator` `w-full` beat `w-20` under TW4)                  | `preference-settings.tsx` passes `data-[orientation=horizontal]:w-20`     |

| Check                                                                                                                   | Result                             |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `docker compose build` and container smoke (`/`, `/album`, `/search/song/arijit`, `/login` 200; `/me` 307; `/nope` 404) | PASS                               |
| Live data pages and entity pages                                                                                        | PASS, 200 with real catalogue data |
| Email signup, login, session, protected `/me`, favorite, playlist create, logout                                        | PASS                               |
| OAuth entry points                                                                                                      | PASS to the provider redirect only |
| Chrome browse, search, entity pages, playback, next, queue, download toast, settings, 404/error                         | PASS                               |
| Light/dark, 1280 and 390px screenshots, no horizontal overflow on 16 routes at 390px                                    | PASS                               |

Not proven then: passkeys, add-to-playlist, queue removal, OAuth round trip, Tailwind 3 pixel baseline. Pre-existing: 14 unformatted files (ISSUE-001), raw `&quot;` titles (ISSUE-012), generic error on an invalid song token (ISSUE-013).

## Non-browser check set (2026-10-02, Bun 1.4.2)

`SKIP_ENV_VALIDATION=true`, inert `DATABASE_URL`/`AUTH_SECRET`, no DB or dev server.

| Command                         | Result                                     |
| ------------------------------- | ------------------------------------------ |
| `bun install --frozen-lockfile` | exit 0, 519 packages                       |
| `bun run fmt:check`             | exit 1, 14 files (ISSUE-001, since closed) |
| `bun run lint`                  | exit 0, 0 errors (ISSUE-002)               |
| `bun run type-check`            | exit 0, 7 of 7 tasks                       |
| `bun test --pass-with-no-tests` | exit 0, 181 pass, 3 skip, 0 fail, 31 files |

Docs check at that time: 96 relative links and 3 README images, 0 broken; `.claude/skills/verify` symlinks to `../../.agents/skills/verify`.

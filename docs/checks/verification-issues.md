# Verification issues ledger

Single canonical ledger for Infinitunes verification. Feature files in [.agents/skills/verify/features](../../.agents/skills/verify/features/README.md) link here by ID and do not repeat issue text. Skill: [.agents/skills/verify/SKILL.md](../../.agents/skills/verify/SKILL.md) (DRAFT).

Branch under test: `fm/infinitunes-pstack-verification`, based on `migration/bun-monorepo` @ `80bb29c`. Date: 2026-10-02.

## Classification

- **CONFIRMED**: backed by evidence named in the row (a command run now, a source line read now, or a prior recorded proof, labelled as such).
- **HYPOTHESIS**: suspected from source or history, not reproduced.
- **GAP**: coverage not exercised. A GAP is not a failure and not a pass.

No PASS is claimed for any browser or authenticated behavior. "Prior proof" means evidence recorded by an earlier run in [../migration-acceptance.md](../migration-acceptance.md) section 13; it was not re-run here.

State values: `open`, `closed`, `needs-browser`, `needs-decision`.

## Summary

| ID                      | Class                   | Severity | Area                                          | State          |
| ----------------------- | ----------------------- | -------- | --------------------------------------------- | -------------- |
| [ISSUE-001](#issue-001) | CONFIRMED               | low      | formatting gate                               | open           |
| [ISSUE-002](#issue-002) | CONFIRMED               | low      | lint warnings                                 | open           |
| [ISSUE-003](#issue-003) | CONFIRMED               | medium   | stubbed actions                               | open           |
| [ISSUE-004](#issue-004) | CONFIRMED               | low      | recently played                               | open           |
| [ISSUE-005](#issue-005) | CONFIRMED               | low      | profile stubs                                 | open           |
| [ISSUE-006](#issue-006) | CONFIRMED               | low      | route list mismatch                           | open           |
| [ISSUE-007](#issue-007) | CONFIRMED               | medium   | password reset oracle                         | open           |
| [ISSUE-008](#issue-008) | CONFIRMED               | medium   | email update validation                       | open           |
| [ISSUE-009](#issue-009) | HYPOTHESIS              | low      | delete account                                | needs-browser  |
| [ISSUE-010](#issue-010) | CONFIRMED               | low      | tRPC origin check                             | open           |
| [ISSUE-011](#issue-011) | CONFIRMED (prior proof) | medium   | upstream outage = 500                         | open           |
| [ISSUE-012](#issue-012) | HYPOTHESIS              | low      | HTML entities in titles                       | needs-browser  |
| [ISSUE-013](#issue-013) | CONFIRMED (prior proof) | low      | invalid song token                            | open           |
| [ISSUE-014](#issue-014) | GAP                     | high     | passkey flows                                 | needs-browser  |
| [ISSUE-015](#issue-015) | GAP                     | medium   | OAuth round trip                              | needs-decision |
| [ISSUE-016](#issue-016) | GAP                     | medium   | add-to-playlist, queue removal                | needs-browser  |
| [ISSUE-017](#issue-017) | GAP                     | low      | Tailwind 3 vs 4 baseline                      | needs-decision |
| [ISSUE-018](#issue-018) | GAP                     | medium   | Vercel preview                                | needs-decision |
| [ISSUE-019](#issue-019) | GAP                     | high     | no browser proof of any feature or UI quality | needs-browser  |
| [ISSUE-020](#issue-020) | GAP                     | low      | rate limiting                                 | open           |
| [ISSUE-021](#issue-021) | CONFIRMED               | low      | stale process notes                           | closed         |
| [ISSUE-022](#issue-022) | CONFIRMED               | medium   | artist header "Play Radio" silent failure     | closed         |
| [ISSUE-023](#issue-023) | CONFIRMED               | low      | email login — no client-side redirect         | closed         |

## Confirmed

### ISSUE-001

`fmt:check` fails on 14 files.

- Evidence (run now): `bun run fmt:check` exits 1, "Format issues found in above 14 files" (300 files checked). Files: `apps/web/app/(root)/me/playlist/[id]/page.tsx`, `settings/_components/profile-form.tsx`, `settings/page.tsx`, `components/sidebar.tsx`, `components/song-list/more-button.tsx`, `components/song-list/song-list.tsx`, `lib/actions.ts`, `tests/{proxy,search-menu-dialog,slider-card,song-list-decode,user-dropdown-menu}.test.ts`, `packages/auth/src/auth.ts`, `packages/trpc/tests/favorites-concurrency.test.ts`.
- Reproduce: from the repo root run `bun run fmt:check`.
- Expected: exit 0 (CI runs it first, `.github/workflows/ci.yml`). Actual: exit 1.
- Same count as the prior note in migration-acceptance section 13 ("14 files untouched by this pass"), so no new drift since then.
- Follow-up: run `bun run fmt` in a formatting-only change. Not fixed here (no product or formatting edits in this task).

### ISSUE-002

Oxlint reports warnings, no errors.

- Evidence (run now): `bun run lint` gives `@infinitunes/web` 46 warnings, `@infinitunes/trpc` 1 warning (`import(no-unassigned-import)` at `packages/trpc/src/index.ts:3`, `import "server-only"`), `@infinitunes/types` 0, 0 errors. Several package results were Turbo cache hits, so the totals replay earlier logs for unchanged packages.
- Reproduce: `bun run lint`.
- Expected: no warnings. Actual: 47 warnings. Severity low; the trpc one is intentional and could be suppressed.
- Follow-up: triage warnings, suppress the intentional import.

### ISSUE-003

Several visible actions were stubs that only showed the toast `This feature is currently in development.`.

- Evidence (updated 2026-10-02 on `fm/infinitunes-radio`):
  - **Radio actions resolved**: `playRadio()` in `components/song-list/more-button.tsx`, `playRadio()` in `components/details-header/more-button.tsx`, and `components/play-button.tsx` for `radio_station` are now wired to real JioSaavn web radio station sessions (`api.radio.createStation`, `api.radio.songs`) and endless queue refills via `activeRadioSessionAtom` in `apps/web/components/player.tsx`. Verified via 9 unit/integration tests in `packages/trpc/tests/radio-router.test.ts` (pass). See [radio-research.md](./radio-research.md) and [.agents/skills/verify/features/radio.md](../../.agents/skills/verify/features/radio.md).
  - **Remaining non-radio stubs**: `components/song-list/more-button.tsx` `like()` (menu `Add To Favourite`) and `components/sidebar.tsx:174` playlist-row button still call `currentlyInDev`.
- Reproduce (browser, pending): open an album, `More Options` on a song, click `Add To Favourite`.
- Expected: the action works or the item is hidden. Actual: toast says it is in development for remaining non-radio actions. `Like` on detail headers is real ([favorites](../../.agents/skills/verify/features/favorites.md)); the song-row item is not.
- Follow-up: implement or remove remaining non-radio stubs. State remains open for the remaining stubs.

### ISSUE-004

`/me/recently-played` renders a static "Under development" page, yet the sidebar links to it.

- Evidence (source): `apps/web/app/(root)/me/(layout-a)/recently-played/page.tsx` returns a `Construction` placeholder; `apps/web/config/nav.ts` lists `Recently Played` at `/me/recently-played`.
- Expected: working history or no nav entry. Actual: placeholder. Follow-up: implement or hide. State open.

### ISSUE-005

Profile form has non-functional controls.

- Evidence (source): `apps/web/app/(root)/settings/_components/profile-form.tsx` `Verify Email` button (`onClick={currentlyInDev}`, line ~143) and the avatar `Edit` button (line ~272).
- Expected: functional or absent. Actual: info toast only. Follow-up: implement or remove. State open.

### ISSUE-006

`appRoutes` lists `/playlists`, but the real routes are `/playlist` and `/playlist/[name]/[token]`.

- Evidence (source): `apps/web/config/routes.ts` `appRoutes` includes `"/playlists"`; `apps/web/proxy.ts` redirects two-segment paths such as `/album/foo` to `/album` only for names in that list; no `app/(root)/playlists` page exists (`/me/playlists` does).
- Expected: the entry names the real top-level route. Actual: `/playlist/<x>` is not normalized like other types. User-visible effect not observed (see [browse](../../.agents/skills/verify/features/browse-and-entities.md)).
- Reproduce (no browser needed once the app runs): `curl -si http://localhost:3417/album/foo` should 307 to `/album`; compare `curl -si http://localhost:3417/playlist/foo`.
- Follow-up: confirm the redirect behavior, then fix the list. State open.

### ISSUE-007

Public `user.resetPassword` leaks account existence and acts as a password-guess oracle.

- Evidence (source, `packages/trpc/src/router/user.ts` `resetPassword`): `publicProcedure`; unknown email throws `NOT_FOUND` "User not found, please try signing up"; a known email with the wrong current password throws `BAD_REQUEST` "Previous password is incorrect"; a passwordless account throws a distinct message. No attempt limit exists in code; the proxy rate limiter only runs when `ENABLE_RATE_LIMITING=true`, `NODE_ENV=production` and Upstash is configured.
- Reproduce (needs the app and disposable DB): POST to `/api/trpc/user.resetPassword` with a matching origin and three emails (unknown, known, passkey-only); compare errors. Not run here.
- Expected: uniform response and throttling. Actual: three distinct responses. Follow-up: unify messages, throttle, or move into the authenticated settings flow. State open.

### ISSUE-008

`user.updateUser` takes an unvalidated email and does not reverify it.

- Evidence (source): `updateUserInput` is `email: z.string().optional()` (no `.email()`); the mutation writes `users.email` directly; the `email` column is `unique` (`packages/db/src/schema.ts`), so a duplicate raises a database error.
- Expected: format validation, duplicate handling with a clear message, re-verification. Actual: any string is accepted; duplicate behavior and the surfaced error are unproven.
- Follow-up: add schema validation and a duplicate case test. State open.

### ISSUE-010

The `/api/trpc` origin check passes requests that send neither `Origin` nor `Referer`.

- Evidence (source): `apps/web/proxy.ts`, branch `else if (!origin && !referer) { isSameOrigin = true; }` with the in-code comment about server-to-server calls.
- Expected for a CSRF defense: browsers always send `Origin` on cross-site POSTs, so the practical effect is limited to non-browser clients, which can already send any header. Treated as low and as documented intent. Confirm against the 403 path with a spoofed origin.
- Follow-up: none required unless the check is meant to be an authorization control. State open.

### ISSUE-011

Public data pages return HTTP 500 when the JioSaavn API or database is unreachable.

- Evidence (prior proof, not re-run): migration-acceptance section 8, `/`, `/search`, `/radio`, `/playlist`, `/me` returned 500 with placeholder API/DB; section 13 shows 200 with the live API and a local database.
- Expected: a graceful error page or partial render. Actual: 500 (the `(root)/error.tsx` boundary may apply; unverified in a browser).
- Follow-up: re-run with network cut off to see which boundary renders. State open.

### ISSUE-013

An invalid song token renders the generic error page.

- Evidence (prior proof, not re-run): migration-acceptance section 13 "Not proven" notes.
- Expected: a specific not-found state. Actual: generic error. Reproduce (browser): open `/song/x/invalid-token`. State open.

### ISSUE-021

Stale process items from the migration report, corrected here.

- Evidence: [../migration-acceptance.md](../migration-acceptance.md) section 12 lists "Docker image build" and Chrome-absent blockers and section 8 says Chrome is missing; section 13 states it "supersedes their Docker, live-data and browser blockers" and records a Docker build pass and Chrome runs. `package.json` `packageManager` and `.github/workflows/ci.yml` now pin Bun `1.4.2` (sections 9 and the header still mention 1.3.14).
- Correction: treat sections 6, 8 and 12 as historical; the open items are in [../TODO.md](../TODO.md). Prior proofs stay in section 13 and are not re-attributed to this verification.
- State closed (documentation note only; the older report text is left as the record).

### ISSUE-022

Artist details-header "Play Radio" creates a station but gets zero songs back — fails silently (no queue update, no `activeRadio`).

- Evidence (browser, 2026-10-02, run `browser-radio-3151`):
  - Opened `/artist/arijit-singh-songs/LlRWpHzy3Hk_`, clicked "More options → Play Radio".
  - Network: `POST /api/trpc/radio.createStation?batch=1` 200, request body `{"type":"artist","name":"Arijit Singh","artistId":null,"language":null}`. Station returned `stationId: "tctBT65u..."`.
  - Network: `GET /api/trpc/radio.songs?batch=1` 200, response `"json":[]` (empty songs array).
  - localStorage after 10s poll: `activeRadio: null`, `queue` length unchanged.
  - Root cause in `apps/web/components/details-header/more-button.tsx` `playRadio()`: when `type === "artist"`, `radioType = "artist"` was set but `artistId` was not provided via props from `DetailsHeader` and remained `undefined`.
  - Upstream behavior: without `artistId`, `createStation` falls back to `webradio.createFeaturedStation`, which returns a placeholder station session without songs. Subsequent fetch to `webradio.getSong` returns `{}`, yielding 0 songs. `radioSongs.length === 0` triggered toast error "Could not find songs for this radio" without updating `queue` or `activeRadio`.
  - Counterfactual proof: calling `createStation` with `{ type: "artist", name: "Arijit Singh", artistId: "461968", language: "hindi" }` immediately returns valid artist radio station ID (`...~^~artist_radio~^~461968`), and `radio.songs` returns tracks (first track "Haareya").
  - Fix: passed `artistId: kind === "artist" ? (item as Artist).artistId : undefined` and `language: kind === "artist" ? (item as Artist).dominantLanguage : songs[0]?.language` from `apps/web/components/details-header/details-header.tsx` to `MoreButton`. In `apps/web/components/details-header/more-button.tsx`, accepted `artistId` and `language` in `MoreButtonProps` and forwarded them in `createStation.mutate`.
  - Live browser verification (run `infinitunes-radio-auth-fixes`, 2026-10-02, port 3152): clicking "More options → Play Radio" on `/artist/arijit-singh-songs/LlRWpHzy3Hk_` generated station `8J3VmbITmEJEOcO9bM98a2rtPB5QEODtuFEvS4n6uS0fbNiB2Vcbdw__~^~artist_radio~^~459320`, populated 20 station songs into `queue`, and set `active_radio_session` (`name: "Arijit Singh Radio"`, `type: "artist"`, `language: "hindi"`). Evidence: `evidence/06-verified-artist-play-radio-success.png`.
  - Regression test: `apps/web/tests/details-header-radio.test.ts`.
- State closed.

### ISSUE-023

After a successful email login, the login form stays on `/login` — no client-side redirect to home.

- Evidence (browser, 2026-10-02, run `browser-radio-3151` and re-reproduced on `infinitunes-radio-auth-fixes`):
  - Filled and submitted the login form at `/login` with `radiotest@example.com` / `Password123!`.
  - Network: `POST /api/auth/sign-in/email` 200, response includes `token`, `user`, `redirect:false`, and `set-cookie: better-auth.session_token`.
  - URL after submit: remained `http://localhost:3152/login` with form inputs still rendered and toast "You have been signed in." displayed. Evidence: `evidence/02-repro-login-stays-on-login.png`.
  - Root cause: in `apps/web/app/(auth)/_components/login-form.tsx` `onSubmit()`, the success path only showed toast without invoking client-side navigation.
  - Fix: imported `useRouter` from `next/navigation` and `asRoute` from `~/lib/utils`. On successful email login and passkey sign-in, read `callbackUrl` (defaulting to `/`), then called `router.push(asRoute(callbackUrl))` and `router.refresh()`.
  - Live browser verification (run `infinitunes-radio-auth-fixes`, 2026-10-02, port 3152): submitted valid email credentials on `/login`, page automatically redirected to `http://localhost:3152/` with title "Online Songs on Infinitunes: Download & Play Latest Music for Free | Infinitunes" and toast "You have been signed in." Evidence: `evidence/05-verified-login-redirect-home.png`.
  - Regression test: `apps/web/tests/login-redirect.test.ts`.
- State closed.

## Hypotheses

### ISSUE-009

Account deletion has no server-side confirmation.

- Basis (source): the phrase `DELETE MY ACCOUNT` is enforced only in `profile-form.tsx` (button disabled until typed); `user.deleteUser` is a `protectedProcedure` that deletes the row with no password or phrase check. A stolen session or a scripted authenticated call deletes the account.
- To confirm: after signing in on the disposable DB, call `user.deleteUser` over tRPC without the UI and check the `user` table. Expected by design for session-only apps; the question is whether recent re-authentication is wanted.
- State needs-browser (needs a session).

### ISSUE-012

Song titles may still show raw `&quot;` from the upstream API.

- Basis: migration-acceptance section 13 saw raw entities; `song-list.tsx` now calls `decode(item.title)` and `apps/web/tests/song-list-decode.test.ts` exists, so it may be fixed in lists but not elsewhere (player bar, queue, search results, details header).
- To confirm (browser): search a title containing a quote and inspect every surface. State needs-browser.

## Gaps (unexercised coverage)

### ISSUE-014

Passkey enrollment, listing, removal and sign-in are unexercised in any browser.

- Source: [auth-passkey.md](../../.agents/skills/verify/features/auth-passkey.md). Unit tests only cover config and schema. Needs a WebAuthn (virtual) authenticator. Severity high because it is a primary auth path. State needs-browser.

### ISSUE-015

OAuth provider round trip (Google, GitHub), callback URLs and the `OAuth Account Not Linked` collision path are unexercised.

- Source: [auth-oauth.md](../../.agents/skills/verify/features/auth-oauth.md). Prior proof only reached the provider redirect. Needs real OAuth apps, which are not available to disposable verification. State needs-decision (provide a test OAuth app or accept the gap).

### ISSUE-016

Adding a song to a playlist and removing a queue item are unexercised.

- Source: [playlists.md](../../.agents/skills/verify/features/playlists.md), [player-queue.md](../../.agents/skills/verify/features/player-queue.md); listed as "Not proven" in migration-acceptance section 13. State needs-browser.

### ISSUE-017

No Tailwind 3 baseline exists for visual comparison with the Tailwind 4 build.

- Source: TODO item and acceptance section 13. State needs-decision (render a pre-migration `master` build or drop the comparison).

### ISSUE-018

The Vercel preview built from `apps/web` (routing, assets, auth callback URLs, external API access, env loading) is unverified.

- Source: [../TODO.md](../TODO.md). Needs hosting access; out of scope for local verification. State needs-decision.

### ISSUE-019

No feature in the verification map has live browser proof, and UI quality (responsive layout, themes, focus order, contrast, overlays) is unproven under this work.

- Source: every file in [features/](../../.agents/skills/verify/features/README.md) is DRAFT, `Last live proof: none`. The captain paused browser automation until a browser skill is chosen. Prior section 13 screenshots are earlier evidence and are not reused as new proof. Severity high as a coverage statement, not a defect. State needs-browser.

### ISSUE-020

Rate limiting (429 path and Upstash integration) is unexercised.

- Source: `apps/web/proxy.ts` only limits when `ENABLE_RATE_LIMITING=true`, `NODE_ENV=production` and Upstash is configured; the unit test only asserts that Redis is not constructed when disabled. Needs a production build and a throwaway Upstash database. State open.

## Checks run for this task

All non-browser, serial, no production data, no credentials. Environment: Bun 1.4.2 (`bun --version`), `SKIP_ENV_VALIDATION=true`, inert `DATABASE_URL`/`AUTH_SECRET` (the same placeholders as CI), no database started, no dev server started.

| Command                                         | Result                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`                 | exit 0, 519 packages installed                                                      |
| `bun run fmt:check`                             | exit 1, 14 files (ISSUE-001)                                                        |
| `bun run lint`                                  | exit 0, 0 errors, warnings (ISSUE-002)                                              |
| `bun run type-check` (Turbo, `--concurrency=1`) | exit 0, 7 of 7 tasks; web and ui executed, 5 packages replayed from the Turbo cache |
| `bun test --pass-with-no-tests`                 | exit 0, 181 pass, 3 skip, 0 fail across 31 files                                    |

These do not prove any UI, auth or runtime behavior. `bun run build` was not run (cost, and the existing acceptance report already records it).

## Documentation checks

| Check                                                                                                                                                 | Result                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown links and anchors (96 relative links and 3 README images across README, package READMEs, `docs/`, skill and feature files; scripted one-off) | 0 broken                                                                                                                                                                                                                                                    |
| `.claude/skills/verify` is a relative symlink to `../../.agents/skills/verify` and resolves to `SKILL.md`                                             | confirmed                                                                                                                                                                                                                                                   |
| Generator placeholder scan (`TODO`, `TBD`, `FIXME`, `{{`, `lorem`, `<app>`) over `.agents/skills/verify`                                              | none; remaining hits are literal UI placeholders and a Docker format string                                                                                                                                                                                 |
| README restoration                                                                                                                                    | `README.md`, `packages/ui/README.md`, `packages/typescript-config/README.md` match their pre-`506015e` content (root logo paths kept at `apps/web/public/images`); `docs/packages.md` removed as a duplicate; `docs/project.md` keeps only the purpose note |

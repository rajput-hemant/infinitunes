---
name: verify
description: DRAFT verification skill for Infinitunes, the Next.js 16 music web app in apps/web (Bun monorepo). Use it to launch the app against a disposable local Postgres, check readiness, and drive or prove browse, search, player, auth (email, passkey, OAuth entry), settings and playlist flows. Browser recipes are pending the user-selected browser skill; nothing here is live-verified yet.
disable-model-invocation: true
---

# Verify Infinitunes (DRAFT)

> [!IMPORTANT]
> **Manual trigger only.** This skill must NOT be invoked automatically by commit, push, PR creation, poteto-mode, or any other ship gate. Run it only when explicitly instructed.
>
> **Standalone invocation:**
>
> - Claude: `/verify` or "read and run `.agents/skills/verify/SKILL.md`"
> - Codex: `$verify` (when discovered) or "read `.agents/skills/verify/SKILL.md` and run a verification pass"
> - Otherwise: explicitly instruct the agent to read this file and execute the launch, doctor, drive, evidence and cleanup steps.
>
> Launch, doctor, drive, evidence and cleanup phases defined below are preserved; only automatic triggering is prohibited.

**Status: DRAFT.** Written from source and existing documented commands only. Launch, doctor, drive, evidence and cleanup below have not been executed with a browser skill. Every feature file is marked DRAFT with `Last live proof: none`. Do not report a PASS from this skill until a run has produced evidence under `docs/evidence/`.

Browser recipes are pending the user-selected browser skill. Until it exists: no browser automation, screenshots, UI driving, Playwright/Cypress runs or `next-dev-loop`. Non-browser checks (below) are allowed.

Issues found while verifying are recorded once, in [docs/verification/verification-issues.md](../../../docs/verification/verification-issues.md). Feature files link to issue IDs there instead of repeating them.

## Prerequisites

- Bun `1.4.2` (`packageManager` in root `package.json`; CI pins the same). Use Bun, never npm. One-off binaries via `bunx`.
- Docker daemon, only for the disposable Postgres (the app needs `DATABASE_URL` for any session, favorites or playlist work).
- Outbound internet to the public JioSaavn API: browse, search, entity pages and playback metadata are fetched live at request time. Without it, public pages return 500 (see `ISSUE-011`).
- A real browser skill chosen by the user (pending). Chrome was absent in the first migration pass (`docs/migration-acceptance.md` section 8) and present in section 13; re-check.
- Never use: production database, real OAuth credentials, a shared authenticated browser profile, live payments, outgoing email.

## Isolation

One dev server and one database per run. Pick task-specific values and reuse them in every command:

| Item               | Value                                        |
| ------------------ | -------------------------------------------- |
| Web port           | `3417` (production-style run may use `3418`) |
| Postgres host port | `54417`                                      |
| Container name     | `infinitunes-verify-pg`                      |
| App origin         | `http://localhost:3417`                      |

If `lsof -nP -iTCP:3417 -sTCP:LISTEN` or `docker ps -a --filter name=infinitunes-verify-pg` shows something you did not start, stop and pick another port or name. Never double-drive a shared instance, and never kill by process name.

## Launch

Run from the repo root, serially, one worker.

1. Install once: `bun install --frozen-lockfile`.
2. Start a disposable database (inert credentials, bound to localhost):
   `docker run -d --name infinitunes-verify-pg -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=infinitunes -p 127.0.0.1:54417:5432 postgres:17`
3. Export the environment in the shell that starts the app. Do not write `.env.local` (it is gitignored but easy to leave behind). Values are inert:
   ```
   export DATABASE_URL=postgres://postgres:verify@127.0.0.1:54417/infinitunes
   export AUTH_SECRET=verify-secret-at-least-32-characters-long
   export AUTH_URL=http://localhost:3417
   export NEXT_PUBLIC_APP_URL=http://localhost:3417
   export JIOSAAVN_DES_KEY=38346591
   export GOOGLE_CLIENT_ID=inert GOOGLE_CLIENT_SECRET=inert GITHUB_CLIENT_ID=inert GITHUB_CLIENT_SECRET=inert
   export ENABLE_RATE_LIMITING=false NEXT_TELEMETRY_DISABLED=1
   ```
   `JIOSAAVN_DES_KEY` is the value from `.env.example`; the env schema requires a non-empty key and playback fails without it. `AUTH_URL` must equal the origin the browser uses: the `/api/trpc` origin check in `apps/web/proxy.ts` and Better Auth's `baseURL` and passkey `rpID` derive from it.
4. Create the schema: `bun run db:migrate` (runs `packages/db/src/migrate.ts` against `DATABASE_URL`). Do not use `db:push` against anything but this container.
5. Start the app: `cd apps/web && bunx next dev -p 3417` (or `bun run dev` from root, which runs `turbo run dev` on port 3000; prefer the explicit port). For a production-style check: `bun run build` then `cd apps/web && bunx next start -p 3418` with `SKIP_ENV_VALIDATION` left unset.
6. Ready when the log prints `Ready` and `curl -s -o /dev/null -w '%{http_code}' http://localhost:3417/login` prints `200`.

## Doctor (read-only)

Run first whenever anything looks off. It changes nothing.

```
lsof -nP -iTCP:3417 -sTCP:LISTEN                         # we own the port (compare PID to the one you started)
docker ps --filter name=infinitunes-verify-pg --format '{{.Names}} {{.Status}}'
docker exec infinitunes-verify-pg pg_isready -U postgres
curl -s -o /dev/null -w 'login %{http_code}\n' http://localhost:3417/login        # expect 200
curl -s -o /dev/null -w 'me %{http_code} -> %{redirect_url}\n' http://localhost:3417/me   # expect 307 to /login as guest
curl -s -o /dev/null -w 'nope %{http_code}\n' http://localhost:3417/nope-xyz      # expect 404
curl -s -o /dev/null -w 'home %{http_code}\n' http://localhost:3417/              # 200 needs live JioSaavn API; 500 means upstream/DB problem
```

Worth driving only if login is 200, `/me` redirects as guest, and the database answers. A 500 on `/` with the others healthy is an upstream or network problem, not an app verdict.

## Drive

Pending the user-selected browser skill. Until then, use the route paths, labels and strings below as the stable handles each feature file relies on. Prefer these over coordinates:

- Routes: see [features/README.md](features/README.md).
- ARIA labels in source: `Previous`, `Next`, `Volume`, `Play`, `Like`, `More options` / `More Options`, `Playlist options`, `Toggle Sidebar`, `Toggle Light Mode`, `Toggle System Mode`, `Toggle Dark Mode`, `Show Password` / `Hide Password`.
- Auth form buttons: `Login with Email`, `Sign in with Passkey`; fields have placeholders `you@domain.com` and a password mask (labels are `sr-only`: `Email`, `Password`, `Confirm Password`).
- Settings: `Save Changes`, `Delete Account`, confirm field placeholder `Type DELETE MY ACCOUNT to confirm!`, passkey section heading `Passkeys`.
- Player storage keys (localStorage): `queue`, `current_song_index`, `stream_quality`, `download_quality`, `image_quality`.
- Toasts (sonner) are the main success and error signal: e.g. `You have been signed in.`, `Account Created Successfully`, `Passkey added.`, `This feature is currently in development.`.

Non-browser drives that are allowed now:

```
bun run fmt:check && bun run lint && bun run type-check && bun test --pass-with-no-tests
bun test packages/trpc/tests/user-router.test.ts packages/auth/tests/auth.test.ts apps/web/tests/proxy.test.ts
curl -s -i http://localhost:3417/me | head -5            # guest redirect
curl -s -i -X POST http://localhost:3417/api/trpc/user.getUserPlaylists -H 'origin: http://evil.example'   # expect 403 from the origin check
```

## Evidence

Store proof under `docs/evidence/<run-id>/` (created by the run; not committed unless a reviewer needs it). Per proof capture: the action (command or step), the resulting state, and the side effect.

- Exercise the real user path, not internal setters or test-only endpoints.
- Verify side effects alongside what is visible: for auth, query the container (`docker exec infinitunes-verify-pg psql -U postgres -d infinitunes -c 'select id,email from "user"'`); for playlists and favorites, check the `infinitunes_playlist` and `infinitunes_favorite` rows.
- Mocks only where a production boundary already isolates the external system. JioSaavn is live and unmocked; OAuth stops at the provider redirect without real credentials.
- Record each result in the feature file's `Last live proof:` line with date, run id and evidence path. Anything not exercised stays `none`.

## Cleanup

Remove only what this run created; never remove evidence.

1. Stop the dev server by the PID you started (`kill <pid>`; confirm with `lsof -nP -iTCP:3417 -sTCP:LISTEN`).
2. Stop any browser bridge or watcher you started.
3. `docker rm -f infinitunes-verify-pg` (deletes all disposable data, including test users and passkeys).
4. `unset DATABASE_URL AUTH_SECRET AUTH_URL NEXT_PUBLIC_APP_URL JIOSAAVN_DES_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET`
5. Confirm `git status` shows no stray `.env.local`, `.next` is ignored, and `docs/evidence/` still exists.

## Helpers

None shipped. Doctor and launch are the commands above; no script has to be reverse-engineered.

## Feature map

[features/README.md](features/README.md) indexes one file per feature, each marked DRAFT.

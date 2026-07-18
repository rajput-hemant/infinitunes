# Migration Acceptance Report

Final cumulative integration and acceptance pass for the Infinitunes Bun
monorepo migration (Wave 3 coordinator lane). This report records the exact
commands run, their pass/fail status, environment-only blockers, deferred
credential-dependent checks, and the captain input required before promotion.

- Branch: `fm/infinitunes-final-f2`
- Base migration tip: `origin/migration/bun-monorepo` @ `565b817`
- Specification: `docs/migration-plan.md`
- Baseline: `docs/migration-baseline.md`
- Tooling: Bun 1.3.14, Node 26.5.0 (workspace); build target Node 22 / Bun 1.3.14 in Docker

No secrets were read, copied, or exposed. No `.env.local` was present in this
worktree and none was accessed. No mutating database command was run. No image
was published or run against external systems. No remote push, PR, or GitHub
Actions run was performed.

---

## 1. Compatibility-completion changes applied

The landed waves were reconciled against the migration plan. The following
compatibility-only changes were necessary to satisfy the plan and were applied
in this lane (no product features, no refactors, no package extraction):

| Change                                         | File                                | Rationale (plan reference)                                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add `@next/env@16.2.10` as a web devDependency | `apps/web/package.json`             | `drizzle.config.ts` imports `@next/env`; under Bun's workspace layout it was not resolvable, breaking `type-check` and `build` type-checking. Adds the explicit dependency that already resolves in the lockfile.                                                                           |
| Restore production-only React Compiler         | `apps/web/next.config.ts`           | Plan step 4: "Preserve the existing production-only React Compiler behavior." Wave 0 had set `reactCompiler: true` (always on); restored to `isProd ? true : undefined` using the Next 16 top-level key.                                                                                    |
| Add `outputFileTracingRoot` for Docker builds  | `apps/web/next.config.ts`           | Makes monorepo standalone file tracing deterministic (points at repo root) so the Docker standalone output is correct regardless of lockfile auto-detection.                                                                                                                                |
| Restore `jsx: "preserve"`                      | `apps/web/tsconfig.json`            | Plan step 4: "preserve ... jsx: \"preserve\"." Had been changed to `react-jsx`. Verified production build still passes.                                                                                                                                                                     |
| Restore `export const runtime = "edge"`        | `apps/web/src/app/api/og/route.tsx` | It was removed because it was "incompatible with cacheComponents"; cacheComponents was subsequently removed (`565b817`), so the removal is no longer justified and diverged from original behavior.                                                                                         |
| Fix Turbo build outputs                        | `turbo.json`                        | `outputs` are package-relative; `apps/web/.next/**` matched nothing (Turbo warned "no output files found"). Changed to `.next/**` (excluding cache) so the web build output is cached/restored.                                                                                             |
| Add Turbo `globalPassThroughEnv`               | `turbo.json`                        | Turbo's strict env filtering dropped `SKIP_ENV_VALIDATION` (and build/runtime vars), so `SKIP_ENV_VALIDATION=true bun run build` failed env validation. Declared the escape hatch and env vars so they reach the build.                                                                     |
| Fix Docker builder + standalone paths          | `dockerfile`                        | Builder stage used `node:*-alpine` but ran `bun run` (bun absent). Switched builder to `oven/bun`. Monorepo standalone nests `server.js` under `apps/web`, so corrected the public/static copy targets and the `CMD` to `node apps/web/server.js`; added a `SKIP_ENV_VALIDATION` build ARG. |
| Correct new Vercel env documentation           | `README.md`                         | The migration-added Vercel env table and deploy link listed stale `NEXTAUTH_*` / `NEXT_PUBLIC_*` names that do not match `src/lib/env.ts`. Aligned them to the actual schema (`AUTH_SECRET`, `AUTH_URL`, ...).                                                                              |

The final repository-wide `bun run fmt` was run once after functional work
settled and produced **no additional diff** (all touched files were already
correctly formatted), so no separate formatting-only commit was created.

---

## 2. Lockfile

| Command                         | Status                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile` | PASS - `Checked 317 installs across 483 packages (no changes)`; the single canonical root `bun.lock` is current after adding `@next/env`. |

A fresh `bun install --frozen-lockfile` succeeds with no drift.

---

## 3. Root script resolution

All root scripts resolve to the intended `@infinitunes/web` workspace. No
destructive database operation was executed.

| Script                                            | Resolves to                             | Verification                                                                                                                                           |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dev`                                             | `@infinitunes/web` → `next dev`         | `turbo run dev --dry-run`                                                                                                                              |
| `build`                                           | `@infinitunes/web` → `next build`       | executed (see §4)                                                                                                                                      |
| `start`                                           | `@infinitunes/web` → `next start`       | `turbo run start --dry-run`                                                                                                                            |
| `lint`                                            | `@infinitunes/web` → `oxlint`           | executed (see §4)                                                                                                                                      |
| `type-check`                                      | `@infinitunes/web` → `tsc --noEmit`     | executed (see §4)                                                                                                                                      |
| `test`                                            | `bun test --pass-with-no-tests` (root)  | executed (see §4)                                                                                                                                      |
| `fmt` / `fmt:check`                               | root `oxfmt`                            | executed (see §4)                                                                                                                                      |
| `db:generate/migrate/drop/push/pull/studio/check` | `bun run --filter @infinitunes/web ...` | `db:check` forwarded correctly and reached `apps/web/drizzle.config.ts` (stopped only at the intended `DATABASE_URL is not set` guard - no DB touched) |

---

## 4. Acceptance gates (executed from repository root)

| Gate         | Command              | Status                                                                                                                                                                                                    |
| ------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format check | `bun run fmt:check`  | PASS - all matched files formatted (225 files)                                                                                                                                                            |
| Lint         | `bun run lint`       | PASS - 43 warnings, 0 errors (warnings are pre-existing style findings, e.g. `no-unused-vars`, `no-shadow`; `console.error;` in `download-button.tsx` is a pre-existing no-op present in `origin/master`) |
| Type check   | `bun run type-check` | PASS (forced, no cache)                                                                                                                                                                                   |
| Tests        | `bun run test`       | PASS - `bun test --pass-with-no-tests` exits 0 (repository has no tests yet, per plan)                                                                                                                    |

Note: the pristine tip reported a stale Turbo cache "hit" for `type-check`; a
forced run revealed the `@next/env` failure, which this lane fixed. All results
above are from forced, cache-bypassed runs.

---

## 5. Production build

### 5a. No secrets (honest classification)

| Command                  | Result                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run build` (no env) | FAILS at environment validation with `Invalid environment variables` for `AUTH_SECRET`, `AUTH_URL`, OAuth client vars, `JIOSAAVN_API_URL`, `DATABASE_URL`. |

This is the **designed** behavior of `src/lib/env.ts` (`@t3-oss/env-nextjs`),
not a defect. It confirms env validation runs at build time.

### 5b. Public placeholders + `SKIP_ENV_VALIDATION` (source compilation / prerender)

| Command                                                                               | Result                                                                                                            |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SKIP_ENV_VALIDATION=true bun run build`                                              | PASS - `Compiled successfully`, static pages prerendered (27-28/28), Proxy (middleware) emitted.                  |
| `SKIP_ENV_VALIDATION=true IS_DOCKER=true NODE_ENV=production next build` (standalone) | PASS - standalone output produced at `apps/web/.next/standalone/apps/web/server.js` with `apps/web/.next/static`. |

This validates source compilation and prerendering only. **It is not a
production certification** - it deliberately bypasses env validation and uses no
real credentials.

---

## 6. Docker

Docker CLI is installed (v29.4.0) but the **daemon is not running** in this
environment, so an actual image build could not be executed here
(environment-only blocker). The Dockerfile was validated by inspection against
the verified local standalone output structure:

- Build context / `.dockerignore`: excludes `node_modules`, `.next`, `.git`,
  and `.env*` (keeps `!/.env.example`); `.env.local` is never copied into image
  layers (plan step 6).
- Deps stage installs the root workspace with `bun install --frozen-lockfile`
  from `oven/bun:1.3.14`.
- Builder stage now uses `oven/bun:1.3.14` (previously `node:*-alpine`, which
  lacked `bun` for `bun run --filter`); sets `SKIP_ENV_VALIDATION` build ARG.
- Output-copy paths corrected for the monorepo standalone layout: public →
  `apps/web/public`, standalone → `./`, static → `apps/web/.next/static`.
- Final entrypoint corrected to `node apps/web/server.js` (server.js is nested
  under `apps/web` in monorepo standalone output, verified locally).

**Deferred (needs Docker daemon):** end-to-end `docker compose build` and a
container smoke run with public placeholder build variables.

---

## 7. Drizzle schema validation

No mutating database command was run. No live database was contacted.

| Command                                                                                | Status                                                                                                      |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `drizzle-kit generate` with a **temporary** config (`out` → temp dir, placeholder URL) | PASS - schema parsed (5 tables), SQL generated only into the temp location; committed migrations untouched. |
| `drizzle-kit check` (placeholder `DATABASE_URL`, reads journal only, no connection)    | PASS - `Everything's fine`.                                                                                 |

`git status apps/web/src/lib/db/migrations/` confirmed no committed migration
was modified. Temporary config and generated SQL were written outside the repo
and removed.

---

## 8. Runtime / browser smoke checks (non-authenticated)

A production server was started with **public placeholders + SKIP_ENV_VALIDATION**
(`next start -p 3300`). No private credentials or production data were used.

| Surface                                                                | Result                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server boot                                                            | PASS - `Ready` on `:3300`                                                                                                                                                                                                                                                         |
| Not-found routing (`/nonexistent-xyz`)                                 | PASS - HTTP 404, renders the not-found page ("404 / not found")                                                                                                                                                                                                                   |
| Static assets (`/favicon.ico`, `/manifest.webmanifest`, `/robots.txt`) | PASS - HTTP 200                                                                                                                                                                                                                                                                   |
| `_next` static chunk serving                                           | PASS - HTTP 200                                                                                                                                                                                                                                                                   |
| Public data pages (`/`, `/search`, `/radio`, `/playlist`, `/me`)       | HTTP 500 - **blocked by external service**: pages fetch the JioSaavn API and database at request time; with only placeholder API/DB the fetch returns non-JSON / unreachable, which surfaces as a 500. This is an environment/service-access blocker, not a migration regression. |

**Browser (chrome-devtools-axi):** Google Chrome is **not installed** in this
environment ("Could not find Google Chrome executable"), so browser-based
visual smoke checks (themes, dialogs, responsive navigation, playback/queue/
download surfaces, light/dark screenshots) **could not be run** and are not
claimed. HTTP-level smoke checks above were used where feasible.

---

## 9. Delivery configuration & documentation review

| Item                            | Status                                                                                                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI (`.github/workflows/ci.yml`) | Pins Bun `1.3.14`, `bun install --frozen-lockfile`, then `fmt:check`, `lint`, `type-check`, `bun test --pass-with-no-tests`, `bun run build` (with `SKIP_ENV_VALIDATION: true`), commitlint. Uses Bun root commands. Not executed (no GitHub Actions run). |
| Docker                          | See §6.                                                                                                                                                                                                                                                    |
| Vercel docs (README)            | Root Directory `apps/web`, Install `bun install`, Build `bun run build`, Output `.next`; env table and deploy link corrected to match `env.ts`.                                                                                                            |
| Environment handling            | `SKIP_ENV_VALIDATION` escape hatch documented and wired through Turbo/Docker; `.env.local` never copied into images.                                                                                                                                       |
| Husky / lint-staged             | `.husky/pre-commit` → `bunx lint-staged`; `.husky/commit-msg` → `bunx commitlint`. Root `lint-staged` runs `oxfmt --write` + `oxlint`.                                                                                                                     |
| Oxfmt / Oxlint                  | `.oxfmtrc.json` (80 col, 2-space, semicolons, double quotes, trailing commas, import + tailwind sorting) and `.oxlintrc.json` (typescript/react/jsx-a11y/import, correctness + suspicious) present; Prettier/ESLint config removed.                        |
| Makefile                        | Presents Bun as the package manager; Docker + root Bun commands.                                                                                                                                                                                           |

---

## 10. Relocation integrity (no lost files)

| Check                        | Result                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/**` file count          | 230 (master) == 230 (`apps/web/src`)                                                                                                               |
| `public/**` file count       | 34 (master) == 34 (`apps/web/public`)                                                                                                              |
| Migrations                   | 15 == 15; committed migrations unchanged                                                                                                           |
| Relocated configs            | `components.json`, `drizzle.config.ts`, `next.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json` all present under `apps/web/` |
| `middleware.ts` → `proxy.ts` | Present (Next 16 rename)                                                                                                                           |
| `.env.example`               | Preserved at repo root                                                                                                                             |
| Intentional removals         | `.eslintrc`, `.prettierrc`, `.prettierignore`, `bun.lockb` (replaced by Oxlint/oxfmt/`bun.lock`)                                                   |
| Empty-dir markers            | None existed in master; nothing lost                                                                                                               |

The cumulative diff from `origin/master` to this branch is compatibility-only
(mechanical move with Git history, dependency upgrades, tooling swap, delivery
updates, and the compatibility fixes in §1). No product feature, unrelated
refactor, or package extraction is included.

---

## 11. Deviations from plan (accepted)

- **Tailwind version:** the plan (step 4) references "Tailwind 4", but the
  landed migration keeps `tailwindcss 3.4.13` (matching the recorded baseline)
  with PostCSS/autoprefixer. Upgrading to Tailwind 4 is a larger styling change
  outside this final acceptance lane's compatibility-only remit and was **not**
  performed here. Flagged for captain decision (see §12).
- **BlobPart fix:** implemented as `chunks: BlobPart[]` typing (type-checks and
  preserves behavior) rather than a literal byte copy; functionally equivalent.

---

## 12. Captain input required before promotion

1. **Tailwind 4 upgrade** - Plan step 4 says preserve Tailwind theme/behavior
   under Tailwind 4, but the branch remains on Tailwind 3.4.13. Confirm whether
   Tailwind 4 is required for promotion or is deferred to a follow-up lane.
2. **Docker image build** - Requires a running Docker daemon; the Dockerfile is
   validated by inspection against the verified standalone layout but the image
   was not built here. Please run/authorize `docker compose build` in an
   environment with the daemon available.
3. **Authenticated + live-data smoke tests** - Credentials-dependent checks
   (credentials/OAuth flows, session persistence, protected pages, playlist
   mutations, favorites, logout) and public data-page rendering (which needs a
   reachable JioSaavn API + database) are deferred; they require a non-production
   database and API access not available in this environment.
4. **Browser visual comparison** - Requires Google Chrome (absent here) plus a
   working data backend; deferred (Tailwind desktop/mobile + light/dark
   screenshots, dialogs, responsive navigation, playback/queue/download UI).
5. **Vercel preview** - The final "Vercel preview builds from apps/web"
   acceptance test requires the hosting platform and secrets; deferred to the
   promotion/deploy step.

---

## Summary

All locally feasible acceptance gates pass: frozen install, `fmt:check`,
`lint`, `type-check`, `test`, source-compilation/prerender build (with the
documented escape hatch), Drizzle schema validation (temp-only, no DB
mutation), root script resolution, static-asset and not-found runtime smoke
checks, and relocation integrity. The cumulative diff is compatibility-only.

Environment-only blockers (Docker daemon down, Chrome absent) and
credential/service-dependent checks (authenticated flows, live public-data
rendering, Vercel preview, Tailwind visual comparison) are deferred and listed
above for captain action. No unexecuted check is claimed as passed and no
secret is included in this report.

# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Monorepo layout

Bun workspaces + Turborepo. The Next.js app is `@infinitunes/web` at `apps/web`
(`@/*` → `apps/web/src/*`). Run all gates from the repo root:
`bun run fmt:check`, `bun run lint` (Oxlint), `bun run type-check`,
`bun run test` (`bun test --pass-with-no-tests`; no tests yet), `bun run build`.
DB scripts (`db:generate|migrate|drop|push|pull|studio|check`) forward to
`apps/web` via `bun run --filter`. Single canonical `bun.lock` at root.

## Build / delivery sharp edges

- Env validation (`apps/web/src/lib/env.ts`) runs at build time and fails
  without real vars. Use `SKIP_ENV_VALIDATION=true` for source-compilation only.
- Turbo filters env vars: any build/runtime var (incl. `SKIP_ENV_VALIDATION`)
  must be listed in `turbo.json` `globalPassThroughEnv` to reach `next build`.
- Turbo `outputs` are package-relative; the web build output is `.next/**`.
- Docker uses `apps/web` standalone output, which nests the server at
  `apps/web/.next/standalone/apps/web/server.js` (entrypoint `node apps/web/server.js`).
  `next.config.ts` sets `outputFileTracingRoot` to the repo root when `IS_DOCKER`.
- `drizzle.config.ts` imports `@next/env` (declared in `apps/web` devDeps).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Zod 4 API

The project uses Zod ^4.4.3. Key differences from Zod 3:

- `z.string()` no longer accepts `required_error` / `invalid_type_error`. Use `error` instead (e.g. `z.string({ error: "..." })`).
- `message` is deprecated; `error` is the replacement.
- `z.preprocess` signature accepts `(arg, ctx) => result` (second `ctx` param is new; single-arg callbacks still work).
- `z.discriminatedUnion`, `.min()`, `.max()`, `.regex()`, `.refine()` APIs are unchanged.
- See `apps/web/src/lib/env.ts` and `apps/web/src/lib/validations.ts` for usage examples.

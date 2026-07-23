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
- `packages/trpc/src/lib/download.ts`'s `createDownloadLinks` needs `JIOSAAVN_DES_KEY`
  in `turbo.json` `globalPassThroughEnv` (alongside `JIOSAAVN_API_URL`) or every song's
  `download_url` silently comes back empty under `bun run dev`/`build`, which crashes
  the player (empty Howler src). Every song array a router returns must be mapped
  through `withDownloadUrl` (see `packages/trpc/src/router/index.ts`) before reaching
  the client, not just the song-details/podcast-episode endpoints.
- `des-ecb` (used by `createDownloadLinks`) is unsupported by plain Node's default
  OpenSSL 3 build (`next dev` runs under Node even when invoked via `bun run dev`), but
  works under Bun's own crypto. Locally reproduce with `NODE_OPTIONS=--openssl-legacy-provider`;
  don't add that flag to the repo, it's a local-verification workaround only.
- Tailwind v4's automatic content scanning only covers `apps/web`. Utility
  classes/theme vars used exclusively inside `packages/ui/src` (e.g.
  `bg-sidebar`, `bg-popover`, `bg-card`) get tree-shaken out of the compiled
  CSS unless `apps/web/styles/globals.css` declares
  `@source '../../../packages/ui/src';`. If a new workspace package ships
  components consumed by `apps/web`, add its source dir the same way.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## React and Next.js Best Practices

- **Server vs Client Components**: Layouts and pages should remain Server Components where possible to fetch data and cookies efficiently. Isolate user interactivity (clicks, menus, forms) into dedicated Client Components with `"use client"`.
- **Sidebar Layout Hierarchy**: Always nest `<Navbar />` inside `<SidebarInset>` above `<main>` within `<SidebarProvider>` to avoid breaking the horizontal layout.
- **Component Imports**: Do not create local component files under `apps/web/components/ui`. Always reference the monorepo package `@infinitunes/ui/components/<name>` and exports in `packages/ui/package.json`.

## Zod 4 API

The project uses Zod ^4.4.3. Key differences from Zod 3:

- `z.string()` no longer accepts `required_error` / `invalid_type_error`. Use `error` instead (e.g. `z.string({ error: "..." })`).
- `message` is deprecated; `error` is the replacement.
- `z.preprocess` signature accepts `(arg, ctx) => result` (second `ctx` param is new; single-arg callbacks still work).
- `z.discriminatedUnion`, `.min()`, `.max()`, `.regex()`, `.refine()` APIs are unchanged.
- See `apps/web/src/lib/env.ts` and `apps/web/src/lib/validations.ts` for usage examples.

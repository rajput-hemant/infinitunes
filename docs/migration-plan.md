
  # Bun Monorepo Migration Plan

  ## Summary

  Migrate the existing application intact into apps/web, with Bun workspaces and Turborepo orchestration. Do not extract
  shared business logic yet. Reserve packages/* for future React Native-compatible modules.

  Before implementation, save this plan as docs/migration-plan.md. No source files, assets, migrations, ignored local
  environment files, or existing empty directories may be deleted during migration.

  ## Implementation Steps

  1. Preserve the current workspace
      - Record Git status, current diagnostics, Bun/Node versions, and dependency versions.
      - Create backup/pre-bun-monorepo-2026-07-18 and commit the exact staged and unstaged tracked state.
      - Create the migration branch from that checkpoint.
      - Never read or commit .env.local; preserve its root copy until the relocated app is validated.

  2. Establish the monorepo
      - Create a private root orchestration package with Bun workspaces: ["apps/*", "packages/*"], one root bun.lock, an exact
        packageManager Bun version, and Turborepo.

      - Mechanically move the current app with Git history into apps/web: src, public, Next, TypeScript, Tailwind, PostCSS,
        Shadcn, Drizzle, and app package configuration.

      - Name the app package @infinitunes/web.
      - Keep @/* -> ./src/* local to the web app and preserve all internal imports.
      - Leave apps/native, packages/db, and other existing directories untouched. Do not scaffold React Native or extract
        packages.

      - Add root task interfaces: dev, build, start, lint, type-check, test, fmt, fmt:check, and web DB command forwarding.
      - Configure Turbo tasks so builds depend on upstream builds, dev is persistent and uncached, and .next/** is the web
        build output.

  3. Upgrade dependencies in isolated lanes
      - Resolve and record every direct dependency's latest stable version at implementation start. Pin framework-critical
        versions and capture the complete resolution in bun.lock.

      - Upgrade sequentially:
          1. Bun, Turbo, Node compatibility floor, Next.js, React, React DOM, React types.
          2. Auth.js, Auth Drizzle adapter, Drizzle ORM/Kit, Postgres drivers.
          3. Zod, React Hook Form, resolvers, and environment validation.
          4. Tailwind 4, PostCSS integration, Radix/UI, icons, and styling dependencies.
          5. Remaining runtime and development dependencies, CI actions, Husky, commitlint, and lint-staged.

      - Use the latest compatible policy:
          - Keep Auth.js on the newest v5 beta because stable v4 would require an authentication rewrite.
          - Use the newest TypeScript release supported by Next.js builds, not TypeScript 7 while its required programmatic
            interface is unavailable.

      - Remove unused @next/bundle-analyzer unless it is deliberately wired into Next configuration. Align sharp with Next.js
        requirements.

      - Only the dependency owner may edit package manifests or bun.lock.

  4. Apply compatibility-only fixes
      - Remove incidental typedRoutes and cacheComponents enablement. Preserve the existing production-only React Compiler
        behavior and jsx: "preserve".

      - Retain the required Next.js middleware-to-proxy migration.
      - Replace mutation-time revalidateTag calls with updateTag to preserve immediate post-mutation reads.
      - Update Zod 4 error configuration without changing validation messages.
      - Resolve the typed-array BlobPart incompatibility with a safe byte copy.
      - Apply only compiler, build, or runtime fixes directly attributable to upgraded packages.
      - For Tailwind 4, preserve theme variables, dark-mode behavior, container sizing, fonts, radii, animations, and class
        output. Correct Shadcn configuration paths as part of relocation.

      - Run Drizzle schema checks and generate SQL only into a temporary location. Never run push, migrate, drop, or modify
        committed migrations during validation.

  5. Replace formatting and linting
      - Replace Prettier and its plugins with oxfmt. Preserve 80-column width, two-space indentation, semicolons, double
        quotes, trailing commas, import sorting, and Tailwind class sorting.

      - Replace ESLint and its plugins/configuration with Oxlint native TypeScript, React, import, accessibility, correctness,
        and suspicious-rule categories.

      - Do not retain ESLint solely for Next-specific rules. Use Next.js compilation and production builds as that
        compatibility gate.

      - Update root scripts, lint-staged, Husky, CI, VS Code, and ignore rules.
      - Translate suppression comments only when Oxlint reports the equivalent rule.
      - Apply full-repository oxfmt output once, after functional work is merged, in a dedicated formatting-only commit.

  6. Update delivery infrastructure
      - Pin Bun in CI, install with bun install --frozen-lockfile, and run format check, Oxlint, type check, tests, and
        production build from the root.

      - Keep a bun test --pass-with-no-tests path until real tests exist, since the repository currently has none.
      - Update Docker for root workspace installation and apps/web standalone output. Build with Bun, copy the correct web
        public, standalone, and static paths, and validate the final server entrypoint.

      - Stop copying .env.local into Docker image layers. Supply runtime/build variables through the environment.
      - Document Vercel's project root as apps/web, Bun installation, build commands, and environment variables.
      - Update README and Makefile to present Bun as the supported package manager.

  ## Parallel Agent Execution

  - Wave 0, coordinator only: checkpoint the dirty workspace, save this plan, create the migration branch, perform the
    mechanical app move, and establish initial workspace manifests.

  - Wave 1, parallel:
      - Dependency/tooling agent owns manifests, lockfile, Turbo, oxfmt, Oxlint, Husky, and VS Code tooling.
      - Delivery agent owns CI, Docker, Compose, Makefile, Vercel documentation, and README.

  - Wave 2, parallel after dependency integration:
      - Web agent owns apps/web/src/app, components, hooks, styles, Next, Tailwind, PostCSS, and Shadcn compatibility.
      - Server/data agent owns authentication, actions, environment validation, database code, Drizzle configuration, and auth
        routes.

      - API/domain agent owns JioSaavn access, utilities, validation modules, types, and platform-neutral configuration.

  - Wave 3, coordinator only: merge in dependency order, resolve cross-lane issues, regenerate the lockfile once, run oxfmt
    once, and execute all acceptance gates.

  - Use separate Git worktrees. Agents must not install dependencies or format the repository concurrently, and must report
    dependency needs to the manifest owner.

  ## Acceptance Tests

  - bun install --frozen-lockfile succeeds from a fresh checkout.
  - Root dev, build, lint, type-check, test, fmt:check, and DB forwarding commands resolve to the correct workspace.
  - Oxlint, oxfmt check, TypeScript, Turbo production build, and Docker build pass.
  - Drizzle schema validation passes with no unexpected generated SQL or applied database changes.
  - Browser smoke tests cover landing, search, album/artist/song pages, playback, queue, downloads, light/dark themes,
    responsive navigation, dialogs, and error/not-found pages.

  - Auth smoke tests cover credentials, OAuth entry points, session persistence, protected pages, playlist mutations,
    favorites, and logout using a non-production database.

  - Tailwind 4 visual comparison covers desktop/mobile and light/dark screenshots.
  - A Vercel preview builds from apps/web and validates routing, static assets, auth callback URLs, external API access, and
    environment loading.

  - Git review confirms functional changes are compatibility-only and the formatting commit contains no behavior changes.

  ## Deferred React Native Seams

  No shared package extraction is included now. Record these future candidates:

  - packages/domain: portable response types, constants, languages, and Zod validation.
  - packages/api-client: JioSaavn client with injected transport, base URL, and language instead of Next cookies/environment
    access.

  - packages/player: queue and preference state with injected web or native persistence adapters.

  apps/web, authentication, database queries, Next server actions, UI, browser hooks, and platform storage remain web-owned
  until a real native adapter creates a justified seam.

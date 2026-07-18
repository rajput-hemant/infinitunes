# Migration Baseline

Recorded 2026-07-18 before Wave 0 monorepo migration.

## Source state

- Checkpoint commit: `0cd5e87` (backup/pre-bun-monorepo-2026-07-18)
- Base commit: `83d0b88a1db72f89a2bc17bfc3f9a4997199561c`
- Working tree: clean

## Tool versions

| Tool | Version |
|------|---------|
| Bun  | 1.3.14  |
| Node | 26.5.0  |
| npm  | 11.17.0 |

## Direct dependencies (at checkpoint)

### Production

| Package | Version |
|---------|---------|
| @auth/drizzle-adapter | ^1.7.0 |
| @hookform/resolvers | ^5.0.1 |
| @radix-ui/* | various ^1.x |
| @t3-oss/env-nextjs | ^0.11.1 |
| @tanstack/react-query | ^5.59.13 |
| @upstash/ratelimit | ^2.0.3 |
| @upstash/redis | ^1.34.3 |
| babel-plugin-react-compiler | ^1.0.0 |
| bcryptjs | ^3.0.0 |
| class-variance-authority | ^0.7.0 |
| clsx | ^2.1.1 |
| cmdk | ^1.0.0 |
| cookies-next | ^6.0.0 |
| drizzle-orm | ^0.45.1 |
| geist | ^1.3.1 |
| jotai | ^2.10.0 |
| lucide-react | ^0.452.0 |
| next | ^16.1.6 |
| next-auth | ^5.0.0-beta.30 |
| next-themes | ^0.3.0 |
| postgres | ^3.4.4 |
| react | ^19.2.4 |
| react-dom | ^19.2.4 |
| react-hook-form | ^7.53.0 |
| react-use-audio-player | ^3.0.2 |
| sonner | ^2.0.1 |
| tailwind-merge | ^3.0.1 |
| tailwindcss-animate | ^1.0.7 |
| vaul | ^1.1.0 |
| zod | ^4.3.6 |

### Dev

| Package | Version |
|---------|---------|
| @commitlint/cli | ^19.5.0 |
| @commitlint/config-conventional | ^19.5.0 |
| @eslint/eslintrc | ^3.3.3 |
| @eslint/js | ^10.0.1 |
| @ianvs/prettier-plugin-sort-imports | ^4.3.1 |
| @next/bundle-analyzer | 15.0.3 |
| @total-typescript/ts-reset | ^0.6.1 |
| @types/bcryptjs | ^3.0.0 |
| @types/node | 22.7.5 |
| @types/react | ^19.2.13 |
| @types/react-dom | ^19.2.3 |
| autoprefixer | 10.4.20 |
| drizzle-kit | ^0.31.10 |
| eslint | ^10.0.0 |
| eslint-config-next | ^16.1.6 |
| eslint-config-prettier | ^10.1.8 |
| eslint-plugin-drizzle | ^0.2.3 |
| eslint-plugin-prettier | ^5.5.5 |
| husky | ^9.1.6 |
| lint-staged | ^16.0.0 |
| pg | ^8.18.0 |
| postcss | 8.4.47 |
| prettier | ^3.3.3 |
| prettier-plugin-tailwindcss | ^0.6.8 |
| sharp | ^0.33.5 |
| tailwindcss | 3.4.13 |
| typescript | ^5.9.3 |

## Baseline results

### Install

- `bun install`: succeeded (768 packages, 1.76s)

### Type-check (`bun run type-check`)

FAILED with 9 errors (pre-existing):

1. `src/components/download-button.tsx:67` - TS2345: Uint8Array[] not assignable to BlobPart[]
2. `src/lib/actions.ts:95` - TS2554: Expected 2 arguments, got 1
3. `src/lib/db/queries.ts:44` - TS2554: Expected 2 arguments, got 1
4. `src/lib/db/queries.ts:85` - TS2554: Expected 2 arguments, got 1
5. `src/lib/db/queries.ts:112` - TS2554: Expected 2 arguments, got 1
6. `src/lib/db/queries.ts:150` - TS2554: Expected 2 arguments, got 1
7. `src/lib/env.ts:30` - TS2769: Zod 4 'required_error' removed

### Lint (`bun run lint`)

FAILED at runtime - TypeError in eslint-plugin-react (pre-existing):
```
TypeError: Error while loading rule 'react/display-name':
contextOrFilename.getFilename is not a function
```

### Build (`bun run build`)

FAILED (pre-existing - missing required env vars):
```
Invalid environment variables: AUTH_SECRET, AUTH_URL, GOOGLE_CLIENT_ID, ...
```
Build requires DATABASE_URL, AUTH_SECRET, AUTH_URL, and OAuth credentials.

### Tests (`bun run test`)

No test script configured. `bun test` would be a new addition.

## Summary

Installation succeeds. Type-check, lint, and build have pre-existing failures
from the upstream dependency-upgrade delta that are not addressed in Wave 0.
These baselines serve as evidence of pre-migration state, not as pass/fail
gates for the mechanical relocation.

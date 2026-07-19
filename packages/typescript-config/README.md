# @infinitunes/typescript-config

Shared TypeScript configurations for the Infinitunes monorepo.

## Usage

Extend the appropriate config in your package's `tsconfig.json`:

```json
{
  "extends": "@infinitunes/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Available Configs

- `base.json` - Core TypeScript settings shared across all packages (strict, ESNext, Bundler module resolution, JSX, noEmit, incremental).
- `nextjs.json` - Extends base with Next.js plugin, DOM libs, and `allowJs`. For Next.js applications.
- `react-library.json` - Extends base with DOM libs, declaration files, and source maps. For React component libraries.

## Consumer Integration Guide

### `apps/web` (Next.js 16)

```json
{
  "extends": "@infinitunes/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### `packages/auth`, `packages/db` (non-UI packages)

```json
{
  "extends": "@infinitunes/typescript-config/base.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `packages/ui` (React component library)

```json
{
  "extends": "@infinitunes/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Package References

Since `noEmit` is enabled in all configs, project references are not recommended for build orchestration. Instead, rely on workspace protocol resolution (`"@infinitunes/db": "workspace:*"`) for inter-package dependencies.

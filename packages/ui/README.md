# @infinitunes/ui

Web-only UI component library for web surfaces in this monorepo, built with Tailwind CSS v4, Base UI, and Lucide React. It stays in `packages/` because a future web surface could reuse it.

> **Important:** This package is web-only due to DOM, CSS, and web-specific dependencies (such as `@base-ui/react`, `next-themes`, and DOM APIs). It must not be imported by a React Native or Expo mobile application. Mobile components belong in a separate package, not a wrapper around these.

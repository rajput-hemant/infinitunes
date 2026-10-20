# @infinitunes/mobile

The Infinitunes iOS and Android app (Expo SDK 58, Expo Router, React Native New Architecture). It talks to the
web app (`apps/web`) over `/api/trpc` and `/api/auth`.

## Run

Expo Go does not support this app (native modules beyond the Expo Go set, and no SDK 58 Expo Go yet), so it runs
as a development build.

1. Start the web app: `bun run dev` from the repo root.
2. `cp apps/mobile/.env.example apps/mobile/.env.local` and set `EXPO_PUBLIC_API_URL` to an address the
   device can reach.
3. Build and install the dev client once (and after any native dependency or config plugin change):
   `bun run --cwd apps/mobile ios` (Xcode) or `bun run --cwd apps/mobile android` (Android SDK).
4. Afterwards start only Metro: `bun run dev:mobile`.

## Checks

From the repo root: `bun run lint`, `bun run type-check`, `bun run test:mobile` (Jest, also part of
`bun run test`), `bun run fmt:check`. Native health: `bun run --cwd apps/mobile doctor`. Bundle check without a
device: `npx expo export --platform ios` (or `android`) in this directory.

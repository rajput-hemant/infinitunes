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
device: `bunx expo export --platform ios` (or `android`) in this directory.

## Known warnings

- `expo-doctor` fails "Check that no duplicate dependencies are installed" for `expo-asset`, `expo-constants`,
  `expo-font`, `expo-glass-effect` and `expo-linking`. Every listed copy is the same version: Bun's isolated
  installs create one folder per peer-dependency variant (`expo` and these modules name each other as peers),
  and autolinking and Metro resolve a single copy. Only a duplicate with a different version is a real problem.
  expo-doctor has no setting to skip the check, and the hoisted linker is not an option (see `AGENTS.md`).
- The web app's Vercel install also installs this app's dependencies. `bun install --filter @infinitunes/web`
  does not avoid them: `@better-auth/expo` (a dependency of `@infinitunes/auth`) resolves its optional `expo-*`
  peers to this app's copies, which bring in `expo` and React Native. Nothing native is built or bundled there.
- Lock screen and notification controls offer play/pause and scrubbing but no next/previous track: expo-audio
  wires those only for its `AudioPlaylist`, which reports no load error (the app needs it to step down a
  bitrate), so playback uses a single `AudioPlayer`.

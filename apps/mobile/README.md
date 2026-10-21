# @infinitunes/mobile

The Infinitunes iOS and Android app (Expo SDK 58, Expo Router, React Native New Architecture). It talks to the
web app (`apps/web`) over `/api/trpc` and `/api/auth`.

## Run

Runs as a development build on a physical device (Expo Go cannot run it). Full setup for Android and iPhone:
[docs/mobile-device-setup.md](../../docs/mobile-device-setup.md). In short: set `EXPO_PUBLIC_API_URL` in
`.env.local` to the computer's LAN address (`http://<LAN-IP>:3000`), install once with
`bun run mobile:android` or `bun run mobile:ios`, then `bun run dev:mobile`.

Screens sit at the web app's paths, so a web link opens in the app with its scheme, e.g.
`npx uri-scheme open infinitunes://album/<name>/<token> --ios`.

## Checks

From the repo root: `bun run lint`, `bun run type-check`, `bun run test:mobile` (Jest, also part of
`bun run test`), `bun run fmt:check`. Native health: `bun run mobile:doctor`. Bundle check without a
device: `bunx expo export --platform ios` (or `android`) in this directory.

## Known warnings

- `expo-doctor` fails "Check that no duplicate dependencies are installed" for `expo-asset`, `expo-constants`,
  `expo-file-system`, `expo-font`, `expo-glass-effect` and `expo-linking`. Every listed copy is the same version:
  Bun's isolated installs create one folder per peer-dependency variant (`expo` and these modules name each
  other as peers), and autolinking and Metro resolve a single copy. Only a duplicate with a different version is
  a real problem. The one exception it lists, `react` 19.3.1 in `packages/core/node_modules`, is that package's
  dev copy for its own tests; the bundle holds only this app's 19.3.0.
  expo-doctor has no setting to skip the check, and the hoisted linker is not an option (see `AGENTS.md`).
- The web app's Vercel install also installs this app's dependencies. `bun install --filter @infinitunes/web`
  does not avoid them: `@better-auth/expo` (a dependency of `@infinitunes/auth`) resolves its optional `expo-*`
  peers to this app's copies, which bring in `expo` and React Native. Nothing native is built or bundled there.
- Lock screen and notification controls offer play/pause and scrubbing but no next/previous track: expo-audio
  wires those only for its `AudioPlaylist`, which reports no load error (the app needs it to step down a
  bitrate), so playback uses a single `AudioPlayer`.

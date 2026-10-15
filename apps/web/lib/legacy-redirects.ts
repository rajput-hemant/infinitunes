/**
 * The settings area was three routes; it is one page now. Old links and
 * bookmarks move permanently (308) to the matching section of `/settings`.
 * Wired up in `next.config.ts`, which runs before the proxy.
 */
export const legacySettingsRedirects = [
  { source: "/settings/appearance", destination: "/settings#appearance" },
  { source: "/settings/preferences", destination: "/settings#playback" },
].map((redirect) => ({ ...redirect, permanent: true as const }));

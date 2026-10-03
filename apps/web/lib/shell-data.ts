import type { FooterDetails, MegaMenu } from "@infinitunes/types";

export const EMPTY_MEGA_MENU: MegaMenu = {
  mega_menu: { top_artists: [], top_playlists: [], new_releases: [] },
};

export const EMPTY_FOOTER: FooterDetails = {
  playlist: [],
  artist: [],
  album: [],
  actor: [],
};

/**
 * The navbar and footer render on every page, so an upstream failure here must
 * not take the whole shell down: log it and render the section empty instead.
 */
async function orFallback<T>(
  label: string,
  request: Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await request;
  } catch (error) {
    console.error(`[shell] ${label} unavailable, rendering without it`, error);
    return fallback;
  }
}

export function megaMenuOrEmpty(request: Promise<MegaMenu>): Promise<MegaMenu> {
  return orFallback("megaMenu", request, EMPTY_MEGA_MENU);
}

export function footerOrEmpty(
  request: Promise<FooterDetails>,
): Promise<FooterDetails> {
  return orFallback("footer", request, EMPTY_FOOTER);
}

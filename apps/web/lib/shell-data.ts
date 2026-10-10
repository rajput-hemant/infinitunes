import type { MegaMenu } from "@infinitunes/types";

import { orFallback } from "~/lib/degrade";

export const EMPTY_MEGA_MENU: MegaMenu = {
  mega_menu: { top_artists: [], top_playlists: [], new_releases: [] },
};

export function megaMenuOrEmpty(request: Promise<MegaMenu>): Promise<MegaMenu> {
  return orFallback("megaMenu", request, EMPTY_MEGA_MENU, "shell");
}

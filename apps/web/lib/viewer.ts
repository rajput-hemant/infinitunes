import { cache } from "react";

import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import type { Viewer } from "~/lib/viewer-types";

/**
 * The signed-in visitor and their library, read once per request. It starts
 * from the session cookie, so it is request data: the root layout hands the
 * (un-awaited) promise to `ViewerProvider` and the small client islands that
 * need it (sidebar library, tab bar, user menu, player) resolve it behind their
 * own `<Suspense>`. Nothing in a layout body awaits it, which is what lets the
 * layout chrome prerender. It is memoized per request, so the layout, the
 * detail headers and the song lists share one session lookup and one library
 * read.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const user = await getUser();
  if (!user)
    return { user: undefined, playlists: undefined, favorites: undefined };

  const [playlists, favorites] = await Promise.all([
    orFallback("user playlists", getUserPlaylists(), undefined),
    orFallback("user favorites", getUserFavorites(), null),
  ]);

  return { user, playlists, favorites };
});

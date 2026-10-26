import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import type { Favorite } from "@infinitunes/db/schema";

import type { User } from "~/lib/auth";

/**
 * What the root layout's client islands know about the visitor. `playlists` is
 * `undefined` when signed out or when the library could not be loaded, and
 * `favorites` is `null` when only the favorites failed to load.
 */
export type Viewer = {
  user: User | undefined;
  playlists: PlaylistSummary[] | undefined;
  favorites: Favorite | null | undefined;
};

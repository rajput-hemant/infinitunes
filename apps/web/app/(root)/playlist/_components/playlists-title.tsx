"use client";

import { SearchParamsBoundary } from "~/components/search-params-boundary";

/** "Top Playlists", or "<Language> Music Playlists" once `?lang=` is known. */
export function PlaylistsTitle() {
  return (
    <SearchParamsBoundary
      render={(params) => {
        const lang = params?.get("lang");

        return `${lang ? `${lang} Music` : "Top"} Playlists`;
      }}
    />
  );
}

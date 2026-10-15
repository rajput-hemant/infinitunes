"use client";

import { SearchParamsBoundary } from "~/components/search-params-boundary";

/** "Trending across your languages", or the chosen language's name. */
export function AlbumsSubtitle() {
  return (
    <SearchParamsBoundary
      render={(params) => {
        const lang = params?.get("lang");

        return lang
          ? `${lang.charAt(0).toUpperCase()}${lang.slice(1)} albums trending this week`
          : "Trending across your languages";
      }}
    />
  );
}

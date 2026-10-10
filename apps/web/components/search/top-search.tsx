import { api } from "~/lib/trpc/server";
import { getHref } from "~/lib/utils";

import { SearchRow } from "./search-row";
import { searchUi } from "./search-ui";

const LABEL_ID = "search-group-trending";

/** The palette's idle "Trending" group, rendered as listbox options. */
export async function TopSearch() {
  const topSearches = await api.search.top();
  if (!topSearches.length) return null;

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- listbox option group, no native element fits
    <div role="group" aria-labelledby={LABEL_ID}>
      <div id={LABEL_ID} className={searchUi.groupLabel}>
        Trending
      </div>

      {topSearches.map((item) => (
        <SearchRow
          key={item.id}
          option
          href={getHref(item.perma_url, item.type)}
          title={item.title}
          subtitle={item.subtitle}
          visual={{ kind: "image", src: item.image, type: item.type }}
          round={item.type === "artist"}
        />
      ))}
    </div>
  );
}

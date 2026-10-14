import { SearchRow } from "~/components/search/search-row";
import { searchUi } from "~/components/search/search-ui";
import { api } from "~/lib/trpc/server";
import { cn, getHref } from "~/lib/utils";

export async function TopSearches() {
  const topSearches = await api.search.top();
  if (!topSearches.length) return null;

  return (
    <section aria-labelledby="top-searches">
      <h2 id="top-searches" className={cn("mb-3", searchUi.sectionTitle)}>
        Top searches
      </h2>

      {topSearches.map((item) => (
        <SearchRow
          key={item.id}
          href={getHref(item.perma_url, item.type)}
          title={item.title}
          subtitle={item.subtitle}
          visual={{ kind: "image", src: item.image, type: item.type }}
          round={item.type === "artist"}
        />
      ))}
    </section>
  );
}

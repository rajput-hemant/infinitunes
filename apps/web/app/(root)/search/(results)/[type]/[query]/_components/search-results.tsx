"use client";

import { uniqueBy } from "@infinitunes/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, SearchX } from "lucide-react";
import type { ComponentProps } from "react";

import { LibraryEmpty } from "~/components/library/library-section";
import { QueryScope } from "~/components/query-scope";
import { searchUi } from "~/components/search/search-ui";
import { SliderCard } from "~/components/slider/slider-card";
import { SongListClient } from "~/components/song-list/song-list.client";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { trpc } from "~/lib/trpc/vanilla";

import type { CardEntry, SearchPage } from "./search-page";
import { toSearchPage } from "./search-page";
import type { ListSearchType } from "./type-map";
import { SEARCH_TYPE_MAP } from "./type-map";

type SearchResultsProps = {
  query: string;
  type: ListSearchType;
  initialPage: SearchPage;
} & Pick<
  ComponentProps<typeof SongListClient>,
  "user" | "userFavorites" | "userPlaylists"
>;

/** Artist results are named `name`; every other card type uses `title`. */
function getCardTitle(result: CardEntry) {
  return "name" in result ? result.name : result.title;
}

function getCardSubtitle(result: CardEntry) {
  return "subtitle" in result ? result.subtitle : result.role;
}

/** Podcast (show) results carry artwork as `image_file_url`; they have no `image`. */
function getCardImage(result: CardEntry) {
  return result.type === "show" ? result.image_file_url : result.image;
}

function SearchResultsContent(props: SearchResultsProps) {
  const { query, type, initialPage, user, userFavorites, userPlaylists } =
    props;

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["search-results", type, query],
      queryFn: async ({ pageParam }) =>
        toSearchPage(
          await trpc.search.byType.query({
            q: query,
            type: SEARCH_TYPE_MAP[type],
            page: pageParam,
            n: 50,
          }),
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        allPages.length * 50 < lastPage.total ? allPages.length + 1 : undefined,
      initialData: { pages: [initialPage], pageParams: [1] },
    });

  const songRows = uniqueBy(
    data.pages.flatMap((page) => page.rows),
    (row) => row.id,
  );
  const cards = uniqueBy(
    data.pages.flatMap((page) => page.cards),
    (card) => card.id,
  );
  const hasResults = songRows.length > 0 || cards.length > 0;

  const [ref] = useIntersectionObserver({
    threshold: 0.5,
    onChange(isIntersecting) {
      if (isIntersecting) {
        fetchNextPage();
      }
    },
  });

  if (!hasResults) {
    return (
      <LibraryEmpty
        icon={SearchX}
        title="No results found"
        description={`Nothing matched "${query}". Check the spelling or try a different search.`}
      />
    );
  }

  return (
    <>
      {type === "song" ? (
        <SongListClient
          items={songRows}
          user={user}
          userFavorites={userFavorites}
          userPlaylists={userPlaylists}
        />
      ) : (
        <div className={searchUi.grid}>
          {cards.map((result) => (
            <SliderCard
              key={result.id}
              name={getCardTitle(result)}
              url={result.perma_url}
              subtitle={getCardSubtitle(result)}
              type={result.type}
              image={getCardImage(result)}
              className={searchUi.gridCard}
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div
          ref={ref}
          className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground"
        >
          {isFetchingNextPage ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading...
            </>
          ) : null}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          You have reached the end of these results.
        </p>
      )}
    </>
  );
}

export function SearchResults(
  props: ComponentProps<typeof SearchResultsContent>,
) {
  return (
    <QueryScope>
      <SearchResultsContent {...props} />
    </QueryScope>
  );
}

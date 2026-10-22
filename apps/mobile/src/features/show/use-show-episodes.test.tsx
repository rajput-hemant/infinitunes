import type { Show } from "@infinitunes/types";
import { rawEpisode, rawSeason, rawShow } from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { procedure } from "~/test/trpc-mock";

import { useShowEpisodes } from "./use-show-episodes";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * A show whose season 1 lists `seasonCount` episodes (`undefined`: the show has
 * no entry for the season) and which has `total` episodes overall.
 */
function showOf(seasonCount: string | undefined, total: string): Show {
  const show = rawShow();
  const season = rawSeason(1);
  return {
    ...show,
    seasons:
      seasonCount === undefined
        ? []
        : [
            {
              ...season,
              more_info: { ...season.more_info, numEpisodes: seasonCount },
            },
          ],
    show_details: {
      ...show.show_details,
      more_info: { ...show.show_details.more_info, total_episodes: total },
    },
  };
}

/** Episodes by `page`; past the last page upstream answers `[]`. */
function serve(...pages: ReturnType<typeof rawEpisode>[][]) {
  procedure("show.episodes").mockImplementation(async (input) => {
    const { page } = input as { page: number };
    return pages[page - 1] ?? [];
  });
}

function renderEpisodes(show: Show) {
  return renderHook(() => useShowEpisodes({ show, season: 1, sort: "desc" }), {
    wrapper,
  });
}

describe("useShowEpisodes", () => {
  it("stops at the season's own episode count, not the show's total", async () => {
    serve([rawEpisode("1"), rawEpisode("2")], [rawEpisode("3")]);
    const { result } = await renderEpisodes(showOf("2", "9"));

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    expect(result.current.hasNextPage).toBe(false);
  });

  it("falls back to the show's total when the season has no count entry", async () => {
    serve([rawEpisode("1"), rawEpisode("2")], [rawEpisode("3")]);
    const { result } = await renderEpisodes(showOf(undefined, "3"));

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("keeps paging while the count is unknown, until a page comes back empty", async () => {
    serve([rawEpisode("1")], [rawEpisode("2")]);
    const { result } = await renderEpisodes(showOf(undefined, "oops"));

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(result.current.items).toHaveLength(2);
  });
});

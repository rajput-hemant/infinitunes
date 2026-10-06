import { describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { AudioPlayerProvider } from "react-use-audio-player";
import superjson from "superjson";

import { api } from "../../lib/trpc/client";

// SongList is an async server component; signed out, it skips every db read.
const queries = await import("~/lib/db/queries");
mock.module("~/lib/auth", () => ({ getUser: async () => null }));
mock.module("~/lib/db/queries", () => ({
  ...queries,
  getUserPlaylists: async () => [],
  getUserFavorites: async () => undefined,
}));

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});

const { SongList } = await import("../../components/song-list/song-list");

describe("song list titles", () => {
  it("renders HTML entities decoded in the title link and cover alt text", async () => {
    const song = {
      id: "s1",
      type: "song",
      title: "Tom &amp; Jerry &#039;99",
      perma_url: "https://www.jiosaavn.com/song/tom/s1",
      image: "https://c.saavncdn.com/x-150x150.jpg",
      more_info: {},
    } as unknown as Song;

    const html = renderToStaticMarkup(
      <AppRouterContext.Provider value={{} as never}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AudioPlayerProvider>
                {await SongList({ items: [song] })}
              </AudioPlayerProvider>
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );

    const doc = new DOMParser().parseFromString(html, "text/html");
    const link = [...doc.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Jerry"),
    );
    const cover = doc.querySelector("img[alt]");

    // Parsed DOM text/attributes are the decoded strings, one assertion per
    // site so a failure names which one regressed.
    expect(link?.textContent).toBe("Tom & Jerry '99");
    expect(cover?.getAttribute("alt")).toBe("Tom & Jerry '99");
    // The only entity left in the markup is React's own single-pass escape.
    expect(html).not.toContain("&amp;amp;");
    expect(html).not.toContain("&amp;#039;");
  });
});

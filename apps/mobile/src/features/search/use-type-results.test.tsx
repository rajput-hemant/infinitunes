import { rawAlbum } from "@infinitunes/types/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { procedure } from "~/test/trpc-mock";

import { useTypeResults } from "./use-type-results";

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const albums = (ids: string[]) =>
  ids.map((id) => rawAlbum({ id, title: `Album ${id}` }));

describe("useTypeResults", () => {
  it("fetches the next page only while the total says there is more", async () => {
    procedure("search.byType")
      .mockResolvedValueOnce({ total: 60, start: 0, results: albums(["a"]) })
      .mockResolvedValueOnce({ total: 60, start: 50, results: albums(["b"]) });
    const { result } = await renderHook(() => useTypeResults("rock", "album"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    await act(async () => result.current.loadMore());

    expect(procedure("search.byType")).toHaveBeenCalledTimes(2);
    expect(procedure("search.byType")).toHaveBeenLastCalledWith({
      q: "rock",
      type: "albums",
      page: 2,
      n: 50,
    });
  });

  it("keeps a repeated entry once", async () => {
    procedure("search.byType")
      .mockResolvedValueOnce({ total: 60, start: 0, results: albums(["a"]) })
      .mockResolvedValueOnce({
        total: 60,
        start: 50,
        results: albums(["a", "b"]),
      });
    const { result } = await renderHook(() => useTypeResults("rock", "album"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.entries.map((entry) => entry.id)).toEqual([
        "a",
        "b",
      ]),
    );
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useInfiniteList } from "./use-infinite-list";

type Item = { id: string };
type Page = { items: Item[]; last: boolean };

const page = (ids: string[], last = false): Page => ({
  items: ids.map((id) => ({ id })),
  last,
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function listOf(
  fetchPage: (page: number) => Promise<Page>,
  options: { firstPage?: number; enabled?: boolean } = {},
) {
  return renderHook(
    () =>
      useInfiniteList<Page, Item>({
        queryKey: ["test-list"],
        fetchPage,
        itemsOf: (p) => p.items,
        hasMore: (p) => !p.last,
        keyOf: (item) => item.id,
        ...options,
      }),
    { wrapper },
  );
}

const ids = (items: readonly Item[]) => items.map((item) => item.id);

describe("useInfiniteList", () => {
  it("pages by number from the first page and appends each page on loadMore", async () => {
    const fetchPage = jest.fn(async (n: number) =>
      n === 1 ? page(["a", "b"]) : page(["c"], true),
    );
    const { result } = await listOf(fetchPage);
    await waitFor(() => expect(ids(result.current.items)).toEqual(["a", "b"]));
    expect(fetchPage).toHaveBeenCalledWith(1);

    await act(async () => result.current.loadMore());

    await waitFor(() =>
      expect(ids(result.current.items)).toEqual(["a", "b", "c"]),
    );
    expect(fetchPage).toHaveBeenLastCalledWith(2);
  });

  it("starts at page 0 for the upstream lists that count from 0", async () => {
    const fetchPage = jest.fn(async () => page(["a"], true));
    await listOf(fetchPage, { firstPage: 0 });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith(0));
    expect(fetchPage).not.toHaveBeenCalledWith(1);
  });

  it("keeps the first of an item upstream repeats across pages", async () => {
    const { result } = await listOf(async (n) =>
      n === 1 ? page(["a", "b"]) : page(["b", "c"], true),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => result.current.loadMore());

    await waitFor(() =>
      expect(ids(result.current.items)).toEqual(["a", "b", "c"]),
    );
  });

  it("ends the list at an empty page even when upstream says there is more", async () => {
    const fetchPage = jest.fn(async (n: number) =>
      n === 1 ? page(["a"]) : page([], false),
    );
    const { result } = await listOf(fetchPage);
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => result.current.loadMore());
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
    expect(result.current.hasNextPage).toBe(false);

    await act(async () => result.current.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("does not fetch past the last page", async () => {
    const fetchPage = jest.fn(async () => page(["a"], true));
    const { result } = await listOf(fetchPage);
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => result.current.loadMore());

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("asks for one next page at a time", async () => {
    const second = Promise.withResolvers<Page>();
    const fetchPage = jest.fn((n: number) =>
      n === 1 ? Promise.resolve(page(["a"])) : second.promise,
    );
    const { result } = await listOf(fetchPage);
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve(page(["b"], true)));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
  });

  it("stays idle while disabled", async () => {
    const fetchPage = jest.fn(async () => page(["a"], true));
    const { result } = await listOf(fetchPage, { enabled: false });
    await act(async () => {});

    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it("refetches every loaded page on refetch", async () => {
    let version = 1;
    const fetchPage = jest.fn(async () => page([`v${version}`], true));
    const { result } = await listOf(fetchPage);
    await waitFor(() => expect(ids(result.current.items)).toEqual(["v1"]));

    version = 2;
    await act(async () => void (await result.current.refetch()));

    await waitFor(() => expect(ids(result.current.items)).toEqual(["v2"]));
  });
});

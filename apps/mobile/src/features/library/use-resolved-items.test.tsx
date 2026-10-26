import {
  resolveWithCache,
  type ItemCache,
} from "@infinitunes/core/liked-songs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { signInAs } from "~/test/session-mock";
import { deferred } from "~/test/user-library";

import {
  UNAVAILABLE,
  useResolvedItems,
  type IdSource,
} from "./use-resolved-items";

type Item = { id: string };

function makeWrapper() {
  // One cache for the whole render, rerenders included.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

type Props = {
  source: IdSource;
  resolve: (
    ids: string[],
    cache: ItemCache<Item>,
  ) => Promise<Item[] | undefined>;
};

const idsOf = (ids: string[]): IdSource => ({
  ids,
  reload: jest.fn(async () => {}),
});

function renderList(initial: Props) {
  return renderHook(
    ({ source, resolve }: Props) =>
      useResolvedItems({ scope: "test", itemKind: "test", source, resolve }),
    { wrapper: makeWrapper(), initialProps: initial },
  );
}

const echo = jest.fn(async (ids: string[]) => ids.map((id) => ({ id })));

beforeEach(async () => {
  echo.mockClear();
  await act(async () => signInAs("alice"));
});

describe("useResolvedItems", () => {
  it("is loading until the ids are known, and asks for nothing meanwhile", async () => {
    const { result } = await renderList({
      source: { ids: undefined, reload: jest.fn(async () => {}) },
      resolve: echo,
    });
    await act(async () => {});

    expect(result.current.status).toBe("loading");
    expect(echo).not.toHaveBeenCalled();
  });

  it("is loading, and asks for nothing, while signed out", async () => {
    await act(async () => signInAs(null));
    const { result } = await renderList({
      source: idsOf(["a"]),
      resolve: echo,
    });
    await act(async () => {});

    expect(result.current.status).toBe("loading");
    expect(echo).not.toHaveBeenCalled();
  });

  it("resolves the ids into items without calling upstream for none", async () => {
    const empty = await renderList({ source: idsOf([]), resolve: echo });
    await waitFor(() => expect(empty.result.current.status).toBe("ready"));
    expect(echo).not.toHaveBeenCalled();
    expect(empty.result.current).toMatchObject({ items: [], missing: 0 });

    const some = await renderList({ source: idsOf(["a", "b"]), resolve: echo });
    await waitFor(() => expect(some.result.current.status).toBe("ready"));
    expect(some.result.current).toMatchObject({
      items: [{ id: "a" }, { id: "b" }],
      missing: 0,
    });
  });

  it("counts the ids upstream no longer has", async () => {
    const { result } = await renderList({
      source: idsOf(["a", "b", "c"]),
      resolve: async () => [{ id: "a" }],
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current).toMatchObject({ items: [{ id: "a" }], missing: 2 });
  });

  it("is an error with a retry when upstream cannot be reached", async () => {
    const resolve = jest
      .fn<Promise<Item[] | undefined>, [string[]]>()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue([{ id: "a" }]);
    const { result } = await renderList({ source: idsOf(["a"]), resolve });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ error: UNAVAILABLE });

    await act(async () => {
      if (result.current.status === "error") result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("reports the source's own failure, and retries by reloading the source", async () => {
    const reload = jest.fn(async () => {});
    const failure = new Error("no history");
    const { result } = await renderList({
      source: { ids: undefined, error: failure, reload },
      resolve: echo,
    });

    expect(result.current).toMatchObject({ status: "error", error: failure });
    await act(async () => {
      if (result.current.status === "error") result.current.retry();
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(echo).not.toHaveBeenCalled();
  });

  it("keeps the old items up while a changed id list loads", async () => {
    const next = deferred<Item[]>();
    const resolve = jest
      .fn<Promise<Item[] | undefined>, [string[]]>()
      .mockResolvedValueOnce([{ id: "a" }, { id: "b" }])
      .mockReturnValueOnce(next.promise);
    const { result, rerender } = await renderList({
      source: idsOf(["a", "b"]),
      resolve,
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await rerender({ source: idsOf(["a"]), resolve });

    // An unlike is a one-row change: no skeleton in between.
    expect(result.current).toMatchObject({
      status: "ready",
      items: [{ id: "a" }, { id: "b" }],
    });

    await act(async () => next.resolve([{ id: "a" }]));
    await waitFor(() =>
      expect(result.current).toMatchObject({ items: [{ id: "a" }] }),
    );
  });

  it("never shows one account's items to the next", async () => {
    const bob = deferred<Item[]>();
    const resolve = jest
      .fn<Promise<Item[] | undefined>, [string[]]>()
      .mockResolvedValueOnce([{ id: "alices-song" }])
      .mockReturnValueOnce(bob.promise);
    const source = idsOf(["x"]);
    const { result } = await renderList({ source, resolve });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => signInAs("bob"));

    await waitFor(() => expect(resolve).toHaveBeenCalledTimes(2));
    expect(result.current.status).toBe("loading");
    await act(async () => bob.resolve([{ id: "bobs-song" }]));
    await waitFor(() =>
      expect(result.current).toMatchObject({ items: [{ id: "bobs-song" }] }),
    );
  });

  it("looks up only new ids when the list changes, and every id on refresh", async () => {
    const lookup = jest.fn(async (ids: string[]) => ({
      found: new Map(ids.map((id) => [id, { id }])),
      gone: [],
    }));
    const resolve = (ids: string[], cache: ItemCache<Item>) =>
      resolveWithCache(ids, cache, lookup);
    const { result, rerender } = await renderList({
      source: idsOf(["a", "b"]),
      resolve,
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(lookup).toHaveBeenLastCalledWith(["a", "b"]);

    // A like: one lookup, for the new id only.
    await rerender({ source: idsOf(["a", "b", "c"]), resolve });
    await waitFor(() =>
      expect(result.current).toMatchObject({
        items: [{ id: "a" }, { id: "b" }, { id: "c" }],
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenLastCalledWith(["c"]);

    // An unlike: no lookup at all.
    await rerender({ source: idsOf(["a", "c"]), resolve });
    await waitFor(() =>
      expect(result.current).toMatchObject({
        items: [{ id: "a" }, { id: "c" }],
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(2);

    await act(async () => {
      if (result.current.status === "ready") await result.current.refresh();
    });
    expect(lookup).toHaveBeenCalledTimes(3);
    expect(lookup).toHaveBeenLastCalledWith(["a", "c"]);
  });

  it("refreshes the source and the items, and keeps the list when the lookup fails", async () => {
    const source = idsOf(["a"]);
    const resolve = jest
      .fn<Promise<Item[] | undefined>, [string[]]>()
      .mockResolvedValueOnce([{ id: "a" }])
      .mockRejectedValueOnce(new Error("down"));
    const { result } = await renderList({ source, resolve });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      if (result.current.status === "ready") result.current.refresh();
    });

    expect(source.reload).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(resolve).toHaveBeenCalledTimes(2));
    // The list stays as it was.
    expect(result.current).toMatchObject({
      status: "ready",
      items: [{ id: "a" }],
    });
  });
});

import { expect, it } from "bun:test";

import { useInfiniteQuery } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { QueryScope } from "../../components/query-scope";
import { waitFor } from "./wait-for";

it("uses each server page when returning to a previously paginated sort", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const requests: number[] = [];
  function List({ sort, seed }: { sort: string; seed: string[] }) {
    const { data, fetchNextPage } = useInfiniteQuery({
      queryKey: ["episodes", sort],
      queryFn: async ({ pageParam }) => {
        requests.push(pageParam);
        return [`${sort} page ${pageParam}`];
      },
      initialPageParam: 1,
      getNextPageParam: (_last, pages) => pages.length + 1,
      initialData: { pages: [seed], pageParams: [1] },
    });
    return (
      <button onClick={() => void fetchNextPage()}>
        {data.pages.flat().join(", ")}
      </button>
    );
  }
  async function render(sort: string, seed: string[]) {
    await act(async () =>
      root.render(
        <QueryScope seed={seed}>
          <List sort={sort} seed={seed} />
        </QueryScope>,
      ),
    );
  }
  try {
    await render("desc", ["old first"]);
    expect(requests).toEqual([]);
    await act(async () => host.querySelector("button")?.click());
    await waitFor(() => host.textContent === "old first, desc page 2");
    expect(host.textContent).toBe("old first, desc page 2");
    await render("asc", ["ascending"]);
    expect(host.textContent).toBe("ascending");
    await render("desc", ["new first"]);
    expect(host.textContent).toBe("new first");
    expect(requests).toEqual([2]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

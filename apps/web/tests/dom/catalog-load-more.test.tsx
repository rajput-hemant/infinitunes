import { afterEach, beforeEach, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

type ObserverOptions = { onChange: (isIntersecting: boolean) => void };

let observerOptions: ObserverOptions | undefined;

mock.module("../../hooks/use-intersection-observer", () => ({
  useIntersectionObserver: (options: ObserverOptions) => {
    observerOptions = options;
    return [() => {}] as const;
  },
}));

const { CatalogLoadMore } = await import("../../components/catalog-load-more");

const roots: Root[] = [];

async function render(props: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(<CatalogLoadMore {...props} />));
  return container;
}

beforeEach(() => {
  observerOptions = undefined;
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("shows the end marker and no loader when there is no next page", async () => {
  const container = await render({
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: () => {},
  });

  expect(container.textContent).toContain("You have seen it all");
  expect(container.textContent).not.toContain("Loading...");
});

it("requests the next page only when the placeholder becomes visible", async () => {
  let loads = 0;
  await render({
    hasNextPage: true,
    isFetchingNextPage: false,
    onLoadMore: () => void loads++,
  });

  await act(async () => observerOptions?.onChange(false));
  expect(loads).toBe(0);

  await act(async () => observerOptions?.onChange(true));
  expect(loads).toBe(1);
});

it("shows a loading state while the next page is fetching", async () => {
  const container = await render({
    hasNextPage: true,
    isFetchingNextPage: true,
    onLoadMore: () => {},
  });

  expect(container.textContent).toContain("Loading...");
  expect(container.textContent).not.toContain("You have seen it all");
});

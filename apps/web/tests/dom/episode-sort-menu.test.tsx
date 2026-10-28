import { afterEach, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { waitFor } from "./wait-for";

// The URL the router has committed; a click alone must not change it.
let query = new URLSearchParams();
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSearchParams: () => query,
}));
const { KeyedByParams } =
  await import("../../components/search-params-boundary");
const { EpisodeSortMenu } =
  await import("../../app/(root)/show/[name]/[season]/[token]/_components/episode-sort-menu");

const router = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
} as never;
let root: Root;
let host: HTMLElement;

function Section() {
  const sort = query.get("sort") === "asc" ? "asc" : "desc";
  return (
    <>
      <EpisodeSortMenu sort={sort} />
      <p data-testid="list">{sort} list</p>
    </>
  );
}

function render() {
  return act(async () =>
    root.render(
      <AppRouterContext.Provider value={router}>
        <KeyedByParams
          params={["sort"]}
          fallback={<p data-testid="skeleton">loading</p>}
        >
          <Section />
        </KeyedByParams>
      </AppRouterContext.Provider>,
    ),
  );
}

async function pick(label: string) {
  await act(async () =>
    (host.querySelector("button") as HTMLButtonElement).click(),
  );
  await waitFor(() => document.querySelector("[role=menuitem]") !== null);
  const item = [...document.querySelectorAll("[role=menuitem]")].find(
    (el) => el.textContent === label,
  ) as HTMLElement;
  await act(async () => item.click());
}

const text = () => host.querySelector("[data-testid]")?.textContent;

afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
  query = new URLSearchParams();
});

it("shows the skeleton at click time, then the new order, in both directions", async () => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await render();
  expect(text()).toBe("desc list");

  for (let round = 0; round < 2; round++) {
    await pick("Oldest");
    expect(text()).toBe("loading");
    query = new URLSearchParams("sort=asc");
    await render();
    expect(text()).toBe("asc list");

    await pick("Newest");
    expect(text()).toBe("loading");
    query = new URLSearchParams("sort=desc");
    await render();
    expect(text()).toBe("desc list");
  }
});

it("shows the new order when the URL changes without a click (back/forward)", async () => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await render();
  query = new URLSearchParams("sort=asc");
  await render();
  expect(text()).toBe("asc list");
  query = new URLSearchParams();
  await render();
  expect(text()).toBe("desc list");
});

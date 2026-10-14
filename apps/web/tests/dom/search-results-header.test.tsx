import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let params: Record<string, string> | "pending" = "pending";
const pending = new Promise<never>(() => {});
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useParams: () => {
    if (params === "pending") throw pending;
    return params;
  },
}));
const { SearchResultsHeader } =
  await import("../../app/(root)/search/(results)/[type]/[query]/_components/results-header");

const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(<SearchResultsHeader />));
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  params = "pending";
});

describe("SearchResultsHeader", () => {
  it("shows a placeholder of the same shape while the route's params are unknown", async () => {
    const container = await mount();

    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("header")).not.toBeNull();
    expect(container.querySelector("nav")).not.toBeNull();
  });

  it("names the decoded query and marks the active type", async () => {
    params = { type: "song", query: "arijit%20singh" };
    const container = await mount();

    expect(container.querySelector("h1")?.textContent).toBe(
      'Results for "arijit singh"',
    );
    const links = [...container.querySelectorAll("nav a")].map((a) => ({
      text: a.textContent,
      href: a.getAttribute("href"),
      current: a.getAttribute("aria-current"),
    }));
    expect(links.find((l) => l.current === "page")?.text).toBe("Songs");
    expect(links.find((l) => l.text === "Albums")?.href).toBe(
      "/search/album/arijit%20singh",
    );
  });

  it("renders nothing for a type it does not know", async () => {
    params = { type: "nope", query: "x" };
    const container = await mount();

    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
  });
});

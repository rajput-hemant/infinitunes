import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let segment: string | null = null;
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSelectedLayoutSegment: () => segment,
}));
const { LabelTabNav } =
  await import("../../app/(root)/label/[name]/[token]/_components/label-tab-nav");

const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<LabelTabNav name="t-series" token="tok_" />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  segment = null;
});

const links = (container: HTMLElement) =>
  [...container.querySelectorAll("a")].map((a) => ({
    text: a.textContent,
    href: a.getAttribute("href"),
    current: a.getAttribute("aria-current"),
  }));

describe("LabelTabNav", () => {
  it("links Songs to the bare label route and Albums to its child route", async () => {
    const container = await mount();

    expect(links(container).map(({ text, href }) => [text, href])).toEqual([
      ["Songs", "/label/t-series/tok_"],
      ["Albums", "/label/t-series/tok_/albums"],
    ]);
  });

  it("marks the tab the selected child segment names, and Songs for none", async () => {
    let container = await mount();
    expect(links(container).map((l) => l.current)).toEqual(["page", null]);

    segment = "albums";
    container = await mount();
    expect(links(container).map((l) => l.current)).toEqual([null, "page"]);
  });
});

import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let segment: string | null = null;
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSelectedLayoutSegment: () => segment,
}));
const { ArtistTabNav } =
  await import("../../app/(root)/artist/[name]/[token]/_components/artist-tab-nav");

const roots: Root[] = [];

async function mount(showBio = true) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<ArtistTabNav name="a-b" token="tok_" showBio={showBio} />);
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

describe("ArtistTabNav", () => {
  it("links each tab to a child route of the artist, Overview on the bare route", async () => {
    const container = await mount();

    expect(links(container).map(({ text, href }) => [text, href])).toEqual([
      ["Overview", "/artist/a-b/tok_"],
      ["Songs", "/artist/a-b/tok_/songs"],
      ["Albums", "/artist/a-b/tok_/albums"],
      ["Biography", "/artist/a-b/tok_/bio"],
    ]);
  });

  it("marks the tab the selected child segment names, and Overview for none", async () => {
    let container = await mount();
    expect(links(container).map((l) => l.current)).toEqual([
      "page",
      null,
      null,
      null,
    ]);

    segment = "albums";
    container = await mount();
    expect(links(container).map((l) => l.current)).toEqual([
      null,
      null,
      "page",
      null,
    ]);
  });

  it("drops the Biography tab for an artist without one", async () => {
    const container = await mount(false);

    expect(links(container).map((l) => l.text)).toEqual([
      "Overview",
      "Songs",
      "Albums",
    ]);
  });
});

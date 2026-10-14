import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ArtistSpotlight } from "../../components/artist-spotlight";

const IMAGES = ["/a.png", "/b.png", "/c.png"];
const realSetInterval = window.setInterval;
const realMatchMedia = window.matchMedia;
const roots: Root[] = [];
let tick: (() => void) | undefined;

function captureInterval() {
  Object.defineProperty(window, "setInterval", {
    configurable: true,
    writable: true,
    value: (handler: () => void) => {
      tick = handler;
      return 1;
    },
  });
}

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduced && query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(<ArtistSpotlight images={IMAGES} />));
  return container;
}

const shown = (c: HTMLElement) =>
  [...c.querySelectorAll("img")].map((img) => ({
    src: img.getAttribute("src"),
    active: img.hasAttribute("data-active"),
  }));

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  window.setInterval = realSetInterval;
  window.matchMedia = realMatchMedia;
  tick = undefined;
});

describe("ArtistSpotlight", () => {
  it("shows a single artist, not the whole set", async () => {
    setReducedMotion(false);
    captureInterval();
    const c = await mount();
    expect(shown(c)).toEqual([{ src: "/a.png", active: true }]);
  });

  it("crossfades to the next artist and wraps around", async () => {
    setReducedMotion(false);
    captureInterval();
    const c = await mount();

    await act(async () => tick?.());
    expect(shown(c)).toEqual([
      { src: "/a.png", active: false },
      { src: "/b.png", active: true },
    ]);

    await act(async () => tick?.());
    await act(async () => tick?.());
    expect(shown(c)).toEqual([
      { src: "/a.png", active: true },
      { src: "/c.png", active: false },
    ]);
  });

  it("holds on the first artist when the user asked for less motion", async () => {
    setReducedMotion(true);
    captureInterval();
    const c = await mount();
    expect(tick).toBeUndefined();
    expect(shown(c)).toEqual([{ src: "/a.png", active: true }]);
  });
});

import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Queue } from "@infinitunes/types";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const played: string[] = [];
let playing = false;

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: {
    album: {
      details: {
        query: async ({ token }: { token: string }) => {
          played.push(token);
          return { list: [] };
        },
      },
    },
    get: { label: { query: async () => ({ topSongs: { songs: [] } }) } },
  },
}));
mock.module("react-use-audio-player", () => ({
  useAudioPlayerContext: () => ({
    isPlaying: playing,
    play() {},
    pause() {},
  }),
}));

const { SliderCard } = await import("../../components/slider/slider-card");
const { TilePlayPauseButton } =
  await import("../../components/song-list/play-pause-button");
const { useQueue, useCurrentSongIndex } = await import("../../hooks/use-store");

const IMAGE = "https://c.saavncdn.com/x-500x500.jpg";
const roots: Root[] = [];

async function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(node));
  return container;
}

afterEach(async () => {
  played.length = 0;
  playing = false;
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

const card = (type: "album" | "artist" | "radio_station") => (
  <SliderCard
    name="Name"
    type={type}
    url={`https://www.jiosaavn.com/${type}/name/tok`}
    image={IMAGE}
  />
);

describe("card play control", () => {
  it("is a control of its own, outside the card's link, and plays without navigating", async () => {
    const container = await mount(card("album"));
    const button = container.querySelector('button[aria-label="Play Name"]');
    if (!button) throw new Error("no play button");

    expect(button.closest("a")).toBeNull();
    expect(container.querySelector("a button")).toBeNull();
    // The link's stretched hit area sits below the button.
    const art = button.parentElement;
    expect(art?.querySelector("a")?.className).toContain("z-10");
    expect(button.className).toContain("z-20");

    const clicks: boolean[] = [];
    document.addEventListener("click", (e) => clicks.push(e.defaultPrevented));
    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(played).toEqual(["tok"]);
    // A button click has no default action that could follow an href.
    expect((button as HTMLButtonElement).type).toBe("button");
    expect(clicks).toHaveLength(1);
  });

  it("keeps the card's links pointing at the page", async () => {
    const container = await mount(card("album"));
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe("/album/name/tok");
  });

  it("sits at the bottom right of square artwork", async () => {
    const container = await mount(card("album"));
    const button = container.querySelector("[data-card-play]");
    expect(button?.getAttribute("data-card-play")).toBe("square");
    expect(button?.className).toContain("right-2");
    expect(button?.className).toContain("bottom-2");
  });

  for (const type of ["artist", "radio_station"] as const) {
    it(`centres ${type} labels under round artwork`, async () => {
      const container = await mount(
        <SliderCard
          name="Rock"
          subtitle="English Radio"
          type={type}
          url={`https://www.jiosaavn.com/${type}/name/tok`}
          image={IMAGE}
        />,
      );
      const h3 = container.querySelector("h3");
      expect(h3?.className).toContain("text-center");
      expect(h3?.querySelector("a, span")?.className).toContain("inline-flex");
      const subtitle = h3?.nextElementSibling;
      expect(subtitle?.className).toContain("text-center");
      expect(subtitle?.className).toContain("truncate");
    });

    it(`centres on ${type} art, hover/focus reveal with a fine pointer`, async () => {
      const container = await mount(card(type));
      const button = container.querySelector("[data-card-play]");
      expect(button?.getAttribute("data-card-play")).toBe("round");
      const cls = button?.className ?? "";
      expect(cls).toContain("inset-0");
      expect(cls).toContain("m-auto");
      expect(cls).not.toContain("right-2");
      expect(cls).toContain("opacity-0");
      expect(cls).toContain("group-hover:opacity-100");
      expect(cls).toContain("group-focus-within:opacity-100");
      expect(cls).toContain("pointer-fine:opacity-0");
      expect(cls).not.toContain("pointer-coarse:hidden");
      expect(button?.getAttribute("aria-label")).toBe("Play Name");
    });
  }
});

describe("song row art icon", () => {
  const rowButton = (container: HTMLElement) => {
    const button = container.querySelector("button:not([data-seed])");
    if (!button) throw new Error("no button");
    return button;
  };

  it("is a plain filled play glyph, not a heavy stroked one", async () => {
    const container = await mount(
      <TilePlayPauseButton id="s1" name="Song s1" type="song" token="s1" />,
    );
    const svg = rowButton(container).querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("lucide-play");
    expect(svg?.getAttribute("class")).toContain("fill-current");
    expect(svg?.getAttribute("stroke-width")).not.toBe("9");
  });

  /** Seeds the store from a click (not an effect), then renders its children. */
  function Current({ children }: { children: React.ReactNode }) {
    const [, setQueue] = useQueue();
    const [, setIndex] = useCurrentSongIndex();
    return (
      <>
        <button
          type="button"
          data-seed=""
          onClick={() => {
            setQueue([{ id: "s1", queueItemId: "q1" } as Queue]);
            setIndex(0);
          }}
        >
          seed
        </button>
        {children}
      </>
    );
  }

  async function seed(container: HTMLElement) {
    await act(async () => {
      container
        .querySelector("[data-seed]")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  it("shows pause for the playing track and play for the paused one", async () => {
    playing = true;
    const container = await mount(
      <Current>
        <TilePlayPauseButton
          id="s1"
          name="Song One"
          type="song"
          token="s1"
          queueItemId="q1"
        />
      </Current>,
    );
    await seed(container);
    let button = rowButton(container);
    expect(button.getAttribute("aria-label")).toBe("Pause Song One");
    expect(button.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-pause",
    );

    playing = false;
    await act(async () =>
      roots[0]?.render(
        <Current>
          <TilePlayPauseButton
            id="s1"
            name="Song One"
            type="song"
            token="s1"
            queueItemId="q1"
          />
        </Current>,
      ),
    );
    button = rowButton(container);
    expect(button.getAttribute("aria-label")).toBe("Play Song One");
    expect(button.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-play",
    );
  });
});

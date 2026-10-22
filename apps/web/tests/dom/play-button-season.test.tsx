import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

type ShowQuery = { token?: string; season?: number; sort?: string };

const fetched: ShowQuery[] = [];

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: {
    show: {
      details: {
        query: async (input: ShowQuery) => {
          fetched.push(input);
          return { episodes: [] };
        },
      },
    },
  },
}));

mock.module("react-use-audio-player", () => ({
  useAudioPlayerContext: () => ({ isPlaying: false, play() {} }),
}));

const { PlayButton } = await import("../../components/play-button");

const roots: Root[] = [];

afterEach(async () => {
  fetched.length = 0;
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

async function click(season?: number) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <PlayButton type="show" token="PjReFP-Sguk_" season={season}>
        Go
      </PlayButton>,
    );
  });
  await act(async () => container.querySelector("button")?.click());
}

describe("PlayButton show", () => {
  it("fetches the show by its perma token, as a card passes it", async () => {
    await click();
    expect(fetched[0]?.token).toBe("PjReFP-Sguk_");
  });

  it("queues the season it is given, not one parsed from the URL", async () => {
    await click(3);
    expect(fetched[0]?.season).toBe(3);
  });

  it("leaves the season to the first one when none is given", async () => {
    await click();
    expect(fetched[0]?.season).toBeUndefined();
  });
});

import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const fetched: { id: string; season?: number }[] = [];

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: {
    show: {
      episodes: {
        query: async (input: { id: string; season?: number }) => {
          fetched.push(input);
          return [];
        },
      },
    },
  },
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
      <PlayButton type="show" token="show1" season={season}>
        Go
      </PlayButton>,
    );
  });
  await act(async () => container.querySelector("button")?.click());
}

describe("PlayButton season", () => {
  it("queues the season it is given, not one parsed from the URL", async () => {
    await click(3);
    expect(fetched[0]?.season).toBe(3);
  });

  it("leaves the season to the first one when none is given", async () => {
    await click();
    expect(fetched[0]?.season).toBeUndefined();
  });
});

import { afterEach, expect, it, mock } from "bun:test";

import { createPositionStore } from "@infinitunes/core/react/position-store";
import type { Queue } from "@infinitunes/types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { getQueryClient } from "../../components/query-scope";

const query = mock(
  (): Promise<{
    synced: { time: number; text: string }[] | null;
    plain: string | null;
    instrumental: boolean;
    copyright: string | null;
    source: "lrclib" | "jiosaavn";
  }> =>
    Promise.resolve({
      synced: null,
      plain: null,
      instrumental: false,
      copyright: null,
      source: "lrclib",
    }),
);
mock.module("../../lib/trpc/vanilla", () => ({
  trpc: { song: { syncedLyrics: { query } } },
}));
const { ExpandedLyrics } =
  await import("../../components/player/expanded-lyrics");
const { lyricsQueryOptions, prefetchLyrics } =
  await import("../../lib/lyrics-query");

const track: Queue = {
  id: "lyrics",
  queueItemId: "q",
  type: "song",
  name: "Song",
  subtitle: "",
  image: "",
  url: "",
  artists: [],
  download_url: "",
  duration: 100,
};
const empty: Awaited<ReturnType<typeof query>> = {
  synced: null,
  plain: null,
  instrumental: false,
  copyright: null,
  source: "lrclib",
};
let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  getQueryClient().clear();
  document.body.innerHTML = "";
  query.mockClear();
});

async function render(data?: Awaited<ReturnType<typeof query>>) {
  if (data)
    getQueryClient().setQueryData(lyricsQueryOptions(track.id).queryKey, data);
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <ExpandedLyrics
        track={track}
        position={createPositionStore()}
        onSeek={() => {}}
      />,
    ),
  );
  return host;
}

it("shows instrumental and no-lyrics states", async () => {
  const host = await render({ ...empty, instrumental: true });
  expect(host.querySelector("output")?.textContent).toBe("Instrumental track");
  await act(async () =>
    getQueryClient().setQueryData(lyricsQueryOptions(track.id).queryKey, empty),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  expect(host.textContent).toContain("No lyrics available for this track.");
});

it("keeps plain lyrics scrollable and suppresses LRCLIB copyright", async () => {
  const host = await render({
    ...empty,
    plain: "First\nSecond",
    copyright: "LRCLIB",
  });
  const plain = host.querySelector('[aria-label="Lyrics"]');
  expect(plain?.textContent).toBe("First\nSecond");
  expect(plain?.getAttribute("tabindex")).toBe("0");
  expect(host.textContent).not.toContain("LRCLIB");
});

it("shows a labelled skeleton while loading", async () => {
  query.mockImplementation(() => new Promise(() => {}));
  try {
    const host = await render();
    expect(host.querySelector('[aria-label="Loading lyrics"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  } finally {
    query.mockImplementation(() =>
      Promise.resolve({ ...empty, source: "lrclib" }),
    );
  }
});

it("prefetches current and next lyrics into the same cache the pane reads", async () => {
  query.mockResolvedValue({
    ...empty,
    source: "lrclib",
  });
  try {
    await prefetchLyrics(["lyrics", "next"]);
    expect(query).toHaveBeenCalledWith({ id: "lyrics" });
    expect(query).toHaveBeenCalledWith({ id: "next" });
    const count = query.mock.calls.length;
    await render();
    expect(query.mock.calls.length).toBe(count);
    expect(
      getQueryClient().getQueryData(lyricsQueryOptions("next").queryKey),
    ).toEqual(empty);
  } finally {
    query.mockImplementation(() =>
      Promise.resolve({ ...empty, source: "lrclib" }),
    );
  }
});

it("seeks synced lines and retains JioSaavn attribution", async () => {
  getQueryClient().setQueryData(lyricsQueryOptions(track.id).queryKey, {
    ...empty,
    source: "jiosaavn",
    copyright: "(c) Label",
    synced: [{ time: 5, text: "First" }],
  });
  const seek = mock(() => {});
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <ExpandedLyrics
        track={track}
        position={createPositionStore(5)}
        onSeek={seek}
      />,
    ),
  );
  await act(async () => host.querySelector("button")?.click());
  expect(seek).toHaveBeenCalledWith(5);
  expect(host.textContent).toContain("(c) Label");
});

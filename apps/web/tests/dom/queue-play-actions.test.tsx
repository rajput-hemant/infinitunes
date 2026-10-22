import { afterEach, expect, it, mock } from "bun:test";

import type { ActiveRadioSession, Queue } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

const play = mock(() => {});
let isPlaying = false;
mock.module("react-use-audio-player", () => ({
  useAudioPlayerContext: () => ({ play, isPlaying }),
}));
mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push() {} }),
}));
mock.module("sonner", () => ({
  toast: Object.assign(() => {}, { success() {}, error() {} }),
}));
mock.module("~/lib/trpc/vanilla", () => ({ trpc: {} }));
mock.module("~/lib/actions", () => ({
  addSongsToPlaylist() {},
  removeSongsFromPlaylist() {},
}));
mock.module("~/components/download-button", () => ({
  useDownloadSongs: () => ({ download() {} }),
}));
mock.module("../../components/song-list/more-button-favorite", () => ({
  useTileFavorite: () => ({ isFavorite: false, like() {} }),
}));
mock.module("../../components/song-list/more-button-desktop", () => ({
  TileMoreDesktop: ({
    entries,
  }: {
    entries: { label: string; onClick: () => void }[];
  }) => (
    <>
      {entries.map((entry) => (
        <button key={entry.label} onClick={entry.onClick}>
          {entry.label}
        </button>
      ))}
    </>
  ),
}));
mock.module("../../components/song-list/more-button-mobile", () => ({
  TileMoreMobile: () => null,
}));
const { PlayButton } = await import("../../components/play-button");
const { TileMoreButton } =
  await import("../../components/song-list/more-button");
const {
  useQueue,
  useCurrentSongIndex,
  useIsPlayerInit,
  useActiveRadioSession,
} = await import("../../hooks/use-store");

const target = toQueue(rawSong({ id: "target" }));
const other = toQueue(rawSong({ id: "other" }));
const radio: ActiveRadioSession = {
  stationId: "station-1",
  name: "Station",
  type: "featured",
};
let root: Root;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
  play.mockClear();
  isPlaying = false;
});

async function mount(
  mode: "card" | "menu",
  initial: { queue: Queue[]; index: number; init: boolean },
  item: Queue = target,
) {
  const snapshot = { ...initial, radio: null as ActiveRadioSession | null };
  let seed = () => {};
  function Probe() {
    const [queue, setQueue] = useQueue();
    const [index, setIndex] = useCurrentSongIndex();
    const [init, setInit] = useIsPlayerInit();
    const [active, setActive] = useActiveRadioSession();
    Object.assign(snapshot, { queue, index, init, radio: active });
    useEffect(() => {
      seed = () => {
        setQueue(initial.queue);
        setIndex(initial.index);
        setInit(initial.init);
        setActive(radio);
      };
    });
    return null;
  }
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <>
        <Probe />
        {mode === "card" ? (
          <PlayButton type="song" token="target-token">
            Play card
          </PlayButton>
        ) : (
          <TileMoreButton item={item} showAlbum={false} favorites={null} />
        )}
      </>,
    ),
  );
  await act(async () => seed());
  const click = (label: string) =>
    act(async () => {
      const button = [...host.querySelectorAll("button")].find(
        (item) => item.textContent === label,
      );
      if (!button) throw new Error(`Missing action ${label}`);
      button.click();
    });
  return { snapshot, click };
}

for (const index of [0, 1]) {
  it(`initializes a restored queued song when the selected index was ${index}`, async () => {
    const { snapshot, click } = await mount("card", {
      queue: [target, other],
      index,
      init: false,
    });
    await click("Play card");
    expect(snapshot.init).toBe(true);
    expect(snapshot.index).toBe(0);
    expect(snapshot.queue).toEqual([target, other]);
    expect(play).not.toHaveBeenCalled();
  });
}
it("resumes the current paused card without replacing its queue", async () => {
  const { snapshot, click } = await mount("card", {
    queue: [target, other],
    index: 0,
    init: true,
  });
  await click("Play card");
  expect(play).toHaveBeenCalledTimes(1);
  expect(snapshot.queue).toEqual([target, other]);
});
it("leaves the current playing card playing", async () => {
  isPlaying = true;
  const { click } = await mount("card", {
    queue: [target],
    index: 0,
    init: true,
  });
  await click("Play card");
  expect(play).not.toHaveBeenCalled();
});
it("lets a changed index load the selected track instead of resuming the previous one", async () => {
  const { snapshot, click } = await mount("card", {
    queue: [target, other],
    index: 1,
    init: true,
  });
  await click("Play card");
  expect(snapshot.index).toBe(0);
  expect(play).not.toHaveBeenCalled();
});
it("clears radio when Play Song Now replaces the queue", async () => {
  const { snapshot, click } = await mount("menu", {
    queue: [other],
    index: 0,
    init: true,
  });
  await click("Play Song Now");
  expect(snapshot.queue.map((item) => item.id)).toEqual([target.id]);
  expect(snapshot.radio).toBeNull();
});
it("preserves radio when Play Song Now selects an existing entry", async () => {
  const { snapshot, click } = await mount("menu", {
    queue: [other, target],
    index: 0,
    init: true,
  });
  await click("Play Song Now");
  expect(snapshot.index).toBe(1);
  expect(snapshot.radio).toEqual(radio);
});
it("Play Song Now jumps to the entry's own copy when the song is queued twice", async () => {
  const copy: Queue = { ...target, queueItemId: "second-copy" };
  const { snapshot, click } = await mount(
    "menu",
    { queue: [target, other, copy], index: 1, init: true },
    copy,
  );
  await click("Play Song Now");
  expect(snapshot.index).toBe(2);
});
it("preserves radio when appending a track", async () => {
  const { snapshot, click } = await mount("menu", {
    queue: [other],
    index: 0,
    init: true,
  });
  await click("Add to Queue");
  expect(snapshot.queue.map((item) => item.id)).toEqual([other.id, target.id]);
  expect(snapshot.radio).toEqual(radio);
});

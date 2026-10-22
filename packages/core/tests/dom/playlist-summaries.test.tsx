import { afterEach, beforeEach, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  addSongsOptimistic,
  removeSongOptimistic,
  resetPlaylistOverlay,
  usePlaylists,
  type PlaylistSummary,
  type PlaylistView,
  type UserPlaylist,
} from "../../src/react/optimistic-playlists";

const summary = (songCount: number, coverSongs: string[]) => [
  {
    id: "p",
    name: "P",
    description: null,
    createdAt: new Date(0),
    songCount,
    coverSongs,
  },
];
const row = (songs: string[]): UserPlaylist => ({
  id: "p",
  name: "P",
  description: null,
  userId: "u",
  createdAt: new Date(0),
  songs,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

let snapshots: (PlaylistView[] | undefined)[];
function Probe({ server }: { server: PlaylistSummary[] }) {
  snapshots.push(usePlaylists(server));
  return null;
}
const roots: Root[] = [];
async function mount(server: PlaylistSummary[], readers = 1) {
  const root = createRoot(document.createElement("div"));
  roots.push(root);
  await act(async () =>
    root.render(
      Array.from({ length: readers }, (_, i) => (
        <Probe key={i} server={server} />
      )),
    ),
  );
}
const last = () => snapshots.at(-1)?.[0];

beforeEach(() => {
  snapshots = [];
  resetPlaylistOverlay();
});
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
});

it("shares one overlaid list between readers", async () => {
  await mount(summary(1, ["old"]), 2);
  expect(snapshots[0]).toBe(snapshots[1]);
});

it("counts an add at once, then from the songs the write returns", async () => {
  await mount(summary(6, ["a", "b", "c", "d"]));
  const write = deferred<UserPlaylist>();
  let done: Promise<unknown> | undefined;
  await act(async () => {
    // "b" is a cover song, so it is known to be held already.
    done = addSongsOptimistic("p", ["new", "b", "new"], () => write.promise);
  });
  expect(last()).toMatchObject({ songCount: 7 });

  await act(async () => {
    write.resolve(row(["a", "b", "c", "d", "e", "f", "new"]));
    await done;
  });
  expect(last()).toMatchObject({
    songCount: 7,
    coverSongs: ["a", "b", "c", "d"],
  });
});

it("counts a removal and drops it from the covers", async () => {
  await mount(summary(2, ["a", "b"]));
  await act(async () => {
    void removeSongOptimistic(
      "p",
      "a",
      ["a", "b"],
      () => new Promise(() => {}),
    );
  });
  expect(last()).toMatchObject({ songCount: 1, coverSongs: ["b"] });
});

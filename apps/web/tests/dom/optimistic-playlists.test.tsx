import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  removeSongOptimistic,
  renamePlaylistOptimistic,
  resetPlaylistOverlay,
  usePlaylists,
  type PlaylistView,
} from "../../lib/optimistic-playlists";
import { waitFor } from "./wait-for";

const playlist = (
  id: string,
  name: string,
  songs: string[] = [],
): MyPlaylist => ({
  id,
  name,
  description: null,
  userId: "u",
  songs,
  createdAt: new Date(0),
});

// The list is written to the DOM and read back, so nothing is reassigned in render.
function Probe({ server }: { server: MyPlaylist[] | undefined }) {
  return <output>{JSON.stringify(usePlaylists(server) ?? null)}</output>;
}
let host: HTMLElement;
const view = (): PlaylistView[] | undefined =>
  JSON.parse(host.textContent ?? "null") ?? undefined;

const roots: Root[] = [];
async function mount(server: MyPlaylist[] | undefined) {
  host = document.createElement("div");
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(<Probe server={server} />));
  return (next: MyPlaylist[] | undefined) =>
    act(async () => root.render(<Probe server={next} />));
}

function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const names = () => view()?.map((p) => p.name);

beforeEach(() => {
  resetPlaylistOverlay();
});
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("optimistic playlists", () => {
  it("shows a created playlist as pending at once, then with its real id", async () => {
    const rerender = await mount([playlist("a", "A")]);
    const write = deferred<MyPlaylist>();
    let created: Promise<MyPlaylist> | undefined;
    await act(async () => {
      created = createPlaylistOptimistic({ name: "New" }, () => write.promise);
    });

    expect(names()).toEqual(["A", "New"]);
    expect(view()?.[1]?.pending).toBe(true);

    await act(async () => write.resolve(playlist("real", "New")));
    await created;
    expect(view()?.[1]).toMatchObject({ id: "real" });
    expect(view()?.[1]?.pending).toBeUndefined();

    // Once the refreshed list has it, the overlay entry is dropped: no duplicate.
    await rerender([playlist("a", "A"), playlist("real", "New")]);
    expect(names()).toEqual(["A", "New"]);
  });

  it("removes the pending row when creating fails", async () => {
    await mount([playlist("a", "A")]);
    const write = deferred<MyPlaylist>();
    let outcome: Promise<unknown> | undefined;
    await act(async () => {
      outcome = createPlaylistOptimistic(
        { name: "New" },
        () => write.promise,
      ).catch((e: Error) => e.message);
    });
    expect(names()).toEqual(["A", "New"]);

    await act(async () => write.reject(new Error("boom")));
    expect(await outcome).toBe("boom");
    await waitFor(() => names()?.length === 1);
  });

  it("renames at once and restores the old name on failure", async () => {
    await mount([playlist("a", "Old")]);
    const write = deferred();
    let outcome: Promise<unknown> | undefined;
    await act(async () => {
      outcome = renamePlaylistOptimistic(
        "a",
        { name: "Fresh" },
        () => write.promise,
      ).catch((e: Error) => e.message);
    });
    expect(names()).toEqual(["Fresh"]);

    await act(async () => write.reject(new Error("nope")));
    await outcome;
    await waitFor(() => names()?.[0] === "Old");
  });

  it("hides a deleted playlist at once and brings it back on failure", async () => {
    await mount([playlist("a", "A"), playlist("b", "B")]);
    const write = deferred();
    let outcome: Promise<unknown> | undefined;
    await act(async () => {
      outcome = deletePlaylistOptimistic("a", () => write.promise).catch(
        (e: Error) => e.message,
      );
    });
    expect(names()).toEqual(["B"]);

    await act(async () => write.reject(new Error("nope")));
    await outcome;
    await waitFor(() => names()?.length === 2);
  });

  it("counts an added song immediately and drops it once the server has it", async () => {
    const rerender = await mount([playlist("a", "A", ["s1"])]);
    const write = deferred();
    await act(async () => {
      void addSongsOptimistic("a", ["s2"], 1, () => write.promise);
    });
    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);

    await act(async () => write.resolve(undefined));
    await rerender([playlist("a", "A", ["s1", "s2"])]);
    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);
  });

  it("removes songs one write at a time with indexes that account for earlier removals", async () => {
    await mount([playlist("a", "A", ["s1", "s2", "s3"])]);
    const sent: number[] = [];
    const first = deferred();
    await act(async () => {
      void removeSongOptimistic(
        "a",
        0,
        "s1",
        3,
        (i) => (sent.push(i), first.promise),
      );
      void removeSongOptimistic(
        "a",
        2,
        "s3",
        3,
        async (i) => void sent.push(i),
      );
    });
    expect(view()?.[0]?.songs).toEqual(["s2"]);
    expect(sent).toEqual([0]);

    await act(async () => first.resolve(undefined));
    await waitFor(() => sent.length === 2);
    expect(sent).toEqual([0, 1]);
  });

  it("leaves an unknown library unknown", async () => {
    await mount(undefined);
    await act(async () => {
      void createPlaylistOptimistic(
        { name: "X" },
        () => new Promise<MyPlaylist>(() => {}),
      );
    });

    expect(view()).toBeUndefined();
  });
});

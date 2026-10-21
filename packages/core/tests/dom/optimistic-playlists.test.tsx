import { afterEach, beforeEach, describe, expect, it } from "bun:test";

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
  type UserPlaylist,
} from "../../src/react/optimistic-playlists";

const playlist = (
  id: string,
  name: string,
  songs: string[] = [],
): UserPlaylist => ({
  id,
  name,
  description: null,
  userId: "u",
  songs,
  createdAt: new Date(0),
});

// The list is written to the DOM and read back, so nothing is reassigned in render.
function Probe({ server }: { server: UserPlaylist[] | undefined }) {
  return <output>{JSON.stringify(usePlaylists(server) ?? null)}</output>;
}
let host: HTMLElement;
const view = (): PlaylistView[] | undefined =>
  JSON.parse(host.textContent ?? "null") ?? undefined;

const roots: Root[] = [];
async function mount(server: UserPlaylist[] | undefined) {
  host = document.createElement("div");
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(<Probe server={server} />));
  return (next: UserPlaylist[] | undefined) =>
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
    const write = deferred<UserPlaylist>();
    let created: Promise<UserPlaylist> | undefined;
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
    const write = deferred<UserPlaylist>();
    let outcome: Promise<unknown> | undefined;
    await act(async () => {
      outcome = createPlaylistOptimistic(
        { name: "New" },
        () => write.promise,
      ).catch((e: Error) => e.message);
    });
    expect(names()).toEqual(["A", "New"]);

    await act(async () => {
      write.reject(new Error("boom"));
      expect(await outcome).toBe("boom");
    });
    expect(names()).toEqual(["A"]);
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

    await act(async () => {
      write.reject(new Error("nope"));
      await outcome;
    });
    expect(names()).toEqual(["Old"]);
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

    await act(async () => {
      write.reject(new Error("nope"));
      await outcome;
    });
    expect(names()).toEqual(["A", "B"]);
  });

  it("counts an added song immediately and drops it once the server has it", async () => {
    const rerender = await mount([playlist("a", "A", ["s1"])]);
    const write = deferred();
    await act(async () => {
      void addSongsOptimistic("a", ["s2"], () => write.promise);
    });
    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);

    await act(async () => write.resolve(undefined));
    await rerender([playlist("a", "A", ["s1", "s2"])]);
    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);
  });

  it("removes by song, resolving each index against what the server holds, across refreshes", async () => {
    const ids = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];
    const rerender = await mount([playlist("a", "A", ids)]);
    const sent: number[] = [];
    let held = [...ids];
    const server = (songId: string) => async (index: number) => {
      sent.push(index);
      expect(held[index]).toBe(songId);
      held = held.filter((_, i) => i !== index);
      return { songs: held };
    };
    const gate = deferred();
    let writes: Promise<unknown>[] = [];
    await act(async () => {
      writes = [
        removeSongOptimistic("a", "s2", ids, async (i) => {
          await gate.promise;
          return server("s2")(i);
        }),
        removeSongOptimistic("a", "s5", ids, server("s5")),
        removeSongOptimistic("a", "s7", ids, server("s7")),
      ];
    });
    expect(view()?.[0]?.songs).toEqual(["s1", "s3", "s4", "s6"]);

    await act(async () => gate.resolve(undefined));
    // The first write's refresh lands while the others are still queued.
    await rerender([playlist("a", "A", ["s1", "s3", "s4", "s5", "s6", "s7"])]);
    await act(async () => {
      await Promise.all(writes);
    });

    expect(sent).toEqual([1, 3, 4]);
    expect(held).toEqual(["s1", "s3", "s4", "s6"]);
    expect(view()?.[0]?.songs).toEqual(["s1", "s3", "s4", "s6"]);
  });

  it("rejects a removal whose song is no longer there instead of removing another", async () => {
    await mount([playlist("a", "A", ["s1"])]);
    let called = false;
    const outcome = await act(async () =>
      removeSongOptimistic("a", "gone", ["s1"], async () => {
        called = true;
      }).catch((e: Error) => e.message),
    );

    expect(called).toBe(false);
    expect(outcome).toMatch(/no longer/);
  });

  it("settles a mixed add and remove on one playlist by song, not by length", async () => {
    const rerender = await mount([playlist("a", "A", ["s1", "s2"])]);
    const rm = deferred();
    const add = deferred();
    await act(async () => {
      void removeSongOptimistic("a", "s1", ["s1", "s2"], () => rm.promise);
      void addSongsOptimistic("a", ["s3"], () => add.promise);
    });
    expect(view()?.[0]?.songs).toEqual(["s2", "s3"]);

    await act(async () => rm.resolve({ songs: ["s2"] }));
    await act(async () => add.resolve({ songs: ["s2", "s3"] }));
    // Same length as before the writes, different songs.
    await rerender([playlist("a", "A", ["s2", "s3"])]);

    expect(view()?.[0]?.songs).toEqual(["s2", "s3"]);
  });

  it("leaves an unknown library unknown", async () => {
    await mount(undefined);
    await act(async () => {
      void createPlaylistOptimistic(
        { name: "X" },
        () => new Promise<UserPlaylist>(() => {}),
      );
    });

    expect(view()).toBeUndefined();
  });
});

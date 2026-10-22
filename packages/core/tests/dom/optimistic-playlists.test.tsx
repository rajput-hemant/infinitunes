import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { act, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  addSongsOptimistic,
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  moveSongOptimistic,
  removeSongOptimistic,
  renamePlaylistOptimistic,
  resetPlaylistOverlay,
  usePlaylistDetailList,
  usePlaylistRowRemoved,
  usePlaylists,
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

type Mode = "details" | "library";

// The list is written to the DOM and read back, so nothing is reassigned in render.
// "library" reads the summaries `getUserPlaylists` returns, "details" the full rows.
function Probe({
  server,
  mode,
}: {
  server: UserPlaylist[] | undefined;
  mode: Mode;
}) {
  const removed = usePlaylistRowRemoved("a", "s2");
  const summaries = useMemo(
    () =>
      server?.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        songCount: p.songs.length,
        coverSongs: p.songs.slice(0, 4),
      })),
    [server],
  );
  const library = usePlaylists(mode === "library" ? summaries : undefined);
  const details = usePlaylistDetailList(
    mode === "details" ? server : undefined,
  );
  return (
    <output data-removed={removed}>
      {JSON.stringify((mode === "library" ? library : details) ?? null)}
    </output>
  );
}
let host: HTMLElement;
const view = (): (UserPlaylist & { pending?: boolean })[] | undefined =>
  JSON.parse(host.textContent ?? "null") ?? undefined;

const roots: Root[] = [];
async function mount(
  server: UserPlaylist[] | undefined,
  mode: Mode = "details",
) {
  host = document.createElement("div");
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(<Probe server={server} mode={mode} />));
  return (next: UserPlaylist[] | undefined) =>
    act(async () => root.render(<Probe server={next} mode={mode} />));
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
    const rerender = await mount([playlist("a", "A")], "library");
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
    await mount([playlist("a", "A")], "library");
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

  it("shows a move at once and sends each move against what the server holds", async () => {
    const ids = ["s1", "s2", "s3", "s4"];
    await mount([playlist("a", "A", ids)]);
    let held = [...ids];
    const sent: [number, number][] = [];
    const server = (songId: string) => async (from: number, to: number) => {
      sent.push([from, to]);
      expect(held[from]).toBe(songId);
      const next = held.filter((_, i) => i !== from);
      next.splice(to, 0, songId);
      held = next;
      return { songs: held };
    };
    const gate = deferred();
    let writes: Promise<unknown>[] = [];
    await act(async () => {
      writes = [
        moveSongOptimistic(
          "a",
          "s4",
          ["s4", "s1", "s2", "s3"],
          ids,
          async (f, t) => {
            await gate.promise;
            return server("s4")(f, t);
          },
        ),
        moveSongOptimistic(
          "a",
          "s1",
          ["s4", "s2", "s3", "s1"],
          ids,
          server("s1"),
        ),
      ];
    });
    expect(view()?.[0]?.songs).toEqual(["s4", "s2", "s3", "s1"]);

    await act(async () => gate.resolve(undefined));
    await act(async () => {
      await Promise.all(writes);
    });

    expect(sent).toEqual([
      [3, 0],
      [1, 3],
    ]);
    expect(held).toEqual(["s4", "s2", "s3", "s1"]);
  });

  it("keeps a move's order while a removal and an add land around it", async () => {
    await mount([playlist("a", "A", ["s1", "s2", "s3"])]);
    await act(async () => {
      void moveSongOptimistic(
        "a",
        "s3",
        ["s3", "s1", "s2"],
        ["s1", "s2", "s3"],
        () => new Promise(() => {}),
      );
      void removeSongOptimistic(
        "a",
        "s1",
        ["s1", "s2", "s3"],
        () => new Promise(() => {}),
      );
      void addSongsOptimistic("a", ["s9"], () => new Promise(() => {}));
    });

    expect(view()?.[0]?.songs).toEqual(["s3", "s2", "s9"]);
  });

  it("restores the order before a move that fails", async () => {
    await mount([playlist("a", "A", ["s1", "s2"])]);
    const outcome = await act(async () =>
      moveSongOptimistic("a", "s2", ["s2", "s1"], ["s1", "s2"], async () => {
        throw new Error("offline");
      }).catch((e: Error) => e.message),
    );

    expect(outcome).toBe("offline");
    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);
  });

  it("drops a settled move once the refreshed playlist has its order", async () => {
    const rerender = await mount([playlist("a", "A", ["s1", "s2"])]);
    await act(async () => {
      await moveSongOptimistic(
        "a",
        "s2",
        ["s2", "s1"],
        ["s1", "s2"],
        async () => ({
          songs: ["s2", "s1"],
        }),
      );
    });
    await rerender([playlist("a", "A", ["s2", "s1"])]);
    // A later server order wins once the move is reconciled.
    await rerender([playlist("a", "A", ["s1", "s2"])]);

    expect(view()?.[0]?.songs).toEqual(["s1", "s2"]);
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
    await mount(undefined, "library");
    await act(async () => {
      void createPlaylistOptimistic(
        { name: "X" },
        () => new Promise<UserPlaylist>(() => {}),
      );
    });

    expect(view()).toBeUndefined();
  });

  it("keeps the next owner's pending create when an old create rejects", async () => {
    await mount([], "library");
    const old = deferred<UserPlaylist>();
    let outcome: Promise<unknown> | undefined;
    await act(async () => {
      outcome = createPlaylistOptimistic(
        { name: "Alice" },
        () => old.promise,
      ).catch(() => undefined);
      resetPlaylistOverlay();
      void createPlaylistOptimistic(
        { name: "Bob" },
        () => new Promise(() => {}),
      );
    });
    await act(async () => {
      old.reject(new Error("old account"));
      await outcome;
    });
    expect(names()).toEqual(["Bob"]);
  });

  it.each([
    [0, 1],
    [1, 0],
  ])(
    "does not restore failed renames (failure order %i, %i)",
    async (first, second) => {
      await mount([playlist("a", "Original")]);
      const gates = [deferred(), deferred()];
      const writes: Promise<unknown>[] = [];
      await act(async () => {
        gates.forEach((gate, i) =>
          writes.push(
            renamePlaylistOptimistic(
              "a",
              { name: `Edit ${i}` },
              () => gate.promise,
            ).catch(() => undefined),
          ),
        );
      });
      for (const i of [first, second]) {
        await act(async () => {
          gates[i]!.reject(new Error("offline"));
          await writes[i];
        });
      }
      expect(names()).toEqual(["Original"]);
    },
  );

  it("skips a failed rename to restore the last successful predecessor", async () => {
    await mount([playlist("a", "Original")]);
    const gates = [deferred(), deferred(), deferred()];
    const writes: Promise<unknown>[] = [];
    await act(async () => {
      gates.forEach((gate, i) =>
        writes.push(
          renamePlaylistOptimistic(
            "a",
            { name: `Edit ${i}` },
            () => gate.promise,
          ).catch(() => undefined),
        ),
      );
    });
    await act(async () => {
      gates[0]!.resolve(undefined);
      gates[1]!.reject(new Error("offline"));
      await Promise.all(writes.slice(0, 2));
      gates[2]!.reject(new Error("offline"));
      await writes[2];
    });
    expect(names()).toEqual(["Edit 0"]);
  });

  it("does not restore a failed move when the next move also fails", async () => {
    const ids = ["s1", "s2", "s3"];
    await mount([playlist("a", "A", ids)]);
    const first = deferred();
    let writes: Promise<unknown>[] = [];
    await act(async () => {
      writes = [
        moveSongOptimistic(
          "a",
          "s3",
          ["s3", "s1", "s2"],
          ids,
          () => first.promise,
        ).catch(() => undefined),
        moveSongOptimistic("a", "s2", ["s2", "s3", "s1"], ids, async () => {
          throw new Error("offline");
        }).catch(() => undefined),
      ];
      first.reject(new Error("offline"));
      await Promise.all(writes);
    });
    expect(view()?.[0]?.songs).toEqual(ids);
  });

  it("keeps the confirmed order after the queue drains until props catch up", async () => {
    const ids = ["s1", "s2", "s3"];
    await mount([playlist("a", "A", ids)]);
    await act(async () => {
      await moveSongOptimistic(
        "a",
        "s3",
        ["s3", "s1", "s2"],
        ids,
        async () => ({ songs: ["s3", "s1", "s2"] }),
      );
    });
    const indexes: number[] = [];
    await act(async () => {
      await removeSongOptimistic("a", "s3", ids, async (index) => {
        indexes.push(index);
        return { songs: ["s1", "s2"] };
      });
    });
    expect(indexes).toEqual([0]);
  });

  it("uses a refreshed server order after it acknowledges the confirmed write", async () => {
    const ids = ["s1", "s2", "s3"];
    const rerender = await mount([playlist("a", "A", ids)]);
    await act(async () => {
      await removeSongOptimistic("a", "s1", ids, async () => ({
        songs: ["s2", "s3"],
      }));
    });
    await rerender([playlist("a", "A", ["s2", "s3"])]);
    const changed = ["s3", "s2"];
    await rerender([playlist("a", "A", changed)]);
    const indexes: number[] = [];
    await act(async () => {
      await removeSongOptimistic("a", "s3", changed, async (index) => {
        indexes.push(index);
        return { songs: ["s2"] };
      });
    });
    expect(indexes).toEqual([0]);
  });

  it("hides a pending add when a removal follows and keeps it hidden after settlement", async () => {
    await mount([playlist("a", "A", ["s1"])]);
    const add = deferred();
    let writes: Promise<unknown>[] = [];
    await act(async () => {
      writes = [
        addSongsOptimistic("a", ["s2"], () => add.promise),
        removeSongOptimistic("a", "s2", ["s1"], async () => ({
          songs: ["s1"],
        })),
      ];
    });
    expect(view()?.[0]?.songs).toEqual(["s1"]);
    await act(async () => {
      add.resolve({ songs: ["s1", "s2"] });
      await Promise.all(writes);
    });
    expect(view()?.[0]?.songs).toEqual(["s1"]);
  });

  it("shows a re-add after a pending removal as the latest intent", async () => {
    const ids = ["s1", "s2", "s3"];
    await mount([playlist("a", "A", ids)]);
    const removal = deferred();
    let writes: Promise<unknown>[] = [];
    await act(async () => {
      writes = [
        removeSongOptimistic("a", "s2", ids, () => removal.promise),
        addSongsOptimistic("a", ["s2"], async () => ({
          songs: ["s1", "s3", "s2"],
        })),
      ];
    });
    expect(view()?.[0]?.songs).toEqual(["s1", "s3", "s2"]);
    expect(host.querySelector("output")?.getAttribute("data-removed")).toBe(
      "false",
    );
    await act(async () => {
      removal.resolve({ songs: ["s1", "s3"] });
      await Promise.all(writes);
    });
    expect(view()?.[0]?.songs).toEqual(["s1", "s3", "s2"]);
  });
});

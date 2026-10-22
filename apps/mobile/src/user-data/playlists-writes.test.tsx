import {
  resetPlaylistOverlay,
  usePlaylistDetails,
} from "@infinitunes/core/react/optimistic-playlists";
import { act, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { failureStore } from "~/lib/failure";
import { queryClient } from "~/lib/query-client";
import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import { deferred, playlistSummary, userPlaylist } from "~/test/user-library";

import {
  addSongsToPlaylist,
  createPlaylist,
  deletePlaylist,
  moveSongInPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  usePlaylistMembership,
  useServerPlaylistDetails,
  useUserPlaylists,
} from "./playlists";

const server = userPlaylist({
  id: "pl-1",
  name: "Road Trip",
  songs: ["a", "b", "c"],
});

/** The playlists as a list shows them: `name:songs`, `*` for a pending row. */
function Shown() {
  const playlists = useUserPlaylists();
  const playlist = usePlaylistDetails(useServerPlaylistDetails("pl-1").data);
  const membership = usePlaylistMembership();
  return (
    <>
      <Text testID="held">{[...(membership.get("pl-1") ?? [])].join("")}</Text>
      <Text testID="counts">
        {playlists?.map((p) => `${p.name}:${p.songCount}`).join("|")}
      </Text>
      <Text testID="shown">
        {playlists
          ?.map(
            (p) =>
              `${p.name}:${p.id === playlist?.id ? playlist.songs.join("") : ""}${p.pending ? "*" : ""}`,
          )
          .join("|") ?? "unknown"}
      </Text>
    </>
  );
}

const shown = () => screen.getByTestId("shown").props.children as string;
const counts = () => screen.getByTestId("counts").props.children as string;
const held = () => screen.getByTestId("held").props.children as string;

beforeEach(async () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  queryClient.clear();
  jest.useFakeTimers();
  await act(async () => signInAs("alice"));
  procedure("user.getUserPlaylists").mockResolvedValue([
    playlistSummary(server),
  ]);
  procedure("user.getPlaylistMembership").mockResolvedValue([
    { id: server.id, songs: server.songs },
  ]);
  procedure("user.getPlaylistDetails").mockResolvedValue(server);
  await renderWithProviders(<Shown />);
  await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  resetPlaylistOverlay();
});

describe("create", () => {
  it("shows a pending row at once, then the minted playlist", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.createNewPlaylist").mockReturnValue(write.promise);

    await act(async () => createPlaylist({ name: "Gym", description: "Hype" }));

    expect(shown()).toBe("Road Trip:abc|Gym:*");
    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledWith({
      name: "Gym",
      description: "Hype",
    });

    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-2", name: "Gym" })),
    );
  });

  it("removes the pending row when the server refuses", async () => {
    procedure("user.createNewPlaylist").mockRejectedValue(
      trpcError(
        "FORBIDDEN",
        "You can only have 10 playlists, please delete one",
      ),
    );

    await act(async () => createPlaylist({ name: "Eleventh" }));

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
    // The server's own refusal is the snackbar's copy.
    expect(failureStore.getState().current?.message).toBe(
      "You can only have 10 playlists, please delete one",
    );
  });
});

describe("rename", () => {
  it("renames in the same frame and sends the new details", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.renamePlaylist").mockReturnValue(write.promise);

    await act(async () => renamePlaylist("pl-1", { name: "Commute" }));

    expect(shown()).toBe("Commute:abc");
    expect(procedure("user.renamePlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      name: "Commute",
    });
    await act(async () => write.resolve(userPlaylist({ name: "Commute" })));
  });

  it("puts the old name back when it fails", async () => {
    procedure("user.renamePlaylist").mockRejectedValue(new Error("down"));

    await act(async () => renamePlaylist("pl-1", { name: "Commute" }));

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
    expect(failureStore.getState().current?.message).toBe(
      "Couldn't rename the playlist.",
    );
  });
});

describe("delete", () => {
  it("drops the playlist at once", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.deletePlaylist").mockReturnValue(write.promise);

    await act(async () => deletePlaylist("pl-1"));
    expect(shown()).toBe("");
    expect(procedure("user.deletePlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
    });

    await act(async () => write.resolve(server));
  });

  it("brings the playlist back when it fails", async () => {
    procedure("user.deletePlaylist").mockRejectedValue(new Error("down"));

    await act(async () => deletePlaylist("pl-1"));

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
  });
});

describe("add songs", () => {
  it("shows the songs at once", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.addSongsToPlaylist").mockReturnValue(write.promise);

    await act(async () =>
      addSongsToPlaylist({ id: "pl-1", name: "Road Trip" }, [
        { id: "d", name: "FA9LA" },
      ]),
    );
    expect(shown()).toBe("Road Trip:abcd");
    expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      songs: ["d"],
    });

    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-1", songs: ["a", "b", "c", "d"] })),
    );
  });

  it("counts and checks the songs at once, then counts what the write returns", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.addSongsToPlaylist").mockReturnValue(write.promise);

    await act(async () =>
      addSongsToPlaylist({ id: "pl-1", name: "Road Trip" }, [
        { id: "a", name: "Already held" },
        { id: "d", name: "New song" },
      ]),
    );
    expect(procedure("user.getPlaylistMembership")).toHaveBeenCalledTimes(1);
    // "a" is one of the summary's cover songs, so only "d" is counted.
    expect(counts()).toBe("Road Trip:4");
    expect(held()).toBe("abcd");

    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-1", songs: ["a", "b", "c", "d"] })),
    );
    expect(counts()).toBe("Road Trip:4");
  });

  it("takes the songs back out when the write fails", async () => {
    procedure("user.addSongsToPlaylist").mockRejectedValue(new Error("down"));

    await act(async () =>
      addSongsToPlaylist({ id: "pl-1", name: "Road Trip" }, [
        { id: "d", name: "One" },
        { id: "e", name: "Two" },
      ]),
    );

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
  });
});

describe("remove a song", () => {
  it("hides it at once and sends its index in the server's copy", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.removeSongsFromPlaylist").mockReturnValue(write.promise);

    await act(async () =>
      removeSongFromPlaylist(server, { id: "b", name: "Two" }),
    );

    expect(shown()).toBe("Road Trip:ac");
    expect(procedure("user.removeSongsFromPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      index: 1,
      songId: "b",
    });
    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-1", songs: ["a", "c"] })),
    );
  });

  it("writes removals one at a time, the second adjusted for the first", async () => {
    const first = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.removeSongsFromPlaylist")
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(userPlaylist({ id: "pl-1", songs: ["b"] }));

    await act(async () => {
      removeSongFromPlaylist(server, { id: "a", name: "One" });
      removeSongFromPlaylist(server, { id: "c", name: "Three" });
    });
    expect(shown()).toBe("Road Trip:b");
    expect(procedure("user.removeSongsFromPlaylist")).toHaveBeenCalledTimes(1);

    await act(async () =>
      first.resolve(userPlaylist({ id: "pl-1", songs: ["b", "c"] })),
    );
    await waitFor(() =>
      expect(procedure("user.removeSongsFromPlaylist")).toHaveBeenCalledTimes(
        2,
      ),
    );
    expect(procedure("user.removeSongsFromPlaylist")).toHaveBeenLastCalledWith({
      playlistId: "pl-1",
      index: 1,
      songId: "c",
    });
  });

  it("brings the row back when it fails", async () => {
    procedure("user.removeSongsFromPlaylist").mockRejectedValue(
      new Error("down"),
    );

    await act(async () =>
      removeSongFromPlaylist(server, { id: "b", name: "Two" }),
    );

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
  });
});

describe("move a song", () => {
  it("shows the new order at once and sends the positions", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.movePlaylistSong").mockReturnValue(write.promise);

    await act(async () =>
      moveSongInPlaylist(
        server,
        ["a", "b", "c"],
        { id: "c", name: "Three" },
        "a",
      ),
    );

    expect(shown()).toBe("Road Trip:cab");
    expect(procedure("user.movePlaylistSong")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      from: 2,
      to: 0,
      songId: "c",
    });
    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-1", songs: ["c", "a", "b"] })),
    );
  });

  it("moves to the end when nothing follows it", async () => {
    procedure("user.movePlaylistSong").mockResolvedValue(
      userPlaylist({ id: "pl-1", songs: ["b", "c", "a"] }),
    );

    await act(async () =>
      moveSongInPlaylist(
        server,
        ["a", "b", "c"],
        { id: "a", name: "One" },
        undefined,
      ),
    );

    expect(shown()).toBe("Road Trip:bca");
  });

  it("puts the order back when it fails", async () => {
    procedure("user.movePlaylistSong").mockRejectedValue(new Error("down"));

    await act(async () =>
      moveSongInPlaylist(
        server,
        ["a", "b", "c"],
        { id: "c", name: "Three" },
        "a",
      ),
    );

    await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
    expect(shown()).toBe("Road Trip:abc");
  });
});

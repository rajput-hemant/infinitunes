import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { toast } from "sonner-native";

import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import { deferred, userPlaylist } from "~/test/user-library";

import {
  addSongsToPlaylist,
  createPlaylist,
  deletePlaylist,
  moveSongInPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
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
  return (
    <Text testID="shown">
      {playlists
        ?.map((p) => `${p.name}:${p.songs.join("")}${p.pending ? "*" : ""}`)
        .join("|") ?? "unknown"}
    </Text>
  );
}

const shown = () => screen.getByTestId("shown").props.children as string;

beforeEach(async () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  jest.useFakeTimers();
  await act(async () => signInAs("alice"));
  procedure("user.getUserPlaylists").mockResolvedValue([server]);
  await renderWithProviders(<Shown />);
  await waitFor(() => expect(shown()).toBe("Road Trip:abc"));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  resetPlaylistOverlay();
});

const toastError = () => jest.mocked(toast.error);
const toastSuccess = () => jest.mocked(toast.success);

describe("create", () => {
  it("shows a pending row at once, then toasts the minted playlist", async () => {
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
    await waitFor(() =>
      expect(toastSuccess()).toHaveBeenCalledWith('Playlist "Gym" created'),
    );
  });

  it("removes the pending row and says why when the server refuses", async () => {
    procedure("user.createNewPlaylist").mockRejectedValue(
      trpcError(
        "FORBIDDEN",
        "You can only have 10 playlists, please delete one",
      ),
    );

    await act(async () => createPlaylist({ name: "Eleventh" }));

    await waitFor(() =>
      expect(toastError()).toHaveBeenCalledWith(
        "You can only have 10 playlists, please delete one",
      ),
    );
    expect(shown()).toBe("Road Trip:abc");
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

  it("puts the old name back with a toast when it fails", async () => {
    procedure("user.renamePlaylist").mockRejectedValue(new Error("down"));

    await act(async () => renamePlaylist("pl-1", { name: "Commute" }));

    await waitFor(() => expect(toastError()).toHaveBeenCalledTimes(1));
    expect(shown()).toBe("Road Trip:abc");
  });
});

describe("delete", () => {
  it("drops the playlist at once and confirms by name", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.deletePlaylist").mockReturnValue(write.promise);

    await act(async () => deletePlaylist("pl-1", "Road Trip"));
    expect(shown()).toBe("");
    expect(procedure("user.deletePlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
    });

    await act(async () => write.resolve(server));
    await waitFor(() =>
      expect(toastSuccess()).toHaveBeenCalledWith(
        'Playlist "Road Trip" deleted',
      ),
    );
  });

  it("brings the playlist back with a toast when it fails", async () => {
    procedure("user.deletePlaylist").mockRejectedValue(new Error("down"));

    await act(async () => deletePlaylist("pl-1", "Road Trip"));

    await waitFor(() => expect(toastError()).toHaveBeenCalledTimes(1));
    expect(shown()).toBe("Road Trip:abc");
    expect(toastSuccess()).not.toHaveBeenCalled();
  });
});

describe("add songs", () => {
  it("shows the songs at once and names one song or a count in the toast", async () => {
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
    await waitFor(() =>
      expect(toastSuccess()).toHaveBeenCalledWith(
        '"FA9LA" added to "Road Trip"',
      ),
    );
  });

  it("takes the songs back out when the write fails", async () => {
    procedure("user.addSongsToPlaylist").mockRejectedValue(new Error("down"));

    await act(async () =>
      addSongsToPlaylist({ id: "pl-1", name: "Road Trip" }, [
        { id: "d", name: "One" },
        { id: "e", name: "Two" },
      ]),
    );

    await waitFor(() => expect(toastError()).toHaveBeenCalledTimes(1));
    expect(shown()).toBe("Road Trip:abc");
    expect(toastSuccess()).not.toHaveBeenCalled();
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
      .mockResolvedValue(userPlaylist({ id: "pl-1", songs: ["c"] }));

    await act(async () => {
      removeSongFromPlaylist(server, { id: "a", name: "One" });
      removeSongFromPlaylist(server, { id: "b", name: "Two" });
    });
    expect(shown()).toBe("Road Trip:c");
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
      index: 0,
      songId: "b",
    });
  });

  it("brings the row back with a toast when it fails", async () => {
    procedure("user.removeSongsFromPlaylist").mockRejectedValue(
      new Error("down"),
    );

    await act(async () =>
      removeSongFromPlaylist(server, { id: "b", name: "Two" }),
    );

    await waitFor(() => expect(toastError()).toHaveBeenCalledTimes(1));
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

  it("puts the order back with a toast when it fails", async () => {
    procedure("user.movePlaylistSong").mockRejectedValue(new Error("down"));

    await act(async () =>
      moveSongInPlaylist(
        server,
        ["a", "b", "c"],
        { id: "c", name: "Three" },
        "a",
      ),
    );

    await waitFor(() => expect(toastError()).toHaveBeenCalledTimes(1));
    expect(shown()).toBe("Road Trip:abc");
  });
});

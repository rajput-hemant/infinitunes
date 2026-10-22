import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { waitFor } from "@testing-library/react-native";

import { procedure, trpcError } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { createPlaylistWithSongs } from "./playlists";

describe("createPlaylistWithSongs", () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    resetPlaylistOverlay();
  });

  it("adds the songs to the playlist the server minted", async () => {
    procedure("user.createNewPlaylist").mockResolvedValue(
      userPlaylist({ id: "pl-9", name: "Road Trip" }),
    );

    createPlaylistWithSongs({ name: "Road Trip" }, ["a", "b"]);

    await waitFor(() =>
      expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
        playlistId: "pl-9",
        songs: ["a", "b"],
      }),
    );
    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledWith({
      name: "Road Trip",
    });
  });

  it("adds nothing when the server refuses the playlist", async () => {
    procedure("user.createNewPlaylist").mockRejectedValue(
      trpcError(
        "FORBIDDEN",
        "You can only have 10 playlists, please delete one",
      ),
    );

    createPlaylistWithSongs({ name: "Eleventh" }, ["a"]);

    await waitFor(() =>
      expect(procedure("user.createNewPlaylist")).toHaveBeenCalledTimes(1),
    );
    expect(procedure("user.addSongsToPlaylist")).not.toHaveBeenCalled();
  });
});

import { waitFor } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { procedure, trpcError } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { createPlaylistWithSongs, songsLabel } from "./playlists";

describe("createPlaylistWithSongs", () => {
  it("adds the songs to the playlist the server minted", async () => {
    procedure("user.createNewPlaylist").mockResolvedValue(
      userPlaylist({ id: "pl-9", name: "Road Trip" }),
    );

    createPlaylistWithSongs({ name: "Road Trip" }, ["a", "b"], "2 songs");

    await waitFor(() =>
      expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
        playlistId: "pl-9",
        songs: ["a", "b"],
      }),
    );
    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledWith({
      name: "Road Trip",
    });
    await waitFor(() =>
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        '2 songs added to "Road Trip"',
      ),
    );
  });

  it("adds nothing when the server refuses the playlist", async () => {
    procedure("user.createNewPlaylist").mockRejectedValue(
      trpcError(
        "FORBIDDEN",
        "You can only have 10 playlists, please delete one",
      ),
    );

    createPlaylistWithSongs({ name: "Eleventh" }, ["a"], '"FA9LA"');

    await waitFor(() =>
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        "You can only have 10 playlists, please delete one",
      ),
    );
    expect(procedure("user.addSongsToPlaylist")).not.toHaveBeenCalled();
  });
});

describe("songsLabel", () => {
  it("quotes one song and counts more", () => {
    expect(songsLabel([{ id: "a", name: "FA9LA" }])).toBe('"FA9LA"');
    expect(
      songsLabel([
        { id: "a", name: "One" },
        { id: "b", name: "Two" },
      ]),
    ).toBe("2 songs");
  });
});

import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { toSongRow } from "@infinitunes/types";
import { rawEpisode, rawSong } from "@infinitunes/types/fixtures";
import { act, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { QueueList } from "./queue-list";

const songs = ["a", "b"].map((id) => toSongRow(rawSong({ id })));
const initial = playerStore.getState();

beforeEach(() => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  jest.useFakeTimers();
  playerStore.setState(initial, true);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  resetPlaylistOverlay();
});

const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(10);
  });

describe("QueueList empty state", () => {
  it("says nothing is queued, with no controls", async () => {
    await renderScreen(<QueueList />);

    expect(screen.getByText("Nothing queued")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Queue actions")).toBeNull();
    expect(screen.queryByLabelText("Clear up next")).toBeNull();
  });
});

describe("saving the queue to a playlist", () => {
  it("shows no queue menu while signed out", async () => {
    playerStore.getState().playTracks(songs);
    await renderScreen(<QueueList />);

    expect(screen.queryByLabelText("Queue actions")).toBeNull();
  });

  it("adds every song in the queue, including the one playing, to the chosen playlist", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip" }),
    ]);
    playerStore.getState().playTracks(songs, { startIndex: 1 });
    await renderScreen(<QueueList />);
    await settle();

    await chooseMenuAction("Queue actions", "playlist:pl-1");

    expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      songs: ["a", "b"],
    });
  });

  it("leaves podcast episodes out of the saved songs", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1" }),
    ]);
    playerStore
      .getState()
      .playTracks([songs[0]!, toSongRow(rawEpisode("9001")), songs[1]!]);
    await renderScreen(<QueueList />);
    await settle();

    await chooseMenuAction("Queue actions", "playlist:pl-1");

    expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      songs: ["a", "b"],
    });
  });

  it("offers a new playlist made of the queue's songs", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([]);
    playerStore.getState().playTracks(songs);
    await renderScreen(<QueueList />);
    await settle();
    // Rendering installs the router; stub navigation after it.
    const push = jest.spyOn(router, "push").mockImplementation(() => {});

    await chooseMenuAction("Queue actions", "new-playlist");

    expect(push).toHaveBeenCalledWith({
      pathname: "/create-playlist",
      params: { songs: "a,b" },
    });
    push.mockRestore();
  });

  it("has no queue menu when only episodes are queued", async () => {
    playerStore.getState().playTracks([toSongRow(rawEpisode("9001"))]);
    await renderScreen(<QueueList />);

    expect(screen.queryByLabelText("Queue actions")).toBeNull();
  });
});

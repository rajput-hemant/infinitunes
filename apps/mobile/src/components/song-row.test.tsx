import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { playbackStatusStore } from "~/playback/playback-status";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

import { SongRow } from "./song-row";

jest.mock("~/lib/trpc", () => require("~/test/trpc-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));

const song = toSongRow(rawSong());
const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  playbackStatusStore.setState({ playing: false });
});

describe("SongRow", () => {
  it("shows the decoded title and the primary artists", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Flipperachi")).toBeOnTheScreen();
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("plays its list when pressed", async () => {
    const onPress = jest.fn();
    await renderScreen(<SongRow song={song} onPress={onPress} />);

    await fireEvent.press(
      screen.getByRole("button", { name: "FA9LA & Friends" }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("marks the playing row, and pauses it instead of restarting", async () => {
    const onPress = jest.fn();
    await renderScreen(<SongRow song={song} onPress={onPress} />);

    await act(async () => {
      playerStore.getState().playTracks([song]);
      playbackStatusStore.setState({ playing: true });
    });
    await fireEvent.press(
      screen.getByRole("button", { name: "FA9LA & Friends" }),
    );

    expect(screen.getByTestId("now-playing")).toBeOnTheScreen();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("asks a signed-out listener to sign in before liking", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Like FA9LA & Friends" }),
    );

    expect(toast.warning).toHaveBeenCalledWith(
      "Sign in to continue",
      expect.objectContaining({
        description: "You need an account to like this song.",
      }),
    );
  });
});

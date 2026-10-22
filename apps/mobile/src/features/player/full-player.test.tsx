import { plainText, toSongRow } from "@infinitunes/types";
import { rawEpisode, rawLyrics, rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { FullPlayer } from "./full-player";
import { MiniPlayer } from "./mini-player";

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
});

function play(...tracks: Parameters<typeof toSongRow>[0][]) {
  playerStore.getState().playTracks(tracks.map(toSongRow));
}

describe("FullPlayer", () => {
  it("swaps the artwork for the song's lyrics and back", async () => {
    const lyrics = procedure("song.syncedLyrics");
    lyrics.mockResolvedValue({
      synced: null,
      plain: plainText(rawLyrics().lyrics),
      copyright: plainText(rawLyrics().lyrics_copyright),
      instrumental: false,
      source: "jiosaavn",
    });
    play(rawSong());
    await renderScreen(<FullPlayer />);

    const toggle = await screen.findByRole("button", { name: "Lyrics" });
    expect(lyrics).not.toHaveBeenCalled();
    await fireEvent.press(toggle);

    expect(
      await screen.findByText("First line\nSecond & third\nbold"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Lyrics powered by Musixmatch")).toBeOnTheScreen();
    expect(lyrics).toHaveBeenCalledWith({ id: "BSaNI3Yr" });

    await fireEvent.press(screen.getByRole("button", { name: "Hide lyrics" }));
    expect(screen.queryByText("Lyrics powered by Musixmatch")).toBeNull();
  });

  it("says so when the song has no lyrics", async () => {
    procedure("song.syncedLyrics").mockResolvedValue({
      synced: null,
      plain: null,
      copyright: null,
      instrumental: false,
      source: "jiosaavn",
    });
    play(rawSong());
    await renderScreen(<FullPlayer />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Lyrics" }),
    );

    expect(
      await screen.findByText("No lyrics available for this track."),
    ).toBeOnTheScreen();
  });

  it("does not look lyrics up for an episode", async () => {
    play(rawEpisode("9001"));
    await renderScreen(<FullPlayer />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Lyrics" }),
    );

    expect(
      screen.getByText("No lyrics available for this track."),
    ).toBeOnTheScreen();
    expect(procedure("song.syncedLyrics")).not.toHaveBeenCalled();
  });

  it("plays and pauses from a filled 72pt control, with the menu in the top bar", async () => {
    play(rawSong());
    await renderScreen(<FullPlayer />);

    const control = await screen.findByTestId("play-pause-prominent");
    expect(control).toHaveStyle({ width: 72, height: 72 });
    expect(control).toHaveAccessibleName("Play");
    expect(
      screen.getByRole("button", { name: "More actions for FA9LA & Friends" }),
    ).toBeOnTheScreen();
  });

  it("names the station a radio queue refills from", async () => {
    playerStore.getState().playTracks([toSongRow(rawSong())], {
      radio: { stationId: "st-1", name: "Flipperachi Radio", type: "artist" },
    });
    await renderScreen(<FullPlayer />);

    expect(
      await screen.findByLabelText("Playing Flipperachi Radio"),
    ).toBeOnTheScreen();
  });
});

describe("MiniPlayer", () => {
  it("shows the station badge only for a radio queue", async () => {
    play(rawSong());
    await renderScreen(<MiniPlayer />);

    expect(await screen.findByText("Flipperachi - FA9LA")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Playing /)).toBeNull();

    await act(async () =>
      playerStore.setState({
        radio: { stationId: "st-1", name: "Hindi Hits", type: "featured" },
      }),
    );
    expect(screen.getByLabelText("Playing Hindi Hits")).toBeOnTheScreen();
  });
});

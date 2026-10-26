import { plainText, toSongRow } from "@infinitunes/types";
import { rawEpisode, rawLyrics, rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { selectionAsync } from "expo-haptics";
import { router } from "expo-router";
import { Text } from "react-native";

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

    // One toggle that shows its state: the filled circle while lyrics are on.
    expect(toggle).toHaveProp("accessibilityState", { selected: true });
    expect(screen.getByTestId("mode-toggle-on")).toBeOnTheScreen();
    await fireEvent.press(toggle);
    expect(screen.queryByText("Lyrics powered by Musixmatch")).toBeNull();
    expect(toggle).toHaveProp("accessibilityState", { selected: false });
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

  it("plays and pauses from a filled 72pt control, with the menu by the title", async () => {
    play(rawSong());
    await renderScreen(<FullPlayer />);

    const control = await screen.findByTestId("play-pause-prominent");
    expect(control).toHaveStyle({ width: 72, height: 72 });
    expect(control).toHaveAccessibleName("Play");
    expect(
      screen.getByRole("button", { name: "More actions for FA9LA & Friends" }),
    ).toBeOnTheScreen();
  });

  it("marks an explicit track before its credit, read once", async () => {
    play(rawSong({ explicit_content: "1" }));
    await renderScreen(<FullPlayer />);

    expect(
      await screen.findByLabelText(
        "FA9LA & Friends, Explicit, Flipperachi - FA9LA",
      ),
    ).toBeOnTheScreen();
    // Hidden from screen readers: the row's label already says it.
    expect(
      screen.getByText("E", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText("Explicit")).toBeNull();
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

  it("shows the queue in the player, toggled from Up next", async () => {
    play(
      rawSong({ id: "a", title: "Alpha" }),
      rawSong({ id: "b", title: "Bravo" }),
      rawSong({ id: "c", title: "Charlie" }),
    );
    await renderScreen(<FullPlayer />);

    const toggle = await screen.findByRole("button", { name: "Up next" });
    expect(toggle).toHaveProp("accessibilityState", { selected: false });
    expect(screen.queryByText("Up next · 2")).toBeNull();
    await fireEvent.press(toggle);

    expect(toggle).toHaveProp("accessibilityState", { selected: true });
    expect(screen.getByText("Up next · 2")).toBeOnTheScreen();
    expect(screen.getByText("Charlie")).toBeOnTheScreen();
    // The header keeps the current song, and the scrubber stays.
    expect(screen.getByText("Alpha")).toBeOnTheScreen();
    expect(
      screen.getByRole("adjustable", { name: "Playback position" }),
    ).toBeOnTheScreen();
    // Shuffle, repeat, the heart and the menu share the header's pill row,
    // one of each; the title row keeps neither heart nor menu.
    expect(screen.getAllByRole("button", { name: "Shuffle" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Repeat off" })).toHaveLength(
      1,
    );
    expect(screen.getAllByRole("button", { name: "Like Alpha" })).toHaveLength(
      1,
    );
    expect(
      screen.getAllByRole("button", { name: "More actions for Alpha" }),
    ).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));
    expect(screen.getByRole("button", { name: "Shuffle" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));
    // Lyrics and the queue never show together.
    const lyrics = screen.getByRole("button", { name: "Lyrics" });
    procedure("song.syncedLyrics").mockResolvedValue({
      synced: null,
      plain: null,
      copyright: null,
      instrumental: false,
      source: "jiosaavn",
    });
    await fireEvent.press(lyrics);
    expect(lyrics).toHaveProp("accessibilityState", { selected: true });
    expect(toggle).toHaveProp("accessibilityState", { selected: false });
    expect(screen.queryByText("Up next · 2")).toBeNull();

    await fireEvent.press(lyrics);
    expect(lyrics).toHaveProp("accessibilityState", { selected: false });
    expect(screen.queryByText("Up next · 2")).toBeNull();
  });

  it("names every repeat mode and ticks once per compact mode change", async () => {
    play(
      rawSong({ id: "a", title: "Alpha" }),
      rawSong({ id: "b", title: "Bravo" }),
    );
    await renderScreen(<FullPlayer />, { initialUrl: "/?view=queue" });
    jest.mocked(selectionAsync).mockClear();

    await fireEvent.press(screen.getByRole("button", { name: "Shuffle" }));
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeSelected();

    await fireEvent.press(screen.getByRole("button", { name: "Repeat off" }));
    expect(screen.getByRole("button", { name: "Repeat all" })).toBeSelected();
    await fireEvent.press(screen.getByRole("button", { name: "Repeat all" }));
    expect(screen.getByRole("button", { name: "Repeat one" })).toBeSelected();
    await fireEvent.press(screen.getByRole("button", { name: "Repeat one" }));
    expect(
      screen.getByRole("button", { name: "Repeat off" }),
    ).not.toBeSelected();

    expect(selectionAsync).toHaveBeenCalledTimes(4);
  });

  it("follows a changed view link while it is already open", async () => {
    play(rawSong());
    await renderScreen(<FullPlayer />, { initialUrl: "/?view=queue" });

    const upNext = await screen.findByRole("button", { name: "Up next" });
    expect(upNext).toHaveProp("accessibilityState", { selected: true });
    await fireEvent.press(upNext);
    expect(upNext).toHaveProp("accessibilityState", { selected: false });

    // A new `?view=` link still switches the view, unlike the local toggle.
    await act(async () => router.setParams({ view: "lyrics" }));
    expect(screen.getByRole("button", { name: "Lyrics" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    expect(upNext).toHaveProp("accessibilityState", { selected: false });

    await act(async () => router.setParams({ view: undefined }));
    expect(screen.getByRole("button", { name: "Lyrics" })).toHaveProp(
      "accessibilityState",
      { selected: false },
    );
  });

  it("sends a signed-out compact Like to sign in without writing a favorite", async () => {
    play(rawSong());
    const app = await renderScreen(<FullPlayer />, {
      initialUrl: "/?view=queue",
      routes: { login: () => <Text>Sign in screen</Text> },
    });

    await fireEvent.press(
      screen.getByRole("button", { name: "Like FA9LA & Friends" }),
    );
    expect(app.getPathname()).toBe("/login");
    expect(procedure("user.addToFavorites")).not.toHaveBeenCalled();
    expect(procedure("user.removeFromFavorites")).not.toHaveBeenCalled();
  });

  it("changes the song from the artwork's and the title's screen reader actions", async () => {
    play(
      rawSong({ id: "a", title: "Alpha" }),
      rawSong({ id: "b", title: "Bravo" }),
    );
    await renderScreen(<FullPlayer />);

    await fireEvent(
      await screen.findByLabelText("Artwork, Alpha"),
      "accessibilityAction",
      { nativeEvent: { actionName: "nextTrack" } },
    );
    expect(playerStore.getState().currentIndex).toBe(1);

    await fireEvent(
      await screen.findByLabelText(/^Bravo, /),
      "accessibilityAction",
      { nativeEvent: { actionName: "previousTrack" } },
    );
    expect(playerStore.getState().currentIndex).toBe(0);
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

  it("drops Next when compact (the inline tab bar accessory)", async () => {
    play(rawSong());
    await renderScreen(<MiniPlayer compact />);

    expect(
      await screen.findByRole("button", { name: "Play" }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Next track" })).toBeNull();
  });

  it("changes the song from its screen reader actions", async () => {
    play(
      rawSong({ id: "a", title: "Alpha" }),
      rawSong({ id: "b", title: "Bravo" }),
    );
    await renderScreen(<MiniPlayer compact />);

    const track = await screen.findByLabelText(/^Now playing Alpha/);
    expect(track.props.accessibilityActions).toEqual([
      { name: "nextTrack", label: "Next track" },
      { name: "previousTrack", label: "Previous track" },
    ]);
    await fireEvent(track, "accessibilityAction", {
      nativeEvent: { actionName: "nextTrack" },
    });
    expect(playerStore.getState().currentIndex).toBe(1);
  });
});

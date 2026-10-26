import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { playbackStatusStore } from "~/playback/playback-status";
import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";
import { titleLineTexts } from "~/test/title-row";
import { procedure } from "~/test/trpc-mock";

import { SongRow } from "./song-row";

const song = toSongRow(rawSong());
const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  playbackStatusStore.setState({ playing: false });
});

describe("SongRow swipe actions", () => {
  it("plays next and adds to the queue from the leading buttons", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: "Play Next" }));
    expect(playerStore.getState().queue.map((q) => q.id)).toContain(song.id);

    const before = playerStore.getState().queue.length;
    await fireEvent.press(screen.getByRole("button", { name: "Add to Queue" }));
    expect(playerStore.getState().queue.length).toBe(before + 1);
  });

  it("adds a trailing destructive action only when given", async () => {
    const onPress = jest.fn();
    await renderScreen(
      <SongRow
        song={song}
        onPress={jest.fn()}
        trailingSwipe={{ label: "Unlike", icon: "heart.slash", onPress }}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Unlike" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("leaves queue rows to the player", async () => {
    await renderScreen(
      <SongRow song={song} onPress={jest.fn()} queueItemId="q1" />,
    );

    expect(screen.queryByRole("button", { name: "Play Next" })).toBeNull();
  });
});

describe("SongRow", () => {
  it("shows the decoded title and the primary artists", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Flipperachi")).toBeOnTheScreen();
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("starts the primary artist's radio from its menu", async () => {
    procedure("radio.createStation").mockResolvedValue({ stationId: "st-1" });
    procedure("radio.songs").mockResolvedValue([rawSong({ id: "radio-1" })]);
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    await chooseMenuAction("More actions for FA9LA & Friends", "play-radio");

    expect(procedure("radio.createStation")).toHaveBeenCalledWith({
      type: "artist",
      name: "Flipperachi",
      artistId: "2393548",
      language: "arabic",
    });
    expect(playerStore.getState().radio?.name).toBe("Flipperachi Radio");
  });

  it("opens the song's own page from its menu", async () => {
    const app = await renderScreen(
      <SongRow song={song} onPress={jest.fn()} />,
      {
        routes: { "song/[name]/[token]": () => null },
      },
    );

    await chooseMenuAction("More actions for FA9LA & Friends", "details");

    expect(app.getPathname()).toBe("/song/fa9la/BSaNI3Yr-token");
  });

  it("opens the song menu on a long press, not only from the More button", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);
    expect(screen.queryByTestId("card-menu")).toBeNull();

    await fireEvent(
      screen.getByRole("button", { name: "FA9LA & Friends" }),
      "longPress",
    );
    await fireEvent(screen.getByTestId("card-menu"), "pressAction", {
      nativeEvent: { event: "add-to-queue" },
    });

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      song.id,
    ]);
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
    expect(screen.getByTestId("now-playing")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "FA9LA & Friends" }),
    );

    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows the pause mark, not the waveform, while the current row is paused", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    await act(async () => {
      playerStore.getState().playTracks([song]);
      playbackStatusStore.setState({ playing: false });
    });

    expect(screen.getByTestId("now-paused")).toBeOnTheScreen();
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("shows its track number instead of the cover in a numbered list", async () => {
    await renderScreen(
      <SongRow song={song} onPress={jest.fn()} leading="index" index={4} />,
    );

    expect(screen.getByText("4")).toBeOnTheScreen();
    expect(screen.queryByTestId(/^now-/)).toBeNull();

    await act(async () => {
      playerStore.getState().playTracks([song]);
    });

    expect(screen.queryByText("4")).toBeNull();
    expect(screen.getByTestId(/^now-/)).toBeOnTheScreen();
  });

  it("leads the credits with the explicit mark", async () => {
    await renderScreen(
      <SongRow song={{ ...song, explicit: true }} onPress={jest.fn()} />,
    );

    expect(titleLineTexts(screen.getByText("FA9LA & Friends"))).toEqual([
      "E",
      "FA9LA & Friends",
    ]);
    expect(
      screen.getByRole("button", { name: "FA9LA & Friends" }),
    ).toHaveAccessibilityValue({ text: "Explicit, Flipperachi" });
  });

  it("shows no heart while signed out", async () => {
    await renderScreen(<SongRow song={song} onPress={jest.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Like FA9LA & Friends" }),
    ).toBeNull();
  });

  it("mounts its Android menu only once its button is pressed", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const app = await renderScreen(
      <SongRow song={song} onPress={jest.fn()} />,
      { routes: { "song/[name]/[token]": () => null } },
    );
    // A list holds dozens of rows: none keeps a native menu host until asked.
    expect(screen.queryByTestId("song-menu")).toBeNull();

    await fireEvent.press(
      screen.getByRole("button", { name: "More actions for FA9LA & Friends" }),
    );
    await fireEvent(screen.getByTestId("song-menu"), "pressAction", {
      nativeEvent: { event: "details" },
    });

    expect(app.getPathname()).toBe("/song/fa9la/BSaNI3Yr-token");
  });
});

import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { screen, waitFor } from "@testing-library/react-native";
import { getColors } from "react-native-image-colors";

import { playerColorsFromSeed } from "~/lib/artwork-colors";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

// The Android file by name: Jest resolves the bare path to the `.ios` one.
import { FloatingPlayerDock as AndroidDock } from "./floating-player-dock.tsx";
import { FullPlayer } from "./full-player";
import { MiniPlayer } from "./mini-player";

const SEED = "#5B0F12";

const iosColors = (background: string) => ({
  platform: "ios" as const,
  background,
  primary: "",
  secondary: "#F4E9E1",
  detail: "#000000",
  quality: "low" as const,
});

/** The palette the screens derive for `SEED` in Jest (iOS, light scheme). */
function expectedColors() {
  const colors = playerColorsFromSeed(SEED, "light", "ios");
  if (!colors) throw new Error("the test seed must pass");
  return colors;
}

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  playerStore.getState().playTracks([toSongRow(rawSong())]);
  jest.mocked(getColors).mockReset();
});

const backdrop = () => screen.getByTestId("player-backdrop-current");

describe("Now Playing's wash", () => {
  it("lays the screen on the cover's wash with checked colours", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await renderScreen(<FullPlayer />);
    const colors = expectedColors();

    await waitFor(() =>
      expect(backdrop()).toHaveStyle({
        backgroundImage: `linear-gradient(180deg, ${colors.wash[0]}, ${colors.wash[1]})`,
      }),
    );
    expect(screen.getByText("FA9LA & Friends")).toHaveStyle({
      color: colors.foreground,
    });
    expect(screen.getByText("Flipperachi - FA9LA")).toHaveStyle({
      color: colors.muted,
    });
    expect(screen.getByTestId("play-pause-prominent")).toHaveStyle({
      backgroundColor: colors.control,
    });
    // The smallest rendition is enough for a colour.
    expect(getColors).toHaveBeenCalledWith(
      expect.stringMatching(/50x50/),
      expect.anything(),
    );
  });

  it("keeps the D1 palette when the extractor fails", async () => {
    jest.mocked(getColors).mockRejectedValue(new Error("offline"));
    await renderScreen(<FullPlayer />);

    await waitFor(() => expect(getColors).toHaveBeenCalled());
    expect(backdrop()).not.toHaveStyle({ backgroundImage: expect.anything() });
    expect(screen.getByText("FA9LA & Friends")).not.toHaveStyle({
      color: expectedColors().foreground,
    });
    expect(screen.getByTestId("play-pause-prominent")).not.toHaveStyle({
      backgroundColor: expectedColors().control,
    });
  });

  it("keeps the D1 palette when the extractor finds no colour", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(""));
    await renderScreen(<FullPlayer />);

    await waitFor(() => expect(getColors).toHaveBeenCalled());
    expect(backdrop()).not.toHaveStyle({ backgroundImage: expect.anything() });
  });

  it("reads each cover once for every player that shows it", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await renderScreen(
      <>
        <AndroidDock />
        <FullPlayer />
      </>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("play-pause-prominent")).toHaveStyle({
        backgroundColor: expectedColors().control,
      }),
    );
    expect(getColors).toHaveBeenCalledTimes(1);
  });
});

describe("the Android dock", () => {
  it("sits on the cover's tonal surface", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await renderScreen(<AndroidDock />);
    const { dock } = expectedColors();

    await waitFor(() =>
      expect(backdrop()).toHaveStyle({ backgroundColor: dock.background }),
    );
    expect(screen.getByText("FA9LA & Friends")).toHaveStyle({
      color: dock.foreground,
    });
    // Decoration, hidden from screen readers.
    expect(
      screen.getByTestId("dock-progress", { includeHiddenElements: true }),
    ).toHaveStyle({
      backgroundColor: dock.accent,
    });
  });

  it("keeps the wallpaper's card when the extractor fails", async () => {
    jest.mocked(getColors).mockRejectedValue(new Error("offline"));
    await renderScreen(<AndroidDock />);

    await waitFor(() => expect(getColors).toHaveBeenCalled());
    expect(screen.getByText("FA9LA & Friends")).not.toHaveStyle({
      color: expectedColors().dock.foreground,
    });
  });
});

describe("the mini player outside a dock", () => {
  it("keeps the host's colours (the iOS 26 accessory's glass)", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await renderScreen(<MiniPlayer />);

    expect(await screen.findByText("FA9LA & Friends")).not.toHaveStyle({
      color: expectedColors().dock.foreground,
    });
    expect(getColors).not.toHaveBeenCalled();
  });
});

import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, screen, waitFor } from "@testing-library/react-native";
import { Image } from "expo-image";
import { getColors } from "react-native-image-colors";

import {
  loadMaterialColors,
  NO_SWATCH,
  playerColorsFromSeed,
} from "~/lib/artwork-colors";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

import { findsNoSwatch } from "../../../__mocks__/react-native-image-colors";
// The Android file by name: Jest resolves the bare path to the `.ios` one.
import { FloatingPlayerDock as AndroidDock } from "./floating-player-dock.tsx";
import { FullPlayer } from "./full-player";
import { MiniPlayer } from "./mini-player";
import { EXTRACTION_TIMEOUT_MS } from "./use-player-colors";

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

// The colour library loads with the first extraction; transforming it takes
// longer than a `waitFor`, so load it before the first test.
beforeAll(() => loadMaterialColors());

beforeEach(() => {
  playerStore.setState(initial, true);
  playerStore.getState().playTracks([toSongRow(rawSong())]);
  // Re-arm the module's default (no swatch) over whatever a test scripted;
  // a bare `mockReset` would answer `undefined`, failing for the wrong reason.
  jest.mocked(getColors).mockClear().mockImplementation(findsNoSwatch);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const backdrop = () => screen.getByTestId("player-backdrop-current");

/** Now Playing over two tracks with their own covers, the first washed. */
async function onSecondCover() {
  jest.mocked(getColors).mockResolvedValueOnce(iosColors(SEED));
  playerStore
    .getState()
    .playTracks(
      ["first", "second"].map((id) =>
        toSongRow(
          rawSong({ id, image: `https://c.saavncdn.com/${id}-500x500.jpg` }),
        ),
      ),
    );
  await renderScreen(<FullPlayer />);
  await waitFor(() =>
    expect(backdrop()).toHaveStyle({ backgroundImage: expect.anything() }),
  );
  // The second cover is read ahead of its turn: let that settle first.
  await waitFor(() => expect(getColors).toHaveBeenCalledTimes(2));
}

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

  it("reads the no-swatch fallback as no colour, not a grey cover", async () => {
    // The module's default here answers the fallback in every field, as the
    // native one does when it finds no swatch.
    await renderScreen(<FullPlayer />);

    await waitFor(() => expect(getColors).toHaveBeenCalled());
    expect(getColors).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ fallback: NO_SWATCH }),
    );
    await expect(
      jest.mocked(getColors).mock.results[0]?.value,
    ).resolves.toMatchObject({ background: NO_SWATCH });
    expect(backdrop()).not.toHaveStyle({ backgroundImage: expect.anything() });
  });

  it("reads a rendition expo-image already holds, so it works offline", async () => {
    const cached = jest
      .spyOn(Image, "getCachePathAsync")
      .mockImplementation(async (key) =>
        key.includes("150x150") ? "/caches/expo-image/medium.jpg" : null,
      );
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await renderScreen(<FullPlayer />);

    await waitFor(() =>
      expect(screen.getByTestId("play-pause-prominent")).toHaveStyle({
        backgroundColor: expectedColors().control,
      }),
    );
    expect(cached).toHaveBeenCalledWith(expect.stringMatching(/50x50/));
    expect(getColors).toHaveBeenCalledWith(
      "file:///caches/expo-image/medium.jpg",
      expect.anything(),
    );
  });

  it("drops the last cover's wash when the next one fails (offline)", async () => {
    await onSecondCover();

    jest.mocked(getColors).mockRejectedValueOnce(new Error("offline"));
    await act(async () => playerStore.getState().skipToNext());

    await waitFor(() => expect(getColors).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(backdrop()).not.toHaveStyle({
        backgroundImage: expect.anything(),
      }),
    );
  });

  it("gives up on an extraction that never settles", async () => {
    await onSecondCover();
    jest.useFakeTimers();

    jest.mocked(getColors).mockReturnValueOnce(new Promise(() => {}));
    await act(async () => playerStore.getState().skipToNext());
    await waitFor(() => expect(getColors).toHaveBeenCalledTimes(3));
    // Still loading: the first cover's wash holds.
    expect(backdrop()).toHaveStyle({ backgroundImage: expect.anything() });

    await act(async () => {
      jest.advanceTimersByTime(EXTRACTION_TIMEOUT_MS);
    });

    await waitFor(() =>
      expect(backdrop()).not.toHaveStyle({
        backgroundImage: expect.anything(),
      }),
    );
  });

  it("reads the next cover's colour ahead of its turn, once", async () => {
    jest.mocked(getColors).mockResolvedValue(iosColors(SEED));
    await onSecondCover();

    // Playing "first": the second cover was read while it plays.
    await waitFor(() => expect(getColors).toHaveBeenCalledTimes(2));
    expect(getColors).toHaveBeenLastCalledWith(
      expect.stringMatching(/second-50x50/),
      expect.anything(),
    );

    jest.mocked(getColors).mockClear();
    await act(async () => playerStore.getState().skipToNext());
    // Landing on it reads nothing more: the seed is already cached.
    await waitFor(() => expect(getColors).not.toHaveBeenCalled());
  });

  it("does not guess the next cover of a shuffled queue", async () => {
    playerStore
      .getState()
      .playTracks(
        ["first", "second"].map((id) =>
          toSongRow(
            rawSong({ id, image: `https://c.saavncdn.com/${id}-500x500.jpg` }),
          ),
        ),
      );
    playerStore.getState().toggleShuffle();
    await renderScreen(<FullPlayer />);

    await waitFor(() => expect(getColors).toHaveBeenCalledTimes(1));
    expect(getColors).not.toHaveBeenCalledWith(
      expect.stringMatching(/second-50x50/),
      expect.anything(),
    );
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

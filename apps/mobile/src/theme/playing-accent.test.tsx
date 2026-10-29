import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

import { contrastRatio, playerColorsFromSeed } from "~/lib/artwork-colors";
import type { PlayerColors } from "~/lib/artwork-colors";
import { usePlayerColors } from "~/lib/use-player-colors";
import { playerStore } from "~/playback/player-store";

import { appearanceStore } from "./appearance";
import { playingAccentFrom, usePlayingAccent } from "./playing-accent";
import { colors } from "./tokens";
import { useTabAccent } from "./use-palette";

jest.mock("~/lib/use-player-colors", () => ({ usePlayerColors: jest.fn() }));

const DARK_BG = colors.dark.background;
const seeded = playerColorsFromSeed("#2b6cb0", "dark", "android")!;
const initialPlayer = playerStore.getState();

const withDock = (
  accent: string,
  onControl = seeded.onControl,
): PlayerColors => ({
  ...seeded,
  onControl,
  dock: { ...seeded.dock, accent },
});

describe("playingAccentFrom", () => {
  it("returns the cover's checked pair", () => {
    const pair = playingAccentFrom(seeded, DARK_BG);
    expect(pair).toEqual({
      primary: seeded.dock.accent,
      foreground: seeded.onControl,
    });
    expect(contrastRatio(pair!.primary, DARK_BG)).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(pair!.foreground, pair!.primary),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("returns nothing with no colours or a background it cannot check", () => {
    expect(playingAccentFrom(null, DARK_BG)).toBeUndefined();
    expect(playingAccentFrom(seeded, "rgba(0, 0, 0, 1)")).toBeUndefined();
  });

  it("drops an accent under 3:1 on the page", () => {
    // A near-black accent on the dark page.
    expect(playingAccentFrom(withDock("#1a1a1a"), DARK_BG)).toBeUndefined();
  });

  it("drops a pair whose text misses 4.5:1 on the accent", () => {
    expect(
      playingAccentFrom(withDock("#9ecaff", "#a0c0f0"), DARK_BG),
    ).toBeUndefined();
  });
});

describe("usePlayingAccent", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "android");
    appearanceStore.getState().setAccent("default");
    playerStore.setState(initialPlayer, true);
    playerStore.getState().playTracks([toSongRow(rawSong())]);
    jest
      .mocked(usePlayerColors)
      .mockImplementation((image) =>
        image ? playerColorsFromSeed("#2b6cb0", "light", "android") : null,
      );
  });
  afterEach(() => jest.restoreAllMocks());

  it("follows the playing cover with the default accent", async () => {
    const { result } = await renderHook(() => usePlayingAccent());
    expect(result.current?.primary).toMatch(/^#[\da-f]{6}$/);
  });

  it("is undefined with nothing playing", async () => {
    playerStore.setState(initialPlayer, true);
    const { result } = await renderHook(() => usePlayingAccent());
    expect(result.current).toBeUndefined();
  });

  it("gives way to an explicit accent", async () => {
    appearanceStore.getState().setAccent("teal");
    const { result } = await renderHook(() => usePlayingAccent());
    expect(result.current).toBeUndefined();
  });

  it("tints the tab bar while one exists", async () => {
    const { result } = await renderHook(() => ({
      tab: useTabAccent(),
      playing: usePlayingAccent(),
    }));
    expect(result.current.tab).toBeDefined();
    expect(result.current.tab).toBe(result.current.playing?.primary);
  });

  it("leaves iOS alone", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { result } = await renderHook(() => usePlayingAccent());
    expect(result.current).toBeUndefined();
  });
});

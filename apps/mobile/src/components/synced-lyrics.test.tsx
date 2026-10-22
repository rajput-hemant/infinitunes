import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { audioPlayer } from "~/playback/audio-engine";
import { playbackPosition } from "~/playback/playback-status";
import { playerStore } from "~/playback/player-store";
import { renderWithProviders } from "~/test/render";

import { SyncedLyrics } from "./synced-lyrics";

const lines = [
  { time: 1, text: "First" },
  { time: 5, text: "Second" },
];
const initial = playerStore.getState();
beforeEach(() => {
  playerStore.setState(initial, true);
  playbackPosition.set(0);
});
afterEach(() => {
  playerStore.setState(initial, true);
});

it("follows the scripted playhead and seeks to a pressed line", async () => {
  playerStore.getState().playTracks([toSongRow(rawSong())]);
  const seek = jest.spyOn(audioPlayer, "seekTo");
  await renderWithProviders(
    <SyncedLyrics lines={lines} songId="BSaNI3Yr" height={200} />,
  );
  expect(screen.getByRole("button", { name: "Seek to First" })).toHaveProp(
    "accessibilityState",
    { selected: false },
  );
  await act(() => playbackPosition.set(2));
  expect(screen.getByRole("button", { name: "Seek to First" })).toHaveProp(
    "accessibilityState",
    { selected: true },
  );
  await act(() => playbackPosition.set(6));
  expect(screen.getByRole("button", { name: "Seek to Second" })).toHaveProp(
    "accessibilityState",
    { selected: true },
  );
  await fireEvent.press(screen.getByRole("button", { name: "Seek to First" }));
  expect(seek).toHaveBeenCalledWith(1);
  expect(screen.getByRole("button", { name: "Seek to First" })).toHaveProp(
    "accessibilityState",
    { selected: true },
  );
  seek.mockRestore();
});
it("follows the playhead with prominent (Now Playing) lines", async () => {
  playerStore.getState().playTracks([toSongRow(rawSong())]);
  await renderWithProviders(
    <SyncedLyrics lines={lines} songId="BSaNI3Yr" height={200} prominent />,
  );
  await act(() => playbackPosition.set(2));
  expect(screen.getByTestId("lyric-line-active")).toHaveTextContent("First");
  expect(screen.getByTestId("lyric-line-active")).toHaveStyle({ opacity: 1 });
  await act(() => playbackPosition.set(6));
  expect(screen.getByTestId("lyric-line-active")).toHaveTextContent("Second");
});
it("does not seek a different playing song from the song page", async () => {
  playerStore.getState().playTracks([toSongRow(rawSong({ id: "other" }))]);
  await renderWithProviders(
    <SyncedLyrics lines={lines} songId="BSaNI3Yr" height={200} />,
  );
  expect(screen.queryByRole("button", { name: "Seek to First" })).toBeNull();
  expect(screen.getByText("First")).toBeOnTheScreen();
});

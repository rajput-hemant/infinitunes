import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { playFrom } from "~/playback/play-collection";

import { SongRow } from "./song-row";
import { TrackList } from "./track-list";

jest.mock("./song-row", () => {
  const { Pressable, Text } = require("react-native");
  return {
    SongRow: jest.fn(({ song, onPress }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{song.name}</Text>
      </Pressable>
    )),
  };
});
jest.mock("~/playback/play-collection", () => ({ playFrom: jest.fn() }));

it("skips unchanged track renders on a parent update and plays the updated recycled row", async () => {
  const rows = Array.from({ length: 20 }, (_, index) =>
    toSongRow(rawSong({ id: String(index), title: `Track ${index}` })),
  );
  const app = await render(<TrackList rows={rows} />);
  expect(SongRow).toHaveBeenCalledTimes(20);
  jest.mocked(SongRow).mockClear();

  await app.rerender(<TrackList rows={rows} />);
  expect(SongRow).not.toHaveBeenCalled();

  const replacement = [toSongRow(rawSong({ id: "new", title: "Replacement" }))];
  await app.rerender(<TrackList rows={replacement} />);
  await fireEvent.press(screen.getByText("Replacement"));
  expect(playFrom).toHaveBeenCalledWith(replacement, 0);
});

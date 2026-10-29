import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Text } from "react-native";

import { playFrom } from "~/playback/play-collection";

import { TrackListPage } from "./track-list";

let mockShowItems = false;
jest.mock("@shopify/flash-list", () => {
  const { View } = require("react-native");
  return {
    FlashList: ({
      ListHeaderComponent,
      data,
      renderItem,
    }: {
      ListHeaderComponent: ReactNode;
      data: unknown[];
      renderItem: (item: { index: number }) => ReactNode;
    }) => (
      <>
        {ListHeaderComponent}
        {mockShowItems
          ? data.map((_, index) => (
              <View key={index}>{renderItem({ index })}</View>
            ))
          : null}
      </>
    ),
  };
});
jest.mock("./song-row", () => {
  const { Pressable, Text: MockText } = require("react-native");
  return {
    SongRow: ({
      song,
      onPress,
    }: {
      song: { name: string };
      onPress: () => void;
    }) => (
      <Pressable onPress={onPress}>
        <MockText>{song.name}</MockText>
      </Pressable>
    ),
  };
});
jest.mock("~/playback/play-collection", () => ({ playFrom: jest.fn() }));

it("shows the first tracks with the header before virtualized cells are drawn", async () => {
  const rows = Array.from({ length: 10 }, (_, index) =>
    toSongRow(rawSong({ id: String(index), title: `Track ${index}` })),
  );
  await render(<TrackListPage rows={rows} header={<Text>Playlist</Text>} />);
  expect(screen.getByText("Playlist")).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("Track 0"));
  expect(playFrom).toHaveBeenCalledWith(rows, 0);
});

it("plays a virtualized track at its original queue position", async () => {
  mockShowItems = true;
  const rows = Array.from({ length: 10 }, (_, index) =>
    toSongRow(rawSong({ id: String(index), title: `Track ${index}` })),
  );
  await render(
    <TrackListPage rows={rows} numbered header={<Text>Album</Text>} />,
  );
  await fireEvent.press(screen.getByText("Track 6"));
  expect(playFrom).toHaveBeenCalledWith(rows, 6);
  mockShowItems = false;
});

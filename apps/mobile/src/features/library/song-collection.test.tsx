import { toSongRow } from "@infinitunes/types";
import type { SongRowItem } from "@infinitunes/types";
import { fireEvent, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Platform, Text, View } from "react-native";

import { DragHandle } from "~/components/drag-handle";
import { chooseMenuAction, renderStack, scrollListTo } from "~/test/render";
import { songNamed } from "~/test/user-library";
import { colors } from "~/theme/tokens";

import { SongCollection } from "./song-collection";
import * as songOrder from "./song-order";

const mockSetOptions = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

const tinted = { headerStyle: { backgroundColor: colors.light.card } };

const songs = [
  toSongRow(songNamed("a", "Opening Number")),
  toSongRow(songNamed("b", "Middle Song")),
  toSongRow(songNamed("c", "Closing Time")),
];

function renderCollection(onMove?: jest.Mock) {
  const Screen = () => (
    <SongCollection
      songs={songs}
      missing={0}
      onRefresh={async () => {}}
      recentLabel="Playlist order"
      onMove={onMove}
      renderRow={(song: SongRowItem, _play, reorder) => (
        <View>
          <Text>{song.name}</Text>
          {reorder ? <DragHandle name={song.name} actions={reorder} /> : null}
        </View>
      )}
    />
  );
  return renderStack({ index: Screen });
}

/** What a screen reader offers on the handle of `title`'s row. */
function actionsOf(title: string) {
  return (
    screen
      .getByLabelText(`Reorder ${title}`)
      .props.accessibilityActions?.map(
        (action: { name: string }) => action.name,
      ) ?? []
  );
}

function perform(title: string, actionName: "moveUp" | "moveDown") {
  return fireEvent(
    screen.getByLabelText(`Reorder ${title}`),
    "accessibilityAction",
    { nativeEvent: { actionName } },
  );
}

describe("SongCollection reorder actions", () => {
  it("offers only the directions a row can go in", async () => {
    await renderCollection(jest.fn());

    expect(actionsOf("Opening Number")).toEqual(["moveDown"]);
    expect(actionsOf("Middle Song")).toEqual(["moveUp", "moveDown"]);
    expect(actionsOf("Closing Time")).toEqual(["moveUp"]);
  });

  it("moves a row up before the song it passes", async () => {
    const onMove = jest.fn();
    await renderCollection(onMove);

    await perform("Closing Time", "moveUp");

    expect(onMove).toHaveBeenCalledWith(songs[2], songs[1]);
  });

  it("moves a row down before the song after the next one", async () => {
    const onMove = jest.fn();
    await renderCollection(onMove);

    await perform("Opening Number", "moveDown");

    // [b, a, c]: `a` now precedes `c`.
    expect(onMove).toHaveBeenCalledWith(songs[0], songs[2]);
  });

  it("moves the last-but-one row to the end with no song after it", async () => {
    const onMove = jest.fn();
    await renderCollection(onMove);

    await perform("Middle Song", "moveDown");

    expect(onMove).toHaveBeenCalledWith(songs[1], undefined);
  });

  it("offers no handle when the list has no order of its own", async () => {
    await renderCollection();

    expect(screen.getByText("Middle Song")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Reorder /)).toBeNull();
  });

  it("offers no handle once the list is sorted, as that is not its own order", async () => {
    await renderCollection(jest.fn());
    expect(screen.getByLabelText("Reorder Middle Song")).toBeOnTheScreen();

    await chooseMenuAction("Sort songs, Playlist order", "title");

    expect(screen.queryByLabelText(/^Reorder /)).toBeNull();
  });
});

describe("SongCollection app bar", () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, "OS", "android");
    mockSetOptions.mockClear();
  });

  it("tints the Android bar as the plain list scrolls under it", async () => {
    await renderCollection();

    await scrollListTo("Middle Song", 40);

    expect(mockSetOptions).toHaveBeenCalledWith(tinted);
  });

  it("gives the reorderable list a Reanimated scroll handler", async () => {
    await renderCollection(jest.fn());

    // ReorderableList composes only Reanimated handlers: never the plain one.
    const list = screen.getByTestId("reorderable-list");
    expect(list.props.onScroll).toEqual(expect.any(Function));
  });
});

function ParentRerenderScreen() {
  const [missing, setMissing] = useState(0);
  const [shown, setShown] = useState(songs);
  return (
    <>
      <Text onPress={() => setMissing(1)}>Report missing</Text>
      <Text onPress={() => setShown(songs.slice(1))}>Remove first</Text>
      <SongCollection
        songs={shown}
        missing={missing}
        onRefresh={async () => {}}
        recentLabel="Recently played"
        renderRow={(song) => <Text>{song.name}</Text>}
      />
    </>
  );
}

it("retains filtered and sorted songs on an unrelated parent render", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  const order = jest.spyOn(songOrder, "orderSongs");
  await renderStack({ index: ParentRerenderScreen });
  order.mockClear();
  await fireEvent.press(screen.getByText("Report missing"));
  expect(order).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Remove first"));
  expect(order).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Opening Number")).toBeNull();
  order.mockRestore();
});

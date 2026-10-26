import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Share } from "react-native";

import { playerStore } from "~/playback/player-store";
import { CollectionMenuBar } from "~/test/collection-menu-bar";
import { chooseMenuAction, renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";

const CollectionMenu = CollectionMenuBar;

const rows = ["one", "two", "three"].map((id) =>
  toSongRow(rawSong({ id, title: `Song ${id}` })),
);
const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

const initial = playerStore.getState();

beforeEach(() => playerStore.setState(initial, true));

describe("the header's collection menu", () => {
  it("sits beside Share in the bar, with every entry", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({
      action: "dismissedAction",
      activityType: undefined,
    });
    signInAs("u1");
    await renderWithProviders(<CollectionMenu name="Udta Teer" rows={rows} />);

    const shareButton = screen.getByRole("button", { name: "Share Udta Teer" });
    expect(
      screen.getByLabelText("More actions for Udta Teer"),
    ).toBeOnTheScreen();
    await fireEvent.press(shareButton);
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("queues every song after the current one, in order", async () => {
    playerStore.getState().playTracks([toSongRow(rawSong({ id: "now" }))]);
    await renderWithProviders(<CollectionMenu name="Udta Teer" rows={rows} />);

    await chooseMenuAction("More actions for Udta Teer", "play-next");

    expect(queuedIds()).toEqual(["now", "one", "two", "three"]);
  });

  it("adds every song to the end of the queue", async () => {
    await renderWithProviders(<CollectionMenu name="Udta Teer" rows={rows} />);

    await chooseMenuAction("More actions for Udta Teer", "add-to-queue");

    expect(queuedIds()).toEqual(["one", "two", "three"]);
  });

  it("starts the first song's artist radio", async () => {
    procedure("radio.createStation").mockResolvedValue({ stationId: "st-1" });
    procedure("radio.songs").mockResolvedValue([rawSong({ id: "radio-1" })]);
    await renderWithProviders(<CollectionMenu name="Udta Teer" rows={rows} />);

    await chooseMenuAction("More actions for Udta Teer", "play-radio");

    expect(procedure("radio.createStation")).toHaveBeenCalledWith({
      type: "artist",
      name: "Flipperachi",
      artistId: "2393548",
      language: "arabic",
    });
    expect(queuedIds()).toEqual(["radio-1"]);
  });

  it("offers a new playlist made of every song", async () => {
    signInAs("u1");
    const push = jest.spyOn(router, "push").mockImplementation(() => {});
    await renderWithProviders(<CollectionMenu name="Udta Teer" rows={rows} />);

    await chooseMenuAction("More actions for Udta Teer", "new-playlist");

    expect(push).toHaveBeenCalledWith({
      pathname: "/create-playlist",
      params: { songs: "one,two,three" },
    });
  });

  it("renders nothing for an empty collection", async () => {
    await renderWithProviders(<CollectionMenu name="Empty" rows={[]} />);

    expect(screen.queryByLabelText("More actions for Empty")).toBeNull();
  });
});

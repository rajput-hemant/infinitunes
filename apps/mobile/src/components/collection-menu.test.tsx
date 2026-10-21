import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderWithProviders } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { CollectionMenu } from "./collection-menu";

const rows = ["one", "two", "three"].map((id) =>
  toSongRow(rawSong({ id, title: `Song ${id}` })),
);
const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

const initial = playerStore.getState();

beforeEach(() => playerStore.setState(initial, true));

describe("CollectionMenu", () => {
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

  it("renders nothing for an empty collection", async () => {
    await renderWithProviders(<CollectionMenu name="Empty" rows={[]} />);

    expect(screen.queryByLabelText("More actions for Empty")).toBeNull();
  });
});

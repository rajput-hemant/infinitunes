import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import {
  procedure,
  rawStation,
  rawStationDetails,
  renderScreenAt,
} from "~/features/browse/test-support";
import { playerStore } from "~/playback/player-store";

import { FeaturedStationsScreen } from "./featured-stations-screen";

jest.mock(
  "~/lib/trpc",
  () => require("~/features/browse/test-support").trpcMock,
);
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/browse/skeleton-mock"),
);

const featuredStations = procedure("get.featuredStations");

beforeEach(() => {
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    started: false,
    radio: null,
  });
});

describe("FeaturedStationsScreen", () => {
  it("shows a skeleton under the intro while stations load", async () => {
    featuredStations.mockReturnValue(new Promise(() => {}));
    await renderScreenAt(<FeaturedStationsScreen />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Endless stations for every mood."),
    ).toBeOnTheScreen();
  });

  it("lists each station once; a short page ends the list", async () => {
    featuredStations.mockResolvedValue([
      rawStation(),
      rawStation(),
      rawStation({ id: "station-2", title: "Punjabi Beats" }),
    ]);
    await renderScreenAt(<FeaturedStationsScreen />);

    expect(await screen.findByText("Hindi Hits & More")).toBeOnTheScreen();
    expect(screen.getAllByText("Hindi Hits & More")).toHaveLength(1);
    expect(screen.getByText("Punjabi Beats")).toBeOnTheScreen();
    expect(screen.getByText("You have seen it all")).toBeOnTheScreen();
    expect(featuredStations).toHaveBeenCalledWith({ page: 1, n: 50 });
  });

  it("says so when there are no stations", async () => {
    featuredStations.mockResolvedValue([]);
    await renderScreenAt(<FeaturedStationsScreen />);

    expect(await screen.findByText("No radio stations")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    featuredStations.mockRejectedValueOnce(new Error("upstream down"));
    featuredStations.mockResolvedValue([rawStation()]);
    await renderScreenAt(<FeaturedStationsScreen />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Hindi Hits & More")).toBeOnTheScreen();
  });

  it("opens a station's screen from its card", async () => {
    featuredStations.mockResolvedValue([rawStation()]);
    const app = await renderScreenAt(<FeaturedStationsScreen />, {
      routes: { "radio/[name]/[token]": () => null },
    });

    await fireEvent.press(await screen.findByText("Hindi Hits & More"));

    expect(app.getPathname()).toBe("/radio/hindi-featured-station/station-1");
  });

  it("tunes in from the card's play button and starts a radio session", async () => {
    featuredStations.mockResolvedValue([rawStation()]);
    procedure("radio.stationDetails").mockResolvedValue(rawStationDetails());
    await renderScreenAt(<FeaturedStationsScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Play Hindi Hits & More" }),
    );

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(2));
    expect(procedure("radio.stationDetails")).toHaveBeenCalledWith({
      name: "hindi-featured-station",
      token: "station-1",
    });
    expect(playerStore.getState().radio).toEqual({
      stationId: "session-42",
      name: "Hindi Hits & More",
      type: "featured",
      language: "hindi",
    });
  });
});

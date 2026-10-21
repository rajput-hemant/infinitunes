import { rawStation, rawStationDetails } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { chooseCardAction, renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { FeaturedStationsScreen } from "./featured-stations-screen";

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
    await renderScreen(<FeaturedStationsScreen />);

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
    await renderScreen(<FeaturedStationsScreen />);

    expect(await screen.findByText("Hindi Hits & More")).toBeOnTheScreen();
    expect(screen.getAllByText("Hindi Hits & More")).toHaveLength(1);
    expect(screen.getByText("Punjabi Beats")).toBeOnTheScreen();
    expect(screen.getByText("You have seen it all")).toBeOnTheScreen();
    expect(featuredStations).toHaveBeenCalledWith({ page: 1, n: 50 });
  });

  it("says so when there are no stations", async () => {
    featuredStations.mockResolvedValue([]);
    await renderScreen(<FeaturedStationsScreen />);

    expect(await screen.findByText("No radio stations")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    featuredStations.mockRejectedValueOnce(new Error("upstream down"));
    featuredStations.mockResolvedValue([rawStation()]);
    await renderScreen(<FeaturedStationsScreen />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Hindi Hits & More")).toBeOnTheScreen();
  });

  it("opens a station's screen from its card", async () => {
    featuredStations.mockResolvedValue([rawStation()]);
    const app = await renderScreen(<FeaturedStationsScreen />, {
      routes: { "radio/[name]/[token]": () => null },
    });

    await fireEvent.press(await screen.findByText("Hindi Hits & More"));

    expect(app.getPathname()).toBe("/radio/hindi-featured-station/station-1");
  });

  it("tunes in from the card's menu and starts a radio session", async () => {
    featuredStations.mockResolvedValue([rawStation()]);
    procedure("radio.stationDetails").mockResolvedValue(rawStationDetails());
    await renderScreen(<FeaturedStationsScreen />);

    // Cards have no Play button; their long-press menu offers Play.
    await chooseCardAction(
      await screen.findByRole("link", { name: /^Hindi Hits & More/ }),
      "play",
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

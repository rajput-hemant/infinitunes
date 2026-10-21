import { rawStationDetails, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { playerStore } from "~/playback/player-store";
import { startSeededRadio } from "~/playback/radio";
import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { StationScreen } from "./station-screen";

const stationDetails = procedure("radio.stationDetails");
const station = (
  <StationScreen name="hindi-featured-station" token="station-1" />
);

beforeEach(() => {
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    started: false,
    radio: null,
  });
});

describe("StationScreen", () => {
  it("shows a skeleton while the station loads", async () => {
    stationDetails.mockReturnValue(new Promise(() => {}));
    await renderScreen(station);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
  });

  it("shows the station and the songs coming up", async () => {
    stationDetails.mockResolvedValue(rawStationDetails());
    await renderScreen(station);

    expect(
      await screen.findByRole("header", { name: "Hindi Hits & More" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Radio station")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Coming up" })).toBeOnTheScreen();
    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Second Song")).toBeOnTheScreen();
    expect(stationDetails).toHaveBeenCalledWith({
      name: "hindi-featured-station",
      token: "station-1",
    });
  });

  it("plays the station as radio, refilled by the playback controller", async () => {
    stationDetails.mockResolvedValue(rawStationDetails());
    await renderScreen(station);

    await fireEvent.press(await screen.findByRole("button", { name: "Play" }));

    const { queue, currentIndex, radio, started } = playerStore.getState();
    expect(queue.map((entry) => entry.name)).toEqual([
      "FA9LA & Friends",
      "Second Song",
    ]);
    expect(currentIndex).toBe(0);
    expect(started).toBe(true);
    expect(radio).toMatchObject({ stationId: "session-42", type: "featured" });
  });

  it("starts the station from the song that was pressed", async () => {
    stationDetails.mockResolvedValue(rawStationDetails());
    await renderScreen(station);

    await fireEvent.press(await screen.findByLabelText("Second Song"));

    expect(playerStore.getState().currentIndex).toBe(1);
    expect(playerStore.getState().radio?.stationId).toBe("session-42");
  });

  it("invites the listener to tune in when the station has no songs queued", async () => {
    stationDetails.mockResolvedValue(rawStationDetails({ songs: [] }));
    await renderScreen(station);

    expect(await screen.findByText("Ready to tune in")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "No songs found for this radio station",
    );
    expect(playerStore.getState().queue).toHaveLength(0);
  });

  it("offers a retry after a failed load", async () => {
    stationDetails.mockRejectedValueOnce(new Error("upstream down"));
    stationDetails.mockResolvedValue(rawStationDetails());
    await renderScreen(station);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Coming up")).toBeOnTheScreen();
  });
});

describe("startSeededRadio", () => {
  it("creates an artist station and plays its songs as radio", async () => {
    procedure("radio.createStation").mockResolvedValue({
      stationId: "artist-7",
    });
    procedure("radio.songs").mockResolvedValue([rawSong()]);

    await startSeededRadio({
      name: "Flipperachi",
      artistId: "2393548",
      language: "arabic",
    });

    expect(procedure("radio.createStation")).toHaveBeenCalledWith({
      type: "artist",
      name: "Flipperachi",
      artistId: "2393548",
      language: "arabic",
    });
    expect(playerStore.getState().queue).toHaveLength(1);
    expect(playerStore.getState().radio).toEqual({
      stationId: "artist-7",
      name: "Flipperachi Radio",
      type: "artist",
    });
  });

  it("toasts instead of playing when the station has no songs", async () => {
    procedure("radio.createStation").mockResolvedValue({
      stationId: "artist-7",
    });
    procedure("radio.songs").mockResolvedValue([]);

    await startSeededRadio({ name: "Nobody" });

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Could not find songs for this radio",
    );
    expect(playerStore.getState().radio).toBeNull();
  });

  it("toasts when the station cannot be created", async () => {
    procedure("radio.createStation").mockRejectedValue(new Error("nope"));

    await startSeededRadio({ name: "Nobody" });

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Unable to start radio station",
    );
  });
});

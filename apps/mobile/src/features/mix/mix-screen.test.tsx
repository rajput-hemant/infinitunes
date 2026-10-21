import { rawMix } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { MixScreen } from "./mix-screen";

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  procedure("get.mix").mockResolvedValue(rawMix());
});

describe("MixScreen", () => {
  it("shows the skeleton while the mix loads", async () => {
    procedure("get.mix").mockReturnValue(new Promise(() => {}));
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header and songs, without a heart", async () => {
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(await screen.findByText("Chill & Focus")).toBeOnTheScreen();
    expect(screen.getByText("Made for · You · 2 Songs")).toBeOnTheScreen();
    expect(screen.getByText("Calm One")).toBeOnTheScreen();
    expect(screen.getByText("Calm Two")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /^Like Chill/ })).toBeNull();
  });

  it("asks for the web page's first twenty songs", async () => {
    await renderScreen(<MixScreen token="XyZ_" />);
    await screen.findByText("Chill & Focus");

    expect(procedure("get.mix")).toHaveBeenCalledWith({
      token: "XyZ_",
      page: 1,
      n: 20,
      lang: "hindi,english",
    });
  });

  it("plays the mix from the top, or from a pressed row", async () => {
    await renderScreen(<MixScreen token="XyZ_" />);
    await screen.findByText("Chill & Focus");

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(playerStore.getState().currentIndex).toBe(0);
    expect(playerStore.getState().queue).toHaveLength(2);

    await fireEvent.press(screen.getByRole("button", { name: "Calm Two" }));
    expect(playerStore.getState().currentIndex).toBe(1);
  });

  it("says so when the mix has no songs", async () => {
    procedure("get.mix").mockResolvedValue(
      rawMix({ list: [], list_count: "0" }),
    );
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
  });

  it("offers a retry when the mix fails to load", async () => {
    procedure("get.mix").mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Chill & Focus")).toBeOnTheScreen();
  });

  it("shows not found for a token that is not a mix", async () => {
    procedure("get.mix").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderScreen(<MixScreen token="nope" />);

    expect(await screen.findByText("Mix not found")).toBeOnTheScreen();
  });
});

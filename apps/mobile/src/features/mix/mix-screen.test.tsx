import type { Mix } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { catalog, notFoundError } from "~/features/song/catalog-mock";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

import { MixScreen } from "./mix-screen";

jest.mock("~/lib/trpc", () => require("~/features/song/catalog-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/song/skeleton-mock"),
);

function mix(overrides: Partial<Mix> = {}): Mix {
  return {
    id: "mix-1",
    title: "Chill &amp; Focus",
    subtitle: "",
    header_desc: "",
    type: "mix",
    perma_url: "https://www.jiosaavn.com/featured/chill/XyZ_",
    image: "https://c.saavncdn.com/mixes/chill-150x150.jpg",
    language: "hindi",
    year: "2026",
    play_count: "",
    explicit_content: "0",
    list_count: "2",
    list_type: "song",
    list: [
      rawSong({ id: "song-1", title: "Calm One" }),
      rawSong({ id: "song-2", title: "Calm Two" }),
    ],
    more_info: {
      uid: "u1",
      last_updated: "",
      username: "jiosaavn",
      firstname: "Made for",
      lastname: "You",
      is_followed: "false",
      playlist_type: "mix",
      share: "0",
    },
    modules: {
      list: {
        source: "",
        position: 1,
        score: "",
        bucket: "",
        scroll_type: "",
        title: "",
        subtitle: "",
        highlight: "",
        simpleHeader: false,
        noHeader: false,
        view_more: [],
      },
    },
    ...overrides,
  };
}

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  catalog.get.mix.mockResolvedValue(mix());
});

describe("MixScreen", () => {
  it("shows the skeleton while the mix loads", async () => {
    catalog.get.mix.mockReturnValue(new Promise(() => {}));
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

    expect(catalog.get.mix).toHaveBeenCalledWith({
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
    catalog.get.mix.mockResolvedValue(mix({ list: [], list_count: "0" }));
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(await screen.findByText("No songs yet")).toBeOnTheScreen();
  });

  it("offers a retry when the mix fails to load", async () => {
    catalog.get.mix.mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<MixScreen token="XyZ_" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Chill & Focus")).toBeOnTheScreen();
  });

  it("shows not found for a token that is not a mix", async () => {
    catalog.get.mix.mockRejectedValue(notFoundError());
    await renderScreen(<MixScreen token="nope" />);

    expect(await screen.findByText("Couldn't find this mix")).toBeOnTheScreen();
  });
});

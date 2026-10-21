import {
  rawEpisode,
  SHOW_TOKEN,
  EPISODE_TOKEN,
} from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { EpisodeScreen } from "./episode-screen";

const initialPlayer = playerStore.getState();

const modules = {
  episode_details: {
    source: "show",
    position: 1,
    title: "episode details",
    subtitle: "",
  },
  episode_starring: {
    source: "show",
    position: 2,
    title: "starring",
    subtitle: "",
  },
};

function renderEpisode() {
  return renderScreen(<EpisodeScreen token={EPISODE_TOKEN} />, {
    routes: {
      "show/[name]/[season]/[token]": () => null,
    },
  });
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  procedure("show.episodeDetails").mockResolvedValue({
    episodes: [rawEpisode("9001")],
    modules,
  });
});

describe("EpisodeScreen", () => {
  it("shows a skeleton while the episode loads", async () => {
    procedure("show.episodeDetails").mockReturnValue(new Promise(() => {}));
    await renderEpisode();

    expect(
      screen.getAllByRole("progressbar", { name: "Loading" }).length,
    ).toBeGreaterThan(0);
  });

  it("shows the episode and its description as plain text", async () => {
    await renderEpisode();

    expect(
      await screen.findByRole("header", { name: "Episode 9001 & more" }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/12\.5K Plays · 62:05 · hindi/)).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "episode details" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("First paragraph.\nSecond line & more."),
    ).toBeOnTheScreen();
    expect(procedure("show.episodeDetails")).toHaveBeenCalledWith({
      token: EPISODE_TOKEN,
      season: 1,
      sort: "desc",
    });
  });

  it("plays the episode", async () => {
    await renderEpisode();

    await fireEvent.press(await screen.findByRole("button", { name: "Play" }));

    const { queue, currentIndex } = playerStore.getState();
    expect(queue.map((entry) => entry.id)).toEqual(["9001"]);
    expect(queue[0]?.type).toBe("episode");
    expect(currentIndex).toBe(0);
  });

  it("links back to its show", async () => {
    const app = await renderEpisode();

    await fireEvent.press(await screen.findByRole("link"));

    expect(app.getPathname()).toBe(`/show/the-ranveer-show/2/${SHOW_TOKEN}`);
  });

  it("shows not found for an unknown episode, without a retry", async () => {
    procedure("show.episodeDetails").mockRejectedValue(
      trpcError("NOT_FOUND", "No episode found, please check the token"),
    );
    await renderEpisode();

    expect(await screen.findByText("Episode not found")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("treats an answer with no episode as not found", async () => {
    procedure("show.episodeDetails").mockResolvedValue({
      episodes: [],
      modules,
    });
    await renderEpisode();

    expect(await screen.findByText("Episode not found")).toBeOnTheScreen();
  });

  it("offers a retry when loading fails", async () => {
    procedure("show.episodeDetails").mockRejectedValueOnce(
      trpcError("BAD_REQUEST", "Please provide episode token"),
    );
    await renderEpisode();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(
      await screen.findByRole("header", { name: "Episode 9001 & more" }),
    ).toBeOnTheScreen();
  });
});

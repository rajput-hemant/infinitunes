import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { Text } from "react-native";
import { toast } from "sonner-native";

import { audioPlayer } from "~/playback/audio-engine";
import { playerStore } from "~/playback/player-store";
import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import {
  catalogAnswering,
  favoritesRow,
  songNamed,
  userPlaylist,
} from "~/test/user-library";

import { AppActionScreen, belowIsPlayer } from "./app-action-screen";

const catalog = {
  a: songNamed("a", "First Like"),
  b: songNamed("b", "Second Like"),
  c: songNamed("c", "Third Like"),
};

const initialPlayer = playerStore.getState();

/** The app's routes the action leaves for, and the action route itself. */
function openLink(url: string) {
  return renderStack(
    {
      index: () => <Text>Home</Text>,
      player: () => <Text>Player</Text>,
      login: () => null,
      "action/[action]": AppActionScreen,
    },
    url,
  );
}

const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

async function landsOn(
  app: Awaited<ReturnType<typeof openLink>>,
  path: string,
) {
  await waitFor(() => expect(app.getPathname()).toBe(path));
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  procedure("song.details").mockImplementation(catalogAnswering(catalog));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("action/resume", () => {
  it("starts the restored queue and opens the player", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    playerStore.setState({ started: false });

    const app = await openLink("/action/resume");

    await landsOn(app, "/player");
    expect(playerStore.getState().started).toBe(true);
  });

  it("plays a paused queue on", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    audioPlayer.pause();
    const play = jest.spyOn(audioPlayer, "play");

    const app = await openLink("/action/resume");

    await landsOn(app, "/player");
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("goes back to an open player instead of stacking another", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    playerStore.setState({ started: false });
    const app = await openLink("/player");

    await act(async () => router.push("/action/resume"));

    await waitFor(() => expect(screen.queryByLabelText("Loading")).toBeNull());
    expect(app.getPathname()).toBe("/player");
    // The app's stack, inside the router's root navigator.
    const stack = app.getRouterState()?.routes[0]?.state;
    const names = stack?.routes.map((route) => route.name);
    expect(names?.filter((name) => name === "player")).toHaveLength(1);
    expect(names).not.toContain("action/[action]");
    expect(playerStore.getState().started).toBe(true);
  });

  it("lands on Home when nothing is queued", async () => {
    const app = await openLink("/action/resume");

    await landsOn(app, "/");
    expect(screen.getByText("Home")).toBeOnTheScreen();
    expect(playerStore.getState().started).toBe(false);
  });
});

describe("action/play-liked and action/shuffle-liked", () => {
  beforeEach(async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["a", "b", "c"] }),
    );
  });

  it("plays the liked songs newest like first", async () => {
    const app = await openLink("/action/play-liked");

    await landsOn(app, "/player");
    expect(queuedIds()).toEqual(["c", "b", "a"]);
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("shuffles the liked songs", async () => {
    const app = await openLink("/action/shuffle-liked");

    await landsOn(app, "/player");
    expect(queuedIds().toSorted()).toEqual(["a", "b", "c"]);
    expect(playerStore.getState().started).toBe(true);
  });

  it("says so when nothing is liked", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(undefined);

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(toast).toHaveBeenCalledWith("No liked songs yet", expect.anything());
    expect(queuedIds()).toEqual([]);
  });

  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(jest.mocked(toast.warning)).toHaveBeenCalledWith(
      "Sign in to continue",
      expect.objectContaining({
        description: "You need an account to play your liked songs.",
      }),
    );
    expect(procedure("user.getUserFavorites")).not.toHaveBeenCalled();
  });

  it("toasts when the library can't be read", async () => {
    procedure("user.getUserFavorites").mockRejectedValue(
      trpcError("INTERNAL_SERVER_ERROR"),
    );

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(jest.mocked(toast.error)).toHaveBeenCalled();
    expect(queuedIds()).toEqual([]);
  });
});

describe("action/play-playlist", () => {
  beforeEach(async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip", songs: ["b", "a"] }),
      userPlaylist({ id: "pl-2", name: "Empty", songs: [] }),
    ]);
  });

  it("plays the playlist in its own order", async () => {
    const app = await openLink("/action/play-playlist?id=pl-1");

    await landsOn(app, "/player");
    expect(queuedIds()).toEqual(["b", "a"]);
  });

  it("says so when the playlist has no songs", async () => {
    const app = await openLink("/action/play-playlist?id=pl-2");

    await landsOn(app, "/");
    expect(toast).toHaveBeenCalledWith('"Empty" has no songs yet');
  });

  it("toasts for a playlist the listener doesn't have", async () => {
    const app = await openLink("/action/play-playlist?id=gone");

    await landsOn(app, "/");
    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
      "Couldn't find that playlist",
    );
    expect(queuedIds()).toEqual([]);
  });
});

describe("action/play-search", () => {
  it("plays the top song for the term", async () => {
    procedure("search.byType").mockResolvedValue({
      total: 1,
      start: 1,
      results: [rawSong({ id: "top" })],
    });

    const app = await openLink("/action/play-search?q=fa9la");

    await landsOn(app, "/player");
    expect(procedure("search.byType")).toHaveBeenCalledWith({
      q: "fa9la",
      type: "songs",
      page: 1,
      n: 1,
    });
    expect(queuedIds()).toEqual(["top"]);
  });

  it("says so when no song matches", async () => {
    procedure("search.byType").mockRejectedValue(trpcError("NOT_FOUND"));

    const app = await openLink("/action/play-search?q=zzzz");

    await landsOn(app, "/");
    expect(toast).toHaveBeenCalledWith('No songs found for "zzzz"');
  });
});

const route = (name: string) => ({ name });

describe("belowIsPlayer", () => {
  it("reads the screen under the action screen", () => {
    expect(
      belowIsPlayer({ index: 1, routes: [route("player"), route("action")] }),
    ).toBe(true);
    expect(
      belowIsPlayer({ index: 1, routes: [route("(tabs)"), route("action")] }),
    ).toBe(false);
  });

  it("is false on a cold start or without a state", () => {
    expect(belowIsPlayer({ routes: [route("action")] })).toBe(false);
    expect(belowIsPlayer(undefined)).toBe(false);
  });
});

it("lands on Home for an unknown action", async () => {
  const app = await openLink("/action/dance");

  await landsOn(app, "/");
  expect(queuedIds()).toEqual([]);
});
